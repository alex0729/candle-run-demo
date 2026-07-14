import re, json, os, math, random, sqlite3, shutil
random.seed(20260701)

# ---------------------------------------------------------------------------
# 데이터 소스: qbrick SQLite DB (kospi/kosdaq 일별 OHLCV + CATEGORY 종목마스터)
#   - 이 DB는 리포에 포함하지 않음(대용량). GitHub Release 자산 `db_source` 에 보관.
#   - 로컬 경로 또는 환경변수 QBRICK_DB 로 지정. 없으면 Release에서 내려받아 사용.
# 추출 조건(캔들런 v0.17 데이터 교체):
#   - KOSPI / KOSDAQ 각 300종목 = 총 600종목
#   - ETF/ETN 등 제외(일반 보통주만), 우선주 제외
#   - 2020~2025년(6년) 데이터만 사용
#   - 종목 선정 = 2020~2025 평균 거래대금(유동성) 상위 300
# ---------------------------------------------------------------------------

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'app', 'public', 'data')
SCN_DIR = os.path.join(OUT, 'scenarios')

DB_PATH = os.environ.get('QBRICK_DB', os.path.join(ROOT, 'qbrick_20260522.db'))
if not os.path.exists(DB_PATH):
    raise SystemExit(
        f"DB를 찾을 수 없습니다: {DB_PATH}\n"
        "GitHub Release 자산에서 내려받아 경로를 지정하세요:\n"
        "  curl -sSL -o qbrick_20260522.db \\\n"
        "    https://github.com/alex0729/candle-run-demo/releases/download/db_source/qbrick_20260522.db\n"
        "  QBRICK_DB=./qbrick_20260522.db python3 scripts/build_data.py")

WARMUP = 120         # 지표 워밍업 구간
PLAY = 80            # 플레이 가능 봉 수(모드 20/30/50 + 결과 리빌 여유)
WINDOW = WARMUP + PLAY
PER_MARKET = 300
START_DATE, END_DATE = '20200101', '20251231'
MIN_BARS = WINDOW    # 최소 확보 봉 수

if os.path.exists(OUT): shutil.rmtree(OUT)
os.makedirs(SCN_DIR, exist_ok=True)

# ---------- 종목 분류 필터 ----------
PREF_RE = re.compile(r'우$|우[BC]$|\d우[BC]?$')          # 우선주(이름): …우 / …우B / …2우B
SPAC_RE = re.compile(r'스팩|기업인수목적|제\s?\d+\s?호$')   # 스팩(기업인수목적회사)

def is_common_stock(name, code, sector):
    """일반 보통주만 True. ETF/ETN(섹터 etc) · 우선주 · 스팩 · 특수코드(끝자리≠0) 제외."""
    if (sector or '').strip().lower() == 'etc':
        return False                       # ETF/ETN/기타 파생·지수형
    if not code.endswith('0'):
        return False                       # 보통주 코드는 끝자리 0, 우선주/특수는 5·7·9 등
    nm = name or ''
    if PREF_RE.search(nm) or SPAC_RE.search(nm):
        return False
    return True

# ---------- 성과 분석(태깅) ----------
def classify(data, start):
    fwd = data[start:]
    if len(fwd) < 5:
        return 'sideways', 'normal'
    closes = [b['c'] for b in fwd]
    ret = (closes[-1]-closes[0])/closes[0]
    rets = [abs((closes[i]-closes[i-1])/closes[i-1]) for i in range(1,len(closes)) if closes[i-1]]
    vol = sum(rets)/len(rets) if rets else 0
    peak=closes[0]; mdd=0
    for c in closes:
        peak=max(peak,c); mdd=max(mdd,(peak-c)/peak if peak else 0)
    if ret > 0.15: pat='uptrend'
    elif ret < -0.15: pat='downtrend'
    elif vol > 0.045: pat='volatile'
    else: pat='sideways'
    if vol < 0.028 and mdd < 0.12: diff='beginner'
    elif vol > 0.05 or mdd > 0.28: diff='advanced'
    else: diff='normal'
    return pat, diff

def write_scn(obj):
    with open(os.path.join(SCN_DIR, obj['id']+'.json'), 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, separators=(',',':'))

con = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
con.row_factory = None
cur = con.cursor()

# 종목 마스터 로드
meta = {}   # code -> (name, market, sector)
for code, mkt, name, sector in cur.execute(
        "SELECT CODE, MARKET, NAME, SECTOR_NAME FROM CATEGORY"):
    if mkt in ('KOSPI','KOSDAQ') and is_common_stock(name, code, sector):
        meta[code] = ((name or '').strip(), mkt, (sector or '').strip() or '기타')

manifest_items = []
counts = {'KOSPI':0, 'KOSDAQ':0}

for mkt, tbl in (('KOSPI','kospi'), ('KOSDAQ','kosdaq')):
    # 1) 유동성 랭킹: 2020~2025 평균 거래대금 + 봉 수
    stat = {}
    for code, n, liq in cur.execute(
            f"SELECT code, COUNT(*) n, AVG(amount) liq FROM {tbl} "
            f"WHERE date BETWEEN ? AND ? GROUP BY code", (START_DATE, END_DATE)):
        stat[code] = (n, liq or 0)
    # 후보 = 보통주 & 충분한 봉 수, 유동성 내림차순
    cand = [(c, stat[c][1]) for c in meta
            if meta[c][1] == mkt and c in stat and stat[c][0] >= MIN_BARS]
    cand.sort(key=lambda x: -x[1])
    picked = [c for c, _ in cand[:PER_MARKET]]
    picked_set = set(picked)
    print(f"[{mkt}] 보통주 후보(>= {MIN_BARS}봉)={len(cand)} → 선정={len(picked)}")

    # 2) 선정 종목의 2020~2025 봉을 한 번에 스캔해서 코드별로 버킷
    bars_by_code = {c: [] for c in picked}
    for code, date, o, h, l, c_, v in cur.execute(
            f"SELECT code, date, open, high, low, close, volume FROM {tbl} "
            f"WHERE date BETWEEN ? AND ? ORDER BY code, date", (START_DATE, END_DATE)):
        if code in picked_set:
            bars_by_code[code].append({'date':date,'o':int(o),'h':int(h),'l':int(l),'c':int(c_),'v':int(v or 0)})

    # 3) 코드별 윈도우 추출(결정적 랜덤 시작점) → 시나리오 생성
    for code in sorted(picked):
        seq = bars_by_code[code]
        if len(seq) < WINDOW:
            continue
        max_start = len(seq) - WINDOW
        off = random.randint(0, max_start) if max_start > 0 else 0
        data = seq[off:off+WINDOW]
        pat, diff = classify(data, WARMUP)
        name, _, sector = meta[code]
        start_date = data[WARMUP]['date']
        end_date = data[-1]['date']
        sid = f"{mkt}-{code}-{start_date}-{PLAY}"
        obj = {
            'id': sid, 'market': mkt, 'sector': sector,
            'source': 'real', 'name': name, 'code': code,
            'blind_label': '종목 ?',
            'warmup': WARMUP, 'play_max': PLAY,
            'start_date': start_date, 'end_date': end_date,
            'pattern': pat, 'difficulty': diff, 'recent': True,
            'data': data,
        }
        write_scn(obj)
        manifest_items.append({k:obj[k] for k in (
            'id','market','sector','source','blind_label','warmup','play_max',
            'start_date','end_date','pattern','difficulty','recent')})
        counts[mkt] += 1

con.close()

# ---------- manifest ----------
from collections import Counter
manifest = {
    'version': '0.17',
    'generated_at': '2026-07-09',
    'warmup': WARMUP,
    'markets': sorted(set(x['market'] for x in manifest_items)),
    'count': len(manifest_items),
    'by_market': dict(Counter(x['market'] for x in manifest_items)),
    'by_source': dict(Counter(x['source'] for x in manifest_items)),
    'recent_count': sum(1 for x in manifest_items if x['recent']),
    'scenarios': manifest_items,
}
with open(os.path.join(OUT,'manifest.json'),'w',encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, separators=(',',':'))

print('TOTAL:', manifest['count'])
print('by_market:', manifest['by_market'])
print('by_source:', manifest['by_source'])
print('difficulty:', dict(Counter(x['difficulty'] for x in manifest_items)))
print('pattern:', dict(Counter(x['pattern'] for x in manifest_items)))
print('manifest size KB:', round(os.path.getsize(os.path.join(OUT,'manifest.json'))/1024,1))

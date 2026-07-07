import re, json, os, math, random, shutil
random.seed(20260701)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'app', 'public', 'data')
SCN_DIR = os.path.join(OUT, 'scenarios')
if os.path.exists(OUT): shutil.rmtree(OUT)
os.makedirs(SCN_DIR, exist_ok=True)

WARMUP = 120

# ---------- helpers: analysis for tagging ----------
def classify(data, start):
    fwd = data[start:]
    if len(fwd) < 5:
        return 'sideways', 'normal'
    closes = [b['c'] for b in fwd]
    ret = (closes[-1]-closes[0])/closes[0]
    # volatility: mean abs daily return
    rets = [abs((closes[i]-closes[i-1])/closes[i-1]) for i in range(1,len(closes))]
    vol = sum(rets)/len(rets)
    # max drawdown
    peak=closes[0]; mdd=0
    for c in closes:
        peak=max(peak,c); mdd=max(mdd,(peak-c)/peak)
    if ret > 0.15: pat='uptrend'
    elif ret < -0.15: pat='downtrend'
    elif vol > 0.045: pat='volatile'
    else: pat='sideways'
    # difficulty by volatility & drawdown
    if vol < 0.028 and mdd < 0.12: diff='beginner'
    elif vol > 0.05 or mdd > 0.28: diff='advanced'
    else: diff='normal'
    return pat, diff

def write_scn(obj):
    with open(os.path.join(SCN_DIR, obj['id']+'.json'), 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, separators=(',',':'))

manifest_items = []

# ---------- 1) real KOSPI scenarios from prototype ----------
# ETF/ETN/레버리지/인버스/선물 등 파생·지수형 상품은 제외(일반 단일종목만)
ETF_PAT = re.compile(r'ETF|ETN|레버리지|인버스|선물|커버드콜|TDF|액티브|KODEX|TIGER|KBSTAR|ARIRANG|KINDEX|KOSEF|KIWOOM|HANARO|TIMEFOLIO|블룸버그|KoAct|\(합성|\bACE\b|\bSOL\b|\bRISE\b')
html = open(os.path.join(ROOT,'legacy','index-v0.3.html'), encoding='utf-8').read()
m = re.search(r'<script id="embeddedScenarios"[^>]*>(.*?)</script>', html, re.S)
real = json.loads(m.group(1))['scenarios']
excluded_etf = 0
for s in real:
    if ETF_PAT.search(s.get('name') or ''):
        excluded_etf += 1
        continue
    data = [{'date':d['date'],'o':int(d['o']),'h':int(d['h']),'l':int(d['l']),'c':int(d['c']),'v':int(d.get('v',0))} for d in s['data']]
    start = int(s.get('start_index',120))
    pat, diff = classify(data, start)
    sid = s['id']
    recent = (s.get('start_date') or '')[:4] >= '2020'
    obj = {
        'id': sid, 'market': s.get('market','KOSPI'), 'sector':(s.get('sector') or '기타').strip(),
        'source':'real', 'name': s.get('name'), 'code': s.get('code'),
        'blind_label': s.get('blind_label') or '종목 ?',
        'warmup': start, 'play_max': len(data)-start,
        'start_date': s.get('start_date'), 'end_date': s.get('end_date'),
        'pattern': pat, 'difficulty': diff, 'recent': recent,
        'data': data
    }
    write_scn(obj)
    manifest_items.append({k:obj[k] for k in ('id','market','sector','source','blind_label','warmup','play_max','start_date','end_date','pattern','difficulty','recent')})

print('real scenarios(kept):', len(real)-excluded_etf, '| ETF/ETN 제외:', excluded_etf)

# ---------- 2) synthetic KOSPI/KOSDAQ scenarios (2020+) ----------
SECTORS = {
 'KOSPI': ['전기전자','금융업','운수장비','화학','철강금속','유통업','건설업','서비스업','의약품','음식료품'],
 'KOSDAQ': ['IT부품','제약바이오','2차전지','게임','반도체','엔터미디어','소프트웨어','헬스케어','인터넷','로봇AI']
}
BLIND = [chr(ord('A')+i) for i in range(26)]

def gen_dates(n, start_year):
    # business-day-ish daily dates from a random 2020+ start
    y = start_year; mo = random.randint(1,10); da = random.randint(1,20)
    dates=[]; 
    import datetime
    d = datetime.date(y,mo,da)
    while len(dates)<n:
        if d.weekday()<5:
            dates.append(d.strftime('%Y%m%d'))
        d += datetime.timedelta(days=1)
    return dates

def gen_series(market, kind):
    n = WARMUP + 90
    price = (30000+random.random()*120000) if market=='KOSPI' else (3000+random.random()*40000)
    base_vol = (0.018+random.random()*0.02) if market=='KOSPI' else (0.03+random.random()*0.035)
    # drift profile by kind
    drift = {'uptrend':0.004,'downtrend':-0.004,'sideways':0.0004,'volatile':0.0}[kind]
    # regime change near decision point for realism
    turn = WARMUP + random.randint(-10,10)
    vol = base_vol
    arr=[]
    for i in range(n):
        vol = max(base_vol*0.7, vol*0.9 + (base_vol*(0.9+random.random()*0.8))*0.1)
        dr = drift
        if kind=='uptrend' and i<turn: dr = drift*0.3
        if kind=='downtrend' and i<turn: dr = -drift*0.3*-1*0.3
        if kind=='volatile': dr = (random.random()-0.5)*0.006
        ret = dr + (random.random()+random.random()+random.random()-1.5)*vol*1.5
        o = price
        c = max(500, o*(1+ret))
        hi = max(o,c)*(1+random.random()*vol*0.8)
        lo = min(o,c)*(1-random.random()*vol*0.8)
        big = abs(ret)/vol
        vbase = (1_000_000 if market=='KOSPI' else 400_000)
        v = int((0.6+random.random()*0.9+big*0.6)*vbase*(1 if price>40000 else 2.0))
        # round price to KRX tick-ish
        def rnd(x):
            if x>=100000: return int(round(x/100)*100)
            if x>=10000: return int(round(x/50)*50)
            if x>=1000: return int(round(x/10)*10)
            return int(round(x/5)*5)
        arr.append({'o':rnd(o),'h':rnd(hi),'l':rnd(lo),'c':rnd(c),'v':v})
        price = c
    return arr

SYN_PER = {'KOSPI':120,'KOSDAQ':150}
KINDS = ['uptrend','downtrend','sideways','volatile']
syn_count=0
for market, cnt in SYN_PER.items():
    for j in range(cnt):
        kind = random.choice(KINDS)
        start_year = random.choice([2020,2021,2021,2022,2022,2023,2023,2024])
        arr = gen_series(market, kind)
        dates = gen_dates(len(arr), start_year)
        data = [{'date':dates[i], **arr[i]} for i in range(len(arr))]
        start = WARMUP
        pat, diff = classify(data, start)
        sid = f'SYN-{market}-{start_year}-{j:03d}'
        sector = random.choice(SECTORS[market])
        obj = {
            'id': sid, 'market': market, 'sector': sector,
            'source':'synthetic', 'name': None, 'code': None,
            'blind_label': '종목 '+random.choice(BLIND),
            'warmup': start, 'play_max': len(data)-start,
            'start_date': dates[start], 'end_date': dates[-1],
            'pattern': pat, 'difficulty': diff, 'recent': True,
            'data': data
        }
        write_scn(obj)
        manifest_items.append({k:obj[k] for k in ('id','market','sector','source','blind_label','warmup','play_max','start_date','end_date','pattern','difficulty','recent')})
        syn_count+=1

print('synthetic scenarios:', syn_count)

# ---------- manifest ----------
from collections import Counter
manifest = {
    'version': '0.4',
    'generated_at': '2026-07-01',
    'warmup': WARMUP,
    'markets': sorted(set(x['market'] for x in manifest_items)),
    'count': len(manifest_items),
    'by_market': dict(Counter(x['market'] for x in manifest_items)),
    'by_source': dict(Counter(x['source'] for x in manifest_items)),
    'recent_count': sum(1 for x in manifest_items if x['recent']),
    'scenarios': manifest_items
}
with open(os.path.join(OUT,'manifest.json'),'w',encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, separators=(',',':'))

print('TOTAL:', manifest['count'])
print('by_market:', manifest['by_market'])
print('by_source:', manifest['by_source'])
print('recent_count:', manifest['recent_count'])
mfsize = os.path.getsize(os.path.join(OUT,'manifest.json'))
print('manifest size KB:', round(mfsize/1024,1))

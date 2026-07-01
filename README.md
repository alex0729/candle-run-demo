# 캔들런 (Candle Run) · v0.4

페이북 투자서비스 활성화를 위한 **실전 캔들 차트 트레이딩 시뮬레이션** 웹게임.
실제 국내주식 과거 데이터와 랜덤 생성 시나리오로 블라인드 매매를 체험하고, 성과를 복기하며 투자 감각을 익힙니다.

## v0.4 주요 변경점

- **데이터 ↔ 앱 분리**: 시나리오를 앱에서 떼어내 `app/public/data/`(매니페스트 + 개별 파일)로 관리. 라운드마다 개별 시나리오만 지연 로드 → 초기 로드 3.7MB → **JS 60KB(gzip)** 수준으로 경량화.
- **KOSPI / KOSDAQ 구분**: 시장을 태그·표시하고, 설정에서 시장을 선택할 수 있습니다.
- **데이터 증량 + 최근(2020년+) 데이터**: 실데이터 300 + 랜덤 생성 270 = **총 570개 시나리오**(KOSPI 420 / KOSDAQ 150, 2020년 이후 330개).
- **반응형 동적 UI**: 단말기 화면 크기에 맞춰 차트·레이아웃이 유동적으로 리사이즈(모바일↔데스크톱).
- **명확한 플로우**: `설정 → 실행 → 성과분석 → 지속/종료`.
- **React + TypeScript + Vite**로 재구축(모듈화·타입 안정성·빌드 파이프라인).
- **신규 요소**: 투자 성향 진단, 전환 CTA(데모 훅), 결과 공유, 페이북머니·전적 영속화, 공매도(고급 난이도) 실연결.

## 실행 방법

```bash
cd app
npm install
npm run dev       # 개발 서버 (http://localhost:5173)
# 또는
npm run build     # 프로덕션 빌드 → app/dist
npm run preview   # 빌드 결과 미리보기 (http://localhost:4173)
```

> 데이터는 `fetch`로 로드되므로 **정적 서버로 서빙**해야 합니다(`file://` 직접 열기는 불가). 루트 `index.html`은 `app/dist`로 리다이렉트합니다.

## 구조

```
app/                 # 서비스 앱 (React + TS + Vite)
  src/
    game/            # 게임 엔진: 지표/시그널/엔진/시나리오 로더/성향진단
    components/      # Chart(반응형 캔버스) · 화면(Setup/Play/Result)
    store/           # zustand 스토어 (플로우·지갑·통계·영속화)
  public/data/       # 분리된 데이터: manifest.json + scenarios/*.json
  dist/              # 빌드 산출물
scripts/build_data.py # 데이터 파이프라인(실데이터 추출 + 랜덤 생성 → 분리 저장)
legacy/index-v0.3.html # 이전 프로토타입(단일 파일)
docs/PRD.md          # 제품 요구사항 정의서
```

## 데이터 재생성

```bash
python3 scripts/build_data.py          # app/public/data 갱신
cd app && npm run build                # dist에 반영
```

## 면책

가상 머니로 진행되는 **학습용 콘텐츠**이며 특정 종목의 매수·매도 추천이 아닙니다.
합성(연습) 시나리오는 결과 화면에서 "연습용 합성 시나리오"로 명시됩니다. 실서비스 배포 시 시세 데이터 라이선스·금융규제 검토가 필요합니다(자세한 내용은 `docs/PRD.md`).

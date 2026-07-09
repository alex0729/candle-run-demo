# 다음 작업 메모 — 주식 데이터 마이그레이션 (집에서 이어서)

> 이 파일은 세션 간 인수인계용 메모입니다. 집에서 접속해 작업을 이어갈 때 이 문서부터 보세요.
> 작성 맥락: Claude Code on the web 세션(원격 환경)에서 데이터 교체 가능성 검토 중 남김.

## 🎯 목표 (요구사항)

현재 게임에 들어가는 주식 데이터를 새 DB로 교체한다.

- **대상**: KOSDAQ / KOSPI **일반종목만** — ETF·ETN 등 파생·지수형 상품 제외, **우선주 제외**.
- **규모**: 시장별 **300종목씩 (KOSPI 300 + KOSDAQ 300 = 총 600종목)**.
- **기간**: **2020년 ~ 2025년, 6년치 데이터만** 사용.

## ⛔ 현재 막힌 지점 (블로커)

원본 DB를 받고 싶은 구글 드라이브 링크:
- https://drive.google.com/file/d/1tIlYr6QYHMKsMaQ5uyuhz_8pSBUw5eIQ/view?usp=drive_link

**이 원격 환경에서는 위 링크를 직접 다운로드할 수 없음.** 아웃바운드 네트워크가 allowlist 기반이라
`drive.google.com` / `docs.google.com` 이 정책상 403 차단됨(테스트로 확인).
- 허용됨: `github` / `raw.githubusercontent.com`, `pypi.org`, npm 등 패키지 저장소
- 차단됨: `drive.google.com`, `docs.google.com`, 일반 웹사이트
- `www.googleapis.com` 은 연결되나 인증(OAuth/API key) 필요 → 공유 링크 파일엔 그대로 못 씀

## ✅ 집에서 할 일 (택1)

1. **(권장) 파일을 GitHub로 올리기** — DB 파일을 이 리포에 커밋하거나 GitHub **Release 자산**으로
   업로드. github는 이 환경에서 접근 가능하므로, 그 뒤 세션에서 Claude가 바로 읽어 처리 가능.
   원본이 크면 처리 후 **가공된 시나리오 JSON만** 남기고 원본은 `.gitignore` 처리 권장.
2. **환경 네트워크 정책 변경** — egress 정책에 `drive.google.com` 허용 + 링크를 "링크 있는 모든
   사용자" 공개로 변경. (설정: https://code.claude.com/docs/en/claude-code-on-the-web 네트워크 정책)
3. **내용 붙여넣기** — CSV처럼 작을 때만.

## 📋 파일을 받으면 Claude에게 알려줄 정보

- 파일 형식: sqlite / csv / parquet / json 중 무엇인지
- 컬럼 스키마: 종목코드 · 일자 · 시가(o) · 고가(h) · 저가(l) · 종가(c) · 거래량(v) · 시장구분(KOSPI/KOSDAQ) 등
- **우선주·ETF 판별에 쓸 필드**: 종목명? 코드 규칙?
  - 참고: 국내 우선주는 보통 종목명 끝이 "우/우B/(전환)", 코드 끝자리 5·7·9.
  - ETF/ETN은 기존 `scripts/build_data.py` 의 `ETF_PAT` 정규식(KODEX/TIGER/레버리지/인버스 등) 참고.

## 🔧 구현 관점 메모

- 현재 `scripts/build_data.py` 는 `legacy/index-v0.3.html` 에 **내장된 KOSPI 실데이터**를 읽어
  시나리오를 생성하는 구조. 새 요구사항(KOSPI/KOSDAQ 600종목, 2020–2025, 우선주 제외)에 맞추려면
  **새 DB를 읽는 로더로 교체**해야 함. 필터링·기간 제한 로직 자체는 난이도 낮음 — 데이터 접근만 해결하면 됨.
- 데이터 재생성/빌드 파이프라인은 이 환경에서 정상 동작 확인함:
  `python3 scripts/build_data.py` → `cd app && npm ci && npm run build`.
- 배포: `main` 브랜치 push 시 GitHub Pages 자동 배포(`.github/workflows/deploy.yml`).
- 작업 브랜치: `claude/github-candlestick-migration-sonzkv`

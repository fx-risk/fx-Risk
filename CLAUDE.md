# fx-Risk

USD/KRW 선물환 매입 의사결정 지원 시스템.

## 프로젝트 정체성

매월 약 $10M 규모 달러 매입 수요를 1~5개월물 선물환으로 분산하고, 매일 시장 데이터를 분석해 만기별 추천 매입금액과 사유를 제시한다.

**이 시스템은 자동거래 시스템이 아니다.** 은행과의 실제 선물환 거래는 외환 담당자가 수행하며, 시스템은 추천만 제공한다. 환차익을 노리지 않고 손익 악화 방어를 목적으로 한다. 자세한 사양은 저장소 루트의 `spec.txt`와 `USD_KRW 선물환 매입 금액 추천 프로그램 개발 기획서.docx` 참조.

## 구조

```
fx-Risk/
├── spec.txt                          # 22절 사양서 (반드시 참고)
├── USD_KRW ... 기획서.docx
├── fx-dashboard/                     # 프론트엔드 (React + Vite, port 5173)
│   ├── src/
│   │   ├── App.jsx                   # 사이드바 + 탭 라우팅
│   │   ├── Dashboard.jsx             # 메인 대시보드
│   │   ├── api/client.js             # 백엔드 API fetch (실패 시 null fallback)
│   │   ├── screens/
│   │   │   ├── InputScreen.jsx       # 데이터/매입결과 입력
│   │   │   ├── StatusScreen.jsx      # 만기별 현황
│   │   │   ├── MarketScreen.jsx      # 시장 분석 (실데이터 ↔ mock 자동 전환)
│   │   │   └── ReportScreen.jsx      # 일/주/월 리포트 + 인쇄
│   │   ├── store/AppContext.jsx      # 전역 상태 + 마운트 시 백엔드 fetch
│   │   └── utils/calculator.js       # 리스크 점수 + 추천 알고리즘
│   ├── vite.config.js                # /api → localhost:8000 프록시
│   └── package.json
└── backend/                          # 백엔드 (FastAPI + SQLite, port 8000)
    ├── app/
    │   ├── main.py                   # FastAPI 앱
    │   ├── config.py                 # .env 로딩
    │   ├── db.py, models.py          # SQLAlchemy + SQLite
    │   ├── services/
    │   │   ├── ecos.py                # 한국은행 ECOS API (USD/KRW 매매기준율)
    │   │   └── fred.py                # FRED API (美 금리/DXY/유가)
    │   └── routers/
    │       ├── rates.py              # /api/rates/*
    │       └── market.py             # /api/market/*
    ├── requirements.txt
    ├── .env.example                  # API 키 템플릿
    └── README.md                     # 키 발급 절차 + 실행법
```

## 기술 스택

**프론트엔드**
- React 19 + Vite 8
- 차트: recharts / 애니메이션: framer-motion / 아이콘: lucide-react
- 상태 관리: React Context (외부 라이브러리 미사용)

**백엔드**
- Python 3.12 + FastAPI + uvicorn
- SQLAlchemy 2.0 + SQLite (단일 파일 DB, `backend/fx_risk.db`)
- httpx (외부 API 호출)
- pydantic-settings (.env 로딩)
- 캐싱 패턴: lazy refresh — GET 요청 시 데이터가 `CACHE_TTL_HOURS`(기본 4h) 이상 stale하면 외부 API 호출 후 DB upsert

## 추천 알고리즘 (spec 16절)

`utils/calculator.js`:
- `calculateRiskScore(marketData)` — 6개 지표 가중합 (FX추세 0.25, 美금리 0.20, 원화수급 0.15, 글로벌리스크 0.15, 변동성 0.10, 노출도 0.15)
- `recommendPurchaseAmount(tenor, remaining, riskScore)` — 만기별 가중치(1M=1.20 → 5M=0.50) × 점수로 등급 결정
- 등급: 강력매입(≥80) / 매입권고(≥65) / 부분매입(≥45) / 소량매입(≥30) / 관망

## 구현 상태

| 화면 | 상태 |
|------|------|
| 메인 대시보드 | 구현됨 (환율차트, 리스크점수, 만기별 추천 테이블) |
| 데이터/결과 입력 | 구현됨 |
| 만기별 현황 | 구현됨 |
| 시장 분석 | 구현됨 (이동평균, 점수 분해, 美/韓 시장, 뉴스 이벤트) |
| 리포트 | 구현됨 (일일/주간/월간 탭 + 브라우저 인쇄/PDF 저장) |

데이터 연동 상태:
- ✅ USD/KRW 환율 (한국은행 ECOS, 통계표 `731Y001` / 항목 `0000001`) — 시장 분석 화면의 이동평균 차트, 메인 대시보드의 현재 환율
- ✅ 美 금리/달러인덱스/10년 국채/WTI (FRED) — 시장 분석 화면의 미국 시장 동향 카드
- ❌ 한국 시장 (외국인 자금 흐름, 한국 금리) — 한국은행 ECOS의 다른 통계표 추가 연동 필요
- ❌ 뉴스 (네이버 검색 API 또는 NewsAPI)
- ❌ 주간/월간 리포트의 집계 데이터 (백엔드에서 집계 로직 필요)

미구현 영역:
- 백엔드 + DB (spec 17절의 6개 테이블)
- 일/주/월간 리포트 — 화면 구현 완료, PDF는 브라우저 인쇄(`window.print()` + `@media print`)로 대응. 별도 PDF 엔진(jsPDF 등) 미사용
- 주간/월간 리포트의 mock 데이터(주간 highlights, 월간 평균 매입환율 등)를 백엔드 집계로 대체 필요
- 사용자 권한 (경영자/외환담당자/관리자, spec 18절)
- 추천 사유의 LLM 기반 자연어 생성

## 개발 명령어

**프론트엔드**
```powershell
cd fx-dashboard
npm install               # 최초 1회
npm run dev               # http://localhost:5173
npm run build
npm run lint
```

**백엔드**
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env    # API 키 입력 필요. backend/README.md 참고
uvicorn app.main:app --reload --port 8000
```

백엔드가 실행 중이면 프론트엔드의 `MarketScreen`이 자동으로 실데이터(badge="실시간")를 표시한다. 백엔드가 꺼져 있어도 프론트엔드는 mock으로 fallback해서 정상 동작한다.

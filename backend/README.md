# fx-Risk Backend

USD/KRW 환율 및 미국 시장 데이터를 외부 API에서 수집하여 SQLite에 캐싱하고, REST로 노출하는 FastAPI 서버.

## 데이터 소스

| 종류 | API | 갱신 주기 | 무료 |
|------|-----|----------|------|
| USD/KRW 환율 (매매기준율) | 한국은행 ECOS | 매영업일 | ✅ (10,000회/일) |
| 美 기준금리 (DFF) | FRED | 매일 | ✅ |
| 美 10년 국채금리 (DGS10) | FRED | 매영업일 | ✅ |
| 달러 인덱스 (DTWEXBGS) | FRED | 매영업일 | ✅ |
| WTI 유가 (DCOILWTICO) | FRED | 매영업일 | ✅ |

## API 키 발급 절차

### 1) 한국은행 ECOS API
1. https://ecos.bok.or.kr/api/ 접속
2. 우상단 **로그인** → 회원가입 (없으면 가입)
3. 메뉴 **OpenAPI → 인증키 신청** → 사용 목적 한 줄 입력
4. **즉시 인증키 발급** → `.env`의 `ECOS_API_KEY`에 입력
5. 통계표는 `731Y001` (시장환율 - 1일), 항목 `0000001` (원/달러) 사용

### 2) FRED API
1. https://fredaccount.stlouisfed.org/apikeys 접속 → 회원가입 (이메일만)
2. **Request API Key** 클릭
3. 즉시 발급된 32자리 키를 `.env`의 `FRED_API_KEY`에 입력

## 설치 및 실행

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1     # Windows PowerShell
# 또는 source .venv/bin/activate (macOS/Linux)
pip install -r requirements.txt
copy .env.example .env          # .env 만들고 키 입력
uvicorn app.main:app --reload --port 8000
```

서버가 뜨면:
- API 문서 (Swagger UI): http://localhost:8000/docs
- 헬스 체크: http://localhost:8000/health

## 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/rates/latest` | 최신 USD/KRW 환율 |
| GET | `/api/rates/history?days=90` | 최근 N일 환율 + 5/20/60일 이동평균 |
| POST | `/api/rates/refresh?days_back=30` | 환율 캐시 강제 갱신 |
| GET | `/api/market/us` | 美 시장 지표 4개 |
| POST | `/api/market/refresh` | 美 시장 캐시 강제 갱신 |

## 캐싱 동작

- 모든 GET은 **DB 캐시 우선**.
- 가장 최근 fetch가 `CACHE_TTL_HOURS`(기본 4시간) 이상 오래되면 외부 API를 호출하고 DB upsert.
- `POST /refresh`로 수동 강제 갱신 가능.

## 데이터베이스

- SQLite 파일: `backend/fx_risk.db` (자동 생성, `.gitignore`에 포함)
- 첫 실행 시 테이블 자동 생성

## 프론트엔드 연동

`fx-dashboard/vite.config.js`의 `server.proxy`로 `/api → http://localhost:8000`을 프록시. 프론트엔드 코드에서는 `fetch('/api/rates/latest')` 형태로 호출.

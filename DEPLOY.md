# fx-Risk 사내 배포 가이드

회사 내부망에 Docker로 배포하여 직원들이 사내 도메인으로 접속하는 절차입니다.

## 배포 구성

```
[사내 PC]  →  http://fx-risk.사내도메인
                       │
                       ▼
        ┌──────────────────────────┐
        │  사내 서버 (Docker host)  │
        │                          │
        │  ┌────────────────────┐  │
        │  │  Nginx (port 80)   │  │  ← Basic Auth (사용자 3명)
        │  │  - React 정적 파일  │  │
        │  │  - /api/* 프록시    │  │
        │  └─────────┬──────────┘  │
        │            │             │
        │            ▼             │
        │  ┌────────────────────┐  │
        │  │  FastAPI (8000)    │  │  ← 매일 04시 자동 데이터 갱신
        │  │  + SQLite 볼륨     │  │
        │  └─────────┬──────────┘  │
        └────────────┼─────────────┘
                     │
                     ▼
              [외부 API]
        한국은행 ECOS / FRED
```

## 사전 준비

- 사내 Linux 서버 (또는 Windows Server) 1대
- **Docker 24+** 와 **Docker Compose v2** 설치
  - Linux: `curl -fsSL https://get.docker.com | sh`
  - Windows: Docker Desktop
- 서버에서 외부 도메인 `ecos.bok.or.kr`, `api.stlouisfed.org` 접근 가능
- 사내 도메인 1개 (예: `fx-risk.회사.local` — IT팀과 협의)
- ECOS API 키, FRED API 키

## 배포 절차 (회사 PC에서 수행)

### 1) 저장소 클론

```bash
git clone https://github.com/Davishyuncha/fx-Risk.git
cd fx-Risk
```

### 2) API 키 설정

```bash
cp backend/.env.example backend/.env
# 편집기로 backend/.env 열어서 ECOS_API_KEY, FRED_API_KEY 입력
```

운영 환경용으로 `CACHE_TTL_HOURS=24` 정도로 늘려도 됩니다 (스케줄러가 매일 04시에 갱신하므로).

### 3) 사용자 ID/PW 등록 (3명)

`httpd:alpine` 이미지로 htpasswd 명령만 빌려 쓰는 방식입니다.

```bash
# 새 파일 생성 (-c 옵션은 첫 사용자에만)
docker run --rm httpd:alpine htpasswd -nbB user1 'pw1' >> deploy/htpasswd
docker run --rm httpd:alpine htpasswd -nbB user2 'pw2' >> deploy/htpasswd
docker run --rm httpd:alpine htpasswd -nbB user3 'pw3' >> deploy/htpasswd
```

- `user1`, `user2`, `user3` 부분과 `pw1`, `pw2`, `pw3` 부분을 실제 값으로 바꾸세요
- `-B`는 bcrypt 해시 (가장 강력함)
- 파일은 `deploy/htpasswd`에 누적됨 → `.gitignore`로 보호됨

대화형 스크립트:
```bash
bash deploy/generate-htpasswd.sh
```

### 4) 빌드 & 실행

```bash
docker compose up -d --build
```

처음 빌드는 3~5분 소요. 빌드 완료 후 두 컨테이너가 시작됩니다:
- `fx-risk-backend` (FastAPI)
- `fx-risk-frontend` (Nginx)

### 5) 동작 확인

```bash
# 컨테이너 상태
docker compose ps

# 백엔드 로그
docker compose logs -f backend

# 헬스체크
curl http://localhost/healthz       # → "ok"
curl http://localhost/api/rates/latest -u user1:pw1
```

### 6) 초기 데이터 적재 (선택)

스케줄러는 매일 04시에 동작합니다. 즉시 채우려면:

```bash
curl -X POST http://localhost/api/rates/refresh -u user1:pw1
curl -X POST http://localhost/api/market/refresh -u user1:pw1
```

### 7) 사내 도메인 매핑

IT팀에 사내 DNS에 다음 매핑 요청:

```
fx-risk.회사.local  →  서버 IP
```

직원들은 브라우저에서 `http://fx-risk.회사.local` 접속 → ID/PW 입력 → 사용.

## HTTPS 옵션 (권장)

사내 CA 인증서가 있다면 nginx.conf에 443 포트와 인증서 경로를 추가하고 docker-compose의 ports에 `"443:443"` 추가, 인증서 파일을 볼륨으로 마운트하세요. 사내 CA 인증서가 없다면 1단계에서는 HTTP만 사용해도 됩니다 (사내망 한정이므로).

## 운영 명령어

```bash
# 재시작
docker compose restart

# 로그 확인
docker compose logs -f backend
docker compose logs -f frontend

# 코드 업데이트 (git pull 후)
git pull
docker compose up -d --build

# 중지
docker compose down

# 데이터 포함 완전 삭제 (주의)
docker compose down -v
```

## 사용자 추가/변경/삭제

```bash
# 추가
docker run --rm httpd:alpine htpasswd -nbB newuser 'newpw' >> deploy/htpasswd
docker compose restart frontend

# 삭제: deploy/htpasswd 파일을 직접 편집해 해당 줄 제거
# 변경: 해당 사용자 줄 제거 후 추가와 동일
```

## 백업

SQLite DB는 Docker volume `fx_data`에 저장됩니다. 매일 백업 권장:

```bash
docker run --rm -v fx-risk_fx_data:/data -v $(pwd)/backups:/backup alpine \
    tar czf /backup/fx-risk-$(date +%F).tar.gz -C /data .
```

## 트러블슈팅

### SSL 인증서 검증 실패 (회사 프록시 환경)
백엔드 컨테이너에서 외부 API 호출 시 `SSL: CERTIFICATE_VERIFY_FAILED` 에러가 나면, 회사 자체 CA 인증서를 컨테이너에 추가해야 합니다:

```bash
# 1) 회사 CA 인증서를 backend/corporate-ca.crt로 저장
# 2) backend/Dockerfile에 다음 줄 추가:
#    COPY corporate-ca.crt /usr/local/share/ca-certificates/
#    RUN update-ca-certificates
# 3) docker compose up -d --build
```

### 80번 포트 충돌
다른 서비스가 80번을 쓰면 `docker-compose.yml`의 ports를 `"8080:80"` 등으로 변경하고 사내 도메인 매핑에서 포트 명시.

### 외환 데이터가 비어있음
1. `backend/.env`의 API 키 확인
2. `docker compose logs backend` 에러 확인
3. `POST /api/rates/refresh` 수동 호출

### 직원이 접속 못함
- 사내 DNS 매핑 확인 (`nslookup fx-risk.회사.local`)
- 서버 방화벽에서 80(또는 443) 포트 열려 있는지 확인
- ID/PW 정확한지 확인 (대소문자 구분)

## 보안 체크리스트

- [ ] `backend/.env` 파일 권한 600 (소유자만 읽기): `chmod 600 backend/.env`
- [ ] `deploy/htpasswd` 파일 권한 600
- [ ] git 저장소가 사내용/비공개인지 확인 (현재 public이면 비공개로 전환 권장)
- [ ] API 키 외부 노출 시 즉시 재발급 (ECOS 마이페이지, FRED 계정 페이지)
- [ ] 사용자 비밀번호는 최소 12자 이상, 회사 표준 따르기
- [ ] 사내망 한정 접속 (외부 인터넷에서 도메인 접근 불가 확인)

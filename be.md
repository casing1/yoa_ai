# yoa Backend

이 폴더는 `main` 브랜치에 합치기 위한 self-contained 백엔드 패키지입니다.

## 구성

- `server.py`: FastAPI 앱과 API 엔드포인트
- `store.py`: Supabase 토큰 저장소
- `sql/tokens.sql`: PostgreSQL 토큰 테이블 생성 SQL
- `app.py`: Vercel 엔트리포인트
- `requirements.txt`: Python 의존성
- `.env.example`: 환경변수 예시
- `.gitignore`: 로컬 비밀값과 가상환경 제외

## 실행

```bash
cd be
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload
```

문서 주소:

```text
http://127.0.0.1:8080/docs
```

## 환경 변수

- `YOA_HOST`
- `YOA_PORT`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## SQL

Supabase SQL Editor에서 `be/sql/tokens.sql`을 실행하면 됩니다.

## 엔드포인트

- `GET /health`
- `POST /tokens/claim/basic`
- `POST /tokens/claim/pro`
- `GET /access`
- `POST /tokens/validate`
- `POST /tokens/revoke`

### `GET /health`

서버 상태 확인용 엔드포인트입니다.

응답 예시:

```json
{
  "status": "ok",
  "service": "yoa-token-backend"
}
```

### `POST /tokens/claim/basic`

CLI 퍼즐 규칙으로 `basic` 토큰을 발급합니다.

요청 예시:

```json
{
  "input_text": "토마토 큰일났다",
  "label": "demo-basic"
}
```

### `POST /tokens/claim/pro`

백도어 인증번호 또는 충성 문장으로 `pro` 토큰을 발급합니다.

요청 예시:

```json
{
  "auth_code": "000000",
  "label": "demo-pro"
}
```

### `GET /access`

`Authorization: Bearer <token>` 헤더로 접근 가능 여부를 확인합니다.

### `POST /tokens/validate`

토큰을 바디 또는 Bearer 헤더로 전달해 유효성을 검사합니다.

요청 예시:

```json
{
  "token": "your-issued-token"
}
```

### `POST /tokens/revoke`

토큰을 폐기합니다. 바디 또는 Bearer 헤더로 전달할 수 있습니다.

## Vercel

Vercel 프로젝트의 Root Directory를 `be`로 지정하면 됩니다.
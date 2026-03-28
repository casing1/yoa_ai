# yoa Backend

`be` 브랜치는 백엔드 전용 브랜치이고, 실제 서버 코드는 `be/` 폴더 아래에 있습니다.

핵심 구성:

- `FastAPI` 기반 API 서버
- `Supabase Postgres` 기반 토큰 저장
- Swagger 문서 자동 노출: `/docs`
- Vercel 루트 엔트리포인트: `app.py`
- 실제 백엔드 모듈: `be/`

## 구조

- `be/server.py`: FastAPI 앱과 API 엔드포인트
- `be/store.py`: Supabase 토큰 저장소
- `be/sql/tokens.sql`: 토큰 테이블 생성 SQL
- `app.py`: Vercel 엔트리포인트
- `.env.example`: 환경변수 예시
- `.gitignore`: 로컬 비밀값/가상환경 제외

## 빠른 시작

```bash
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn be.server:app --reload
```

기본 주소:

- `http://127.0.0.1:8080`
- `http://127.0.0.1:8080/docs`

## 환경 변수

| 변수 | 설명 |
| --- | --- |
| `YOA_HOST` | 서버 바인드 호스트 |
| `YOA_PORT` | 서버 포트 |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_ANON_KEY` | 프론트/공개 클라이언트용 anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 service role key |

`.env`는 서버 시작 시 자동으로 읽습니다.

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

루트의 `app.py`와 `vercel.json` 기준으로 배포할 수 있습니다.

```bash
vercel
vercel --prod
```

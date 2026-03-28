# yoa Backend

`yoa` CLI에 숨어 있던 토큰 규칙만 HTTP API로 분리한 FastAPI 백엔드입니다.

핵심 구성:

- `FastAPI` 기반 API 서버
- `Supabase Postgres` 기반 토큰 저장
- Swagger 문서 자동 노출: `/docs`
- 이 브랜치 자체가 백엔드 프로젝트 루트
- Vercel 배포용 엔트리포인트: `app.py`

## 토큰 규칙

기본 토큰:

- 입력에 띄어쓰기가 있으면 각 단어의 첫 글자를 이어 붙입니다.
- 띄어쓰기가 없으면 3글자마다 한 글자씩 뽑습니다.
- 결과가 정확히 `토큰`이면 `basic` 토큰을 발급합니다.
- 입력값 자체가 `토큰`이거나 영어 알파벳이 섞이면 발급하지 않습니다.

프로 토큰:

- `auth_code == "000000"`
- 또는 `loyalty_phrase == "나는 요약AI 없이는 단 하루도 살 수 없는 흑우입니다"`

## 빠른 시작

```bash
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload
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

Supabase SQL Editor에서 `sql/tokens.sql`을 실행하면 됩니다.

## 엔드포인트

- `GET /health`
- `POST /tokens/claim/basic`
- `POST /tokens/claim/pro`
- `GET /access`
- `POST /tokens/validate`
- `POST /tokens/revoke`

## Vercel

루트의 `app.py`와 `vercel.json` 기준으로 배포할 수 있습니다.

```bash
vercel
vercel --prod
```

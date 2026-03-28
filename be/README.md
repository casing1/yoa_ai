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

## Vercel

Vercel 프로젝트의 Root Directory를 `be`로 지정하면 됩니다.

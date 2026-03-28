# yoa

`yoa`는 CLI 세계관을 웹과 API로 옮긴 가짜 요약 서비스입니다.

이 저장소는 세 부분으로 나뉩니다.

- `be/`: FastAPI + Supabase 토큰 백엔드
- `fe/`: Next.js 프론트엔드
- `yoa_cli/`: 원본 CLI

## 구조

```text
.
├── be
├── fe
└── yoa_cli
```

세부 문서는 각 폴더의 README를 보면 됩니다.

- `be/README.md`
- `fe/README.md`
- `yoa_cli/README.md`

## 빠른 실행

### Backend

```bash
cd be
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload
```

### Frontend

```bash
cd fe
npm install
NEXT_PUBLIC_YOA_API_BASE_URL=http://127.0.0.1:8080 npm run dev
```

## 배포 기준

- 백엔드 Root Directory: `be`
- 프론트 Root Directory: `fe`
- 백엔드 문서: `/docs`

현재 프로덕션 URL:

- Frontend: `https://yoa-fe.vercel.app`
- Backend: `https://yoa-be.vercel.app`

## 핵심 동작

- 로그인 없이 조건을 만족하면 토큰을 발급합니다.
- 기본 토큰은 숨겨진 요약 규칙으로 발급합니다.
- 프로 토큰은 `--auth-code 000000` 또는 충성 문장으로 발급합니다.
- 웹은 발급된 토큰을 브라우저에 저장하고, CLI는 상태 파일에 저장합니다.
- 한글과 영어 모두 같은 규칙으로 요약합니다.

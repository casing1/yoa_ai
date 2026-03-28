# yoa Frontend

이 폴더는 `main` 브랜치에 합치기 위한 self-contained 프론트엔드 패키지입니다.

## 실행

```bash
cd fe
npm install
npm run dev
```

## 구성

- `app/`: Next.js App Router
- `components/`: UI 컴포넌트
- `package.json`: 프론트 의존성 및 스크립트
- `.gitignore`: 프론트 로컬 빌드 산출물 제외

## 배포

Vercel 프로젝트의 Root Directory를 `fe`로 지정하면 됩니다.

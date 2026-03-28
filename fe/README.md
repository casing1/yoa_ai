# yoa Frontend

`fe/`는 `yoa` 웹 콘솔 프론트엔드입니다.  
Next.js 기반이고, 백엔드의 토큰 발급/검증 API를 호출합니다.

## 실행

```bash
cd fe
npm install
NEXT_PUBLIC_YOA_API_BASE_URL=http://127.0.0.1:8080 npm run dev
```

프로덕션 빌드 확인:

```bash
npm run typecheck
npm run build
```

## 환경 변수

- `NEXT_PUBLIC_YOA_API_BASE_URL`
  - 예: `http://127.0.0.1:8080`
  - 배포 환경에서는 `https://yoa-be.vercel.app`

## UI 동작

- 시작 시 입력창에는 `오늘 날씨가 맑고 좋네요`가 기본으로 들어갑니다.
- 입력창이 비어 있을 때는 `yoa --help` 예시를 볼 수 있습니다.
- 기본 토큰과 프로 토큰 상태가 `current token status` 패널에 표시됩니다.
- 발급된 토큰은 브라우저에 저장되고, 새로고침 후에도 백엔드 검증을 거쳐 복구됩니다.

## 예시 입력

```text
오늘 날씨가 맑고 좋네요
yoa --help
yoa --auth
yoa --auth-code 000000
yoa --deep hello world from yoa
```

## 배포

Vercel 프로젝트의 Root Directory를 `fe`로 지정하면 됩니다.

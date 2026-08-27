# Vite React 프로젝트 Cloudflare Workers 이전 계획서

이 프로젝트는 Next.js가 아닌 **Vite 기반의 React SPA(정적 앱)**이므로, Next.js 전용 오픈 넥스트 도구 대신 Cloudflare Wrangler의 **Workers Static Assets**를 통해 배포 환경을 안전하게 이전하는 계획입니다.

## 1. 개요 및 배경
- 프로젝트가 Next.js가 아니므로, Next.js 전용 모듈(`@opennextjs/cloudflare`) 및 설정 파일(`next.config.ts`)은 제외합니다.
- 대신 정적 파일 빌드 디렉토리인 `dist/`를 바로 배포할 수 있는 **Wrangler의 Assets 배포 규격**을 사용하여 Cloudflare Workers 환경으로 안전하게 마이그레이션합니다.

---

## 2. 세부 구현 계획

### A. 개발 의존성 패키지 설치
- Cloudflare Wrangler CLI 도구를 개발 의존성으로 설치합니다.
- **실행 명령어**: `npm install -D wrangler`

### B. `wrangler.jsonc` 설정 파일 생성 [NEW]
- 프로젝트 루트에 아래와 같이 `wrangler.jsonc` 파일을 생성합니다.
  ```jsonc
  {
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "jt-self-inspection",
    "compatibility_date": "2026-08-20",
    "assets": { "directory": "./dist" },
    "observability": { "enabled": true }
  }
  ```

### C. `public/_headers` 헤더 설정 파일 생성 [NEW]
- Vite React 번들 자산 폴더인 `/assets/`에 대한 캐싱 정책을 담은 `public/_headers` 파일을 생성합니다. (Vite 빌드 시 `dist/`로 자동 복사됨)
- **내용**:
  ```
  /assets/*
    Cache-Control: public,max-age=31536000,immutable
  ```

### D. `package.json` 스크립트 추가 [MODIFY]
- Cloudflare 빌드 및 로컬 테스트, 배포를 위한 스크립트를 추가합니다:
  - `"cf:build": "npm run build"`
  - `"cf:preview": "npm run build && wrangler dev"`
  - `"cf:deploy": "npm run build && wrangler deploy"`

### E. `.gitignore` 업데이트 [MODIFY]
- wrangler 임시 폴더 및 로컬 변수 파일을 커밋에서 제외합니다:
  ```
  .wrangler/
  .dev.vars
  ```

### F. `.dev.vars` 로컬 변수 파일 생성 [NEW]
- `.env` 및 로컬 환경변수 파일 내용을 복사하여 `.dev.vars` 파일을 생성하고, 개발 환경 지시어(`ENV=development` 등)를 상단에 추가합니다.

### G. Edge Runtime 선언 탐색
- 프로젝트 전체 소스에서 `export const runtime = "edge"` 구문이 존재하는지 검색하고, 있는 경우 삭제 처리합니다.

---

## 3. 검증 계획
1. **의존성 설치 및 파일 생성 확인**: `wrangler.jsonc`, `public/_headers`, `.dev.vars`가 지정된 사양대로 잘 만들어졌는지 검증합니다.
2. **빌드 검증**: `npm run cf:build`를 돌려 Vite 빌드가 문제없이 끝나는지 확인합니다.

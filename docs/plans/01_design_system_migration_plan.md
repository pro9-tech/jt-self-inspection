# JT_자주측정 앱 디자인 시스템 MASTER v3.0 적용 계획서

본 계획서는 기존 'JT_자주측정' 앱에 새로운 제니트리 통합 디자인 시스템 MASTER v3.0 스펙을 이식하고 브랜드 로고 및 파비콘을 적용하기 위한 구체적인 절차를 정의합니다.

## User Review Required

> [!IMPORTANT]
> - **프레임워크 확인**: 본 앱은 Next.js가 아닌 **Vite + React (TypeScript)**로 구축되어 있습니다. 정적 파일 복사는 `public/` 디렉터리에 수행하며, 최종 URL 경로 또한 Vite의 정적 호스팅 규격(`href="/brand/logo/..."`)에 따릅니다.
> - **파비콘 누락 보완**: 제공된 `brand/logo` 디렉터리 내에 `favicon.svg` 파일이 존재하지 않는 것을 확인했습니다. 브랜드 마크 역할을 하는 `brand/logo/logo-mark.svg` 파일을 `favicon.svg`로 복제하여 public에 배치하고 적용하겠습니다.

## Proposed Changes

### 1. 브랜드 에셋 배치 및 파비콘 링크 설정

- [NEW] `public/brand` 폴더로 브랜드 자산 전체 복사
- [NEW] `public/brand/logo/favicon.svg` 생성 (존재하지 않을 시 `logo-mark.svg`를 복사)
- [MODIFY] [index.html](file:///c:/Users/user/Desktop/JT_자주측정/index.html)
  - 기존 파비콘 링크를 `<link rel="icon" type="image/svg+xml" href="/brand/logo/favicon.svg">`로 수정
  - `<head>` 태그 내에 Pretendard 및 Figtree 폰트를 로드하는 Google Fonts CDN 링크 추가

---

### 2. CSS 글로벌 디자인 시스템 토큰 반영

- [MODIFY] [src/index.css](file:///c:/Users/user/Desktop/JT_자주측정/src/index.css)
  - `JT_디자인시스템_MASTER_v3.0.md`의 Seed, Map, Alias 토큰 전체를 `:root` 및 `[data-theme="dark"]`에 CSS 변수로 선언
  - Tailwind CSS v4 환경에 영향이 없도록 CSS 최상단에 토큰을 정의하고 `@import "tailwindcss";` 아래에서 활용 가능하게 유지

---

### 3. 헤더 내 로고 탑재 및 홈(대시보드) 이동 로직 적용

- [MODIFY] [src/App.tsx](file:///c:/Users/user/Desktop/JT_자주측정/src/App.tsx)
  - 화면 상단 헤더 영역(약 899~910 라인)에 브랜드 로고 `logo-h.svg` (다크모드 대응 시 `logo-h-light.svg`) 배치
  - 높이를 24px ~ 28px 범위로 설정하고 로고 비율 보존 (`object-contain`)
  - 로고 클릭 시 `showHistory(false)` 및 `showSettings(false)` 상태로 리셋하여 대시보드 홈 화면으로 즉시 이동하게 함
  - 기존에 10px로 강제된 버튼의 글자 크기를 최소 12px (`var(--fs-sm)`)로 조정
  - 주요 제어 입력창(Select, Input) 및 버튼의 높이를 `--control-height` (36px)로 통일

---

## Verification Plan

### Manual Verification
1. 브라우저에서 사이트를 실행하고 헤더 상단에 '제니트리' 공식 로고(`logo-h.svg`)가 정확한 비율과 24px~28px 높이로 나타나는지 확인합니다.
2. 이력 조회 또는 설정 페이지로 이동한 상태에서 로고를 클릭했을 때 메인 측정 입력 화면(대시보드)으로 정상 회귀하는지 테스트합니다.
3. 브라우저 탭의 파비콘이 신규 `favicon.svg`로 정상 노출되는지 관찰합니다.
4. CSS 변수(`var(--color-primary)`, `var(--control-height)`)가 정상 참조되어 디자인이 시스템 지침을 따르는지 검사합니다.

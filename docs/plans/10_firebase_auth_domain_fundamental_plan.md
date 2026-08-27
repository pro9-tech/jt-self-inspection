# Firebase Authentication 커스텀 도메인 로그인 오류 및 권한 관리 체계 근본 해결 계획서

이 계획서는 커스텀 도메인(`self-inspection.janytree.app`) 진입 시 발생하는 로그인 오작동 문제를 근본적으로 차단하고, 최고 관리자(`pro9@janytree.com`)를 제외한 다른 계정들에 대해 **권한 허용(사용자/관리자 등급 지정 및 승인)을 제어할 수 있는 튼튼한 권한 관리 체계(RBAC)**를 구축하는 통합 마이그레이션 계획입니다.

---

## 1. 근본 원인 및 개선 방향

### A. 로그인 오류 근본 해결
- **도메인 승인**: Firebase Console의 Authorized domains에 `self-inspection.janytree.app` 도메인을 추가하여 Google OAuth 세션 거부를 방지합니다. (체이스 수동 1회 등록 필요)
- **임시 우회 로그인 제거**: 리다이렉트 처리 오류 시 로컬 스토리지에 가짜 관리자 세션을 강제 주입하던 코드를 삭제합니다. 오직 실제 파이어베이스 인증 정보(`onAuthStateChanged`)로만 로그인 상태를 정립하여 비로그인 시 불필요한 Firestore 조회를 원천 차단합니다.
- **하이브리드 로그인 기법**: `signInWithPopup` 방식을 디폴트로 띄워 모바일/데스크톱 대응력을 강화하고, 팝업 차단 발생 시에만 `signInWithRedirect`로 낙하(Fallback)합니다.

### B. 튼튼한 권한 관리(Role/Permission) 체계 뼈대 마련
- 기존의 하드코딩된 관리자 목록(`ADMIN_EMAILS`)에 여러 메일을 추가하던 방식은 관리자가 늘어날 때마다 소스 코드를 빌드/배포해야 하는 문제가 있어 유지보수가 불가능했습니다.
- 따라서 **최고 관리자(Super Admin)를 단일화**하고, 다른 일반 관리자 및 일반 사용자는 데이터베이스 상에서 **최고 관리자가 직접 권한을 토글하여 허용(등록)**해주는 동적 권한 체계로 전면 전환합니다.

---

## 2. 세부 설계 및 데이터 모델

### A. 최고 관리자(Super Admin) 및 관리자 등급 정의
- **최고 관리자 (고정)**: `pro9@janytree.com` (시스템 내 하드코딩된 유일무이한 마스터 권한)
- **일반 관리자 (동적)**: `settings/global` 문서 내의 사용자 목록 중 `role: 'admin'` 또는 `isAdmin: true` 필드가 지정되어 저장된 계정.
- **일반 사용자 (동적)**: `settings/global` 문서 내의 사용자 목록 중 `role: 'user'` 또는 관리자 지정이 안 된 계정.

### B. Firestore 데이터 스키마 고도화 (`settings/global`)
기존의 `{ name, email }` 형태의 사용자 개별 모델에 `role` 필드를 신설하여 확장합니다:
```json
{
  "operators": [
    { "name": "홍길동", "email": "hong@janytree.com", "role": "user" },
    { "name": "체이스(abcd)", "email": "abcd7623@janytree.com", "role": "admin" }
  ],
  "verifiers": [
    { "name": "김확인", "email": "kim@janytree.com", "role": "user" }
  ]
}
```

### C. 클라이언트 소스 권한 판정부 구현 (`src/App.tsx`)
- **관리자 권한 조회 헬퍼 함수 (`checkIsAdmin`)**:
  - `user.email`이 `pro9@janytree.com` (최고 관리자) 이면 **무조건 `true`**.
  - `user.email`이 Firestore `settings.operators` 혹은 `settings.verifiers` 목록에 등록되어 있고, 해당 객체의 `role`이 `'admin'` 이면 **`true`**.
  - 그 외의 일반 사용자 계정이나 비로그인 상태는 **`false`**.
- 이 `checkIsAdmin` 함수의 리턴값에 따라 상단 자물쇠 아이콘(관리자 모드 온/오프), 환경설정 탭 편집 권한, 기록 삭제 권한을 일괄 제어합니다.

### D. 최고 관리자 화면 UI 보강 (환경설정 > 사용자 관리)
- 최고 관리자(`pro9@janytree.com`)가 환경설정 화면에서 측정자(Operators) 및 확인자(Verifiers) 이메일을 추가/편집할 때, **"관리자 권한 부여" 토글/체크박스**를 노출합니다.
- 최고 관리자가 체크하여 저장하면 해당 이메일은 Firestore 상에서 `role: 'admin'` 으로 승인 처리되어, 이후 해당 계정으로 구글 로그인 시 관리자 권한을 가진 채 대시보드에 정상 접속하게 됩니다.

---

## 3. 구현 절차 (Step-by-Step)
1. **[1단계 - 체이스]** Firebase Console의 Authentication > Settings > Authorized domains에 `self-inspection.janytree.app` 등록.
2. **[2단계 - 소스 수정]** `App.tsx` 내 `ADMIN_EMAILS`를 `['pro9@janytree.com']`으로 수정 및 `checkIsAdmin` 판정 로직 탑재.
3. **[3단계 - 소스 수정]** `getRedirectResult` 에러 가드 처리 및 로그인 핸들러 하이브리드화(Popup + Redirect) 구현.
4. **[4단계 - 소스 수정]** 환경설정 사용자 추가 모달/UI에 "관리자 권한 부여" 체크박스 추가 및 Firestore 저장 연동.
5. **[5단계 - DB 규칙 보강]** `firestore.rules`에서 일반 관리자(`role == 'admin'`)도 settings를 정상 조회/수정할 수 있도록 규칙 보정.

---

## 4. 검증 계획
1. **Authorized Domain 등록 확인**: Firebase Console 승인 여부 검증.
2. **비로그인 진입**: 캐시/세션 삭제 후 첫 진입 시 데이터베이스 권한 팝업 없이 로그인 화면이 노출되는지 확인.
3. **최고 관리자 로그인**: `pro9@janytree.com` 로그인 시 환경설정에서 일반 관리자 권한을 체크하여 등록할 수 있는 UI가 나타나는지 확인.
4. **일반 관리자 로그인**: `abcd7623@janytree.com`에 대해 최고 관리자가 "관리자 권한"을 준 상태에서 로그인 시, 정상적으로 관리자 모드로 작동하는지 확인.
5. **일반 사용자 로그인**: 권한이 부여되지 않은 일반 사용자로 로그인 시, 대시보드 조회는 가능하나 자물쇠 해제나 환경설정 편집은 차단되는지 확인.

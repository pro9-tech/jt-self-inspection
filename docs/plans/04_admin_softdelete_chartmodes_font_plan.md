# [구현 계획서] 관리자 모드, 소프트 삭제, 다양한 그래프 모드, 글자 크기 확대 및 내부 모달 적용

본 계획서는 체이스의 요청에 따라 앱의 접근 제어, 데이터 보존성 향상, 시인성 개선, UI 완성도를 높이기 위한 구체적인 기술 사양과 변경 사항을 정리한 것입니다.

---

## 1. 주요 요구사항 및 제안 사항

### ① 기록 삭제 방식 변경 (소프트 삭제 및 영구보존)
* **목적**: 데이터를 실수로 삭제하지 않고 데이터베이스에 안전하게 영구보존하며, UI 상에서만 삭제 여부를 명시합니다.
* **구현 방식**:
  * `FillingRecord` 모델에 `isDeleted` (boolean) 및 `deletedAt` (string) 필드를 추가합니다.
  * 기존 `deleteDoc`을 사용한 물리 삭제 대신 `updateDoc`으로 `isDeleted: true` 상태를 업데이트합니다.
  * 기록 목록에서 삭제된 기록도 흐리게 처리(opacity 적용)하고, 텍스트에 취소선을 긋고 `[삭제됨]` 배지를 큼직하게 붙여 유지합니다.
  * 삭제된 기록은 수정하지 못하도록 폼 로딩 시 입력 필드를 비활성화하거나 읽기 전용 상태로 전환합니다.

### ② 모든 글자 크기 확대 (시인성 확보)
* **목적**: 브라우저 화면을 강제로 확대하지 않아도 모든 UI 텍스트가 시원하고 명확하게 보이도록 합니다.
* **구현 방식**:
  * 제니트리 디자인 토큰인 `typography.css` 변수(예: `--jt-fs-base`, `--jt-fs-sm` 등)를 15%~20% 더 크게 재정의합니다.
  * Tailwind rem 비례를 위해 `html` 기본 폰트 크기를 `font-size: 118%` 수준으로 확대합니다.
  * 표나 입력창 등 텍스트 밀도가 높은 영역의 배치 간격을 약간 넓혀 디자인 레이아웃이 깨지지 않게 보완합니다.

### ③ 그래프창 다양한 모드 지원
* **목적**: 평균값 외에도 개별 측정 수치나 오차 한계 범위를 다각도로 시각화하여 품질 관리를 고도화합니다.
* **구현 방식**:
  * `WeightChart` 컴포넌트 내에 `chartMode` (`'average' | 'individual' | 'minMax'`) 상태를 추가합니다.
  * **평균 트렌드 모드 (average)**: 현재 구현된 라인 차트입니다.
  * **개별 측정값 모드 (individual)**: 측정 주기마다 모든 바이알(Vials)들의 원시 측정값들을 다중 원(Scatter)으로 캔버스에 시각화합니다.
  * **최소/최대 범위 모드 (minMax)**: 측정 주기별 최소값과 최대값 범위를 세로 밴드(Vertical Bar/Line)로 잇고, 그 위에 평균값을 점으로 표현합니다.
  * **UI**: 우측 상단에 세련된 탭 형태의 버튼을 두어 디자인 시스템이 깨지지 않고 쉽게 모드를 토글하게 합니다.

### ④ 상태 메시지의 앱 내부 모달화
* **목적**: 크롬 기본 `alert` 팝업을 제거하고, 디자인 시스템 테마(다크 모드 등)와 자연스럽게 어울리는 커스텀 내부 모달을 제공합니다.
* **구현 방식**:
  * 공용 내부 알림 모달 상태(`alertModal`)와 알림창 호출 헬퍼(`showAlert`)를 `App.tsx`에 추가합니다.
  * "클라우드에 저장되었습니다", "설정이 성공적으로 저장되었습니다" 등 기존 `alert()` 호출 코드를 내부 모달 호출로 일제히 대체합니다.

### ⑤ 관리자 모드 (`pro9@janytree.com`) 및 자물쇠 분리
* **목적**: 중요 설정(측정자, 확인자, 구글 시트 동기화)에 대한 접근 권한을 관리자 본인으로 제한합니다.
* **구현 방식**:
  * 로그인한 계정이 `pro9@janytree.com`인 경우에만 환경설정창 타이틀 옆에 **자물쇠 아이콘(Lock/Unlock)**을 표시합니다.
  * 자물쇠가 풀린(Unlock) 관리자 모드 상태(`isAdminMode: true`)에서만 환경설정 모달 내의 "측정자 설정", "확인자 설정", "구글 시트 동기화 설정" 섹션이 활성화 및 노출됩니다.
  * 일반 사용자이거나 자물쇠가 잠긴 상태인 경우, 해당 관리자 전용 섹션들은 보이지 않으며 "품목 및 중량 설정"만 표시됩니다.

### ⑥ 사용자/확인자 구글 이메일 연동 및 로그인 제한
* **목적**: 사전에 관리자가 이메일을 지정해 준 인원만 로그인할 수 있도록 통제합니다.
* **구현 방식**:
  * 환경설정(`AppSettings`) 내의 `operators` 및 `verifiers` 목록 구조를 `{ name: string, email: string }` 형태의 객체 배열로 확장합니다. (기존 문자열 배열 데이터는 첫 로딩 시 자동으로 파싱 및 변환하여 호환성을 보장합니다.)
  * 로그인 성공 시점(`onAuthStateChanged` 및 리다이렉트 처리부)에 로그인한 구글 이메일이 `pro9@janytree.com`이 아니고, 설정에 등록된 측정자/확인자 이메일 목록에도 존재하지 않는다면, 즉시 `auth.signOut()`을 통해 로그아웃하고 권한 에러 메시지를 내부 모달로 노출하여 진입을 차단합니다.

---

## 2. 변경할 대상 파일 목록

| 작업 유형 | 파일 경로 | 변경 요약 |
| :--- | :--- | :--- |
| **MODIFY** | [src/App.tsx](file:///c:/Users/janytree/OneDrive/바탕%20화면/jt-self-inspection/src/App.tsx) | 삭제 핸들러(soft delete), 로그인 제한 검사 및 폼 비활성화, `WeightChart` 모드 전환 구현, 내부 알림 모달 및 관리자 자물쇠 기능 UI 추가, 측정자/확인자 이메일 설정 UI 추가 |
| **MODIFY** | [src/index.css](file:///c:/Users/janytree/OneDrive/바탕%20화면/jt-self-inspection/src/index.css) | 폰트 토큰 변수 및 HTML 기본 font-size 비율 재정의 (전체 글자 크기 확대) |

---

## 3. 상세 구현 사양

### ① 데이터 모델 변경 (하위 호환성 유지)
```typescript
interface UserWithEmail {
  name: string;
  email: string;
}

interface AppSettings {
  items: ConfigItem[];
  operators: UserWithEmail[]; // string[]에서 변환
  verifiers: UserWithEmail[]; // string[]에서 변환
  scriptUrl?: string;
  uid: string;
}

interface FillingRecord {
  // ... 기존 필드 유지
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}
```

### ② 로그인 승인 정책 로직 (Pseudo-code)
```typescript
const checkUserPermission = async (loggedInEmail: string | null) => {
  if (!loggedInEmail) return false;
  if (loggedInEmail === 'pro9@janytree.com') return true;

  // Firestore에서 settings/global 문서를 가져와 등록 이메일 검증
  const snap = await getDoc(doc(db, 'settings', 'global'));
  if (snap.exists()) {
    const data = snap.data();
    const ops = data.operators || [];
    const vers = data.verifiers || [];
    
    const isAllowed = [...ops, ...vers].some(u => {
      const email = typeof u === 'string' ? '' : (u.email || '');
      return email.toLowerCase().trim() === loggedInEmail.toLowerCase().trim();
    });
    
    return isAllowed;
  }
  return false;
};
```

---

## 4. 검증 계획

### 수동 검증 항목 (브라우저 확인)
1. **이메일 로그인 제한 검증**:
   - `pro9@janytree.com`으로 로그인했을 때 정상 진입 및 자물쇠 아이콘 노출 확인.
   - 임의의 다른 구글 계정으로 로그인 시도 시 즉시 튕겨 나가며 "권한 없음" 내부 모달 팝업이 출력되는지 확인.
   - 측정자/확인자에 일반 구글 이메일을 등록한 후, 해당 계정으로 로그인 시 정상 진입(단, 자물쇠 미노출) 확인.
2. **소프트 삭제 검증**:
   - 기록 목록에서 항목 삭제 시 `deleteDoc`이 아닌 수정(Soft Delete) 처리가 되어 흐리게 표시되는지 확인.
   - [삭제됨] 배지가 정상적으로 나타나는지 확인.
   - 삭제된 항목 상세를 열었을 때 입력창 수정 및 저장 기능이 차단되는지 확인.
3. **글자 크기 확인**:
   - 화면 글꼴이 약 20% 크고 선명하게 보이며 화면 레이아웃 깨짐이 없는지 확인.
4. **다양한 그래프 모드**:
   - `WeightChart`에서 모드 전환 탭을 클릭함에 따라 `[평균 트렌드]`, `[개별 측정값]`, `[최소/최대 범위]` 그래프가 정상적으로 전환되며 그려지는지 확인.
5. **내부 알림 모달**:
   - 저장 성공 시 크롬 팝업 대신 다크/라이트 테마에 맞춘 모달창으로 표시되는지 확인.

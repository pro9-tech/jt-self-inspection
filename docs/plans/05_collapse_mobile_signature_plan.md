# [구현 계획서] 카드 접기 기능, 모바일 레이아웃 최적화, 인쇄 시 전자 서명 연동

본 계획서는 체이스의 요청에 따라 앱의 각 카드 섹션 접기/펴기 기능 추가, 모바일 환경 최적화(하단 탭 바 및 목록 하단 배치), 인쇄 화면 내 결재란의 Canvas 기반 전자 서명 기능 추가를 위한 구체적인 설계 사양을 정의합니다.

---

## 1. 주요 요구사항 및 제안 사항

### ① 각 카드(네모 칸) 접기/펴기(Collapse) 기능
* **목적**: 화면이 복잡해질 때 사용하지 않는 영역을 접어서 작업 공간을 효율적으로 확보합니다.
* **대상 카드**:
  1. **기본 정보 설정 카드** (`infoCard`)
  2. **계측 테이블 카드** (`tableCard`)
  3. **중량 트렌드 그래프 카드** (`graphCard`)
* **구현 방식**:
  * 각 카드별 접힘 상태(`isInfoCardCollapsed`, `isTableCardCollapsed`, `isGraphCardCollapsed`)를 React State로 관리합니다.
  * 각 카드 상단에 통일성 있는 헤더 영역을 보장하고, 우측에 접기/펴기 버튼(Lucide `ChevronUp`, `ChevronDown`)을 배치합니다. (헤더가 없던 테이블 카드와 그래프 카드 상단에 심플한 디자인의 헤더를 추가합니다.)
  * 카드가 접혔을 때는 내부 본문 영역을 조건부 렌더링으로 숨기거나 `hidden` 처리하고, 카드 높이를 헤더 높이만큼(약 `56px`)으로 축소합니다.
  * 카드 접힘 상태에서는 브라우저 자체 드래그 크기 조절 기능이 방해되지 않도록 `resize: none`을 동적 인라인 스타일로 적용합니다.

### ② 모바일 환경 레이아웃 최적화 (하단 탭 바 및 목록 하단 배치)
* **목적**: 스마트폰이나 태블릿 등 모바일 기기로 접속했을 때, 사이드바를 숨기고 모바일 네이티브 앱 같은 친화적인 인터페이스를 제공합니다.
* **구현 방식**:
  * **사이드바 숨김**: 모바일 해상도(768px 미만)에서는 데스크톱 세로 사이드바(`aside`)를 숨깁니다 (`hidden md:flex`).
  * **하단 고정 탭 바 (Bottom Navigation Bar) 추가**: 모바일 하단에 `fixed bottom-0`으로 고정되는 탭 바를 추가하여 인쇄 시에는 보이지 않게(`print-hidden`) 설정합니다.
    * 탭 항목: [🏠 대시보드], [📋 기록내역 (목록)], [➕ 새기록], [💾 저장], [🖨️ 발행]
    * 각 탭은 데스크톱 사이드바의 동작과 100% 동일하게 작동합니다.
  * **하단 목록 배치**: 기록 내역 조회 모달이 모바일 환경에서는 화면 아래쪽에서 위로 슬라이드되어 올라오는 **바텀 시트(Bottom Sheet) 형태**로 밀착 배치되도록 스타일을 개선합니다. (이미 `index.css`에 구성된 `.fixed.inset-0.flex.items-center.justify-center` 미디어 쿼리를 기반으로 모바일 뷰 최적화 연동을 완벽히 매칭합니다.)
  * **카드 크기 강제 최적화**: 모바일 뷰에서는 드래그 확대/축소를 비활성화하고, 카드가 화면 가로 전체(100%)를 꽉 채우도록 처리합니다.

### ③ 인쇄(보고서 발행) 시 결재란 전자 서명 기능 추가
* **목적**: 종이에 출력하거나 PDF로 저장하기 전에, 작성자/검토자/승인자가 화면에서 직접 서명할 수 있는 기능을 제공합니다.
* **구현 방식**:
  * **서명 상태 관리**: `AppContent` 상위 컴포넌트에서 서명 이미지 데이터를 보관할 React State(`signatures`)를 추가합니다.
    * `signatures: { writer: string; reviewer: string; approver: string; }` (각각 작성, 검토, 승인 서명의 Base64 Image URL 저장)
  * **서명 모달 컴포넌트 (`SignatureModal`) 구현**: 
    * HTML5 Canvas API를 이용하여 마우스 드래그와 모바일 터치 드로잉(`onTouchStart`, `onTouchMove`, `onTouchEnd`)을 완벽하게 지원하는 가볍고 성능 좋은 서명 컴포넌트를 자체 작성합니다.
    * [초기화], [서명 적용], [취소] 기능을 깔끔하게 제공합니다.
  * **결재란 연동**:
    * `PrintReportTemplate` 컴포넌트의 결재 테이블 내 [작성], [검토], [승인] 서명 란에 클릭 이벤트를 연동합니다. (미리보기 화면인 `isPreview={true}` 상태일 때만 클릭 가능하도록 제한)
    * 서명란을 클릭하면 해당 권한자의 서명 모달이 열립니다. 서명이 등록되면 해당 서명 이미지가 결재란 내에 자연스럽게 렌더링됩니다.
    * 서명이 이미 존재하는 경우, 미리보기 화면 아래쪽에 '지우기' 버튼을 조그맣게 노출하여 개별 서명을 초기화할 수 있게 합니다.
    * 미리보기 화면에서 입력한 서명 정보는 실제 인쇄용 `PrintReportTemplate`에도 동일한 State로 바인딩되어, 실제 인쇄 명령(`window.print()`)을 수행할 때 서명 이미지가 선명하게 포함된 상태로 출력됩니다.

---

## 2. 변경할 대상 파일 목록

| 작업 유형 | 파일 경로 | 변경 요약 |
| :--- | :--- | :--- |
| **MODIFY** | [src/App.tsx](file:///c:/Users/janytree/OneDrive/바탕%20화면/jt-self-inspection/src/App.tsx) | 각 카드별 접기/펴기 상태 및 토글 헤더 UI 추가, 모바일용 하단 탭 바 UI 렌더링 추가, `PrintReportTemplate`에 서명 연동(Prop 추가 및 결재란 이미지 바인딩) 및 `SignatureModal` 컴포넌트 추가 |
| **MODIFY** | [src/index.css](file:///c:/Users/janytree/OneDrive/바탕%20화면/jt-self-inspection/src/index.css) | 모바일 화면용 탭 바 스타일 및 바텀 시트 여백 보정 (`pb-20`), 인쇄 시 서명 란의 스타일 보완 |

---

## 3. 상세 구현 사양

### ① 카드 접기 상태 정의 및 스타일 연동
```typescript
// AppContent 내부 상태 추가
const [isInfoCardCollapsed, setIsInfoCardCollapsed] = useState(false);
const [isTableCardCollapsed, setIsTableCardCollapsed] = useState(false);
const [isGraphCardCollapsed, setIsGraphCardCollapsed] = useState(false);
```

**인라인 스타일 제어 예시:**
```tsx
<div 
  ref={infoCard.ref} 
  className="resizable-card bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex-none" 
  style={{ 
    minWidth: '280px', 
    minHeight: isInfoCardCollapsed ? 'auto' : '350px', 
    height: isInfoCardCollapsed ? '60px' : undefined,
    width: '320px', 
    resize: isInfoCardCollapsed ? 'none' : 'both',
    overflow: isInfoCardCollapsed ? 'hidden' : 'auto',
    fontSize: `${13 * infoCard.scale}px`, 
    '--control-height': `${36 * infoCard.scale}px` 
  } as React.CSSProperties}
>
  {/* 헤더 영역 (항상 노출) */}
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">기본 정보 설정</h2>
    <button 
      onClick={() => setIsInfoCardCollapsed(!isInfoCardCollapsed)}
      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
    >
      {isInfoCardCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
    </button>
  </div>

  {/* 본문 영역 (접혔을 때는 렌더링하지 않음) */}
  {!isInfoCardCollapsed && (
    <div className="space-y-4">
      {/* 기존 입력 폼 요소들 */}
    </div>
  )}
</div>
```

### ② 모바일 하단 탭 바 UI 렌더링 구조
```tsx
{/* App.tsx 리턴 부분 하단에 추가 */}
<div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-[var(--jt-color-border)] dark:border-zinc-800 flex justify-around items-center h-16 z-40 print-hidden pb-safe">
  <button onClick={handleGoDashboard} className="flex flex-col items-center justify-center flex-1 text-zinc-500 hover:text-zinc-900">
    <Layers size={18} />
    <span className="text-[9px] font-bold mt-1">대시보드</span>
  </button>
  <button onClick={() => setShowHistory(true)} className="flex flex-col items-center justify-center flex-1 text-zinc-500 hover:text-zinc-900">
    <History size={18} />
    <span className="text-[9px] font-bold mt-1">기록내역</span>
  </button>
  <button onClick={resetForm} className="flex flex-col items-center justify-center flex-1 text-zinc-500 hover:text-zinc-900">
    <Plus size={18} />
    <span className="text-[9px] font-bold mt-1">새기록</span>
  </button>
  <button onClick={saveRecord} disabled={isSaving || !user} className="flex flex-col items-center justify-center flex-1 text-zinc-500 hover:text-zinc-900 disabled:opacity-50">
    <Save size={18} />
    <span className="text-[9px] font-bold mt-1">저장</span>
  </button>
  <button onClick={() => setShowPrintPreview(true)} className="flex flex-col items-center justify-center flex-1 text-zinc-500 hover:text-zinc-900">
    <CheckCircle2 size={18} className="text-blue-500" />
    <span className="text-[9px] font-bold mt-1 text-blue-500">발행</span>
  </button>
</div>
```

---

## 4. 검증 계획

### 수동 검증 항목 (브라우저 확인)
1. **카드 접기/펴기 기능 검증**:
   - 각 카드(기본정보, 계측테이블, 그래프)의 헤더 우측 토글 버튼을 눌렀을 때, 내용이 접히며 카드의 세로 크기가 60px 내외로 줄어드는지 확인.
   - 접힌 상태에서 드래그 크기 조절(`resize`) 핸들이 사라지고 크기 변경이 차단되는지 확인.
   - 다시 토글 버튼을 눌렀을 때 원래 크기와 본문이 그대로 복구되는지 확인.

2. **모바일 최적화 및 레이아웃 검증**:
   - 브라우저 개발자 도구(F12)를 통해 해상도를 모바일 크기(예: 430px)로 줄였을 때:
     - 좌측 사이드바가 자연스럽게 숨겨지는지 확인.
     - 화면 맨 아래쪽에 고정된 하단 탭 바가 이쁘게 정렬되는지 확인.
     - 메인 콘텐츠 영역 카드의 드래그 크기 조절이 차단되고 꽉 찬 너비로 1열 정렬되는지 확인.
     - 기록 내역(목록)을 켰을 때 하단 바텀 시트로 쓱 밀착하여 열리는지 확인.

3. **인쇄 전자 서명 기능 검증**:
   - [보고서 발행] 버튼을 클릭해 A4 인쇄 미리보기 모달을 띄웠을 때:
     - 우측 상단 결재란(작성, 검토, 승인)에 마우스를 올리면 커서가 포인터(`cursor-pointer`)로 변하는지 확인.
     - 각 칸을 클릭했을 때 서명 캔버스 모달(`SignatureModal`)이 정상 노출되는지 확인.
     - 마우스 및 터치로 글씨가 부드럽게 그려지는지 확인.
     - [서명 적용]을 누르면 결재 테이블 내 해당 칸에 서명이 쏙 들어가는지 확인.
     - 서명이 있는 칸 하단에 '지우기' 버튼이 조그맣게 뜨며, 이를 누르면 서명이 정상 제거되는지 확인.
     - 서명을 채운 후 [인쇄하기] 버튼을 누르면 인쇄 미리보기 화면에 서명이 완벽히 삽입되어 출력 대기 상태로 가는지 확인.

---
> [!IMPORTANT]
> 본 작업은 JT 디자인 시스템 토큰 변수(`index.css` 내)를 그대로 준수하며, 기존의 Firebase와 Supabase 연동 코드에 전혀 영향을 미치지 않도록 안정성을 유지하며 변경이 필요한 영역만 엄격히 수정합니다.

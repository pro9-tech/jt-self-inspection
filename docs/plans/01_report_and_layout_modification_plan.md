# 01. 보고서 발행 및 레이아웃 수정 구현 계획서

본 계획서는 체이스님이 요청하신 충진품 자주측정 앱의 보고서 발행 기능 추가, 상단 메뉴 레이아웃 변경, 네모칸 드래그 확대/축소, 측정항목 그래프화 및 평균 조회 기능 구현을 위한 설계 문서입니다.

---

## 1. 개요 및 요구사항 분석
1. **보고서 발행 및 A4 인쇄**:
   - 앱에 '보고서 발행' 버튼을 추가하여 저장된 데이터를 기반으로 A4 규격에 맞는 인쇄 화면을 제공합니다.
   - 인쇄 화면 구성:
     - **왼쪽 상단**: 결재란 (작성 / 검토 / 승인) 탑재.
     - **오른쪽 상단**: 연도 동적 반영 제목 (예: `{연도}년 충진품 자주검사기록`).
     - **오른쪽 하단**: 문서 번호 `[JTQF-3440-05]` 배치.
   - A4 한 장에 테이블 행이 꽉 차면 다음 장으로 자동 분할 (`page-break-after: always`).
   - 모드별 분류 적용: **충진1**, **충진2**, **포장**의 앱 저장 방식에 따라 각각 최적화된 테이블 레이아웃 적용.
2. **상단 메뉴 레이아웃 수정**:
   - 로고는 기존 위치(왼쪽 위)를 유지.
   - 상단 메뉴 버튼들(구글 로그인, 환경설정, 기록 내역, 새 기록, 저장, 보고서 발행 등)을 왼쪽 영역에 **세로 리스트(사이드바) 형태**로 배치.
   - 메인 타이틀(제목)을 화면 상단 가운데 정렬하여 배치.
3. **네모칸(카드) 드래그 확대/축소**:
   - 메인 대시보드의 주요 카드형 네모칸(기본 정보 설정, 계측 가이드, 계측 테이블, 그래프 카드 등)에 마우스 드래그 확대/축소 기능(`resize: both; overflow: auto;`) 적용.
   - 디자인이 크게 훼손되지 않도록 `min-width`, `min-height` 속성을 안전하게 설정.
4. **측정항목 그래프화 및 평균 조회**:
   - 충진 중량(V1, V2, V3) 및 기타 계측 항목 데이터를 시각화하는 세련된 **SVG 기반 그래프(선/막대 혼합형)** 제공.
   - 데이터 전체의 평균값을 요약하여 그래프 옆 또는 상단에 표시.
   - 외부 라이브러리 추가 없이 순수 React/SVG로 구현하여 구글 시트 및 Supabase 연동에 영향을 주지 않도록 완벽히 격리.

---

## 2. 세부 구현 계획

### A. 레이아웃 변경 (사이드바 도입)
- 기존의 상단 가로형 헤더를 왼쪽 사이드바로 변경합니다.
- `src/App.tsx`의 뼈대 레이아웃을 다음과 같이 구조화합니다:
  ```tsx
  <div className="min-h-screen flex bg-[var(--color-bg-layout)] text-[var(--color-text)]">
    {/* 왼쪽 사이드바 (로고 + 메뉴 리스트) */}
    <aside className="w-64 bg-white border-r border-[var(--color-border)] p-6 flex flex-col gap-6 shrink-0 print:hidden">
      {/* 로고 (현 위치 유지) */}
      <div className="flex items-center cursor-pointer select-none">
        <img src="/brand/logo/logo-h.svg" alt="Zenitry Logo" className="h-[26px] w-auto object-contain dark:hidden" />
        <img src="/brand/logo/logo-h-light.svg" alt="Zenitry Logo" className="h-[26px] w-auto object-contain hidden dark:block" />
      </div>
      
      {/* 메뉴 리스트 */}
      <nav className="flex flex-col gap-2">
        {/* 로그인 정보 및 기존 메뉴 버튼들을 세로 목록으로 렌더링 */}
      </nav>
    </aside>

    {/* 메인 콘텐츠 영역 */}
    <main className="flex-1 p-8 overflow-y-auto space-y-6">
      {/* 제목 가운데 정렬 */}
      <header className="text-center py-4 print:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
          충진품 자주측정 ({record.mainMode})
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 uppercase tracking-widest font-mono">
          Filling Product Measurement Record
        </p>
      </header>
      
      {/* 본문 콘텐츠 (그리드 레이아웃 및 확대/축소 카드들) */}
    </main>
  </div>
  ```

### B. 각 카드 확대/축소 (CSS Resize)
- 기본 정보 카드, 계측 테이블 카드, 그래프 카드 등의 스타일 클래스에 다음 CSS를 적용합니다:
  ```css
  .resizable-card {
    resize: both;
    overflow: auto;
    min-width: 280px;
    min-height: 200px;
  }
  ```
- 테이블의 경우 가로 스크롤(`overflow-x: auto`)과 조화를 이루도록 래퍼 엘리먼트에 드래그 크기 조절을 바인딩합니다.

### C. 측정항목 그래프화 및 평균
- **대상 데이터**: 현재 선택된 `record`의 `measurements` 배열 내 `vials` (중량 V1, V2, V3) 값.
- **UI 구성**:
  - 그래프 표시용 신규 카드를 생성합니다. (드래그 확대/축소 가능)
  - 시간대별 중량 변화를 꺾은선(SVG Line) 또는 점(SVG Circle)으로 표시하고, 규격 상한/하한선을 가이드 라인으로 그려 시각적 완성도를 높입니다.
  - 측정된 중량 데이터 전체의 **종합 평균값**을 계산하여 카드 상단에 굵은 텍스트로 표기합니다.

### D. 보고서 발행 및 A4 인쇄 미리보기
- **발행 방식**: 
  - 사이드바에 '보고서 발행' 버튼을 생성합니다.
  - 버튼 클릭 시 '인쇄 미리보기 모달'을 띄워 인쇄 상태를 체이스님이 확인할 수 있도록 하고, 브라우저 인쇄(`window.print()`)를 연동합니다.
- **A4 인쇄 레이아웃 구현**:
  - 인쇄 시에만 나타나는 전용 프린트 스타일 `@media print`를 작성하여 헤더, 사이드바, 컨트롤 버튼들을 모두 숨깁니다 (`display: none`).
  - A4 규격(너비 210mm)에 맞춘 레포트 페이지를 생성합니다.
  - 한 장에 들어갈 테이블 행 수를 10~12개 단위로 쪼개어, 데이터가 많을 경우 `page-break-after: always`를 통해 자연스럽게 다음 페이지로 넘어가도록 페이징 로직을 구현합니다.
  - 각 페이지의 왼쪽 상단에 결재 박스를 포함하고, 오른쪽 상단에는 해당 레코드의 `fillingDate`에서 연도를 추출하여 `2026년 충진품 자주검사기록` 형태로 제목을 넣습니다.
  - 오른쪽 하단에 `[JTQF-3440-05]` 텍스트를 고정으로 렌더링합니다.

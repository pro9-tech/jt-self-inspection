# 빠른 시작

## A. 정적 HTML 산출물 (목업, 슬라이드, 프로토타입, 일회성 페이지)

`styles.css`, `tokens/` 폴더, 그리고 `assets/logo/`에서 필요한 파일을 HTML 옆에 복사하세요. 그다음:

```html
<link rel="stylesheet" href="styles.css">
```

이 한 파일이 모든 토큰과 웹폰트(Pretendard, Figtree, Noto Sans SC/TC, Material Symbols Rounded — 전부 CDN,
설치할 것 없음)를 끌어옵니다. 이제 커스텀 프로퍼티로 만들면 됩니다:

```html
<button style="height:var(--jt-control-height);padding:0 14px;border:0;border-radius:var(--jt-r-md);
  background:var(--jt-color-primary);color:var(--jt-color-on-primary);
  font:var(--jt-fw-medium) var(--jt-fs-base)/1 var(--jt-font-base);cursor:pointer">저장</button>

<span class="material-symbols-rounded size-20">science</span>
<span class="jt-num">0.040 %</span>   <!-- Figtree + 고정폭 숫자 -->
```

`base.css`가 본문 타이포, 링크 색, 포커스 링, `word-break: keep-all`, 인쇄 정리를 이미 처리합니다.

**다크 테마** — `<html>`에 `data-theme="dark"`를 넣으세요. 모든 알리아스 토큰이 전환되고 컴포넌트 코드는 그대로입니다.
**컴팩트 밀도** — 아무 컨테이너에나 `data-density="compact"`를 넣으세요(조밀한 표, 견적 품목 등).

## B. 프로덕션 React

`components/`에는 순수 React 컴포넌트가 들어 있습니다 — import는 React뿐이고, 스타일링은 CSS 커스텀 프로퍼티,
npm 패키지 없음. 필요한 디렉터리를 복사해 바로 import 하세요:

```jsx
import { Button } from './components/general/Button.jsx';
import { Table }  from './components/data/Table.jsx';
```

컴포넌트마다 `.d.ts`(props 계약)와 `.prompt.md`(한 줄 "무엇을·언제" + 예제 + 변형)가 함께 있습니다. 컴포넌트를
쓰기 전에 `.prompt.md`를 읽으세요 — API뿐 아니라 브랜드 규칙이 담겨 있습니다.

## 어떤 토큰을 써야 하나요?

컴포넌트가 건드리는 값에는 `tokens/semantic.css`의 **알리아스** 이름을 쓰세요. 라이트/다크 전환 시 바뀌는 것이
이 층입니다.

| 필요한 것 | 토큰 |
|---|---|
| 본문 / 보조 / 힌트 텍스트 | `--jt-color-text` · `--jt-color-text-secondary` · `--jt-color-text-tertiary` |
| 페이지 배경 | `--jt-color-bg-layout` |
| 카드 · 패널 · 표 표면 | `--jt-color-bg-container` |
| 모달 · 드롭다운 표면 | `--jt-color-bg-elevated` |
| 보더 · 행 구분선 | `--jt-color-border` · `--jt-color-split` |
| 링크 · 포커스 링 · 활성 탭 | `--jt-color-link` · `--jt-color-focus-ring` · `--jt-color-accent` |
| 솔리드 프라이머리 버튼 | `--jt-color-primary` + `--jt-color-on-primary` |
| 상태 | `--color-{success,warning,error,info}-{bg,border,text}` |
| 컨트롤 높이 | `--jt-control-height`(36) · `-sm`(28) · `-lg`(44) |
| 간격 | `--jt-space-1` … `--jt-space-12` (4px 그리드) |
| 라운드 | `--jt-r-sm` 4 · `--jt-r-md` 8(기본) · `--jt-r-lg` 16 · `--jt-r-xl` 24 · `--jt-r-full` |
| 그림자 | `--jt-shadow-1` 카드 · `-2` 드롭다운 · `-3` 모달 · `-4` 팝오버 |
| 모션 | `--jt-dur-fast` 160ms 호버 · `--jt-dur-base` 240ms · `--jt-ease-standard` |

원시 스케일(`--neutral-*`, `--blue-*`, `--teal-*`)은 차트, 일러스트, 알리아스 층이 정말로 커버하지 못하는
경우에만 직접 쓰세요.

## 비주얼 레퍼런스

`guidelines/`와 `components/` 아래의 모든 `*.card.html`은 브라우저에서 바로 열 수 있는 독립 페이지입니다 —
색상 램프, 타입 스케일, 밀도 비교, 모든 컴포넌트 상태를 실제 스펙으로 볼 수 있습니다. 가이드 전체를 읽지 않고
"이건 어떻게 생겨야 하지"를 확인하는 가장 빠른 방법입니다.

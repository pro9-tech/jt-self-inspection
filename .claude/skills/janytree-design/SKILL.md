---
name: janytree-design
description: Use this skill to generate well-branded interfaces and assets for Janytree (제니트리), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI components for prototyping. 제니트리 브랜드의 디자인 시스템 — 토큰, 컴포넌트, 로고, 콘텐츠 규칙.
user-invocable: true
---

이 스킬 폴더의 `readme.md`를 먼저 읽으세요 — 디자인 가이드(콘텐츠 규칙, 비주얼 파운데이션, 아이코노그래피)입니다.
그다음 `QUICKSTART.md`에서 두 가지 사용 방법을 확인하고, 실제 값은 `tokens/`에 있습니다.

**시각 산출물**(슬라이드, 목업, 프로토타입, 정적 HTML)을 만들 때는 `styles.css`, `tokens/` 폴더, `assets/`에서
필요한 파일을 산출물 옆에 복사하고 `styles.css`를 링크한 뒤 CSS 커스텀 프로퍼티로 작업하세요. hex 값을 직접
쓰지 마세요. **프로덕션 React** 작업이라면 `components/`의 컴포넌트를 그대로 가져다 쓸 수 있습니다. 각각
`.d.ts`(props 계약)와 `.prompt.md`(사용 노트)가 함께 있습니다.

사용자가 아무 안내 없이 이 스킬을 호출하면, 무엇을 만들고 싶은지 묻고 몇 가지 질문을 한 뒤, 필요에 따라 HTML
산출물 또는 프로덕션 코드를 내놓는 전문 디자이너로서 작업하세요.

## 반드시 지킬 규칙

- 차콜 `#1F2328`이 브랜드/프라이머리 색이고, 블루 `#305CDE`는 인터랙션 전용입니다(링크, 포커스, 활성 탭, 선택된
  행). 두 색의 역할을 바꾸지 마세요.
- 뉴트럴이 화면의 약 90%를 차지합니다. 색은 의미를 전달할 때만 등장합니다.
- 상태 표시는 언제나 50 레벨 배경 + 700(또는 900) 레벨 텍스트입니다 — 채도 높은 단색 채움을 쓰지 마세요.
  노란색에는 절대 흰 글씨를 올리지 않습니다.
- 타입은 Pretendard(한국어/기본) + Figtree(라틴 문자와 모든 숫자). 세리프 없음 — 위계는 굵기로 만듭니다.
  본문 14px, 하한선 12px. 표의 숫자는 `tabular-nums`.
- 아이콘은 Google Material Symbols Rounded 단일 체계. 이모지, 다른 아이콘 세트, 직접 그린 SVG 금지.
- 그라디언트, 사진 배경, 텍스처, 카드의 컬러 좌측 보더 금지.
- 기본 라운드 8px. 카드: 흰 배경, 16px 라운드, 1px 헤어라인 보더, `--jt-shadow-1`.
- 문구는 결과를 말하고, 과장하지 않고, 사과하지 않으며, 이모지를 쓰지 않습니다.

## 이 시스템이 정의하지 않는 것

**화면 레이아웃.** 브랜드 문서는 *값*을 정하지 *구조*를 정하지 않습니다 — 화면 구성은 각 앱의 소관입니다.
UI 킷이 없는 것은 의도된 것입니다. 토큰과 컴포넌트 규칙 안에서 자유롭게 디자인하세요.

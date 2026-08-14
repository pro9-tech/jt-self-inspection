제목 태그를 직접 쓰는 대신 `Text`를 사용해 14px 기반 스케일을 일관되게 유지하세요.

```jsx
<Text role="h2">전성분 보고서</Text>
<Text role="sm" tone="secondary">최종 발행 2026-08-04</Text>
<Text role="body" numeric>0.04 %</Text>
```

제목은 Pretendard 700–800 굵기입니다 — 이 브랜드에 세리프는 없습니다. `numeric`은 Figtree + 고정폭 숫자로 전환하며, 열에 들어가는 모든 숫자에 사용합니다.

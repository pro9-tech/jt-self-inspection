목록·탭·검색 결과가 비었을 때는 `Empty`를 사용하세요. 빈 화면은 반드시 다음 행동을 제안해야 합니다.

```jsx
<Empty icon="description" title="발행된 문서가 없습니다" description="품목을 선택하고 전성분보고서를 작성하세요."
  action={<Button variant="primary" iconLeft="add">문서 작성</Button>} />
```

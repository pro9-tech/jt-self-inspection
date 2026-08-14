모든 동작에 `Button`을 사용하세요. `variant="primary"`는 솔리드 차콜 버튼이며 한 화면에 정확히 하나만 있어야 합니다.

```jsx
<Button variant="primary" iconLeft="save">저장</Button>
<Button variant="default">취소</Button>
<Button variant="primary" danger iconLeft="delete">삭제</Button>
```

변형: `primary`(차콜 채움) · `default`(보더 + 텍스트) · `text` · `link`(액센트 블루).
크기는 `--jt-control-height-sm|--jt-control-height|--jt-control-height-lg`(28/36/44px)에 대응합니다.
레이블은 방법이 아니라 결과를 말합니다 — "제출"이 아니라 "저장".

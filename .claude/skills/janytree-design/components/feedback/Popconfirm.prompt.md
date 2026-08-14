행 단위의 파괴적 동작에는 `Popconfirm`을 사용하세요 — Modal보다 가볍지만 여전히 신중합니다.

```jsx
<Popconfirm title="이 원료를 삭제할까요?" description="되돌릴 수 없습니다." onConfirm={remove}>
  <Button variant="text" danger iconLeft="delete">삭제</Button>
</Popconfirm>
```

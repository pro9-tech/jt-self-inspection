짧고 집중된 편집이나 확인에는 `Modal`을, 뒤의 목록이 보여야 할 때는 `Drawer`를 사용하세요.

```jsx
<Modal open={o} title="원료 추가" onClose={close}
  footer={<><Button variant="default" onClick={close}>취소</Button><Button variant="primary">추가</Button></>}>…</Modal>
```
오버레이는 페이드되고, 카드는 `--jt-dur-slow` 동안 .98→1로 확대됩니다.

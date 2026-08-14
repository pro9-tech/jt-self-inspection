한 화면을 넘길 수 있는 모든 표 아래에 `Pagination`을 사용하세요.

```jsx
<Pagination page={p} pageSize={20} total={412} onChange={setP} />
```
숫자는 Figtree 고정폭이라 페이지를 넘겨도 컨트롤이 흔들리지 않습니다.

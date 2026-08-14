선택지가 닫힌 집합일 때 `Select`를 사용하세요. 높이·라운드·포커스 링이 `Input`과 일치합니다.

```jsx
<Select value={v} onChange={e=>setV(e.target.value)} options={[{value:'kr',label:'국내'},{value:'eu',label:'EU'}]} />
```

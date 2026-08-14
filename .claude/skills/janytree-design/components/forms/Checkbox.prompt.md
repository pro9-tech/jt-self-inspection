서로 독립적인 선택지에는 `Checkbox`, 배타적인 선택지에는 `Radio`, 즉시 반영되는 설정에는 `Switch`를 사용하세요.

```jsx
<Checkbox checked={all} indeterminate={some} onChange={setAll} label="전체 선택" />
<Radio checked={mode==='kr'} onChange={()=>setMode('kr')} label="국문" />
<Switch checked={pub} onChange={setPub} label="외부 공개" />
```
선택 상태는 `--jt-color-accent`, 스위치의 꺼짐 상태는 `--jt-neutral-300` 입니다.

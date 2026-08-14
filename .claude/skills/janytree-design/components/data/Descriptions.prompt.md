하나의 레코드가 가진 속성들을 보여줄 때는 2열 표 대신 `Descriptions`를 사용하세요.

```jsx
<Descriptions columns={3} items={[{label:'문서번호',value:'JT-ING-2026-0417',numeric:true},{label:'상태',value:<Tag tone="success">승인</Tag>}]} />
```

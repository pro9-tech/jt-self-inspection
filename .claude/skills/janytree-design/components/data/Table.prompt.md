모든 레코드 목록에 `Table`을 사용하세요. 밀도 토큰을 읽으므로 상위 요소에 `data-density="compact"`를 주면 prop 변경 없이 조밀해집니다.

```jsx
<Table columns={[{key:'code',title:'품목코드'},{key:'pct',title:'함량',align:'right',numeric:true,sortable:true}]} rows={rows} onRowClick={open} />
```

숫자 열은 `numeric`으로 항상 우측 정렬합니다. 페이지가 가로로 스크롤되게 두지 말고 스크롤 컨테이너로 감싸세요.

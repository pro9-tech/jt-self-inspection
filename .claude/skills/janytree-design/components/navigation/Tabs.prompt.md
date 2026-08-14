하나의 레코드에 속한 동등한 뷰들을 전환할 때 `Tabs`를 사용하세요(품목 상세, 발행 이력…).

```jsx
<Tabs activeKey={tab} onChange={setTab} items={[{key:'info',label:'기본정보'},{key:'ing',label:'전성분',count:76}]} />
```

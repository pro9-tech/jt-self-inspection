행의 케밥 메뉴와 계정 메뉴에 `Dropdown`을 사용하세요. 패널은 엘리베이티드 표면 + `--jt-shadow-2` 입니다.

```jsx
<Dropdown trigger={<IconButton icon="more_vert" />} align="right" items={[
  {key:'edit',label:'편집',icon:'edit'},{divider:true},{key:'del',label:'삭제',icon:'delete',danger:true}]} />
```

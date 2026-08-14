앱 셸의 사이더 내비게이션에 `Menu`를 사용하고, 단독으로 쓰는 행에는 `NavItem`만 사용하세요.

```jsx
<Menu activeKey="docs" onSelect={setKey} items={[
  {key:'dash',label:'대시보드',icon:'dashboard'},
  {key:'docs',label:'문서 발행',icon:'description',badge:12},
]} />
```

활성 상태 = 액센트 텍스트, 액센트 배경, 3px 좌측 바, 채워진 아이콘. 비활성 = `--jt-color-text-secondary`.

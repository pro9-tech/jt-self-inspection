내용을 묶는 모든 블록에 `Card`를 사용하세요. `AppTile`은 앱 허브 런처에만 씁니다.

```jsx
<Card title="발행 이력" extra={<Button variant="link">전체 보기</Button>}>…</Card>
<AppTile name="JANYTREE PLM" icon="science" color="var(--jt-app-plm)" />
```

타일의 색은 **오직 아이콘 칩에만** 들어갑니다 — 카드 본문은 중립을 유지합니다. 컬러 좌측 보더는 넣지 마세요.

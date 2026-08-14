파트너나 직원이 문서를 첨부하는 모든 곳(MSDS, 시험성적서, 발주서)에 `Upload`를 사용하세요.

```jsx
<Upload hint="PDF · XLSX · 최대 20MB" files={[{name:'MSDS_JT-AMP-0417.pdf',size:'1.2 MB'}]} progress={64} />
```
기본 보더는 `--jt-color-border` 파선이고, 호버·드래그 시 액센트 색과 액센트 배경으로 바뀝니다.

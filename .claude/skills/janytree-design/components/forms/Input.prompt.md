모든 텍스트 입력에는 `Input`을, 값이 수량·비율·금액일 때는 `InputNumber`를 사용하세요.

```jsx
<Input placeholder="품목명 또는 코드 검색" prefix="search" />
<InputNumber value={0.04} unit="%" />
<Textarea rows={5} placeholder="비고" />
```

모든 입력 필드는 버튼·셀렉트와 `--jt-control-height`(36px)를 공유합니다. 포커스는 액센트 보더 + 3px 액센트 링이고, `status="error"`는 레드 램프로 전환합니다.

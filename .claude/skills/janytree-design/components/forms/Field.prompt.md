모든 입력 페이지에 `FormSection` + `Field`를 사용해 레이블·힌트·오류가 하나의 세로 리듬을 유지하게 하세요.

```jsx
<FormSection title="발행 정보" description="문서 상단 레터헤드에 인쇄됩니다.">
  <Field label="문서번호" required hint="JT-XXX-0000 형식">
    <Input value={no} onChange={...} />
  </Field>
</FormSection>
<FormActions><Button variant="default">취소</Button><Button variant="primary">저장</Button></FormActions>
```
레이블은 보조 텍스트이고, 필수 표시와 검증 문구는 레드 램프를 씁니다. 오류 문구는 무엇이 잘못됐고 어떻게 고치는지를 말합니다 — 사과 문구는 넣지 않습니다.

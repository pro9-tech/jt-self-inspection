"성공했다"는 피드백(저장·복사)에는 `Toast`를 쓰고 3초 후 사라지게 하세요. 사용자가 놓쳤을 수 있는 사건(발행 완료)에는 `Notification`을 사용합니다.

```jsx
<Toast tone="success" message="저장되었습니다" />
<Notification tone="success" title="전성분보고서 발행 완료" description="JT-ING-2026-0417 v3" time="방금 전" />
```

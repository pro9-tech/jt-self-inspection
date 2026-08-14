곧 도착할 콘텐츠의 형태를 잡아둘 때 `Skeleton`을 사용하고, 형태를 알 수 없는 곳에만 `Spin`을 사용하세요.

```jsx
<Skeleton width={180} height={20} />
<Spin />
```
시머는 1.2초 주기로 좌→우로 흐릅니다.

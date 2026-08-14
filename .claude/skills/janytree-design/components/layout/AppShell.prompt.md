제니트리 사내 앱(PLM, 인사, 견적…)의 바깥 프레임으로 `AppShell`을 사용하세요.

```jsx
<AppShell sider={<><Logo /><SiderSection title="문서"><NavItem .../></SiderSection></>} header={<Breadcrumb items={...} />}>
  <PageContent />
</AppShell>
```

사이더는 236px, `collapsed` 시 64px. 헤더는 56px. 콘텐츠만 스크롤되고 크롬은 고정됩니다.

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100vh' }}>
      <nav style={{ display: 'flex', gap: 16, padding: 12, borderBottom: '1px solid #ddd' }}>
        <a href="/explorer">Explorer</a>
        <a href="/explorer/request">Request Console</a>
      </nav>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  )
}

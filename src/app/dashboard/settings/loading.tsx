export default function SettingsLoading() {
  return (
    <div style={{ padding: '24px', maxWidth: '600px' }}>
      <div style={{ height: '28px', width: '90px', background: '#f3f4f6', borderRadius: '6px', marginBottom: '24px' }} />
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px' }}>
          <div style={{ height: '14px', width: '120px', background: '#f3f4f6', borderRadius: '4px', marginBottom: '20px', paddingBottom: '12px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: i === 2 ? '1fr 1fr' : '1fr', gap: '16px' }}>
            {Array.from({ length: i === 2 ? 2 : 1 }).map((_, j) => (
              <div key={j}>
                <div style={{ height: '13px', width: '100px', background: '#f9fafb', borderRadius: '4px', marginBottom: '6px' }} />
                <div style={{ height: '38px', background: '#f9fafb', borderRadius: '8px' }} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ height: '42px', background: '#15803d', borderRadius: '8px', opacity: 0.3 }} />
    </div>
  )
}

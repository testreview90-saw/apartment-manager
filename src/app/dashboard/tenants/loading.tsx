export default function TenantsLoading() {
  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <div style={{ height: '28px', width: '100px', background: '#f3f4f6', borderRadius: '6px', marginBottom: '24px' }} />
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: '1fr 80px 140px 120px', gap: '0' }}>
          {['Name', 'Room', 'Phone', 'Move-in'].map(h => (
            <div key={h} style={{ height: '12px', width: '50px', background: '#e5e7eb', borderRadius: '4px' }} />
          ))}
        </div>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid #f9fafb', display: 'grid', gridTemplateColumns: '1fr 80px 140px 120px', alignItems: 'center' }}>
            <div>
              <div style={{ height: '14px', width: '130px', background: '#f3f4f6', borderRadius: '4px', marginBottom: '6px' }} />
              <div style={{ height: '11px', width: '80px', background: '#f9fafb', borderRadius: '4px' }} />
            </div>
            <div style={{ height: '24px', width: '44px', background: '#eff6ff', borderRadius: '999px' }} />
            <div style={{ height: '14px', width: '100px', background: '#f3f4f6', borderRadius: '4px' }} />
            <div style={{ height: '13px', width: '80px', background: '#f3f4f6', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

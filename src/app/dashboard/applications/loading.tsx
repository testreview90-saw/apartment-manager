export default function ApplicationsLoading() {
  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <div style={{ height: '28px', width: '130px', background: '#f3f4f6', borderRadius: '6px', marginBottom: '24px' }} />
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px', height: '320px' }}>
        <div style={{ height: '15px', width: '150px', background: '#f3f4f6', borderRadius: '4px', marginBottom: '20px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div style={{ height: '60px', background: '#f9fafb', borderRadius: '8px' }} />
          <div style={{ height: '60px', background: '#f9fafb', borderRadius: '8px' }} />
        </div>
        <div style={{ height: '60px', background: '#f9fafb', borderRadius: '8px' }} />
      </div>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: '15px', width: '140px', background: '#f3f4f6', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ height: '13px', width: '100px', background: '#f0fdf4', borderRadius: '4px' }} />
            </div>
            <div style={{ height: '24px', width: '70px', background: '#eff6ff', borderRadius: '999px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

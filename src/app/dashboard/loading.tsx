export default function DashboardLoading() {
  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <div style={{ height: '28px', width: '120px', background: '#f3f4f6', borderRadius: '6px', marginBottom: '24px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
            <div style={{ height: '12px', width: '60%', background: '#f3f4f6', borderRadius: '4px', marginBottom: '12px' }} />
            <div style={{ height: '32px', width: '40%', background: '#e5e7eb', borderRadius: '4px', marginBottom: '8px' }} />
            <div style={{ height: '12px', width: '30%', background: '#f3f4f6', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ height: '14px', width: '180px', background: '#f3f4f6', borderRadius: '4px' }} />
        </div>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid #f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ height: '14px', width: '140px', background: '#f3f4f6', borderRadius: '4px', marginBottom: '6px' }} />
              <div style={{ height: '12px', width: '80px', background: '#f9fafb', borderRadius: '4px' }} />
            </div>
            <div style={{ height: '14px', width: '80px', background: '#f3f4f6', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

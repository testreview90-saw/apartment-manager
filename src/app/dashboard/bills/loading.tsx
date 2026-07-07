export default function BillsLoading() {
  return (
    <div style={{ padding: '24px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ height: '28px', width: '80px', background: '#f3f4f6', borderRadius: '6px' }} />
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ height: '56px', width: '120px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }} />
          <div style={{ height: '56px', width: '120px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px' }} />
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ height: '12px', width: '300px', background: '#e5e7eb', borderRadius: '4px' }} />
        </div>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ height: '20px', width: '40px', background: '#eff6ff', borderRadius: '4px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: '14px', width: '120px', background: '#f3f4f6', borderRadius: '4px', marginBottom: '6px' }} />
              <div style={{ height: '11px', width: '80px', background: '#f9fafb', borderRadius: '4px' }} />
            </div>
            <div style={{ height: '14px', width: '70px', background: '#f3f4f6', borderRadius: '4px' }} />
            <div style={{ height: '14px', width: '80px', background: '#f3f4f6', borderRadius: '4px' }} />
            <div style={{ height: '14px', width: '80px', background: '#f3f4f6', borderRadius: '4px' }} />
            <div style={{ height: '14px', width: '70px', background: '#e5e7eb', borderRadius: '4px' }} />
            <div style={{ height: '24px', width: '60px', background: '#f0fdf4', borderRadius: '999px' }} />
            <div style={{ height: '30px', width: '80px', background: '#f3f4f6', borderRadius: '8px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

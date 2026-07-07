export default function RoomsLoading() {
  return (
    <div style={{ padding: '24px', maxWidth: '1000px' }}>
      <div style={{ height: '28px', width: '80px', background: '#f3f4f6', borderRadius: '6px', marginBottom: '24px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', height: '90px' }}>
            <div style={{ height: '18px', width: '40px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '8px' }} />
            <div style={{ height: '12px', width: '80%', background: '#f3f4f6', borderRadius: '4px', marginBottom: '6px' }} />
            <div style={{ height: '12px', width: '60%', background: '#f3f4f6', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

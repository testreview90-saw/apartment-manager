export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function saveSettings(formData: FormData) {
  'use server'
  const fields = ['building_name', 'water_rate', 'electricity_rate', 'due_day']
  for (const key of fields) {
    const value = formData.get(key) as string
    if (!value) continue
    await prisma.setting.upsert({
      where:  { settingKey: key },
      update: { settingValue: value },
      create: { settingKey: key, settingValue: value },
    })
  }
  revalidatePath('/dashboard/settings')
}

export default async function SettingsPage() {
  const settings = await prisma.setting.findMany()
  const get = (key: string) => settings.find(s => s.settingKey === key)?.settingValue || ''

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: '13px',
    fontWeight: '500' as const,
    color: '#374151',
    marginBottom: '4px',
  }

  const hintStyle = {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px',
  }

  return (
    <div style={{ padding: '24px', maxWidth: '600px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '24px' }}>Settings</h1>

      <form action={saveSettings}>
        {/* Building info */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
            Building Info
          </h2>
          <div>
            <label style={labelStyle}>Building Name</label>
            <input
              name="building_name"
              defaultValue={get('building_name')}
              placeholder="My Apartments"
              style={inputStyle}
            />
            <p style={hintStyle}>Shown in the app header</p>
          </div>
        </div>

        {/* Utility rates */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
            Utility Rates
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Water Rate (฿ per unit)</label>
              <input
                name="water_rate"
                type="number"
                step="0.01"
                defaultValue={get('water_rate')}
                placeholder="18"
                style={inputStyle}
              />
              <p style={hintStyle}>฿ per cubic meter</p>
            </div>
            <div>
              <label style={labelStyle}>Electricity Rate (฿ per unit)</label>
              <input
                name="electricity_rate"
                type="number"
                step="0.01"
                defaultValue={get('electricity_rate')}
                placeholder="7"
                style={inputStyle}
              />
              <p style={hintStyle}>฿ per kWh</p>
            </div>
          </div>
          <div style={{ marginTop: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px' }}>
            <p style={{ fontSize: '13px', color: '#15803d', fontWeight: '500' }}>How billing is calculated:</p>
            <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
              Water: (current reading − previous reading) × water rate<br />
              Electricity: (current reading − previous reading) × electricity rate<br />
              Total: Rent + Water amount + Electricity amount
            </p>
          </div>
        </div>

        {/* Billing */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
            Billing
          </h2>
          <div>
            <label style={labelStyle}>Bill Due Day</label>
            <select
              name="due_day"
              defaultValue={get('due_day')}
              style={{ ...inputStyle, background: 'white' }}
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                <option key={d} value={String(d)}>
                  {d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of each month
                </option>
              ))}
            </select>
            <p style={hintStyle}>Bills are due on this day every month</p>
          </div>
        </div>

        <button
          type="submit"
          style={{
            background: '#15803d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '11px 28px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Save Settings
        </button>
      </form>

      {/* Current values preview */}
      <div style={{ background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px', marginTop: '20px' }}>
        <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Values</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
          <p style={{ color: '#374151' }}>Building: <strong>{get('building_name') || '—'}</strong></p>
          <p style={{ color: '#374151' }}>Due day: <strong>{get('due_day') || '—'}</strong></p>
          <p style={{ color: '#374151' }}>Water rate: <strong>฿{get('water_rate') || '—'}/unit</strong></p>
          <p style={{ color: '#374151' }}>Electricity rate: <strong>฿{get('electricity_rate') || '—'}/unit</strong></p>
        </div>
      </div>
    </div>
  )
}

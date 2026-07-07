'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RoomData {
  id: number
  tenantId: number
  roomNumber: string
  tenantName: string
  monthlyRent: number
  waterPrev: number
  elecPrev: number
  hasExistingBill: boolean
}

interface Props {
  rooms: RoomData[]
  waterRate: number
  elecRate: number
  month: string
  dueDate: string
}

export default function GenerateForm({ rooms, waterRate, elecRate, month, dueDate }: Props) {
  const router = useRouter()
  const [readings, setReadings] = useState<Record<number, { w: string; e: string }>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function get(roomId: number, type: 'w' | 'e') {
    return readings[roomId]?.[type] || ''
  }

  function set(roomId: number, type: 'w' | 'e', value: string) {
    setReadings(prev => ({ ...prev, [roomId]: { ...prev[roomId], [type]: value } }))
  }

  function calcRow(room: RoomData) {
    const wCurr  = parseFloat(get(room.id, 'w')) || 0
    const eCurr  = parseFloat(get(room.id, 'e')) || 0
    const wUnits = Math.max(0, wCurr - room.waterPrev)
    const eUnits = Math.max(0, eCurr - room.elecPrev)
    const wAmt   = wUnits * waterRate
    const eAmt   = eUnits * elecRate
    const total  = room.monthlyRent + wAmt + eAmt
    return { wCurr, eCurr, wUnits, eUnits, wAmt, eAmt, total }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const bills = rooms
      .filter(r => !r.hasExistingBill)
      .map(room => {
        const c = calcRow(room)
        return {
          tenantId:     room.tenantId,
          roomId:       room.id,
          billingMonth: month,
          rentAmount:   room.monthlyRent,
          waterPrev:    room.waterPrev,
          waterCurr:    c.wCurr,
          waterUnits:   c.wUnits,
          waterRate,
          waterAmount:  c.wAmt,
          elecPrev:     room.elecPrev,
          elecCurr:     c.eCurr,
          elecUnits:    c.eUnits,
          elecRate,
          elecAmount:   c.eAmt,
          totalAmount:  c.total,
          dueDate,
          status: 'unpaid',
        }
      })

    try {
      const res = await fetch('/api/bills/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bills }),
      })
      if (!res.ok) throw new Error('Failed to save')
      router.push('/dashboard/bills')
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  const newRooms = rooms.filter(r => !r.hasExistingBill)
  const existingRooms = rooms.filter(r => r.hasExistingBill)

  return (
    <div>
      {existingRooms.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#92400e' }}>
          {existingRooms.length} room(s) already have bills for {month} and are skipped: {existingRooms.map(r => r.roomNumber).join(', ')}
        </div>
      )}

      {newRooms.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          All rooms already have bills for {month}.
        </div>
      ) : (
        <>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Room</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Tenant</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Water Prev</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#0369a1' }}>Water Curr ✏️</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Water Amt</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Elec Prev</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#0369a1' }}>Elec Curr ✏️</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Elec Amt</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {newRooms.map((room, i) => {
                    const c = calcRow(room)
                    return (
                      <tr key={room.id} style={{ borderBottom: i < newRooms.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: '#1d4ed8', fontSize: '15px' }}>{room.roomNumber}</td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{room.tenantName}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6b7280' }}>{room.waterPrev}</td>
                        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                          <input
                            type="number"
                            value={get(room.id, 'w')}
                            onChange={e => set(room.id, 'w', e.target.value)}
                            placeholder={String(room.waterPrev)}
                            style={{ width: '80px', padding: '6px 8px', border: '2px solid #0369a1', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: c.wAmt > 0 ? '#374151' : '#d1d5db' }}>
                          {c.wAmt > 0 ? `฿${c.wAmt.toFixed(0)} (${c.wUnits}u)` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6b7280' }}>{room.elecPrev}</td>
                        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                          <input
                            type="number"
                            value={get(room.id, 'e')}
                            onChange={e => set(room.id, 'e', e.target.value)}
                            placeholder={String(room.elecPrev)}
                            style={{ width: '80px', padding: '6px 8px', border: '2px solid #0369a1', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: c.eAmt > 0 ? '#374151' : '#d1d5db' }}>
                          {c.eAmt > 0 ? `฿${c.eAmt.toFixed(0)} (${c.eUnits}u)` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: c.total > room.monthlyRent ? '#111827' : '#9ca3af' }}>
                          {c.total > room.monthlyRent ? `฿${c.total.toFixed(0)}` : `฿${room.monthlyRent}`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', color: '#dc2626', marginBottom: '12px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '11px 28px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Saving...' : `Generate ${newRooms.length} Bills`}
            </button>
            <a href="/dashboard/bills" style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none' }}>Cancel</a>
          </div>
        </>
      )}
    </div>
  )
}

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

type ReadingState = Record<number, { water: string; electricity: string }>

function formatMoney(amount: number) {
  return `฿${amount.toFixed(0)}`
}

export default function GenerateForm({ rooms, waterRate, elecRate, month, dueDate }: Props) {
  const router = useRouter()
  const [readings, setReadings] = useState<ReadingState>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function getRawReading(roomId: number, type: 'water' | 'electricity') {
    return readings[roomId]?.[type] || ''
  }

  function setRawReading(roomId: number, type: 'water' | 'electricity', value: string) {
    setReadings(previous => ({
      ...previous,
      [roomId]: {
        water: previous[roomId]?.water || '',
        electricity: previous[roomId]?.electricity || '',
        [type]: value,
      },
    }))
  }

  function getCurrentReading(room: RoomData, type: 'water' | 'electricity') {
    const raw = getRawReading(room.id, type)
    const fallback = type === 'water' ? room.waterPrev : room.elecPrev
    if (raw === '') return fallback
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  function calculateRow(room: RoomData) {
    const waterCurr = getCurrentReading(room, 'water')
    const elecCurr = getCurrentReading(room, 'electricity')
    const waterUnits = waterCurr - room.waterPrev
    const elecUnits = elecCurr - room.elecPrev
    const waterAmount = waterUnits * waterRate
    const elecAmount = elecUnits * elecRate
    const total = room.monthlyRent + waterAmount + elecAmount

    return {
      waterCurr,
      elecCurr,
      waterUnits,
      elecUnits,
      waterAmount,
      elecAmount,
      total,
      hasInvalidWater: waterCurr < room.waterPrev,
      hasInvalidElectricity: elecCurr < room.elecPrev,
    }
  }

  function validateBeforeSave(newRooms: RoomData[]) {
    if (newRooms.length === 0) return 'No new bills to generate.'

    for (const room of newRooms) {
      const calc = calculateRow(room)

      if (calc.hasInvalidWater) {
        return `Room ${room.roomNumber}: current water reading cannot be lower than previous reading.`
      }

      if (calc.hasInvalidElectricity) {
        return `Room ${room.roomNumber}: current electricity reading cannot be lower than previous reading.`
      }
    }

    return ''
  }

  async function handleSave() {
    const newRooms = rooms.filter(room => !room.hasExistingBill)
    const validationError = validateBeforeSave(newRooms)

    if (validationError) {
      setError(validationError)
      return
    }

    const confirmed = window.confirm(`Generate ${newRooms.length} bill(s) for ${month}? Please confirm meter readings are correct.`)
    if (!confirmed) return

    setSaving(true)
    setError('')

    const bills = newRooms.map(room => {
      const calc = calculateRow(room)

      return {
        tenantId: room.tenantId,
        roomId: room.id,
        billingMonth: month,
        rentAmount: room.monthlyRent,
        waterPrev: room.waterPrev,
        waterCurr: calc.waterCurr,
        waterUnits: calc.waterUnits,
        waterRate,
        waterAmount: calc.waterAmount,
        elecPrev: room.elecPrev,
        elecCurr: calc.elecCurr,
        elecUnits: calc.elecUnits,
        elecRate,
        elecAmount: calc.elecAmount,
        totalAmount: calc.total,
        dueDate,
      }
    })

    try {
      const res = await fetch('/api/bills/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bills }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to save bills.')
      }

      router.push('/dashboard/bills')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  const newRooms = rooms.filter(room => !room.hasExistingBill)
  const existingRooms = rooms.filter(room => room.hasExistingBill)

  return (
    <div>
      {existingRooms.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#92400e' }}>
          {existingRooms.length} room(s) already have bills for {month} and are skipped: {existingRooms.map(room => room.roomNumber).join(', ')}
        </div>
      )}

      {newRooms.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          All occupied rooms already have bills for {month}.
        </div>
      ) : (
        <>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '16px' }}>
            <div className="generate-scroll" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Room</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Tenant</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Water Prev</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#0369a1' }}>Water Curr</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Water Amt</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Elec Prev</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#0369a1' }}>Elec Curr</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Elec Amt</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {newRooms.map((room, index) => {
                    const calc = calculateRow(room)
                    const waterInvalid = calc.hasInvalidWater
                    const elecInvalid = calc.hasInvalidElectricity

                    return (
                      <tr key={room.id} style={{ borderBottom: index < newRooms.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: '#1d4ed8', fontSize: '15px' }}>{room.roomNumber}</td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{room.tenantName}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6b7280' }}>{room.waterPrev}</td>
                        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min={room.waterPrev}
                            value={getRawReading(room.id, 'water')}
                            onChange={event => setRawReading(room.id, 'water', event.target.value)}
                            placeholder={String(room.waterPrev)}
                            style={{ width: '90px', padding: '6px 8px', border: `2px solid ${waterInvalid ? '#dc2626' : '#0369a1'}`, borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: calc.waterAmount > 0 ? '#374151' : '#d1d5db' }}>
                          {calc.waterAmount > 0 ? `${formatMoney(calc.waterAmount)} (${calc.waterUnits}u)` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6b7280' }}>{room.elecPrev}</td>
                        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min={room.elecPrev}
                            value={getRawReading(room.id, 'electricity')}
                            onChange={event => setRawReading(room.id, 'electricity', event.target.value)}
                            placeholder={String(room.elecPrev)}
                            style={{ width: '90px', padding: '6px 8px', border: `2px solid ${elecInvalid ? '#dc2626' : '#0369a1'}`, borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: calc.elecAmount > 0 ? '#374151' : '#d1d5db' }}>
                          {calc.elecAmount > 0 ? `${formatMoney(calc.elecAmount)} (${calc.elecUnits}u)` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>
                          {formatMoney(calc.total)}
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
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '11px 28px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
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

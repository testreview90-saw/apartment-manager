'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Wrong username or password')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', background: '#15803d', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <span style={{ color: 'white', fontSize: '28px' }}>🏢</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>Apartment Manager</h1>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #e5e7eb' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="admin"
                required
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="password"
                required
              />
            </div>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#dc2626', marginBottom: '16px' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

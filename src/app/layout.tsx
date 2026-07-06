import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Apartment Manager',
  description: 'ระบบจัดการอพาร์ตเมนต์',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="font-sans antialiased bg-gray-50">{children}</body>
    </html>
  )
}
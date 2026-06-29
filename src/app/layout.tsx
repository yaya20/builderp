import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BuildERP — אליהו גול בנייה',
  description: 'מערכת ניהול פרויקטי בנייה',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  )
}

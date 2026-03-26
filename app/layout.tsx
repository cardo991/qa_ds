import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Visual QA — Célula DS',
  description: 'Cuestionario de revisión visual para tableros Power BI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}

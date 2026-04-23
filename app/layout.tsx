import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ninja Company Portal',
  description: 'Portal unificado Ninja Company',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}

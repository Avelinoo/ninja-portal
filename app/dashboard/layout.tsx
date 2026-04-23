import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { decodeSession, SESSION_COOKIE } from '@/lib/session'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) redirect('/login')
  const session = decodeSession(token, process.env.SESSION_SECRET!)
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}

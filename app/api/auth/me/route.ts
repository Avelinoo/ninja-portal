import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, SESSION_COOKIE } from '@/lib/session'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const session = decodeSession(token, process.env.SESSION_SECRET!)
  if (!session) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
  return NextResponse.json({ userId: session.userId, username: session.username, role: session.role })
}

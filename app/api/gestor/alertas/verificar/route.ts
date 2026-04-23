import { NextRequest, NextResponse } from 'next/server'
import pool, { ensureSchema } from '@/lib/db'
import { decodeSession, SESSION_COOKIE } from '@/lib/session'
import { logger } from '@/lib/logger'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_GESTOR ?? '8216608942:AAGDaM9KiJLy4B3l98avGW5Y0hQmZYGrNkk'

const METRIC_LABELS: Record<string, string> = {
  ctr: 'CTR',
  cpm: 'CPM',
  cpc: 'CPC',
  cost_per_result: 'Custo por Resultado',
  spend: 'Gasto Total',
  result_count: 'Resultados',
}

const METRIC_FORMAT: Record<string, (v: number) => string> = {
  ctr:             v => `${v.toFixed(2)}%`,
  cpm:             v => `R$ ${v.toFixed(2)}`,
  cpc:             v => `R$ ${v.toFixed(2)}`,
  cost_per_result: v => `R$ ${v.toFixed(2)}`,
  spend:           v => `R$ ${v.toFixed(2)}`,
  result_count:    v => `${Math.round(v)}`,
}

async function sendTelegram(chatId: string, text: string) {
  if (!chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
  } catch (err) {
    logger.error('telegram.send_failed', { chatId, err: String(err) })
  }
}

export async function POST(req: NextRequest) {
  const session = decodeSession(
    req.cookies.get(SESSION_COOKIE)?.value ?? '',
    process.env.SESSION_SECRET!
  )
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  await ensureSchema()

  // Busca todos os alertas ativos do usuário
  const { rows: alerts } = await pool.query(
    `SELECT * FROM portal.gestor_alerts WHERE user_id = $1 AND is_active = true`,
    [session.userId]
  )
  if (!alerts.length) return NextResponse.json({ triggered: 0, alerts: [] })

  // Busca métricas do dia atual (ou ontem se hoje ainda não sincronizou)
  const { rows: metrics } = await pool.query(`
    SELECT account_id, account_name, date,
      ctr::float, cpm::float, cpc::float,
      cost_per_result::float, spend::float, result_count::int
    FROM daily_account_metrics
    WHERE date >= CURRENT_DATE - INTERVAL '1 day'
    ORDER BY date DESC
  `)

  // Índice por account_id com os dados mais recentes
  const metricsIdx: Record<string, Record<string, number>> = {}
  for (const row of metrics) {
    if (!metricsIdx[row.account_id]) {
      metricsIdx[row.account_id] = {
        ctr: row.ctr,
        cpm: row.cpm,
        cpc: row.cpc,
        cost_per_result: row.cost_per_result,
        spend: row.spend,
        result_count: row.result_count,
      }
    }
  }

  const triggered: typeof alerts = []
  const COOLDOWN_H = 4  // não dispara o mesmo alerta em menos de 4 horas

  for (const alert of alerts) {
    const data = metricsIdx[alert.account_id]
    if (!data) continue

    const value = data[alert.metric as string] ?? 0
    const hit =
      (alert.condition === 'above' && value > alert.threshold) ||
      (alert.condition === 'below' && value < alert.threshold)

    if (!hit) continue

    // Cooldown
    if (alert.last_triggered) {
      const diffH = (Date.now() - new Date(alert.last_triggered).getTime()) / 3_600_000
      if (diffH < COOLDOWN_H) continue
    }

    const label  = METRIC_LABELS[alert.metric] ?? alert.metric
    const fmt    = METRIC_FORMAT[alert.metric] ?? ((v: number) => String(v))
    const dir    = alert.condition === 'above' ? 'acima' : 'abaixo'
    const meta   = alert.account_name || alert.account_id

    const text =
      `⚠️ <b>Alerta Ninja Portal</b>\n\n` +
      `📊 <b>Conta:</b> ${meta}\n` +
      `📈 <b>Métrica:</b> ${label}\n` +
      `🔢 <b>Valor atual:</b> ${fmt(value)}\n` +
      `🎯 <b>Meta:</b> ${dir} de ${fmt(alert.threshold)}\n` +
      `🕐 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`

    const chatId = alert.telegram_chat_id || process.env.TELEGRAM_CHAT_ID || ''
    await sendTelegram(chatId, text)

    await pool.query(
      `UPDATE portal.gestor_alerts SET last_triggered = NOW() WHERE id = $1`,
      [alert.id]
    )

    logger.info('gestor.alert_triggered', { alertId: alert.id, metric: alert.metric, value, account: meta })
    triggered.push({ ...alert, current_value: value })
  }

  return NextResponse.json({ triggered: triggered.length, alerts: triggered })
}

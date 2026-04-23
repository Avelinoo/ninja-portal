export interface DailyMetric {
  account_id: string
  date: string
  spend: number
  impressions: number
  clicks: number
  reach: number
  ctr: number
  cpc: number
  cpm: number
  result_type: string
  result_label: string
  result_count: number
  cost_per_result: number
  conversions: number
  active_campaigns: number
  paused_campaigns: number
}

export interface CampaignSnapshot {
  account_id: string
  campaign_id: string
  campaign_name: string
  objective: string
  status: string
  daily_budget: number | null
  lifetime_budget: number | null
  budget_remaining: number | null
  spend: number
  impressions: number
  clicks: number
  reach: number
  ctr: number
  cpc: number
  cpm: number
  result_type: string
  result_label: string
  result_count: number
  cost_per_result: number
  conversions: number
  snapshot_date: string
}

export interface AdAccount {
  account_id: string
  account_name: string
  is_active: boolean
}

export type PresetPeriod =
  | 'today'
  | 'yesterday'
  | '7d'
  | '14d'
  | '28d'
  | '30d'
  | 'this_month'
  | 'last_month'
  | 'maximum'
  | 'custom'

export type Period = PresetPeriod

export interface DateRange {
  from: string // YYYY-MM-DD
  to: string   // YYYY-MM-DD
}

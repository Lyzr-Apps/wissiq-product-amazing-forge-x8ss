'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import type { AIAgentResponse } from '@/lib/aiAgent'
import { uploadAndTrainDocument } from '@/lib/ragKnowledgeBase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import {
  FiUpload, FiTrendingUp, FiTrendingDown, FiAlertTriangle, FiCheckCircle,
  FiBarChart2, FiDollarSign, FiFileText, FiMessageSquare, FiSend,
  FiDownload, FiActivity, FiPieChart, FiTarget, FiArrowUp, FiArrowDown,
  FiLoader, FiX, FiChevronRight, FiDatabase, FiShield, FiClock,
  FiInfo, FiAlertCircle, FiArrowRight, FiRefreshCw, FiPlus, FiMinus,
  FiMaximize2, FiEye
} from 'react-icons/fi'

// ============================================================
// Constants
// ============================================================
const FINANCIAL_COORDINATOR_ID = '699e1f09b4bdd3b00090d5e5'
const FINANCIAL_SNAPSHOT_ID = '699e1ebc28e1d2a729e6c352'
const CASH_FLOW_FORECAST_ID = '699e1ef0a79fe05f9bfd5091'
const KPI_BENCHMARK_ID = '699e1ef0a79fe05f9bfd5093'
const ANOMALY_DETECTION_ID = '699e1ef1a79fe05f9bfd5095'
const ASK_WISSIQ_ID = '699e1f2a4268325fd8a0c022'
const BOARD_REPORT_ID = '699e1f2a03e99fdcfa03914c'
const RAG_ID = '699e1ebce9e49857cb7abf2b'

const AGENTS_INFO = [
  { id: FINANCIAL_COORDINATOR_ID, name: 'Financial Analysis Coordinator', purpose: 'Orchestrates all sub-agents and provides executive summary' },
  { id: FINANCIAL_SNAPSHOT_ID, name: 'Financial Snapshot', purpose: 'P&L, balance sheet, cash position analysis' },
  { id: CASH_FLOW_FORECAST_ID, name: 'Cash Flow Forecast', purpose: '13-week cash flow projections' },
  { id: KPI_BENCHMARK_ID, name: 'KPI & Benchmark', purpose: 'Key performance indicators vs industry benchmarks' },
  { id: ANOMALY_DETECTION_ID, name: 'Anomaly Detection', purpose: 'Risk scoring and anomaly identification' },
  { id: ASK_WISSIQ_ID, name: 'Ask WissIQ', purpose: 'Natural language Q&A over financial data' },
  { id: BOARD_REPORT_ID, name: 'Board Report Generator', purpose: 'Generates board-ready reports with PDF export' },
]

// ============================================================
// Theme
// ============================================================
const THEME_VARS: React.CSSProperties & Record<string, string> = {
  '--background': '222 47% 11%',
  '--foreground': '210 40% 98%',
  '--card': '217 33% 17%',
  '--card-foreground': '210 40% 98%',
  '--popover': '222 47% 11%',
  '--popover-foreground': '210 40% 98%',
  '--primary': '217 91% 60%',
  '--primary-foreground': '222 47% 11%',
  '--secondary': '217 33% 25%',
  '--secondary-foreground': '210 40% 98%',
  '--muted': '217 33% 20%',
  '--muted-foreground': '215 20% 65%',
  '--accent': '217 33% 25%',
  '--accent-foreground': '210 40% 98%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '210 40% 98%',
  '--border': '217 33% 25%',
  '--input': '217 33% 25%',
  '--ring': '217 91% 60%',
  '--radius': '0.5rem',
} as any

// ============================================================
// Types
// ============================================================
interface CoordinatorData {
  executive_summary?: string
  analysis_status?: {
    snapshot_complete?: string
    forecast_complete?: string
    kpi_complete?: string
    anomaly_complete?: string
  }
  key_findings?: Array<{ area?: string; finding?: string; priority?: string }>
  recommended_actions?: Array<{ action?: string; urgency?: string; impact?: string }>
}

interface SnapshotData {
  pnl_summary?: {
    total_revenue?: string
    total_expenses?: string
    net_income?: string
    gross_margin?: string
    key_line_items?: Array<{ name?: string; amount?: string; change_pct?: string }>
  }
  balance_sheet?: {
    total_assets?: string
    total_liabilities?: string
    total_equity?: string
    key_components?: Array<{ name?: string; amount?: string; category?: string }>
  }
  cash_position?: {
    cash_on_hand?: string
    cash_equivalents?: string
    net_cash_flow?: string
    runway_months?: string
  }
  revenue_breakdown?: Array<{ category?: string; amount?: string; percentage?: string }>
  expense_breakdown?: Array<{ category?: string; amount?: string; percentage?: string }>
  highlights?: Array<{ type?: string; title?: string; description?: string }>
}

interface CashFlowData {
  forecast_summary?: {
    starting_cash?: string
    ending_cash_expected?: string
    ending_cash_best?: string
    ending_cash_worst?: string
    confidence_level?: string
    total_inflows?: string
    total_outflows?: string
  }
  weekly_projections?: Array<{
    week?: string; week_label?: string; inflows?: string; outflows?: string
    net_cash_flow?: string; closing_balance?: string; risk_flag?: string
  }>
  liquidity_risks?: Array<{ week?: string; risk_description?: string; severity?: string; recommended_action?: string }>
  upcoming_obligations?: Array<{ due_date?: string; description?: string; amount?: string; priority?: string }>
  assumptions?: string[]
}

interface KPIData {
  kpis?: Array<{
    name?: string; value?: string; previous_value?: string; trend?: string
    industry_benchmark?: string; status?: string; category?: string
  }>
  top_performers?: Array<{ kpi_name?: string; value?: string; benchmark?: string; insight?: string }>
  needs_improvement?: Array<{ kpi_name?: string; value?: string; benchmark?: string; gap?: string; recommendation?: string }>
  overall_score?: string
  overall_assessment?: string
}

interface AnomalyData {
  risk_score?: string
  risk_level?: string
  total_anomalies?: string
  anomalies?: Array<{
    id?: string; severity?: string; category?: string; title?: string; description?: string
    metric_affected?: string; expected_value?: string; actual_value?: string
    deviation_pct?: string; recommended_action?: string
  }>
  trend_alerts?: Array<{
    metric?: string; direction?: string; duration?: string
    concern_level?: string; description?: string
  }>
  data_quality_issues?: Array<{ issue_type?: string; description?: string; affected_records?: string }>
  summary?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  data?: {
    answer?: string
    data_points?: Array<{ metric?: string; value?: string; context?: string }>
    implications?: string
    follow_up_suggestions?: string[]
    confidence?: string
    data_source?: string
  }
}

interface BoardReportData {
  report_title?: string
  generated_date?: string
  executive_summary?: string
  sections?: Array<{
    title?: string; content?: string
    key_metrics?: Array<{ label?: string; value?: string; status?: string }>
  }>
  board_questions?: string[]
  next_steps?: Array<{ action?: string; owner?: string; deadline?: string }>
  overall_assessment?: string
}

// ============================================================
// Sample Data
// ============================================================
const SAMPLE_COORDINATOR: CoordinatorData = {
  executive_summary: 'The company demonstrates strong revenue growth of 23% YoY, driven by SaaS subscription expansion. However, operating expenses have risen 18%, primarily due to increased headcount and marketing spend. Cash runway remains healthy at 14 months, but declining gross margins warrant attention. Two critical anomalies were detected in Q3 expense patterns that require immediate investigation.',
  analysis_status: { snapshot_complete: 'true', forecast_complete: 'true', kpi_complete: 'true', anomaly_complete: 'true' },
  key_findings: [
    { area: 'Revenue', finding: 'SaaS ARR grew 23% YoY to $4.2M, exceeding industry median of 18%', priority: 'high' },
    { area: 'Cash Flow', finding: 'Net cash burn rate decreased by 12% due to improved collections', priority: 'medium' },
    { area: 'Expenses', finding: 'Marketing CAC increased 34% without proportional revenue lift', priority: 'critical' },
    { area: 'Liquidity', finding: 'Cash runway of 14 months provides adequate buffer for growth plans', priority: 'low' },
  ],
  recommended_actions: [
    { action: 'Investigate Q3 marketing spend spike and optimize channel allocation', urgency: 'high', impact: 'high' },
    { action: 'Renegotiate vendor contracts expiring in Q1 to reduce COGS by ~8%', urgency: 'medium', impact: 'medium' },
    { action: 'Accelerate AR collections to improve DSO from 45 to 35 days', urgency: 'medium', impact: 'high' },
  ],
}

const SAMPLE_SNAPSHOT: SnapshotData = {
  pnl_summary: {
    total_revenue: '$4,250,000', total_expenses: '$3,612,500', net_income: '$637,500',
    gross_margin: '68.5%',
    key_line_items: [
      { name: 'SaaS Subscriptions', amount: '$3,400,000', change_pct: '+23%' },
      { name: 'Professional Services', amount: '$550,000', change_pct: '+8%' },
      { name: 'Payroll & Benefits', amount: '$1,800,000', change_pct: '+15%' },
      { name: 'Marketing & Sales', amount: '$720,000', change_pct: '+34%' },
    ],
  },
  balance_sheet: {
    total_assets: '$8,450,000', total_liabilities: '$2,100,000', total_equity: '$6,350,000',
    key_components: [
      { name: 'Cash & Equivalents', amount: '$3,200,000', category: 'Current Assets' },
      { name: 'Accounts Receivable', amount: '$1,850,000', category: 'Current Assets' },
      { name: 'Fixed Assets', amount: '$2,400,000', category: 'Non-Current Assets' },
      { name: 'Accounts Payable', amount: '$680,000', category: 'Current Liabilities' },
      { name: 'Long-term Debt', amount: '$1,200,000', category: 'Non-Current Liabilities' },
    ],
  },
  cash_position: { cash_on_hand: '$2,800,000', cash_equivalents: '$400,000', net_cash_flow: '$180,000', runway_months: '14' },
  revenue_breakdown: [
    { category: 'SaaS Subscriptions', amount: '$3,400,000', percentage: '80%' },
    { category: 'Professional Services', amount: '$550,000', percentage: '13%' },
    { category: 'Licensing', amount: '$200,000', percentage: '5%' },
    { category: 'Other', amount: '$100,000', percentage: '2%' },
  ],
  expense_breakdown: [
    { category: 'Payroll & Benefits', amount: '$1,800,000', percentage: '50%' },
    { category: 'Marketing & Sales', amount: '$720,000', percentage: '20%' },
    { category: 'Infrastructure', amount: '$450,000', percentage: '12%' },
    { category: 'R&D', amount: '$360,000', percentage: '10%' },
    { category: 'G&A', amount: '$282,500', percentage: '8%' },
  ],
  highlights: [
    { type: 'positive', title: 'Strong Revenue Growth', description: 'Revenue increased 23% YoY, outpacing industry average of 18%' },
    { type: 'negative', title: 'Rising CAC', description: 'Customer acquisition cost up 34%, impacting unit economics' },
    { type: 'neutral', title: 'Headcount Growth', description: 'Team expanded from 45 to 58 employees to support product roadmap' },
  ],
}

const SAMPLE_CASHFLOW: CashFlowData = {
  forecast_summary: {
    starting_cash: '$3,200,000', ending_cash_expected: '$3,850,000',
    ending_cash_best: '$4,200,000', ending_cash_worst: '$2,900,000',
    confidence_level: '78%', total_inflows: '$5,600,000', total_outflows: '$4,950,000',
  },
  weekly_projections: [
    { week: '1', week_label: 'Jan 6-12', inflows: '$430,000', outflows: '$380,000', net_cash_flow: '$50,000', closing_balance: '$3,250,000', risk_flag: 'low' },
    { week: '2', week_label: 'Jan 13-19', inflows: '$410,000', outflows: '$395,000', net_cash_flow: '$15,000', closing_balance: '$3,265,000', risk_flag: 'low' },
    { week: '3', week_label: 'Jan 20-26', inflows: '$450,000', outflows: '$520,000', net_cash_flow: '-$70,000', closing_balance: '$3,195,000', risk_flag: 'medium' },
    { week: '4', week_label: 'Jan 27-Feb 2', inflows: '$380,000', outflows: '$410,000', net_cash_flow: '-$30,000', closing_balance: '$3,165,000', risk_flag: 'low' },
    { week: '5', week_label: 'Feb 3-9', inflows: '$460,000', outflows: '$370,000', net_cash_flow: '$90,000', closing_balance: '$3,255,000', risk_flag: 'low' },
  ],
  liquidity_risks: [
    { week: 'Week 3', risk_description: 'Large vendor payment of $150K due alongside quarterly tax installment', severity: 'medium', recommended_action: 'Ensure AR collections are accelerated in Week 2' },
    { week: 'Week 8', risk_description: 'Annual insurance premium renewal of $85K coincides with payroll', severity: 'low', recommended_action: 'Negotiate payment plan with insurance provider' },
  ],
  upcoming_obligations: [
    { due_date: 'Jan 15', description: 'Quarterly tax installment', amount: '$95,000', priority: 'high' },
    { due_date: 'Jan 20', description: 'AWS infrastructure payment', amount: '$45,000', priority: 'medium' },
    { due_date: 'Feb 1', description: 'Office lease payment', amount: '$32,000', priority: 'medium' },
    { due_date: 'Feb 15', description: 'Annual insurance renewal', amount: '$85,000', priority: 'high' },
  ],
  assumptions: [
    'Revenue growth continues at current trajectory of 2% MoM',
    'No major customer churn expected in the forecast period',
    'Hiring plan adds 3 new employees starting Week 6',
  ],
}

const SAMPLE_KPI: KPIData = {
  overall_score: '7.4/10',
  overall_assessment: 'The company performs above average across most financial KPIs, with notable strength in revenue growth and customer retention. Areas requiring attention include rising customer acquisition costs and declining gross margins. Overall financial health is solid with strong liquidity ratios.',
  kpis: [
    { name: 'Revenue Growth Rate', value: '23%', previous_value: '18%', trend: 'up', industry_benchmark: '18%', status: 'above', category: 'Growth' },
    { name: 'Gross Margin', value: '68.5%', previous_value: '72.1%', trend: 'down', industry_benchmark: '70%', status: 'below', category: 'Profitability' },
    { name: 'Net Profit Margin', value: '15%', previous_value: '12%', trend: 'up', industry_benchmark: '14%', status: 'above', category: 'Profitability' },
    { name: 'Customer Acquisition Cost', value: '$1,200', previous_value: '$895', trend: 'up', industry_benchmark: '$950', status: 'below', category: 'Efficiency' },
    { name: 'Customer Retention Rate', value: '94%', previous_value: '92%', trend: 'up', industry_benchmark: '90%', status: 'above', category: 'Growth' },
    { name: 'Current Ratio', value: '2.4', previous_value: '2.1', trend: 'up', industry_benchmark: '2.0', status: 'above', category: 'Liquidity' },
    { name: 'Debt-to-Equity', value: '0.33', previous_value: '0.38', trend: 'down', industry_benchmark: '0.40', status: 'above', category: 'Leverage' },
    { name: 'Days Sales Outstanding', value: '45 days', previous_value: '42 days', trend: 'up', industry_benchmark: '38 days', status: 'below', category: 'Efficiency' },
  ],
  top_performers: [
    { kpi_name: 'Revenue Growth Rate', value: '23%', benchmark: '18%', insight: 'Outpacing industry by 5 percentage points due to strong SaaS expansion' },
    { kpi_name: 'Customer Retention Rate', value: '94%', benchmark: '90%', insight: 'Product stickiness and customer success initiatives driving retention above peers' },
  ],
  needs_improvement: [
    { kpi_name: 'Customer Acquisition Cost', value: '$1,200', benchmark: '$950', gap: '$250', recommendation: 'Optimize marketing channel mix and reduce dependency on paid acquisition' },
    { kpi_name: 'Days Sales Outstanding', value: '45 days', benchmark: '38 days', gap: '7 days', recommendation: 'Implement automated invoice reminders and offer early payment discounts' },
  ],
}

const SAMPLE_ANOMALY: AnomalyData = {
  risk_score: '6.2',
  risk_level: 'moderate',
  total_anomalies: '4',
  summary: 'Four anomalies detected across expense patterns and revenue recognition. Two are rated critical and require immediate investigation. The overall risk profile is moderate, with no systemic threats to financial stability but specific areas requiring management attention.',
  anomalies: [
    { id: 'ANM-001', severity: 'critical', category: 'Expenses', title: 'Unusual Marketing Spend Spike', description: 'Marketing expenses in September exceeded the 3-month moving average by 47%, with $180K in unbudgeted agency fees.', metric_affected: 'Marketing Spend', expected_value: '$122,000', actual_value: '$180,000', deviation_pct: '47%', recommended_action: 'Review and validate all September marketing invoices against approved campaign budgets' },
    { id: 'ANM-002', severity: 'critical', category: 'Revenue', title: 'Revenue Recognition Timing', description: 'Three large contracts totaling $320K were recognized in Q3 despite service delivery scheduled for Q4.', metric_affected: 'Quarterly Revenue', expected_value: '$1,050,000', actual_value: '$1,370,000', deviation_pct: '30%', recommended_action: 'Audit Q3 revenue recognition against ASC 606 compliance requirements' },
    { id: 'ANM-003', severity: 'warning', category: 'Payroll', title: 'Overtime Costs Exceeding Budget', description: 'Engineering overtime costs have exceeded budget by 22% for three consecutive months.', metric_affected: 'Engineering Payroll', expected_value: '$185,000', actual_value: '$226,000', deviation_pct: '22%', recommended_action: 'Review project timelines and consider additional hiring to reduce overtime dependency' },
    { id: 'ANM-004', severity: 'info', category: 'Vendor', title: 'Duplicate Vendor Payment Detected', description: 'A $12,500 payment to CloudHost Inc. appears duplicated in the October ledger.', metric_affected: 'Vendor Payments', expected_value: '$12,500', actual_value: '$25,000', deviation_pct: '100%', recommended_action: 'Verify with AP team and request credit or refund if confirmed duplicate' },
  ],
  trend_alerts: [
    { metric: 'Gross Margin', direction: 'declining', duration: '4 months', concern_level: 'high', description: 'Gross margin has declined from 72.1% to 68.5% over the past four months, driven by rising COGS' },
    { metric: 'Customer Acquisition Cost', direction: 'increasing', duration: '3 months', concern_level: 'medium', description: 'CAC has risen 34% over three months, outpacing customer lifetime value growth' },
  ],
  data_quality_issues: [
    { issue_type: 'Missing Data', description: '12 expense entries in September lack proper category classification', affected_records: '12' },
    { issue_type: 'Format Inconsistency', description: 'Date format varies between MM/DD/YYYY and YYYY-MM-DD in imported data', affected_records: '45' },
  ],
}

// ============================================================
// Helpers
// ============================================================
function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function getSeverityColor(severity?: string): string {
  const s = (severity ?? '').toLowerCase()
  if (s === 'critical' || s === 'high') return 'bg-red-500/20 text-red-400 border-red-500/30'
  if (s === 'warning' || s === 'medium' || s === 'moderate') return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  if (s === 'low' || s === 'info') return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
}

function getPriorityColor(priority?: string): string {
  const p = (priority ?? '').toLowerCase()
  if (p === 'critical' || p === 'high') return 'bg-red-500/20 text-red-400 border-red-500/30'
  if (p === 'medium') return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  if (p === 'low') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
}

function getStatusColor(status?: string): string {
  const s = (status ?? '').toLowerCase()
  if (s === 'above' || s === 'positive' || s === 'good') return 'text-emerald-400'
  if (s === 'below' || s === 'negative' || s === 'poor') return 'text-red-400'
  return 'text-amber-400'
}

function getRiskFlagColor(flag?: string): string {
  const f = (flag ?? '').toLowerCase()
  if (f === 'high' || f === 'critical') return 'bg-red-500/20 text-red-400'
  if (f === 'medium') return 'bg-amber-500/20 text-amber-400'
  return 'bg-emerald-500/20 text-emerald-400'
}

function getHighlightIcon(type?: string) {
  const t = (type ?? '').toLowerCase()
  if (t === 'positive') return <FiTrendingUp className="w-5 h-5 text-emerald-400" />
  if (t === 'negative') return <FiTrendingDown className="w-5 h-5 text-red-400" />
  return <FiInfo className="w-5 h-5 text-blue-400" />
}

function getHighlightBorder(type?: string): string {
  const t = (type ?? '').toLowerCase()
  if (t === 'positive') return 'border-l-emerald-500'
  if (t === 'negative') return 'border-l-red-500'
  return 'border-l-blue-500'
}

function getStatusBadgeColor(status?: string): string {
  const s = (status ?? '').toLowerCase()
  if (s === 'above' || s === 'good' || s === 'positive') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  if (s === 'below' || s === 'poor' || s === 'negative') return 'bg-red-500/20 text-red-400 border-red-500/30'
  return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
}

function extractAgentData(result: AIAgentResponse): any {
  if (!result?.success) return null
  const r = result?.response?.result
  if (r && typeof r === 'object' && Object.keys(r).length > 0) return r
  return result?.response ?? null
}

// ============================================================
// ErrorBoundary
// ============================================================
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================
// Sub-Components
// ============================================================

function MetricCard({ label, value, icon, subtext, color }: { label: string; value: string; icon: React.ReactNode; subtext?: string; color?: string }) {
  return (
    <Card className="bg-card/80 border-border/50 hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-xl font-bold ${color ?? 'text-foreground'}`}>{value || '--'}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </div>
          <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonLoader({ rows }: { rows?: number }) {
  const count = rows ?? 3
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

function AgentStatusPanel({ activeAgentId, agentsLoading }: { activeAgentId: string | null; agentsLoading: Set<string> }) {
  return (
    <Card className="bg-card/60 border-border/30">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <FiActivity className="w-3 h-3" /> Agent Status
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="space-y-1.5">
          {AGENTS_INFO.map((agent) => {
            const isActive = activeAgentId === agent.id
            const isLoading = agentsLoading.has(agent.id)
            return (
              <div key={agent.id} className={`flex items-center gap-2 py-1 px-2 rounded text-xs ${isActive || isLoading ? 'bg-primary/10 border border-primary/30' : ''}`}>
                {isLoading ? (
                  <FiLoader className="w-3 h-3 text-primary animate-spin flex-shrink-0" />
                ) : (
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                )}
                <span className={`truncate ${isActive || isLoading ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{agent.name}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// DataUploadTab
// ============================================================
function DataUploadTab({
  csvFile, setCsvFile, onAnalyze, uploading, analyzing, uploadStatus,
  kbFile, setKbFile, onKbUpload, kbUploading, kbStatus
}: {
  csvFile: File | null; setCsvFile: (f: File | null) => void
  onAnalyze: () => void; uploading: boolean; analyzing: boolean; uploadStatus: string
  kbFile: File | null; setKbFile: (f: File | null) => void
  onKbUpload: () => void; kbUploading: boolean; kbStatus: string
}) {
  const csvInputRef = useRef<HTMLInputElement>(null)
  const kbInputRef = useRef<HTMLInputElement>(null)

  const handleCsvDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    if (file) setCsvFile(file)
  }, [setCsvFile])

  const handleKbDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    if (file) setKbFile(file)
  }, [setKbFile])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* CSV Upload */}
      <Card className="bg-card/80 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FiBarChart2 className="w-5 h-5 text-primary" /> Financial Data Upload
          </CardTitle>
          <CardDescription>Upload your CSV financial data for comprehensive analysis by all specialist agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleCsvDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => csvInputRef.current?.click()}
            className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
          >
            <FiUpload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Drag and drop your CSV file here, or click to browse</p>
            <p className="text-xs text-muted-foreground/60">Supports .csv files</p>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target?.files?.[0]
                if (file) setCsvFile(file)
              }}
            />
          </div>
          {csvFile && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiFileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{csvFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(csvFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCsvFile(null)}>
                <FiX className="w-4 h-4" />
              </Button>
            </div>
          )}
          {uploadStatus && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${uploadStatus.includes('Error') || uploadStatus.includes('error') || uploadStatus.includes('fail') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
              {uploadStatus}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={onAnalyze}
            disabled={!csvFile || uploading || analyzing}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {uploading ? (
              <><FiLoader className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
            ) : analyzing ? (
              <><FiLoader className="w-4 h-4 mr-2 animate-spin" /> Analyzing with all agents...</>
            ) : (
              <><FiBarChart2 className="w-4 h-4 mr-2" /> Analyze Financial Data</>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Knowledge Base Upload */}
      <Card className="bg-card/80 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FiDatabase className="w-5 h-5 text-primary" /> Knowledge Base
          </CardTitle>
          <CardDescription>Upload supporting documents (PDF, DOCX, TXT) to enrich the Ask WissIQ agent context</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleKbDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => kbInputRef.current?.click()}
            className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
          >
            <FiPlus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Drag and drop your document here, or click to browse</p>
            <p className="text-xs text-muted-foreground/60">Supports .pdf, .docx, .txt files</p>
            <input
              ref={kbInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target?.files?.[0]
                if (file) setKbFile(file)
              }}
            />
          </div>
          {kbFile && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiFileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{kbFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(kbFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setKbFile(null)}>
                <FiX className="w-4 h-4" />
              </Button>
            </div>
          )}
          {kbStatus && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${kbStatus.includes('Error') || kbStatus.includes('error') || kbStatus.includes('fail') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              {kbStatus}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={onKbUpload}
            disabled={!kbFile || kbUploading}
            variant="secondary"
            className="w-full"
          >
            {kbUploading ? (
              <><FiLoader className="w-4 h-4 mr-2 animate-spin" /> Uploading to Knowledge Base...</>
            ) : (
              <><FiUpload className="w-4 h-4 mr-2" /> Upload to Knowledge Base</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// ============================================================
// DashboardTab
// ============================================================
function DashboardTab({
  coordinator, snapshot, cashflow, kpi, anomaly,
  loadingCoordinator, loadingSnapshot, loadingCashflow, loadingKpi, loadingAnomaly
}: {
  coordinator: CoordinatorData | null; snapshot: SnapshotData | null
  cashflow: CashFlowData | null; kpi: KPIData | null; anomaly: AnomalyData | null
  loadingCoordinator: boolean; loadingSnapshot: boolean
  loadingCashflow: boolean; loadingKpi: boolean; loadingAnomaly: boolean
}) {
  const [dashSection, setDashSection] = useState('overview')
  const hasData = coordinator || snapshot || cashflow || kpi || anomaly

  if (!hasData && !loadingCoordinator && !loadingSnapshot && !loadingCashflow && !loadingKpi && !loadingAnomaly) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FiBarChart2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Analysis Data Yet</h3>
        <p className="text-sm text-muted-foreground/60 text-center max-w-md">Upload a CSV file on the Data Upload tab and run the analysis to populate this dashboard with financial insights.</p>
      </div>
    )
  }

  const dashTabs = [
    { id: 'overview', label: 'Overview', icon: <FiEye className="w-4 h-4" /> },
    { id: 'snapshot', label: 'Snapshot', icon: <FiPieChart className="w-4 h-4" /> },
    { id: 'cashflow', label: 'Cash Flow', icon: <FiDollarSign className="w-4 h-4" /> },
    { id: 'kpi', label: 'KPI', icon: <FiTarget className="w-4 h-4" /> },
    { id: 'anomaly', label: 'Alerts', icon: <FiShield className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-4">
      {/* Sub-navigation */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-lg overflow-x-auto">
        {dashTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDashSection(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${dashSection === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {dashSection === 'overview' && (
        <div className="space-y-6">
          {loadingCoordinator ? <SkeletonLoader rows={4} /> : coordinator ? (
            <>
              {/* Executive Summary */}
              <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><FiFileText className="w-4 h-4 text-primary" /> Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>{renderMarkdown(coordinator?.executive_summary ?? '')}</CardContent>
              </Card>

              {/* Analysis Status */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Financial Snapshot', status: coordinator?.analysis_status?.snapshot_complete },
                  { label: 'Cash Flow Forecast', status: coordinator?.analysis_status?.forecast_complete },
                  { label: 'KPI & Benchmark', status: coordinator?.analysis_status?.kpi_complete },
                  { label: 'Anomaly Detection', status: coordinator?.analysis_status?.anomaly_complete },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
                    {(item.status ?? '').toLowerCase() === 'true' ? (
                      <FiCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <FiClock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    )}
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Key Findings */}
              {Array.isArray(coordinator?.key_findings) && coordinator.key_findings.length > 0 && (
                <Card className="bg-card/80 border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><FiAlertCircle className="w-4 h-4 text-primary" /> Key Findings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {coordinator.key_findings.map((f, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-muted/10 rounded-lg">
                          <Badge className={`text-xs flex-shrink-0 mt-0.5 ${getPriorityColor(f?.priority)}`}>{f?.priority ?? 'N/A'}</Badge>
                          <div>
                            <span className="text-xs font-medium text-primary uppercase">{f?.area ?? ''}</span>
                            <p className="text-sm text-foreground/90 mt-0.5">{f?.finding ?? ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommended Actions */}
              {Array.isArray(coordinator?.recommended_actions) && coordinator.recommended_actions.length > 0 && (
                <Card className="bg-card/80 border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><FiArrowRight className="w-4 h-4 text-primary" /> Recommended Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {coordinator.recommended_actions.map((a, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-muted/10 rounded-lg">
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <Badge className={`text-xs ${getPriorityColor(a?.urgency)}`}>Urgency: {a?.urgency ?? 'N/A'}</Badge>
                            <Badge className={`text-xs ${getPriorityColor(a?.impact)}`}>Impact: {a?.impact ?? 'N/A'}</Badge>
                          </div>
                          <p className="text-sm text-foreground/90">{a?.action ?? ''}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Financial Snapshot */}
      {dashSection === 'snapshot' && (
        <div className="space-y-6">
          {loadingSnapshot ? <SkeletonLoader rows={5} /> : snapshot ? (
            <>
              {/* P&L Summary Cards */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><FiDollarSign className="w-4 h-4" /> P&L Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard label="Total Revenue" value={snapshot?.pnl_summary?.total_revenue ?? '--'} icon={<FiTrendingUp className="w-4 h-4 text-emerald-400" />} color="text-emerald-400" />
                  <MetricCard label="Total Expenses" value={snapshot?.pnl_summary?.total_expenses ?? '--'} icon={<FiTrendingDown className="w-4 h-4 text-red-400" />} color="text-red-400" />
                  <MetricCard label="Net Income" value={snapshot?.pnl_summary?.net_income ?? '--'} icon={<FiDollarSign className="w-4 h-4 text-primary" />} color="text-primary" />
                  <MetricCard label="Gross Margin" value={snapshot?.pnl_summary?.gross_margin ?? '--'} icon={<FiPieChart className="w-4 h-4 text-blue-400" />} color="text-blue-400" />
                </div>
              </div>

              {/* Key Line Items */}
              {Array.isArray(snapshot?.pnl_summary?.key_line_items) && snapshot.pnl_summary.key_line_items.length > 0 && (
                <Card className="bg-card/80 border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Key Line Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/30">
                          <TableHead className="text-xs">Item</TableHead>
                          <TableHead className="text-xs text-right">Amount</TableHead>
                          <TableHead className="text-xs text-right">Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {snapshot.pnl_summary.key_line_items.map((item, i) => (
                          <TableRow key={i} className="border-border/20">
                            <TableCell className="text-sm">{item?.name ?? ''}</TableCell>
                            <TableCell className="text-sm text-right font-medium">{item?.amount ?? ''}</TableCell>
                            <TableCell className={`text-sm text-right font-medium ${(item?.change_pct ?? '').startsWith('+') ? 'text-emerald-400' : (item?.change_pct ?? '').startsWith('-') ? 'text-red-400' : ''}`}>{item?.change_pct ?? ''}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Balance Sheet */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><FiBarChart2 className="w-4 h-4" /> Balance Sheet</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <MetricCard label="Total Assets" value={snapshot?.balance_sheet?.total_assets ?? '--'} icon={<FiArrowUp className="w-4 h-4 text-emerald-400" />} color="text-emerald-400" />
                  <MetricCard label="Total Liabilities" value={snapshot?.balance_sheet?.total_liabilities ?? '--'} icon={<FiArrowDown className="w-4 h-4 text-red-400" />} color="text-red-400" />
                  <MetricCard label="Total Equity" value={snapshot?.balance_sheet?.total_equity ?? '--'} icon={<FiDollarSign className="w-4 h-4 text-primary" />} color="text-primary" />
                </div>
              </div>

              {/* Balance Sheet Components */}
              {Array.isArray(snapshot?.balance_sheet?.key_components) && snapshot.balance_sheet.key_components.length > 0 && (
                <Card className="bg-card/80 border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Balance Sheet Components</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/30">
                          <TableHead className="text-xs">Component</TableHead>
                          <TableHead className="text-xs">Category</TableHead>
                          <TableHead className="text-xs text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {snapshot.balance_sheet.key_components.map((comp, i) => (
                          <TableRow key={i} className="border-border/20">
                            <TableCell className="text-sm">{comp?.name ?? ''}</TableCell>
                            <TableCell className="text-sm"><Badge variant="secondary" className="text-xs">{comp?.category ?? ''}</Badge></TableCell>
                            <TableCell className="text-sm text-right font-medium">{comp?.amount ?? ''}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Cash Position */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><FiDollarSign className="w-4 h-4" /> Cash Position</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard label="Cash on Hand" value={snapshot?.cash_position?.cash_on_hand ?? '--'} icon={<FiDollarSign className="w-4 h-4 text-emerald-400" />} />
                  <MetricCard label="Cash Equivalents" value={snapshot?.cash_position?.cash_equivalents ?? '--'} icon={<FiDollarSign className="w-4 h-4 text-blue-400" />} />
                  <MetricCard label="Net Cash Flow" value={snapshot?.cash_position?.net_cash_flow ?? '--'} icon={<FiActivity className="w-4 h-4 text-primary" />} />
                  <MetricCard label="Runway (Months)" value={snapshot?.cash_position?.runway_months ?? '--'} icon={<FiClock className="w-4 h-4 text-amber-400" />} />
                </div>
              </div>

              {/* Revenue & Expense Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Revenue */}
                <Card className="bg-card/80 border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><FiTrendingUp className="w-4 h-4 text-emerald-400" /> Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array.isArray(snapshot?.revenue_breakdown) && snapshot.revenue_breakdown.map((item, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{item?.category ?? ''}</span>
                            <span className="font-medium">{item?.amount ?? ''} ({item?.percentage ?? ''})</span>
                          </div>
                          <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: item?.percentage ?? '0%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Expenses */}
                <Card className="bg-card/80 border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><FiTrendingDown className="w-4 h-4 text-red-400" /> Expense Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array.isArray(snapshot?.expense_breakdown) && snapshot.expense_breakdown.map((item, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{item?.category ?? ''}</span>
                            <span className="font-medium">{item?.amount ?? ''} ({item?.percentage ?? ''})</span>
                          </div>
                          <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500/50 rounded-full" style={{ width: item?.percentage ?? '0%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Highlights */}
              {Array.isArray(snapshot?.highlights) && snapshot.highlights.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Highlights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {snapshot.highlights.map((h, i) => (
                      <Card key={i} className={`bg-card/80 border-l-4 ${getHighlightBorder(h?.type)} border-border/50`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {getHighlightIcon(h?.type)}
                            <div>
                              <p className="text-sm font-medium">{h?.title ?? ''}</p>
                              <p className="text-xs text-muted-foreground mt-1">{h?.description ?? ''}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Cash Flow Forecast */}
      {dashSection === 'cashflow' && (
        <div className="space-y-6">
          {loadingCashflow ? <SkeletonLoader rows={5} /> : cashflow ? (
            <>
              {/* Forecast Summary */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><FiDollarSign className="w-4 h-4" /> Forecast Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard label="Starting Cash" value={cashflow?.forecast_summary?.starting_cash ?? '--'} icon={<FiDollarSign className="w-4 h-4 text-blue-400" />} />
                  <MetricCard label="Expected Ending" value={cashflow?.forecast_summary?.ending_cash_expected ?? '--'} icon={<FiTarget className="w-4 h-4 text-emerald-400" />} color="text-emerald-400" />
                  <MetricCard label="Confidence" value={cashflow?.forecast_summary?.confidence_level ?? '--'} icon={<FiShield className="w-4 h-4 text-primary" />} color="text-primary" />
                  <MetricCard label="Net Flow" value={`${cashflow?.forecast_summary?.total_inflows ?? '?'} in / ${cashflow?.forecast_summary?.total_outflows ?? '?'} out`} icon={<FiActivity className="w-4 h-4 text-amber-400" />} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <Card className="bg-emerald-500/5 border-emerald-500/20">
                    <CardContent className="p-4 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Best Case Ending Cash</span>
                      <span className="text-lg font-bold text-emerald-400">{cashflow?.forecast_summary?.ending_cash_best ?? '--'}</span>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-500/5 border-red-500/20">
                    <CardContent className="p-4 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Worst Case Ending Cash</span>
                      <span className="text-lg font-bold text-red-400">{cashflow?.forecast_summary?.ending_cash_worst ?? '--'}</span>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Weekly Projections Table */}
              {Array.isArray(cashflow?.weekly_projections) && cashflow.weekly_projections.length > 0 && (
                <Card className="bg-card/80 border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><FiBarChart2 className="w-4 h-4 text-primary" /> 13-Week Projections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border/30">
                            <TableHead className="text-xs">Week</TableHead>
                            <TableHead className="text-xs">Period</TableHead>
                            <TableHead className="text-xs text-right">Inflows</TableHead>
                            <TableHead className="text-xs text-right">Outflows</TableHead>
                            <TableHead className="text-xs text-right">Net Flow</TableHead>
                            <TableHead className="text-xs text-right">Closing Balance</TableHead>
                            <TableHead className="text-xs text-center">Risk</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cashflow.weekly_projections.map((w, i) => (
                            <TableRow key={i} className="border-border/20">
                              <TableCell className="text-sm font-medium">{w?.week ?? ''}</TableCell>
                              <TableCell className="text-sm">{w?.week_label ?? ''}</TableCell>
                              <TableCell className="text-sm text-right text-emerald-400">{w?.inflows ?? ''}</TableCell>
                              <TableCell className="text-sm text-right text-red-400">{w?.outflows ?? ''}</TableCell>
                              <TableCell className={`text-sm text-right font-medium ${(w?.net_cash_flow ?? '').startsWith('-') ? 'text-red-400' : 'text-emerald-400'}`}>{w?.net_cash_flow ?? ''}</TableCell>
                              <TableCell className="text-sm text-right font-medium">{w?.closing_balance ?? ''}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={`text-xs ${getRiskFlagColor(w?.risk_flag)}`}>{w?.risk_flag ?? 'N/A'}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Liquidity Risks */}
              {Array.isArray(cashflow?.liquidity_risks) && cashflow.liquidity_risks.length > 0 && (
                <Card className="bg-card/80 border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><FiAlertTriangle className="w-4 h-4 text-amber-400" /> Liquidity Risks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cashflow.liquidity_risks.map((risk, i) => (
                        <div key={i} className="p-3 bg-muted/10 rounded-lg border-l-4 border-l-amber-500/50">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${getSeverityColor(risk?.severity)}`}>{risk?.severity ?? ''}</Badge>
                            <span className="text-xs text-muted-foreground">{risk?.week ?? ''}</span>
                          </div>
                          <p className="text-sm mb-1">{risk?.risk_description ?? ''}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><FiChevronRight className="w-3 h-3" /> {risk?.recommended_action ?? ''}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Obligations */}
              {Array.isArray(cashflow?.upcoming_obligations) && cashflow.upcoming_obligations.length > 0 && (
                <Card className="bg-card/80 border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><FiClock className="w-4 h-4 text-primary" /> Upcoming Obligations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/30">
                          <TableHead className="text-xs">Due Date</TableHead>
                          <TableHead className="text-xs">Description</TableHead>
                          <TableHead className="text-xs text-right">Amount</TableHead>
                          <TableHead className="text-xs text-center">Priority</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashflow.upcoming_obligations.map((ob, i) => (
                          <TableRow key={i} className="border-border/20">
                            <TableCell className="text-sm font-medium">{ob?.due_date ?? ''}</TableCell>
                            <TableCell className="text-sm">{ob?.description ?? ''}</TableCell>
                            <TableCell className="text-sm text-right font-medium">{ob?.amount ?? ''}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={`text-xs ${getPriorityColor(ob?.priority)}`}>{ob?.priority ?? ''}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Assumptions */}
              {Array.isArray(cashflow?.assumptions) && cashflow.assumptions.length > 0 && (
                <Card className="bg-card/60 border-border/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground flex items-center gap-2"><FiInfo className="w-3 h-3" /> Assumptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {cashflow.assumptions.map((a, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">-</span> {a ?? ''}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* KPI & Benchmark */}
      {dashSection === 'kpi' && (
        <div className="space-y-6">
          {loadingKpi ? <SkeletonLoader rows={5} /> : kpi ? (
            <>
              {/* Overall Score Banner */}
              <Card className="bg-gradient-to-r from-primary/15 to-transparent border-primary/20">
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Overall Financial Health Score</p>
                    <p className="text-3xl font-bold text-primary">{kpi?.overall_score ?? '--'}</p>
                  </div>
                  <div className="max-w-lg">{renderMarkdown(kpi?.overall_assessment ?? '')}</div>
                </CardContent>
              </Card>

              {/* KPI Grid */}
              {Array.isArray(kpi?.kpis) && kpi.kpis.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Key Performance Indicators</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {kpi.kpis.map((k, i) => (
                      <Card key={i} className="bg-card/80 border-border/50 hover:border-primary/30 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="text-xs">{k?.category ?? ''}</Badge>
                            <Badge className={`text-xs ${getStatusBadgeColor(k?.status)}`}>{k?.status ?? ''}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{k?.name ?? ''}</p>
                          <div className="flex items-end gap-2 mb-2">
                            <span className="text-xl font-bold">{k?.value ?? '--'}</span>
                            <span className="text-xs text-muted-foreground mb-1">prev: {k?.previous_value ?? '--'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs">
                              {(k?.trend ?? '').toLowerCase() === 'up' ? (
                                <FiArrowUp className="w-3 h-3 text-emerald-400" />
                              ) : (k?.trend ?? '').toLowerCase() === 'down' ? (
                                <FiArrowDown className="w-3 h-3 text-red-400" />
                              ) : (
                                <FiMinus className="w-3 h-3 text-muted-foreground" />
                              )}
                              <span className={`${(k?.trend ?? '').toLowerCase() === 'up' ? 'text-emerald-400' : (k?.trend ?? '').toLowerCase() === 'down' ? 'text-red-400' : 'text-muted-foreground'}`}>{k?.trend ?? ''}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">Benchmark: {k?.industry_benchmark ?? '--'}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Performers & Needs Improvement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Performers */}
                {Array.isArray(kpi?.top_performers) && kpi.top_performers.length > 0 && (
                  <Card className="bg-card/80 border-emerald-500/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><FiCheckCircle className="w-4 h-4 text-emerald-400" /> Top Performers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {kpi.top_performers.map((tp, i) => (
                          <div key={i} className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">{tp?.kpi_name ?? ''}</span>
                              <span className="text-sm font-bold text-emerald-400">{tp?.value ?? ''}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Benchmark: {tp?.benchmark ?? ''}</p>
                            <p className="text-xs text-emerald-400/80 mt-1">{tp?.insight ?? ''}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Needs Improvement */}
                {Array.isArray(kpi?.needs_improvement) && kpi.needs_improvement.length > 0 && (
                  <Card className="bg-card/80 border-red-500/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><FiAlertTriangle className="w-4 h-4 text-red-400" /> Needs Improvement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {kpi.needs_improvement.map((ni, i) => (
                          <div key={i} className="p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">{ni?.kpi_name ?? ''}</span>
                              <span className="text-sm font-bold text-red-400">{ni?.value ?? ''}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Benchmark: {ni?.benchmark ?? ''} | Gap: {ni?.gap ?? '--'}</p>
                            <p className="text-xs text-amber-400/80 mt-1 flex items-start gap-1"><FiChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" /> {ni?.recommendation ?? ''}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Anomaly Detection / Alerts */}
      {dashSection === 'anomaly' && (
        <div className="space-y-6">
          {loadingAnomaly ? <SkeletonLoader rows={5} /> : anomaly ? (
            <>
              {/* Risk Score Banner */}
              <Card className={`border-border/50 ${(anomaly?.risk_level ?? '').toLowerCase() === 'high' || (anomaly?.risk_level ?? '').toLowerCase() === 'critical' ? 'bg-red-500/5 border-red-500/20' : (anomaly?.risk_level ?? '').toLowerCase() === 'moderate' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Risk Score</p>
                      <div className="flex items-end gap-3">
                        <span className="text-4xl font-bold">{anomaly?.risk_score ?? '--'}</span>
                        <Badge className={`text-sm mb-1 ${getSeverityColor(anomaly?.risk_level)}`}>{anomaly?.risk_level ?? 'Unknown'}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{anomaly?.total_anomalies ?? '0'} anomalies detected</p>
                    </div>
                    <div className="max-w-lg">{renderMarkdown(anomaly?.summary ?? '')}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Anomalies List */}
              {Array.isArray(anomaly?.anomalies) && anomaly.anomalies.length > 0 && (
                <Card className="bg-card/80 border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><FiAlertCircle className="w-4 h-4 text-red-400" /> Detected Anomalies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {anomaly.anomalies.map((a, i) => (
                        <div key={i} className={`p-4 rounded-lg border-l-4 bg-muted/10 ${(a?.severity ?? '').toLowerCase() === 'critical' ? 'border-l-red-500' : (a?.severity ?? '').toLowerCase() === 'warning' ? 'border-l-amber-500' : 'border-l-blue-500'}`}>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge className={`text-xs ${getSeverityColor(a?.severity)}`}>{a?.severity ?? ''}</Badge>
                            <Badge variant="secondary" className="text-xs">{a?.category ?? ''}</Badge>
                            <span className="text-xs text-muted-foreground ml-auto">{a?.id ?? ''}</span>
                          </div>
                          <h4 className="text-sm font-semibold mb-1">{a?.title ?? ''}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{a?.description ?? ''}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                            <div className="text-xs"><span className="text-muted-foreground">Metric:</span> <span className="font-medium">{a?.metric_affected ?? ''}</span></div>
                            <div className="text-xs"><span className="text-muted-foreground">Expected:</span> <span className="font-medium">{a?.expected_value ?? ''}</span></div>
                            <div className="text-xs"><span className="text-muted-foreground">Actual:</span> <span className="font-medium text-red-400">{a?.actual_value ?? ''}</span></div>
                            <div className="text-xs"><span className="text-muted-foreground">Deviation:</span> <span className="font-medium text-amber-400">{a?.deviation_pct ?? ''}</span></div>
                          </div>
                          <div className="text-xs text-primary flex items-start gap-1 bg-primary/5 p-2 rounded">
                            <FiChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" /> {a?.recommended_action ?? ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Trend Alerts */}
              {Array.isArray(anomaly?.trend_alerts) && anomaly.trend_alerts.length > 0 && (
                <Card className="bg-card/80 border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><FiTrendingDown className="w-4 h-4 text-amber-400" /> Trend Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {anomaly.trend_alerts.map((ta, i) => (
                        <div key={i} className="p-3 bg-muted/10 rounded-lg flex items-start gap-3">
                          {(ta?.direction ?? '').toLowerCase().includes('declin') || (ta?.direction ?? '').toLowerCase().includes('down') || (ta?.direction ?? '').toLowerCase().includes('decreas') ? (
                            <FiTrendingDown className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <FiTrendingUp className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{ta?.metric ?? ''}</span>
                              <Badge className={`text-xs ${getSeverityColor(ta?.concern_level)}`}>{ta?.concern_level ?? ''}</Badge>
                              <span className="text-xs text-muted-foreground">{ta?.duration ?? ''}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{ta?.description ?? ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Data Quality Issues */}
              {Array.isArray(anomaly?.data_quality_issues) && anomaly.data_quality_issues.length > 0 && (
                <Card className="bg-card/60 border-border/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground flex items-center gap-2"><FiInfo className="w-3 h-3" /> Data Quality Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {anomaly.data_quality_issues.map((dq, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs p-2 bg-muted/10 rounded">
                          <FiAlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium">{dq?.issue_type ?? ''}:</span> {dq?.description ?? ''} <span className="text-muted-foreground">({dq?.affected_records ?? '0'} records)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ============================================================
// AskWissIQTab
// ============================================================
function AskWissIQTab({
  chatMessages, setChatMessages, chatLoading, setChatLoading,
  activeAgentId, setActiveAgentId
}: {
  chatMessages: ChatMessage[]; setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  chatLoading: boolean; setChatLoading: (v: boolean) => void
  activeAgentId: string | null; setActiveAgentId: (id: string | null) => void
}) {
  const [chatInput, setChatInput] = useState('')
  const [chatError, setChatError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleSend = useCallback(async () => {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput('')
    setChatError('')
    setChatMessages((prev) => [...prev, { role: 'user', content: msg }])
    setChatLoading(true)
    setActiveAgentId(ASK_WISSIQ_ID)

    try {
      const result = await callAIAgent(msg, ASK_WISSIQ_ID)
      if (result?.success) {
        const data = extractAgentData(result)
        setChatMessages((prev) => [...prev, {
          role: 'assistant',
          content: data?.answer ?? data?.text ?? data?.message ?? 'Analysis complete.',
          data: data ?? undefined,
        }])
      } else {
        setChatError(result?.error ?? 'Failed to get response.')
        setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I was unable to process your question. Please try again.' }])
      }
    } catch (err: any) {
      setChatError(err?.message ?? 'Network error')
    } finally {
      setChatLoading(false)
      setActiveAgentId(null)
    }
  }, [chatInput, chatLoading, setChatMessages, setChatLoading, setActiveAgentId])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setChatInput(suggestion)
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {chatMessages.length === 0 && !chatLoading && (
          <div className="flex flex-col items-center justify-center h-full">
            <FiMessageSquare className="w-16 h-16 text-muted-foreground/20 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Ask WissIQ</h3>
            <p className="text-sm text-muted-foreground/60 text-center max-w-md mb-6">Ask any question about your financial data. WissIQ will analyze the uploaded documents and provide insights with supporting data points.</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {['What is our current cash runway?', 'Summarize our P&L performance', 'What are the biggest expense categories?', 'How does our gross margin compare to industry?'].map((q, i) => (
                <button key={i} onClick={() => handleSuggestionClick(q)} className="text-xs px-3 py-2 bg-muted/30 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-border/30">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3' : 'space-y-3 w-full'}`}>
              {msg.role === 'user' ? (
                <p className="text-sm">{msg.content}</p>
              ) : (
                <Card className="bg-card/80 border-border/50">
                  <CardContent className="p-4 space-y-3">
                    {/* Answer */}
                    <div>{renderMarkdown(msg?.data?.answer ?? msg.content ?? '')}</div>

                    {/* Data Points */}
                    {Array.isArray(msg?.data?.data_points) && msg.data.data_points.length > 0 && (
                      <div className="bg-muted/20 rounded-lg p-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Supporting Data</p>
                        <div className="space-y-2">
                          {msg.data.data_points.map((dp, j) => (
                            <div key={j} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{dp?.metric ?? ''}</span>
                              <div className="text-right">
                                <span className="font-medium">{dp?.value ?? ''}</span>
                                {dp?.context && <p className="text-xs text-muted-foreground">{dp.context}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Implications */}
                    {msg?.data?.implications && (
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                        <p className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-1">Implications</p>
                        <p className="text-sm text-foreground/80">{msg.data.implications}</p>
                      </div>
                    )}

                    {/* Confidence & Source */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {msg?.data?.confidence && (
                        <Badge variant="secondary" className="text-xs">Confidence: {msg.data.confidence}</Badge>
                      )}
                      {msg?.data?.data_source && (
                        <span className="flex items-center gap-1"><FiDatabase className="w-3 h-3" /> {msg.data.data_source}</span>
                      )}
                    </div>

                    {/* Follow-up Suggestions */}
                    {Array.isArray(msg?.data?.follow_up_suggestions) && msg.data.follow_up_suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.data.follow_up_suggestions.map((s, j) => (
                          <button key={j} onClick={() => handleSuggestionClick(s ?? '')} className="text-xs px-3 py-1.5 bg-primary/10 rounded-full text-primary hover:bg-primary/20 transition-all border border-primary/20">
                            {s ?? ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ))}

        {chatLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 p-4 bg-card/80 rounded-lg border border-border/30">
              <FiLoader className="w-4 h-4 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">WissIQ is analyzing...</span>
            </div>
          </div>
        )}
      </div>

      {chatError && (
        <div className="mb-2 p-2 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20">{chatError}</div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Ask a question about your financial data..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          className="bg-muted/30 border-border/50"
          disabled={chatLoading}
        />
        <Button onClick={handleSend} disabled={!chatInput.trim() || chatLoading} className="bg-primary hover:bg-primary/90 px-4">
          {chatLoading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// BoardReportTab
// ============================================================
function BoardReportTab({
  boardReport, boardFiles, boardLoading, boardError,
  onGenerate
}: {
  boardReport: BoardReportData | null
  boardFiles: Array<{ file_url?: string; name?: string; format_type?: string }>
  boardLoading: boolean; boardError: string
  onGenerate: () => void
}) {
  if (!boardReport && !boardLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FiFileText className="w-16 h-16 text-muted-foreground/20 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Board Report Generator</h3>
        <p className="text-sm text-muted-foreground/60 text-center max-w-md mb-6">Generate a comprehensive board-ready financial report with executive summary, detailed analysis sections, and downloadable PDF.</p>
        <Button onClick={onGenerate} className="bg-primary hover:bg-primary/90" disabled={boardLoading}>
          <FiFileText className="w-4 h-4 mr-2" /> Generate Board Report
        </Button>
        {boardError && (
          <div className="mt-4 p-3 rounded-lg text-sm bg-red-500/10 text-red-400 border border-red-500/20 max-w-md">{boardError}</div>
        )}
      </div>
    )
  }

  if (boardLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FiLoader className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Generating board report... This may take a moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{boardReport?.report_title ?? 'Board Report'}</h2>
          <p className="text-sm text-muted-foreground">{boardReport?.generated_date ?? ''}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onGenerate} variant="secondary" size="sm" disabled={boardLoading}>
            <FiRefreshCw className="w-4 h-4 mr-1" /> Regenerate
          </Button>
          {Array.isArray(boardFiles) && boardFiles.length > 0 && boardFiles.map((f, i) => (
            <a key={i} href={f?.file_url ?? '#'} target="_blank" rel="noopener noreferrer" download>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <FiDownload className="w-4 h-4 mr-1" /> Download PDF
              </Button>
            </a>
          ))}
        </div>
      </div>

      {boardError && (
        <div className="p-3 rounded-lg text-sm bg-red-500/10 text-red-400 border border-red-500/20">{boardError}</div>
      )}

      {/* Executive Summary */}
      {boardReport?.executive_summary && (
        <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><FiFileText className="w-4 h-4 text-primary" /> Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>{renderMarkdown(boardReport.executive_summary)}</CardContent>
        </Card>
      )}

      {/* Report Sections */}
      {Array.isArray(boardReport?.sections) && boardReport.sections.map((section, i) => (
        <Card key={i} className="bg-card/80 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{section?.title ?? `Section ${i + 1}`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderMarkdown(section?.content ?? '')}
            {Array.isArray(section?.key_metrics) && section.key_metrics.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30">
                    <TableHead className="text-xs">Metric</TableHead>
                    <TableHead className="text-xs text-right">Value</TableHead>
                    <TableHead className="text-xs text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.key_metrics.map((m, j) => (
                    <TableRow key={j} className="border-border/20">
                      <TableCell className="text-sm">{m?.label ?? ''}</TableCell>
                      <TableCell className="text-sm text-right font-medium">{m?.value ?? ''}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`text-xs ${getStatusBadgeColor(m?.status)}`}>{m?.status ?? ''}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Board Questions */}
      {Array.isArray(boardReport?.board_questions) && boardReport.board_questions.length > 0 && (
        <Card className="bg-card/80 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><FiMessageSquare className="w-4 h-4 text-primary" /> Anticipated Board Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {boardReport.board_questions.map((q, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-primary font-bold text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                  <span>{q ?? ''}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {Array.isArray(boardReport?.next_steps) && boardReport.next_steps.length > 0 && (
        <Card className="bg-card/80 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><FiArrowRight className="w-4 h-4 text-primary" /> Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/30">
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs">Owner</TableHead>
                  <TableHead className="text-xs">Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boardReport.next_steps.map((ns, i) => (
                  <TableRow key={i} className="border-border/20">
                    <TableCell className="text-sm">{ns?.action ?? ''}</TableCell>
                    <TableCell className="text-sm">{ns?.owner ?? ''}</TableCell>
                    <TableCell className="text-sm">{ns?.deadline ?? ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Overall Assessment */}
      {boardReport?.overall_assessment && (
        <Card className="bg-card/60 border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><FiTarget className="w-4 h-4 text-primary" /> Overall Assessment</CardTitle>
          </CardHeader>
          <CardContent>{renderMarkdown(boardReport.overall_assessment)}</CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// Main Page Component
// ============================================================
export default function Page() {
  // Tab state
  const [activeTab, setActiveTab] = useState('upload')

  // Sample data toggle
  const [showSample, setShowSample] = useState(false)

  // File upload state
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [assetIds, setAssetIds] = useState<string[]>([])

  // KB upload state
  const [kbFile, setKbFile] = useState<File | null>(null)
  const [kbUploading, setKbUploading] = useState(false)
  const [kbStatus, setKbStatus] = useState('')

  // Agent active state
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [agentsLoading, setAgentsLoading] = useState<Set<string>>(new Set())

  // Dashboard data
  const [coordinatorData, setCoordinatorData] = useState<CoordinatorData | null>(null)
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null)
  const [cashflowData, setCashflowData] = useState<CashFlowData | null>(null)
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [anomalyData, setAnomalyData] = useState<AnomalyData | null>(null)

  // Loading states per agent
  const [loadingCoordinator, setLoadingCoordinator] = useState(false)
  const [loadingSnapshot, setLoadingSnapshot] = useState(false)
  const [loadingCashflow, setLoadingCashflow] = useState(false)
  const [loadingKpi, setLoadingKpi] = useState(false)
  const [loadingAnomaly, setLoadingAnomaly] = useState(false)

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)

  // Board Report state
  const [boardReport, setBoardReport] = useState<BoardReportData | null>(null)
  const [boardFiles, setBoardFiles] = useState<Array<{ file_url?: string; name?: string; format_type?: string }>>([])
  const [boardLoading, setBoardLoading] = useState(false)
  const [boardError, setBoardError] = useState('')

  // Apply sample data
  useEffect(() => {
    if (showSample) {
      setCoordinatorData(SAMPLE_COORDINATOR)
      setSnapshotData(SAMPLE_SNAPSHOT)
      setCashflowData(SAMPLE_CASHFLOW)
      setKpiData(SAMPLE_KPI)
      setAnomalyData(SAMPLE_ANOMALY)
    } else {
      // Only clear if no real data has been loaded
      if (!assetIds.length) {
        setCoordinatorData(null)
        setSnapshotData(null)
        setCashflowData(null)
        setKpiData(null)
        setAnomalyData(null)
      }
    }
  }, [showSample, assetIds.length])

  // Helper to add/remove agent from loading set
  const markAgentLoading = useCallback((agentId: string, loading: boolean) => {
    setAgentsLoading((prev) => {
      const next = new Set(prev)
      if (loading) next.add(agentId)
      else next.delete(agentId)
      return next
    })
  }, [])

  // CSV Upload & Analysis
  const handleAnalyze = useCallback(async () => {
    if (!csvFile) return
    setUploadStatus('')
    setUploading(true)

    try {
      // 1. Upload file
      const uploadResult = await uploadFiles(csvFile)
      if (!uploadResult?.success) {
        setUploadStatus('Error: ' + (uploadResult?.error ?? 'Upload failed'))
        setUploading(false)
        return
      }

      const ids = Array.isArray(uploadResult?.asset_ids) ? uploadResult.asset_ids : []
      setAssetIds(ids)
      setUploadStatus('File uploaded successfully. Starting analysis...')
      setUploading(false)
      setAnalyzing(true)

      // 2. Switch to Dashboard
      setActiveTab('dashboard')

      // 3. Call all agents in parallel
      const message = `Analyze the uploaded financial CSV data comprehensively. Provide detailed structured analysis.`
      const options = ids.length > 0 ? { assets: ids } : undefined

      // Coordinator
      setLoadingCoordinator(true)
      markAgentLoading(FINANCIAL_COORDINATOR_ID, true)
      callAIAgent(message, FINANCIAL_COORDINATOR_ID, options).then((res) => {
        const data = extractAgentData(res)
        if (data) setCoordinatorData(data)
        setLoadingCoordinator(false)
        markAgentLoading(FINANCIAL_COORDINATOR_ID, false)
      }).catch(() => { setLoadingCoordinator(false); markAgentLoading(FINANCIAL_COORDINATOR_ID, false) })

      // Snapshot
      setLoadingSnapshot(true)
      markAgentLoading(FINANCIAL_SNAPSHOT_ID, true)
      callAIAgent(message, FINANCIAL_SNAPSHOT_ID, options).then((res) => {
        const data = extractAgentData(res)
        if (data) setSnapshotData(data)
        setLoadingSnapshot(false)
        markAgentLoading(FINANCIAL_SNAPSHOT_ID, false)
      }).catch(() => { setLoadingSnapshot(false); markAgentLoading(FINANCIAL_SNAPSHOT_ID, false) })

      // Cash Flow
      setLoadingCashflow(true)
      markAgentLoading(CASH_FLOW_FORECAST_ID, true)
      callAIAgent(message, CASH_FLOW_FORECAST_ID, options).then((res) => {
        const data = extractAgentData(res)
        if (data) setCashflowData(data)
        setLoadingCashflow(false)
        markAgentLoading(CASH_FLOW_FORECAST_ID, false)
      }).catch(() => { setLoadingCashflow(false); markAgentLoading(CASH_FLOW_FORECAST_ID, false) })

      // KPI
      setLoadingKpi(true)
      markAgentLoading(KPI_BENCHMARK_ID, true)
      callAIAgent(message, KPI_BENCHMARK_ID, options).then((res) => {
        const data = extractAgentData(res)
        if (data) setKpiData(data)
        setLoadingKpi(false)
        markAgentLoading(KPI_BENCHMARK_ID, false)
      }).catch(() => { setLoadingKpi(false); markAgentLoading(KPI_BENCHMARK_ID, false) })

      // Anomaly
      setLoadingAnomaly(true)
      markAgentLoading(ANOMALY_DETECTION_ID, true)
      callAIAgent(message, ANOMALY_DETECTION_ID, options).then((res) => {
        const data = extractAgentData(res)
        if (data) setAnomalyData(data)
        setLoadingAnomaly(false)
        markAgentLoading(ANOMALY_DETECTION_ID, false)
      }).catch(() => { setLoadingAnomaly(false); markAgentLoading(ANOMALY_DETECTION_ID, false) })

      // Mark analysis done after a short delay (agents run in parallel)
      setTimeout(() => setAnalyzing(false), 2000)
      setUploadStatus('Analysis initiated across all agents.')

    } catch (err: any) {
      setUploadStatus('Error: ' + (err?.message ?? 'An error occurred'))
      setUploading(false)
      setAnalyzing(false)
    }
  }, [csvFile, markAgentLoading])

  // KB Upload
  const handleKbUpload = useCallback(async () => {
    if (!kbFile) return
    setKbUploading(true)
    setKbStatus('')

    try {
      const result = await uploadAndTrainDocument(RAG_ID, kbFile)
      if (result?.success) {
        setKbStatus('Document uploaded and trained successfully.')
        setKbFile(null)
      } else {
        setKbStatus('Error: ' + (result?.error ?? 'Upload failed'))
      }
    } catch (err: any) {
      setKbStatus('Error: ' + (err?.message ?? 'Upload failed'))
    } finally {
      setKbUploading(false)
    }
  }, [kbFile])

  // Board Report Generation
  const handleGenerateBoardReport = useCallback(async () => {
    setBoardLoading(true)
    setBoardError('')
    setBoardReport(null)
    setBoardFiles([])
    setActiveAgentId(BOARD_REPORT_ID)
    markAgentLoading(BOARD_REPORT_ID, true)

    try {
      const prompt = 'Generate a comprehensive board-ready financial report based on the latest financial analysis data. Include executive summary, detailed sections with key metrics, anticipated board questions, and next steps.'
      const options = assetIds.length > 0 ? { assets: assetIds } : undefined
      const result = await callAIAgent(prompt, BOARD_REPORT_ID, options)

      if (result?.success) {
        const data = extractAgentData(result)
        if (data) setBoardReport(data)

        // Extract files from module_outputs
        const files = Array.isArray(result?.module_outputs?.artifact_files)
          ? result.module_outputs.artifact_files
          : []
        setBoardFiles(files)
      } else {
        setBoardError(result?.error ?? 'Failed to generate board report.')
      }
    } catch (err: any) {
      setBoardError(err?.message ?? 'An error occurred')
    } finally {
      setBoardLoading(false)
      setActiveAgentId(null)
      markAgentLoading(BOARD_REPORT_ID, false)
    }
  }, [assetIds, markAgentLoading])

  const tabs = [
    { id: 'upload', label: 'Data Upload', icon: <FiUpload className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <FiBarChart2 className="w-4 h-4" /> },
    { id: 'askwissiq', label: 'Ask WissIQ', icon: <FiMessageSquare className="w-4 h-4" /> },
    { id: 'boardreport', label: 'Board Report', icon: <FiFileText className="w-4 h-4" /> },
  ]

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FiBarChart2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">WissIQ</h1>
                <p className="text-xs text-muted-foreground -mt-0.5">Financial Intelligence Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Sample Data Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sample Data</span>
                <Switch checked={showSample} onCheckedChange={setShowSample} />
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="max-w-[1400px] mx-auto px-4">
            <div className="flex gap-1 -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/50'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1400px] mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Content Area */}
            <div className="flex-1 min-w-0">
              {activeTab === 'upload' && (
                <DataUploadTab
                  csvFile={csvFile} setCsvFile={setCsvFile}
                  onAnalyze={handleAnalyze} uploading={uploading} analyzing={analyzing} uploadStatus={uploadStatus}
                  kbFile={kbFile} setKbFile={setKbFile}
                  onKbUpload={handleKbUpload} kbUploading={kbUploading} kbStatus={kbStatus}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardTab
                  coordinator={coordinatorData} snapshot={snapshotData}
                  cashflow={cashflowData} kpi={kpiData} anomaly={anomalyData}
                  loadingCoordinator={loadingCoordinator} loadingSnapshot={loadingSnapshot}
                  loadingCashflow={loadingCashflow} loadingKpi={loadingKpi} loadingAnomaly={loadingAnomaly}
                />
              )}

              {activeTab === 'askwissiq' && (
                <AskWissIQTab
                  chatMessages={chatMessages} setChatMessages={setChatMessages}
                  chatLoading={chatLoading} setChatLoading={setChatLoading}
                  activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId}
                />
              )}

              {activeTab === 'boardreport' && (
                <BoardReportTab
                  boardReport={boardReport} boardFiles={boardFiles}
                  boardLoading={boardLoading} boardError={boardError}
                  onGenerate={handleGenerateBoardReport}
                />
              )}
            </div>

            {/* Sidebar - Agent Status */}
            <div className="hidden lg:block w-56 flex-shrink-0">
              <div className="sticky top-28">
                <AgentStatusPanel activeAgentId={activeAgentId} agentsLoading={agentsLoading} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}

'use client'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from 'recharts'

interface DataPoint { month: string; sessions: number; users: number }

const MONTH_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']

// "YYYYMM" → "mmm YY" (fr-CA)
function fmtMonth(ym: string): string {
  if (ym.length !== 6) return ym
  const year  = parseInt(ym.slice(0, 4), 10)
  const month = parseInt(ym.slice(4, 6), 10) - 1
  return `${MONTH_FR[month] ?? ''} ${String(year).slice(2)}`
}

export default function MonthlyChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="bg-white rounded-xl2 shadow-card p-5">
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-textMain">Visites mensuelles — 12 derniers mois</h2>
        <span className="text-[11px] text-gray-400">Sessions & utilisateurs</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#1A7A3C" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#1A7A3C" stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#2D9CDB" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#2D9CDB" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
          <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            labelFormatter={v => fmtMonth(String(v))}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone" dataKey="sessions"
            stroke="#1A7A3C" strokeWidth={2}
            fill="url(#sessionsFill)" name="Sessions"
          />
          <Area
            type="monotone" dataKey="users"
            stroke="#2D9CDB" strokeWidth={2}
            fill="url(#usersFill)" name="Utilisateurs"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

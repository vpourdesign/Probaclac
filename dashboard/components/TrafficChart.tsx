'use client'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from 'recharts'

interface DataPoint { date: string; sessions: number; users: number }

export default function TrafficChart({ data }: { data: DataPoint[] }) {
  const fmt = (d: string) => d.slice(5) // MM-DD

  return (
    <div className="bg-white rounded-xl2 shadow-card p-5">
      <h2 className="text-sm font-semibold text-textMain mb-4">Sessions & utilisateurs — 30 jours</h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
          <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 11 }} interval={4} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip labelFormatter={v => `Date : ${v}`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="sessions" stroke="#1A7A3C" strokeWidth={2} dot={false} name="Sessions" />
          <Line type="monotone" dataKey="users"    stroke="#2D9CDB" strokeWidth={2} dot={false} name="Utilisateurs" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

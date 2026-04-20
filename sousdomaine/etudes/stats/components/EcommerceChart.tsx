'use client'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from 'recharts'

interface DataPoint {
  date:           string
  add_to_cart:    number
  begin_checkout: number
  purchase:       number
}

export default function EcommerceChart({ data }: { data: DataPoint[] }) {
  const fmt = (d: string) => d.slice(5) // MM-DD

  // Masque la série "purchase" si zéro partout (tracking purchase pas encore branché)
  const hasPurchase = data.some(d => d.purchase > 0)

  return (
    <div className="bg-white rounded-xl2 shadow-card p-5">
      <h2 className="text-sm font-semibold text-textMain mb-4">Events ecommerce — 30 jours</h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
          <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 11 }} interval={4} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip labelFormatter={v => `Date : ${v}`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="add_to_cart"    stroke="#1A7A3C" strokeWidth={2} dot={false} name="Ajout panier" />
          <Line type="monotone" dataKey="begin_checkout" stroke="#2D9CDB" strokeWidth={2} dot={false} name="Passer caisse" />
          {hasPurchase && (
            <Line type="monotone" dataKey="purchase"     stroke="#E07B2F" strokeWidth={2} dot={false} name="Achat" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

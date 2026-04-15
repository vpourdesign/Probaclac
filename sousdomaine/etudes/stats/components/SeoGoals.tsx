interface Keyword {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export default function SeoGoals({ keywords }: { keywords: Keyword[] }) {
  return (
    <div className="bg-white rounded-xl2 shadow-card p-5 overflow-x-auto">
      <h2 className="text-sm font-semibold text-textMain mb-4">Top mots-clés — Search Console</h2>
      <table className="w-full text-xs text-left">
        <thead>
          <tr className="text-gray-400 border-b border-gray-100">
            <th className="pb-2 font-medium">Requête</th>
            <th className="pb-2 font-medium text-right">Clics</th>
            <th className="pb-2 font-medium text-right">Impressions</th>
            <th className="pb-2 font-medium text-right">CTR</th>
            <th className="pb-2 font-medium text-right">Position</th>
          </tr>
        </thead>
        <tbody>
          {keywords.map(k => (
            <tr key={k.query} className="border-b border-gray-50 hover:bg-[#F8F9FA] transition">
              <td className="py-1.5 pr-4 font-medium text-textMain">{k.query}</td>
              <td className="py-1.5 text-right text-accent font-semibold">{k.clicks}</td>
              <td className="py-1.5 text-right">{k.impressions.toLocaleString('fr-CA')}</td>
              <td className="py-1.5 text-right">{(k.ctr * 100).toFixed(1)} %</td>
              <td className="py-1.5 text-right">{k.position.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

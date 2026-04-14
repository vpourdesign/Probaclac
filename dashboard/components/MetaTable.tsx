import clsx from 'clsx'

interface Campaign {
  id: string
  name: string
  status: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  cpc: number
  roas: number
}

export default function MetaTable({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <div className="bg-white rounded-xl2 shadow-card p-5 overflow-x-auto">
      <h2 className="text-sm font-semibold text-textMain mb-4">Campagnes Meta Ads</h2>
      <table className="w-full text-xs text-left">
        <thead>
          <tr className="text-gray-400 border-b border-gray-100">
            <th className="pb-2 font-medium">Campagne</th>
            <th className="pb-2 font-medium text-center">Statut</th>
            <th className="pb-2 font-medium text-right">Dépenses</th>
            <th className="pb-2 font-medium text-right">Impressions</th>
            <th className="pb-2 font-medium text-right">Clics</th>
            <th className="pb-2 font-medium text-right">Conv.</th>
            <th className="pb-2 font-medium text-right">CPC</th>
            <th className="pb-2 font-medium text-right">ROAS</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map(c => (
            <tr key={c.id} className="border-b border-gray-50 hover:bg-[#F8F9FA] transition">
              <td className="py-2 pr-4 font-medium text-textMain max-w-[180px] truncate">{c.name}</td>
              <td className="py-2 text-center">
                <span className={clsx(
                  'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                  c.status === 'ACTIVE' ? 'bg-green-100 text-primary' : 'bg-gray-100 text-gray-500',
                )}>
                  {c.status === 'ACTIVE' ? 'Actif' : 'Pausé'}
                </span>
              </td>
              <td className="py-2 text-right">{c.spend.toFixed(2)} $</td>
              <td className="py-2 text-right">{c.impressions.toLocaleString('fr-CA')}</td>
              <td className="py-2 text-right">{c.clicks.toLocaleString('fr-CA')}</td>
              <td className="py-2 text-right text-accent font-semibold">{c.conversions}</td>
              <td className="py-2 text-right">{c.cpc.toFixed(2)} $</td>
              <td className={clsx('py-2 text-right font-semibold', c.roas >= 2 ? 'text-primary' : 'text-danger')}>
                {c.roas.toFixed(1)}×
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

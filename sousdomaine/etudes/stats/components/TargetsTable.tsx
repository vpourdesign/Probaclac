'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { INTENT_LABEL, INTENT_TONE } from '@/lib/seo-goals'
import type { SeoCompetitorRow, SeoTargetRow } from '@/lib/data'
import TargetQueryModal from './TargetQueryModal'

interface Props {
  rows:        SeoTargetRow[]
  competitors: SeoCompetitorRow[]
}

const fmt = (n: number) => n.toLocaleString('fr-CA')

function positionTone(pos: number | null): string {
  if (pos === null) return 'text-gray-300'
  if (pos <= 3)     return 'text-primary'
  if (pos <= 10)    return 'text-accent'
  if (pos <= 20)    return 'text-amber-500'
  return 'text-danger'
}

function positionLabel(pos: number | null): string {
  if (pos === null) return '—'
  return pos < 10 ? pos.toFixed(1) : pos.toFixed(0)
}

export default function TargetsTable({ rows, competitors }: Props) {
  const [selected, setSelected] = useState<SeoTargetRow | null>(null)

  return (
    <div className="bg-white rounded-xl2 shadow-card p-5">
      <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-textMain">Requêtes cibles — position moyenne 30j</h3>
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">
          Cliquer une requête pour voir les marques devant nous
        </span>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100 text-left">
              <th className="pb-2 font-medium">Requête</th>
              <th className="pb-2 font-medium">Intent</th>
              <th className="pb-2 font-medium text-right">Impr.</th>
              <th className="pb-2 font-medium text-right">Clics</th>
              <th className="pb-2 font-medium text-right">CTR</th>
              <th className="pb-2 font-medium text-right">Position</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr
                key={r.query}
                onClick={() => setSelected(r)}
                className="border-b border-gray-50 hover:bg-primary/[0.04] transition cursor-pointer group"
              >
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      'w-1 h-4 rounded-full flex-shrink-0',
                      r.priority === 1 ? 'bg-primary' : r.priority === 2 ? 'bg-accent' : 'bg-gray-300',
                    )} />
                    <span className="font-medium text-textMain truncate max-w-[220px] group-hover:text-primary transition">{r.query}</span>
                    <span className="text-[10px] text-gray-300 group-hover:text-primary transition opacity-0 group-hover:opacity-100">→</span>
                  </div>
                  {r.topPage && (
                    <span className="text-[10px] text-gray-400 ml-3 truncate max-w-[260px] block">
                      {r.topPage.replace(/^https?:\/\//, '')}
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3">
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-semibold', INTENT_TONE[r.intent])}>
                    {INTENT_LABEL[r.intent]}
                  </span>
                </td>
                <td className="py-2 text-right tabular-nums text-gray-500">{fmt(r.impressions)}</td>
                <td className="py-2 text-right tabular-nums text-accent font-semibold">{fmt(r.clicks)}</td>
                <td className="py-2 text-right tabular-nums text-gray-500">
                  {r.impressions > 0 ? `${(r.ctr * 100).toFixed(1)} %` : '—'}
                </td>
                <td className={clsx('py-2 text-right tabular-nums font-bold', positionTone(r.position))}>
                  {positionLabel(r.position)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-4 flex-wrap text-[10px] text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-1 h-3 bg-primary rounded-full" />Pilier (priorité 1)</span>
        <span className="flex items-center gap-1.5"><span className="w-1 h-3 bg-accent rounded-full" />Important (priorité 2)</span>
        <span className="flex items-center gap-1.5"><span className="w-1 h-3 bg-gray-300 rounded-full" />Nice-to-have (priorité 3)</span>
      </div>

      {selected && (
        <TargetQueryModal
          target={selected}
          competitors={competitors}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

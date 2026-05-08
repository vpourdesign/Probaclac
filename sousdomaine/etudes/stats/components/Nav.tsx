import Link from 'next/link'
import clsx from 'clsx'

interface NavProps {
  current: 'global' | 'sci' | 'ugc'
}

const tabs = [
  { id: 'global', label: 'Tout le site',  href: '/' },
  { id: 'sci',    label: 'Page /sci',     href: '/sci' },
  { id: 'ugc',    label: 'UGC',           href: '/ugc' },
] as const

export default function Nav({ current }: NavProps) {
  return (
    <nav className="flex gap-1 border-b border-gray-200 -mx-1">
      {tabs.map(t => (
        <Link
          key={t.id}
          href={t.href}
          className={clsx(
            'px-4 py-2 text-sm font-medium rounded-t-lg transition',
            current === t.id
              ? 'bg-white text-primary border-b-2 border-primary -mb-px'
              : 'text-gray-500 hover:text-textMain hover:bg-white/50',
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}

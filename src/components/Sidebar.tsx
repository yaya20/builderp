'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, LayoutDashboard, HardHat } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/employees', label: 'עובדים', icon: Users },
  // מודולים עתידיים
  // { href: '/projects', label: 'פרויקטים', icon: FolderOpen },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-52 bg-slate-900 text-white flex flex-col flex-shrink-0 h-full">
      <div className="px-4 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <HardHat className="w-6 h-6 text-amber-400" />
          <div>
            <div className="font-bold text-sm leading-tight">BuildERP</div>
            <div className="text-xs text-slate-400 leading-tight">אליהו גול בנייה</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-700 text-xs text-slate-500">
        גרסה 1.0
      </div>
    </aside>
  )
}

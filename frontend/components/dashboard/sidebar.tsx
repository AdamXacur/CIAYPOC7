"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { 
  LayoutDashboard, 
  FileText, 
  Building2, 
  Megaphone, 
  BarChart3, 
  LogOut, 
  Server,
  Database,
  Bot,
  Users
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

const sidebarItems = [
  {
    title: "Vista General",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ['superadmin', 'official']
  },
  {
    title: "Mesa de Ayuda IA",
    href: "/dashboard/assistant",
    icon: Bot,
    roles: ['superadmin', 'official']
  },
  {
    title: "Bandeja de Solicitudes",
    href: "/dashboard/requests",
    icon: FileText,
    roles: ['superadmin', 'official']
  },
  {
    title: "Gestión de Dependencias",
    href: "/dashboard/dependencies",
    icon: Building2,
    roles: ['superadmin']
  },
  {
    title: "Usuarios y Accesos",
    href: "/dashboard/users",
    icon: Users,
    roles: ['superadmin']
  },
  {
    title: "Acciones de Gobierno",
    href: "/dashboard/gov-actions",
    icon: Megaphone,
    roles: ['superadmin']
  },
  {
    title: "Reportes y Exportación",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ['superadmin', 'official']
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <div className="flex h-full flex-col bg-white shadow-xl border-r border-ciay-gold/30">
      <div className="p-6 border-b border-ciay-gold/20 bg-ciay-cream/30">
         <Logo className="h-14 w-auto" />
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-ciay-gold uppercase mb-2 tracking-wider">Operación</p>
          {sidebarItems.map((item, index) => {
            if (user && !item.roles.includes(user.role)) return null
            
            const isActive = pathname === item.href
            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-ciay-brown text-white shadow-md" 
                    : "text-ciay-slate hover:bg-ciay-cream hover:text-ciay-brown"
                )}
              >
                <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-ciay-gold" : "text-ciay-silver group-hover:text-ciay-brown")} />
                {item.title}
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 px-3">
             <p className="px-3 text-[10px] font-bold text-ciay-gold uppercase mb-2 tracking-wider">Sistema</p>
             <div className="px-3 py-2 text-xs text-ciay-slate flex items-center gap-2"><Server className="w-4 h-4 text-green-600" /> API Backend (Online)</div>
             <div className="px-3 py-2 text-xs text-ciay-slate flex items-center gap-2"><Database className="w-4 h-4 text-green-600" /> Postgres DB (Stable)</div>
        </div>
      </div>

      <div className="p-4 border-t border-ciay-gold/20 bg-ciay-cream/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-8 w-8 rounded-full bg-ciay-brown text-ciay-gold flex items-center justify-center font-bold text-xs border border-ciay-gold">
            {user?.email?.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-ciay-brown truncate">{user?.role === 'superadmin' ? 'Administrador' : 'Funcionario'}</span>
            <span className="text-[10px] text-ciay-slate truncate w-32">{user?.email}</span>
          </div>
        </div>
        <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-ciay-brown hover:bg-ciay-brown hover:text-white transition-colors" 
            onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}
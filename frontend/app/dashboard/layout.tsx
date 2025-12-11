import { Sidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr] bg-ciay-cream">
      <div className="hidden lg:block h-screen sticky top-0">
        <Sidebar />
      </div>
      <div className="flex flex-col h-screen overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-ciay-brown/10 bg-white px-8 shadow-sm flex-shrink-0">
          <div className="w-full flex-1">
            <h2 className="text-lg font-bold text-ciay-brown uppercase tracking-wide">Panel de Control</h2>
          </div>
          <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> SISTEMA OPERATIVO
                </span>
            </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-ciay-cream/50">
          {children}
        </main>
      </div>
    </div>
  )
}
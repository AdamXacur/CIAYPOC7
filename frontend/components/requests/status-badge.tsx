import { cn } from "@/lib/utils"

const statusStyles = {
  "Recibida": "bg-gray-100 text-gray-700 border-gray-200",
  "En revisión": "bg-blue-50 text-blue-700 border-blue-200",
  "Atendida": "bg-green-50 text-green-700 border-green-200",
  "Rechazada": "bg-red-50 text-red-700 border-red-200",
}

const urgencyStyles = {
  "Baja": "bg-slate-100 text-slate-600",
  "Media": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Alta": "bg-orange-50 text-orange-700 border-orange-200",
  "Crítica": "bg-red-50 text-red-700 border-red-200 animate-pulse",
}

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status as keyof typeof statusStyles] || "bg-gray-100 text-gray-700"
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", style)}>
      {status}
    </span>
  )
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const style = urgencyStyles[urgency as keyof typeof urgencyStyles] || "bg-slate-100"
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border", style)}>
      {urgency}
    </span>
  )
}
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Clock } from "lucide-react"

interface TimelineItem {
  title: string
  date?: string
  status: 'completed' | 'current' | 'upcoming'
  description?: string
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
      {items.map((item, index) => (
        <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          
          {/* Icono Central */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
            {item.status === 'completed' ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : item.status === 'current' ? (
              <Clock className="w-6 h-6 text-ciay-gold animate-pulse" />
            ) : (
              <Circle className="w-6 h-6 text-slate-300" />
            )}
          </div>
          
          {/* Contenido */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between space-x-2 mb-1">
              <div className="font-bold text-ciay-brown">{item.title}</div>
              <time className="font-mono text-xs text-slate-500">{item.date}</time>
            </div>
            <div className="text-slate-500 text-sm">
              {item.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
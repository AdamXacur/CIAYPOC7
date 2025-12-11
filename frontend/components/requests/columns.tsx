"use client"

import { ColumnDef } from "@tanstack/react-table"
import { StatusBadge, UrgencyBadge } from "./status-badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Eye, FileText, Siren } from "lucide-react"
import { RequestType } from "@/types"

export type Request = {
  id: string
  folio: string
  created_at: string
  description: string
  topic: string
  urgency: string
  status: string
  location_text: string
  request_type?: RequestType
}

export const columns: ColumnDef<Request>[] = [
  {
    accessorKey: "folio",
    header: "Folio",
    cell: ({ row }) => (
        <div className="flex flex-col">
            <span className="font-mono font-bold text-ciay-brown">{row.getValue("folio")}</span>
            {row.original.request_type === 'OPERATIVA' && (
                <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 px-1 rounded w-fit mt-1">
                    <Siren className="w-3 h-3" /> OPERATIVA
                </span>
            )}
            {row.original.request_type === 'ADMINISTRATIVA' && (
                <span className="flex items-center gap-1 text-[10px] text-blue-600 font-bold bg-blue-50 px-1 rounded w-fit mt-1">
                    <FileText className="w-3 h-3" /> ADMIN
                </span>
            )}
        </div>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Fecha",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return <div className="text-xs text-ciay-slate">{format(date, "dd MMM yyyy", { locale: es })}</div>
    },
  },
  {
    accessorKey: "topic",
    header: "Tema",
    cell: ({ row }) => <div className="font-medium text-ciay-brown text-sm">{row.getValue("topic")}</div>,
  },
  {
    accessorKey: "urgency",
    header: "Prioridad",
    cell: ({ row }) => <UrgencyBadge urgency={row.getValue("urgency")} />,
  },
  {
    accessorKey: "status",
    header: "Estatus",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      // @ts-ignore
      const onView = table.options.meta?.onViewAction
      
      return (
        <div className="text-right">
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-400 hover:text-ciay-brown hover:bg-ciay-cream"
                onClick={() => onView && onView(row.original)}
                title="Ver Detalle"
            >
                <Eye className="h-4 w-4" />
            </Button>
        </div>
      )
    },
  },
]
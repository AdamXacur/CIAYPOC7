"use client"

import { Table } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onFilterChange: (key: string, value: string) => void
}

export function DataTableToolbar<TData>({ table, onFilterChange }: DataTableToolbarProps<TData>) {
  
  const handleReset = () => {
      onFilterChange('status', 'all')
      onFilterChange('topic', 'all')
      onFilterChange('urgency', 'all')
      onFilterChange('sentiment', 'all')
      onFilterChange('search', '')
      // Recargar página o resetear estados locales si fuera necesario, 
      // pero con el hook useRequests debería bastar con limpiar los filtros.
      window.location.reload() // Hack rápido para limpiar visualmente los Selects no controlados
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-ciay-cream/30 rounded-t-lg border-b border-ciay-gold/10">
      
      {/* Fila 1: Búsqueda */}
      <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por folio, descripción..."
            onChange={(event) => onFilterChange('search', event.target.value)}
            className="max-w-sm bg-white"
          />
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-gray-500 hover:text-red-500">
              <X className="h-4 w-4 mr-2" /> Limpiar
          </Button>
      </div>

      {/* Fila 2: Filtros Avanzados */}
      <div className="flex flex-wrap items-center gap-2">
        
        {/* ESTATUS */}
        <Select onValueChange={(value) => onFilterChange('status', value)}>
            <SelectTrigger className="w-[160px] bg-white h-8 text-xs">
                <SelectValue placeholder="Estatus" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Recibida">Recibida</SelectItem>
                <SelectItem value="En revisión">En revisión</SelectItem>
                <SelectItem value="Atendida">Atendida</SelectItem>
                <SelectItem value="Rechazada">Rechazada</SelectItem>
            </SelectContent>
        </Select>

        {/* PRIORIDAD (URGENCIA) */}
        <Select onValueChange={(value) => onFilterChange('urgency', value)}>
            <SelectTrigger className="w-[160px] bg-white h-8 text-xs border-l-4 border-l-orange-400">
                <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Baja">Baja</SelectItem>
                <SelectItem value="Media">Media</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Crítica">Crítica</SelectItem>
            </SelectContent>
        </Select>

        {/* TEMA */}
        <Select onValueChange={(value) => onFilterChange('topic', value)}>
            <SelectTrigger className="w-[160px] bg-white h-8 text-xs">
                <SelectValue placeholder="Tema" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Seguridad">Seguridad</SelectItem>
                <SelectItem value="Salud">Salud</SelectItem>
                <SelectItem value="Transporte">Transporte</SelectItem>
                <SelectItem value="Servicios Públicos">Servicios Públicos</SelectItem>
                <SelectItem value="Educación">Educación</SelectItem>
                <SelectItem value="Otros">Otros</SelectItem>
            </SelectContent>
        </Select>

        {/* SENTIMIENTO */}
        <Select onValueChange={(value) => onFilterChange('sentiment', value)}>
            <SelectTrigger className="w-[160px] bg-white h-8 text-xs border-l-4 border-l-blue-400">
                <SelectValue placeholder="Sentimiento" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Positivo">Positivo 😀</SelectItem>
                <SelectItem value="Neutro">Neutro 😐</SelectItem>
                <SelectItem value="Negativo">Negativo 😠</SelectItem>
            </SelectContent>
        </Select>

      </div>
    </div>
  )
}
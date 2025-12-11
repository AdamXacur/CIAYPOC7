"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { StatusBadge, UrgencyBadge } from "./status-badge"
import { Request } from "./columns"
import { useUpdateRequestStatus } from "@/hooks/use-requests"
import { Loader2, CheckCircle, MapPin, BrainCircuit, Clock, FileText, Building2, Calendar } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Textarea } from "@/components/ui/textarea"

interface RequestDialogProps {
  request: any // Usamos any para acceder a todas las propiedades extendidas
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequestDialog({ request, open, onOpenChange }: RequestDialogProps) {
  const [response, setResponse] = useState("")
  const updateStatusMutation = useUpdateRequestStatus()
  const [activeTab, setActiveTab] = useState<'details' | 'process'>('details')

  if (!request) return null

  const handleResolve = () => {
    updateStatusMutation.mutate(
      { 
        id: request.id, 
        data: {
          status: "Atendida",
          official_response: response || "Solicitud atendida satisfactoriamente."
        }
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          setResponse("")
        }
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto border-t-4 border-ciay-brown p-0 gap-0">
        
        {/* HEADER */}
        <div className="p-6 bg-ciay-cream/30 border-b border-gray-100">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <DialogTitle className="text-xl font-serif font-bold text-ciay-brown flex items-center gap-2">
                        <FileText className="w-5 h-5" /> Detalle de Solicitud
                    </DialogTitle>
                    <DialogDescription className="font-mono text-ciay-gold font-bold mt-1 text-lg">
                        {request.folio}
                    </DialogDescription>
                </div>
                <StatusBadge status={request.status} />
            </div>
            
            <div className="flex gap-2 mt-4">
                <button 
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'details' ? 'bg-white shadow text-ciay-brown' : 'text-gray-500 hover:bg-white/50'}`}
                >
                    Información General
                </button>
                <button 
                    onClick={() => setActiveTab('process')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'process' ? 'bg-white shadow text-ciay-brown' : 'text-gray-500 hover:bg-white/50'}`}
                >
                    Proceso y Línea de Tiempo
                </button>
            </div>
        </div>
        
        {/* BODY */}
        <div className="p-6">
            {activeTab === 'details' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-2">
                    {/* Descripción */}
                    <div>
                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Descripción del Ciudadano</Label>
                        <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 text-sm leading-relaxed">
                            {request.description}
                        </div>
                    </div>

                    {/* Datos Clave */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-400 uppercase">Ubicación</Label>
                            <div className="flex items-center gap-2 text-sm text-gray-800">
                                <MapPin className="w-4 h-4 text-ciay-gold" />
                                {request.location_text || "No especificada"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-400 uppercase">Fecha de Recepción</Label>
                            <div className="flex items-center gap-2 text-sm text-gray-800">
                                <Calendar className="w-4 h-4 text-ciay-gold" />
                                {format(new Date(request.created_at), "dd 'de' MMMM, yyyy", { locale: es })}
                            </div>
                        </div>
                    </div>

                    {/* Clasificación IA */}
                    <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-lg">
                        <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
                            <BrainCircuit className="w-4 h-4" /> Análisis Inteligente
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <span className="text-xs text-blue-600 block">Tema Detectado</span>
                                <span className="font-medium text-sm">{request.topic}</span>
                            </div>
                            <div>
                                <span className="text-xs text-blue-600 block">Sentimiento</span>
                                <span className="font-medium text-sm">{request.sentiment}</span>
                            </div>
                            <div>
                                <span className="text-xs text-blue-600 block">Prioridad</span>
                                <UrgencyBadge urgency={request.urgency} />
                            </div>
                        </div>
                    </div>

                    {/* Asignación */}
                    <div>
                        <Label className="text-xs font-bold text-gray-400 uppercase">Asignación Administrativa</Label>
                        <div className="mt-1 flex items-center gap-2 p-2 border rounded bg-white">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">
                                {request.department_name || request.dependency_name || "Pendiente de asignación"}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'process' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                    {/* Timeline */}
                    <div className="relative pl-4 border-l-2 border-gray-200 space-y-6">
                        {request.timeline?.map((event: any, idx: number) => (
                            <div key={idx} className="relative pl-4">
                                <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full bg-white border-2 border-ciay-gold"></div>
                                <p className="text-sm font-bold text-gray-800">
                                    {event.action === 'created' ? 'Solicitud Recibida' : 
                                     event.action === 'imported' ? 'Importación Histórica' :
                                     event.action === 'status_change' ? `Cambio a: ${event.new_status}` : event.action}
                                </p>
                                <p className="text-xs text-gray-500 mb-1">
                                    {format(new Date(event.timestamp), "dd MMM yyyy, HH:mm", { locale: es })}
                                </p>
                                {event.note && <p className="text-xs bg-gray-100 p-2 rounded text-gray-600 mt-1">{event.note}</p>}
                            </div>
                        ))}
                    </div>

                    {/* Respuesta Oficial */}
                    {request.status === 'Atendida' ? (
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-bold text-green-800 flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5" /> Respuesta Oficial
                            </h4>
                            <p className="text-green-900 text-sm whitespace-pre-wrap">{request.official_response}</p>
                        </div>
                    ) : (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <Label className="mb-2 block">Redactar Respuesta Oficial</Label>
                            <Textarea 
                                placeholder="Escriba la resolución del caso para notificar al ciudadano..."
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100">
          {request.status !== 'Atendida' && activeTab === 'process' ? (
              <Button onClick={handleResolve} disabled={updateStatusMutation.isPending || !response} className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
                {updateStatusMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Finalizar y Notificar
              </Button>
          ) : (
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
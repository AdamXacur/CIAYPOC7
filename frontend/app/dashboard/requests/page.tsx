"use client"

import { useState, useRef, useEffect } from "react"
import { useRequests } from "@/hooks/use-requests"
import { Request, columns } from "@/components/requests/columns"
import { DataTable } from "@/components/requests/data-table"
import { RequestDialog } from "@/components/requests/request-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, Upload, FileSpreadsheet, Shield, HeartPulse, Bus, Lightbulb, GraduationCap, HelpCircle, Play, BrainCircuit, CheckCircle2, FileText } from "lucide-react"
import { requestService, aiService } from "@/lib/api"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"

export default function RequestsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [filters, setFilters] = useState({})
  
  // --- POLLING DE PROGRESO IA ---
  const { data: aiProgress } = useQuery({
      queryKey: ["ai-progress"],
      queryFn: aiService.getProgress,
      refetchInterval: (query) => {
          const status = query.state.data?.status;
          // Si está procesando, consultar cada 2 segundos. Si no, cada 10s.
          return status === 'processing' ? 2000 : 10000;
      }
  })

  // Si el progreso cambia, refrescar la tabla automáticamente
  useEffect(() => {
      if (aiProgress?.status === 'processing') {
          queryClient.invalidateQueries({ queryKey: ["requests"] })
          queryClient.invalidateQueries({ queryKey: ["topic-counts"] })
      }
  }, [aiProgress?.processed, queryClient])

  const { data, isLoading } = useRequests(pagination, filters)
  
  const { data: topicCounts } = useQuery({
      queryKey: ["topic-counts"],
      queryFn: requestService.getTopicCounts
  })

  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request)
    setIsDialogOpen(true)
  }

  const handleFilterChange = (key: string, value: string) => {
    setPagination({ ...pagination, pageIndex: 0 })
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value }))
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setIsImporting(true)
      try {
          const res = await requestService.importCsv(file)
          toast.success(`Archivo cargado. Procesando ${res.imported} registros en segundo plano.`)
          // Forzar actualización inmediata del progreso
          queryClient.invalidateQueries({ queryKey: ["ai-progress"] })
      } catch (error: any) {
          toast.error("Error al importar CSV.")
      } finally {
          setIsImporting(false)
          if (fileInputRef.current) fileInputRef.current.value = ""
      }
  }

  const handleManualTrigger = async () => {
      try {
          await aiService.triggerBatch(true)
          toast.success("Análisis forzado iniciado.")
          queryClient.invalidateQueries({ queryKey: ["ai-progress"] })
      } catch (e) {
          toast.error("Error al iniciar análisis.")
      }
  }

  const pageCount = data ? Math.ceil(data.total / pagination.pageSize) : 0

  const getIcon = (topic: string) => {
      switch(topic) {
          case 'Seguridad': return <Shield className="w-4 h-4 text-blue-600" />;
          case 'Salud': return <HeartPulse className="w-4 h-4 text-red-600" />;
          case 'Transporte': return <Bus className="w-4 h-4 text-orange-600" />;
          case 'Servicios Públicos': return <Lightbulb className="w-4 h-4 text-yellow-600" />;
          case 'Educación': return <GraduationCap className="w-4 h-4 text-purple-600" />;
          case 'Transparencia': return <FileText className="w-4 h-4 text-teal-600" />;
          default: return <HelpCircle className="w-4 h-4 text-gray-600" />;
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
              <h2 className="text-2xl font-serif font-bold text-ciay-brown">Bandeja de Solicitudes</h2>
              <p className="text-ciay-slate text-sm">Gestión y seguimiento de reportes ciudadanos.</p>
          </div>
          
          {user?.role === 'superadmin' && (
              <div className="flex gap-2 items-center">
                  <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
                  <Button 
                      onClick={handleImportClick} 
                      disabled={isImporting}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                  >
                      {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                      Importar CSV
                  </Button>
              </div>
          )}
      </div>

      {/* --- TARJETA DE PROGRESO DE IA (REAL-TIME) --- */}
      {aiProgress && aiProgress.status === 'processing' && (
          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-white shadow-md animate-in fade-in slide-in-from-top-2">
              <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-full animate-pulse">
                      <BrainCircuit className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                          <div>
                              <h4 className="font-bold text-purple-900 text-sm">Motor de IA Activo</h4>
                              <p className="text-xs text-purple-600">Clasificando solicitudes (Operativa vs Administrativa)...</p>
                          </div>
                          <div className="text-right">
                              <span className="text-lg font-bold text-purple-700">{aiProgress.percentage}%</span>
                              <p className="text-xs text-gray-500">{aiProgress.processed} / {aiProgress.total}</p>
                          </div>
                      </div>
                      <Progress value={aiProgress.percentage} className="h-2 bg-purple-200" />
                  </div>
              </CardContent>
          </Card>
      )}

      {/* --- BARRA DE RESUMEN --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {['Seguridad', 'Salud', 'Transporte', 'Servicios Públicos', 'Educación', 'Transparencia', 'Otros'].map(topic => (
              <Card key={topic} className="border border-gray-100 shadow-sm bg-white">
                  <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-white rounded-md border border-gray-100">
                              {getIcon(topic)}
                          </div>
                          <span className="text-xs font-bold text-gray-600 truncate max-w-[80px]" title={topic}>{topic}</span>
                      </div>
                      <span className="text-lg font-bold text-ciay-brown transition-all">
                          {topicCounts ? (topicCounts[topic] || 0) : '-'}
                      </span>
                  </CardContent>
              </Card>
          ))}
      </div>

      <Card className="border-ciay-gold/10 shadow-md">
        <CardContent className="p-0">
            {isLoading ? (
                <div className="flex justify-center py-20 text-ciay-brown">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <DataTable 
                    columns={columns} 
                    data={data?.items || []}
                    pageCount={pageCount}
                    pagination={pagination}
                    setPagination={setPagination}
                    onFilterChange={handleFilterChange}
                    onViewAction={handleViewRequest}
                />
            )}
        </CardContent>
      </Card>

      <RequestDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        request={selectedRequest}
      />
    </div>
  )
}
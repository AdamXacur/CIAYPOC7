"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertTriangle, CheckCircle, Clock, RefreshCw, Map as MapIcon, Calendar as CalendarIcon, Sparkles, BrainCircuit, ArrowRight } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'
import dynamic from 'next/dynamic'
import { Loader2 } from "lucide-react"
import { requestService, dependencyService, api, aiService } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

// Mapa dinámico
const RequestMap = dynamic(() => import('@/components/dashboard/request-map'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-100 rounded-md text-ciay-slate"><Loader2 className="animate-spin mr-2" /> Cargando Mapa...</div>
})

const COLORS = ['#C49B64', '#624E32', '#BDC1C2', '#71706C', '#A8A29E'];

export default function DashboardPage() {
  // --- Filtros ---
  const [selectedDep, setSelectedDep] = useState<string>("all")
  const [dateRange, setDateRange] = useState("30") // Días atrás
  
  // --- Estado de Análisis IA ---
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  // --- Queries ---
  const { data: dependencies } = useQuery({
      queryKey: ["dependencies"],
      queryFn: dependencyService.getAll
  })

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["dashboard-stats", selectedDep, dateRange],
    queryFn: async () => {
        const startDate = format(subDays(new Date(), parseInt(dateRange)), 'yyyy-MM-dd')
        const params: any = { start_date: startDate }
        if (selectedDep !== "all") params.dependency_id = selectedDep
        
        const res = await api.get('/stats/dashboard', { params })
        return res.data
    }
  })

  const { data: requestsData } = useQuery({
    queryKey: ["requests-map"],
    queryFn: () => requestService.getAll({ limit: 100 }) 
  })

  // --- Handler para Análisis ITIL ---
  const handleRunAnalysis = async () => {
      setIsAnalyzing(true)
      setAnalysisResult(null)
      try {
          const res = await aiService.analyzeBatch(50, true) // Forzamos análisis de los últimos 50
          setAnalysisResult(res)
          toast.success("Análisis sistémico completado")
          refetch() // Actualizar stats y alertas
      } catch (error) {
          toast.error("Error al ejecutar el análisis de IA")
      } finally {
          setIsAnalyzing(false)
      }
  }

  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center text-ciay-brown">
            <RefreshCw className="animate-spin mr-2"/> Analizando datos...
        </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* --- BARRA DE FILTROS Y ALERTAS --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-ciay-brown">Tablero de Control</h2>
            <p className="text-sm text-gray-500">Monitoreo estratégico en tiempo real.</p>
          </div>
          
          <div className="flex gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
              <Select value={selectedDep} onValueChange={setSelectedDep}>
                  <SelectTrigger className="w-[200px] h-9 text-xs">
                      <SelectValue placeholder="Todas las Dependencias" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Todas las Dependencias</SelectItem>
                      {dependencies?.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>{d.acronym || d.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                      <CalendarIcon className="w-3 h-3 mr-2" />
                      <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="7">Últimos 7 días</SelectItem>
                      <SelectItem value="30">Últimos 30 días</SelectItem>
                      <SelectItem value="90">Últimos 3 meses</SelectItem>
                  </SelectContent>
              </Select>
              
              <Button size="sm" variant="ghost" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4" />
              </Button>
          </div>
      </div>

      {/* --- SECCIÓN DE INTELIGENCIA ARTIFICIAL (NUEVO) --- */}
      <Card className="border-t-4 border-purple-500 shadow-md bg-gradient-to-r from-purple-50 to-white">
          <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                          <BrainCircuit className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                          <CardTitle className="text-lg font-bold text-purple-900">Análisis de Patrones Sistémicos</CardTitle>
                          <p className="text-xs text-purple-600">Detección de causa raíz basada en manuales operativos (RAG).</p>
                      </div>
                  </div>
                  <Button 
                    onClick={handleRunAnalysis} 
                    disabled={isAnalyzing}
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                  >
                      {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      {isAnalyzing ? "Analizando Lote..." : "Ejecutar Diagnóstico"}
                  </Button>
              </div>
          </CardHeader>
          
          <CardContent>
              {/* Resultado del Análisis */}
              {analysisResult ? (
                  <div className="animate-in fade-in slide-in-from-top-2 space-y-4 mt-2">
                      <div className="p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                          <h4 className="font-bold text-purple-800 text-sm mb-2 uppercase tracking-wide">Resumen Ejecutivo</h4>
                          <p className="text-sm text-gray-700 leading-relaxed">{analysisResult.ai_summary}</p>
                      </div>

                      {analysisResult.patterns_found?.length > 0 ? (
                          <div className="grid gap-3 md:grid-cols-2">
                              {analysisResult.patterns_found.map((pattern: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-red-50 border-l-4 border-red-400 rounded-r-md">
                                      <div className="flex justify-between items-start">
                                          <h5 className="font-bold text-red-800 text-sm">{pattern.pattern_name}</h5>
                                          <span className="px-2 py-0.5 bg-red-200 text-red-800 text-[10px] rounded-full font-bold">
                                              {pattern.urgency}
                                          </span>
                                      </div>
                                      <p className="text-xs text-red-700 mt-1 font-medium">Causa Probable: {pattern.root_cause_hypothesis}</p>
                                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                          <ArrowRight className="w-3 h-3" />
                                          <span>Acción: {pattern.suggested_action}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-center py-4 text-sm text-green-600 bg-green-50 rounded-md border border-green-100">
                              <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                              No se detectaron patrones anómalos críticos en este lote.
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">
                      Presione "Ejecutar Diagnóstico" para que la IA analice las solicitudes recientes en busca de problemas masivos.
                  </div>
              )}
          </CardContent>
      </Card>

      {/* --- ALERTAS ACTIVAS (DEL SISTEMA) --- */}
      {stats?.active_alerts && stats.active_alerts.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm animate-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                      <h4 className="font-bold text-red-800 text-sm uppercase">Alertas Vigentes</h4>
                      <ul className="list-disc list-inside text-sm text-red-700 mt-1">
                          {stats.active_alerts.map((alert: string, i: number) => (
                              <li key={i}>{alert}</li>
                          ))}
                      </ul>
                  </div>
              </div>
          </div>
      )}

      {/* --- KPI CARDS --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-ciay-gold shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase">Total Solicitudes</CardTitle>
            <Activity className="h-4 w-4 text-ciay-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ciay-brown">{stats?.total_requests || 0}</div>
            <p className="text-xs text-gray-400 mt-1">En el periodo seleccionado</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats?.pending_count || 0}</div>
            <p className="text-xs text-gray-400 mt-1">En revisión o recibidas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase">Atendidas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats?.attended_count || 0}</div>
            <p className="text-xs text-gray-400 mt-1">Casos cerrados con éxito</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase">Tiempo Promedio</CardTitle>
            <RefreshCw className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{stats?.avg_response_time_hours}h</div>
            <p className="text-xs text-gray-400 mt-1">Tiempo de respuesta inicial</p>
          </CardContent>
        </Card>
      </div>
      
      {/* --- GRÁFICAS PRINCIPALES --- */}
      <div className="grid gap-6 md:grid-cols-7">
        
        {/* TENDENCIA TEMPORAL (LINE CHART) */}
        <Card className="col-span-4 shadow-md border-gray-100">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-ciay-brown">Tendencia de Solicitudes</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.requests_by_date || []}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#C49B64" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#C49B64" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="solicitudes" stroke="#624E32" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* DISTRIBUCIÓN POR TEMA (PIE CHART) */}
        <Card className="col-span-3 shadow-md border-gray-100">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-ciay-brown">Distribución por Tema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={stats?.requests_by_topic || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {(stats?.requests_by_topic || []).map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- MAPA Y TOP DEPENDENCIAS --- */}
      <div className="grid gap-6 md:grid-cols-7">
          <Card className="col-span-4 shadow-md border-gray-100 overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-100 py-3">
                <div className="flex items-center gap-2">
                    <MapIcon className="w-4 h-4 text-ciay-gold" />
                    <CardTitle className="text-sm font-bold text-ciay-brown">Mapa de Calor</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0 h-[350px]">
                <RequestMap requests={requestsData?.items || []} />
            </CardContent>
          </Card>

          <Card className="col-span-3 shadow-md border-gray-100">
            <CardHeader>
                <CardTitle className="text-sm font-bold text-ciay-brown">Top Dependencias con Más Casos</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={stats?.requests_by_dependency || []} margin={{left: 20}}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="label" type="category" width={80} tick={{fontSize: 11}} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="value" fill="#624E32" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}
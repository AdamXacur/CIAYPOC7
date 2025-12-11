"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, ArrowRight, FileSearch, CheckCircle2, Clock, MapPin, Calendar, Building2, AlertCircle, Printer } from "lucide-react"
import { requestService } from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"

export default function TrackerPage() {
  const [folio, setFolio] = useState("")
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!folio) return
    
    setIsLoading(true)
    setResult(null)
    
    try {
      const data = await requestService.getByFolioPublic(folio)
      setResult(data)
    } catch (error) {
      toast.error("Folio no encontrado. Verifique e intente nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  // Calcular paso actual para la barra de progreso
  const getStepStatus = (status: string) => {
      if (status === 'Rechazada') return -1;
      if (status === 'Atendida') return 3;
      if (status === 'En revisión') return 2;
      return 1; // Recibida
  }

  const currentStep = result ? getStepStatus(result.status) : 0;

  return (
    <div className="min-h-screen bg-ciay-cream flex flex-col">
      
      {/* --- HEADER INSTITUCIONAL --- */}
      <header className="bg-white border-b-4 border-ciay-gold shadow-sm py-4 px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
              <Logo className="h-12 w-auto" />
              <div className="hidden md:block h-10 w-px bg-gray-300"></div>
              <div className="hidden md:block">
                  <h1 className="text-ciay-brown font-serif font-bold text-lg leading-tight">Atención Ciudadana</h1>
                  <p className="text-ciay-slate text-xs tracking-widest uppercase">Gobierno del Estado</p>
              </div>
          </div>
          <Link href="/portal/new-request">
            <Button variant="outline" className="border-ciay-brown text-ciay-brown hover:bg-ciay-brown hover:text-white transition-colors">
                Nueva Solicitud
            </Button>
          </Link>
      </header>

      <main className="flex-1 flex flex-col items-center py-12 px-4">
        
        {/* --- BUSCADOR --- */}
        <div className="text-center mb-10 max-w-2xl">
            <h2 className="text-3xl font-serif font-bold text-ciay-brown mb-3">Consulte el estatus de su reporte</h2>
            <p className="text-gray-600">
            Ingrese el número de folio único (ej. <span className="font-mono font-bold bg-white px-1 rounded border">YUC-2025-XXXXX</span>) que recibió al momento de generar su solicitud.
            </p>
        </div>

        <Card className="w-full max-w-3xl shadow-xl border-0 ring-1 ring-gray-200 bg-white overflow-hidden">
            <div className="bg-ciay-brown p-2"></div> {/* Franja decorativa */}
            <CardContent className="p-8">
            <form onSubmit={handleSearch} className="flex gap-3 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                    <Input 
                        placeholder="Ingrese su Folio" 
                        className="pl-12 h-12 text-lg bg-gray-50 border-gray-300 focus:border-ciay-gold focus:ring-ciay-gold/20 rounded-lg"
                        value={folio}
                        onChange={(e) => setFolio(e.target.value)}
                    />
                </div>
                <Button type="submit" className="h-12 px-8 bg-ciay-gold hover:bg-ciay-gold/90 text-white font-bold rounded-lg shadow-md" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "Consultar"}
                </Button>
            </form>

            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                    
                    {/* --- BARRA DE ESTADO --- */}
                    <div className="relative">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded"></div>
                        <div className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 rounded transition-all duration-1000" style={{width: `${((currentStep - 1) / 2) * 100}%`}}></div>
                        
                        <div className="flex justify-between text-sm font-medium text-gray-500">
                            {['Recibida', 'En revisión', 'Atendida'].map((step, idx) => {
                                const stepNum = idx + 1;
                                const isActive = currentStep >= stepNum;
                                const isCurrent = currentStep === stepNum;
                                
                                return (
                                    <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                                            isActive ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300'
                                        }`}>
                                            {isActive ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs">{stepNum}</span>}
                                        </div>
                                        <span className={`${isCurrent ? 'text-green-700 font-bold' : ''}`}>{step}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* --- TARJETA DE DETALLES --- */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                        <div className="flex justify-between items-start border-b border-gray-200 pb-4 mb-4">
                            <div>
                                <p className="text-xs font-bold text-ciay-gold uppercase tracking-wider">Folio</p>
                                <p className="text-2xl font-mono font-bold text-ciay-brown">{result.folio}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-ciay-brown" onClick={() => window.print()}>
                                <Printer className="w-4 h-4 mr-2" /> Imprimir
                            </Button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Descripción</p>
                                    <p className="text-gray-800 mt-1">{result.description}</p>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4 text-ciay-gold" />
                                    <span>{result.location_text || "Ubicación no especificada"}</span>
                                </div>
                            </div>
                            
                            <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Fecha de recepción:</span>
                                    <span className="font-medium">{format(new Date(result.created_at), "dd/MM/yyyy", { locale: es })}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Dependencia:</span>
                                    <span className="font-medium text-ciay-brown">{result.department_name || "En proceso de asignación"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Tema:</span>
                                    <span className="px-2 py-0.5 bg-ciay-cream text-ciay-brown rounded text-xs font-bold">{result.topic}</span>
                                </div>
                            </div>
                        </div>

                        {/* RESPUESTA OFICIAL */}
                        {result.official_response && (
                            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                                <h4 className="font-bold text-green-800 flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="w-5 h-5" /> Respuesta Oficial
                                </h4>
                                <p className="text-green-900 text-sm">{result.official_response}</p>
                                {result.closed_at && (
                                    <p className="text-xs text-green-700 mt-2 text-right">
                                        Cerrado el: {format(new Date(result.closed_at), "dd/MM/yyyy HH:mm", { locale: es })}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* --- HISTORIAL (TIMELINE) --- */}
                    <div>
                        <h3 className="font-bold text-ciay-brown mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Historial de Movimientos
                        </h3>
                        <div className="space-y-4 pl-2 border-l-2 border-gray-200 ml-2">
                            {result.timeline?.map((event: any, idx: number) => (
                                <div key={idx} className="relative pl-6 pb-2">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-ciay-gold border-2 border-white shadow-sm"></div>
                                    <p className="text-sm font-bold text-gray-800">
                                        {event.action === 'created' ? 'Solicitud Recibida' : 
                                         event.action === 'status_change' ? `Cambio de estado a: ${event.new_status}` : event.action}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-1">
                                        {format(new Date(event.timestamp), "dd MMM yyyy, HH:mm", { locale: es })}
                                    </p>
                                    {event.note && <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1">{event.note}</p>}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}

            {!result && !isLoading && (
                <div className="text-center py-12 opacity-50">
                    <FileSearch className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-400 text-sm">Ingrese un folio para ver los detalles.</p>
                </div>
            )}
            </CardContent>
        </Card>
      </main>

      <footer className="bg-ciay-brown text-ciay-cream py-8 text-center text-sm">
          <p className="font-bold mb-2">Gobierno del Estado de Yucatán</p>
          <p className="opacity-70">Plataforma de Atención Ciudadana - Renacimiento Maya</p>
      </footer>
    </div>
  )
}

function Loader2({ className }: { className?: string }) {
    return <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
}
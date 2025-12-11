"use client"

import { useState } from "react"
import { reportService } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2, FileSpreadsheet, BarChart } from "lucide-react"
import { toast } from "sonner"

export default function ReportsPage() {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const blob = await reportService.downloadCsv()
      
      // Crear link temporal para descargar
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_crac_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      
      toast.success("Reporte descargado correctamente")
    } catch (error) {
      toast.error("Error al descargar el reporte")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
          <h2 className="text-2xl font-serif font-bold text-ciay-brown">Centro de Reportes</h2>
          <p className="text-ciay-slate text-sm">Descarga de datos y análisis estadístico.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Reporte General */}
        <Card className="border-t-4 border-ciay-gold shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="w-12 h-12 bg-ciay-cream rounded-lg flex items-center justify-center mb-4">
                    <FileSpreadsheet className="w-6 h-6 text-ciay-brown" />
                </div>
                <CardTitle className="text-lg font-bold text-ciay-brown">Reporte General CSV</CardTitle>
                <CardDescription>
                    Exportación completa de todas las solicitudes con estatus, fechas y clasificación.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button 
                    className="w-full bg-ciay-brown hover:bg-ciay-brown/90" 
                    onClick={handleDownload}
                    disabled={isDownloading}
                >
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                    Descargar CSV
                </Button>
            </CardContent>
        </Card>

        {/* Reporte por Dependencia (Placeholder Visual) */}
        <Card className="border-t-4 border-gray-300 shadow-sm opacity-75">
            <CardHeader>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <BarChart className="w-6 h-6 text-gray-500" />
                </div>
                <CardTitle className="text-lg font-bold text-gray-600">Métricas por Dependencia</CardTitle>
                <CardDescription>
                    Análisis de rendimiento y tiempos de respuesta por secretaría.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="outline" className="w-full" disabled>
                    Próximamente
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
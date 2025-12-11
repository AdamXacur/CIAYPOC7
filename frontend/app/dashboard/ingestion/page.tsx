"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Loader2, FileText, CheckCircle, AlertCircle, BrainCircuit } from "lucide-react"
import { toast } from "sonner"
import { ingestionService } from "@/lib/api"

export default function IngestionPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{chunks_created: number, filename: string} | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("Por favor, seleccione un archivo.")
      return
    }
    
    setIsUploading(true)
    setResult(null)
    
    try {
      // Usamos el servicio de ingesta manual
      const response = await ingestionService.uploadManual(file, "general")
      setResult(response)
      toast.success("Manual procesado e indexado correctamente.")
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Error al procesar el archivo."
      toast.error(msg)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
          <h2 className="text-2xl font-serif font-bold text-ciay-brown">Base de Conocimiento (RAG)</h2>
          <p className="text-ciay-slate text-sm">Sube manuales PDF para entrenar al Asistente de TI.</p>
      </div>

      <Card className="border-t-4 border-ciay-gold shadow-md">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ciay-brown">
                <BrainCircuit /> Ingesta de Manuales
            </CardTitle>
            <CardDescription>
                El sistema leerá el PDF, lo dividirá en fragmentos y generará vectores (Embeddings) para búsqueda semántica.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="file-upload">Manual Técnico (.pdf)</Label>
                <Input 
                    id="file-upload" 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="file:text-ciay-brown file:font-bold"
                />
            </div>
            
            <Button 
                onClick={handleUpload} 
                disabled={isUploading || !file}
                className="w-full bg-ciay-brown hover:bg-ciay-brown/90"
            >
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isUploading ? "Indexando Conocimiento..." : "Subir y Procesar"}
            </Button>

            {result && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 animate-in fade-in">
                    <h3 className="font-bold text-green-800 mb-2">¡Procesamiento Exitoso!</h3>
                    <div className="flex flex-col gap-1 text-sm text-green-700">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>Archivo: <strong>{result.filename}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Fragmentos vectorizados: <strong>{result.chunks_created}</strong></span>
                        </div>
                        <p className="mt-2 text-xs opacity-80">El asistente ya puede responder preguntas sobre este documento.</p>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
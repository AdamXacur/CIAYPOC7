"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { MapPin, Send, Loader2, Upload, Image as ImageIcon } from "lucide-react"
import { requestService, api } from "@/lib/api"

export default function NewRequestPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleGeoLocation = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      setCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
      toast.success("Ubicación detectada")
    }, () => toast.error("No se pudo obtener la ubicación"))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    let evidenceUrl = ""
    try {
      // 1. Subir la imagen si existe
      if (file) {
        const formData = new FormData()
        formData.append("file", file)
        const uploadResponse = await api.post("/uploads", formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        evidenceUrl = uploadResponse.data.file_url
      }

      // 2. Crear la solicitud con la URL de la imagen
      const requestData = await requestService.create({
        description,
        location_text: location,
        latitude: coords?.lat,
        longitude: coords?.lng,
        evidence_url: evidenceUrl
      })
      
      toast.success(`Solicitud creada con éxito. Folio: ${requestData.folio}`)
      router.push(`/tracker?folio=${requestData.folio}`)

    } catch (error) {
      toast.error("Error al enviar la solicitud.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ciay-cream flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-ciay-brown">
        <CardHeader>
          <CardTitle className="text-2xl font-serif font-bold text-ciay-brown">Nueva Solicitud</CardTitle>
          <CardDescription>
            Reporte una incidencia. La Inteligencia Artificial clasificará su solicitud automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="desc">Descripción del Problema</Label>
              <textarea 
                id="desc"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Ej: Hay un bache profundo en la calle 60..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label>Ubicación</Label>
              <div className="flex gap-2">
                <Input 
                    placeholder="Calle, Colonia o Referencia" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                />
                <Button type="button" variant="outline" onClick={handleGeoLocation} title="Usar mi ubicación">
                    <MapPin className="h-4 w-4 text-ciay-gold" />
                </Button>
              </div>
              {coords && <p className="text-xs text-green-600 flex items-center gap-1"><MapPin size={10}/> Coordenadas adjuntas</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="evidence">Adjuntar Evidencia (Opcional)</Label>
                <div className="flex items-center gap-4">
                    <label htmlFor="evidence" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-center text-gray-500">
                                <Upload className="mx-auto h-6 w-6" />
                                <p className="text-sm">Arrastra o haz clic para subir</p>
                            </div>
                        </div>
                    </label>
                    <input id="evidence" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    {preview && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                            <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
            </div>

            <Button type="submit" className="w-full bg-ciay-brown hover:bg-ciay-brown/90" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2"/> : <Send className="mr-2 h-4 w-4"/>}
              Enviar Reporte
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
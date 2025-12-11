"use client"

import { useEffect, useState } from "react"
import { govActionService, dependencyService } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Megaphone, Loader2, Calendar } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function GovActionsPage() {
  const [actions, setActions] = useState<any[]>([])
  const [dependencies, setDependencies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    dependency_id: "",
    related_topic: "Otros"
  })

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [actionsData, depsData] = await Promise.all([
        govActionService.getAll(),
        dependencyService.getAll()
      ])
      setActions(Array.isArray(actionsData) ? actionsData : [])
      setDependencies(Array.isArray(depsData) ? depsData : [])
    } catch (error) {
      console.error("Error loading data", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Convertir fechas a ISO si es necesario
      await govActionService.create({
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
      })
      toast.success("Acción de gobierno registrada")
      setIsDialogOpen(false)
      setFormData({ name: "", start_date: "", end_date: "", dependency_id: "", related_topic: "Otros" })
      loadData()
    } catch (error) {
      toast.error("Error al crear la acción")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-serif font-bold text-ciay-brown">Acciones de Gobierno</h2>
            <p className="text-ciay-slate text-sm">Campañas y operativos estratégicos.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button className="bg-ciay-brown hover:bg-ciay-brown/90 text-white shadow-md">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Campaña
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-t-4 border-ciay-gold bg-white">
                <DialogHeader>
                    <DialogTitle className="text-ciay-brown font-serif text-xl">Registrar Campaña</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-ciay-brown font-bold">Nombre de la Campaña</Label>
                        <Input 
                            placeholder="Ej: Operativo Bacheo 2025" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                            className="border-ciay-gold/30 focus:border-ciay-gold"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-ciay-brown font-bold">Fecha Inicio</Label>
                            <Input 
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                required
                                className="border-ciay-gold/30 focus:border-ciay-gold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-ciay-brown font-bold">Fecha Fin</Label>
                            <Input 
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                required
                                className="border-ciay-gold/30 focus:border-ciay-gold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-ciay-brown font-bold">Dependencia Responsable</Label>
                        <Select 
                            onValueChange={(val) => setFormData({...formData, dependency_id: val})}
                            value={formData.dependency_id}
                        >
                            <SelectTrigger className="border-ciay-gold/30 focus:border-ciay-gold">
                                <SelectValue placeholder="Seleccione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {dependencies.map(dep => (
                                    <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="submit" className="bg-ciay-gold hover:bg-ciay-gold/90 w-full text-white font-bold" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "Guardar Campaña"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

      <Card className="border-ciay-gold/20 shadow-lg bg-white">
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-ciay-cream">
                    <TableRow className="border-ciay-gold/10">
                        <TableHead className="text-ciay-brown font-bold uppercase text-xs tracking-wider">Campaña</TableHead>
                        <TableHead className="text-ciay-brown font-bold uppercase text-xs tracking-wider">Vigencia</TableHead>
                        <TableHead className="text-ciay-brown font-bold uppercase text-xs tracking-wider">Dependencia</TableHead>
                        <TableHead className="text-ciay-brown font-bold uppercase text-xs tracking-wider text-right">Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center"><Loader2 className="mx-auto animate-spin text-ciay-gold h-8 w-8"/></TableCell>
                        </TableRow>
                    ) : actions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center text-ciay-slate flex flex-col items-center justify-center">
                                <Megaphone className="h-8 w-8 mb-2 opacity-20" />
                                No hay campañas activas.
                            </TableCell>
                        </TableRow>
                    ) : (
                        actions.map((action) => (
                            <TableRow key={action.id} className="hover:bg-ciay-cream/30 border-ciay-gold/10">
                                <TableCell className="font-medium text-ciay-brown py-4">
                                    {action.name}
                                </TableCell>
                                <TableCell className="text-sm text-gray-500 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-ciay-gold" />
                                    {format(new Date(action.start_date), "dd MMM", { locale: es })} - {format(new Date(action.end_date), "dd MMM yyyy", { locale: es })}
                                </TableCell>
                                <TableCell>
                                    {/* Aquí idealmente cruzaríamos el ID con la lista de dependencias para mostrar el nombre */}
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">ID: {action.dependency_id.substring(0,8)}...</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
                                        Activa
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )
}
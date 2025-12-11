"use client"

import { useEffect, useState } from "react"
import { dependencyService } from "@/lib/api" // Usamos el servicio tipado
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Building2, Loader2, Trash2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function DependenciesPage() {
  const [dependencies, setDependencies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    acronym: "",
    admin_email: "",
    admin_password: "",
    contact_phone: ""
  })

  const loadDependencies = async () => {
    setIsLoading(true)
    try {
      const data = await dependencyService.getAll()
      setDependencies(data)
    } catch (error) {
      console.error("Error loading dependencies", error)
      setDependencies([]) 
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDependencies()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await dependencyService.create(formData)
      toast.success("Dependencia creada exitosamente")
      setIsDialogOpen(false)
      setFormData({ name: "", acronym: "", admin_email: "", admin_password: "", contact_phone: "" })
      loadDependencies()
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Error al crear dependencia."
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
      if(!confirm("¿Estás seguro de eliminar esta dependencia? Se borrarán sus usuarios y reportes.")) return;
      
      try {
          await dependencyService.delete(id)
          toast.success("Dependencia eliminada")
          loadDependencies()
      } catch (error) {
          toast.error("No se pudo eliminar la dependencia")
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-serif font-bold text-ciay-brown">Gestión de Dependencias</h2>
            <p className="text-ciay-slate text-sm">Administración de Secretarías y Entidades.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button className="bg-ciay-brown hover:bg-ciay-brown/90 text-white shadow-md">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Dependencia
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-t-4 border-ciay-gold bg-white">
                <DialogHeader>
                    <DialogTitle className="text-ciay-brown font-serif text-xl">Registrar Nueva Entidad</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-ciay-brown font-bold">Nombre Oficial</Label>
                            <Input 
                                placeholder="Ej: Secretaría de Salud" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                                className="border-ciay-gold/30 focus:border-ciay-gold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-ciay-brown font-bold">Siglas</Label>
                            <Input 
                                placeholder="Ej: SSY" 
                                value={formData.acronym}
                                onChange={(e) => setFormData({...formData, acronym: e.target.value})}
                                className="border-ciay-gold/30 focus:border-ciay-gold"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-ciay-brown font-bold">Correo del Administrador</Label>
                        <Input 
                            type="email" 
                            placeholder="admin@dependencia.gob.mx" 
                            value={formData.admin_email}
                            onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                            required
                            className="border-ciay-gold/30 focus:border-ciay-gold"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-ciay-brown font-bold">Contraseña Inicial</Label>
                        <Input 
                            type="password" 
                            value={formData.admin_password}
                            onChange={(e) => setFormData({...formData, admin_password: e.target.value})}
                            required
                            minLength={6}
                            className="border-ciay-gold/30 focus:border-ciay-gold"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-ciay-brown font-bold">Teléfono de Contacto</Label>
                        <Input 
                            placeholder="Opcional"
                            value={formData.contact_phone}
                            onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                            className="border-ciay-gold/30 focus:border-ciay-gold"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" className="bg-ciay-gold hover:bg-ciay-gold/90 w-full text-white font-bold" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "Registrar Entidad"}
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
                        <TableHead className="text-ciay-brown font-bold uppercase text-xs tracking-wider">Nombre</TableHead>
                        <TableHead className="text-ciay-brown font-bold uppercase text-xs tracking-wider">Siglas</TableHead>
                        <TableHead className="text-ciay-brown font-bold uppercase text-xs tracking-wider">Contacto</TableHead>
                        <TableHead className="text-ciay-brown font-bold uppercase text-xs tracking-wider text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center"><Loader2 className="mx-auto animate-spin text-ciay-gold h-8 w-8"/></TableCell>
                        </TableRow>
                    ) : dependencies.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center text-ciay-slate flex flex-col items-center justify-center">
                                <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                                No hay dependencias registradas.
                            </TableCell>
                        </TableRow>
                    ) : (
                        dependencies.map((dep) => (
                            <TableRow key={dep.id} className="hover:bg-ciay-cream/30 border-ciay-gold/10">
                                <TableCell className="font-medium text-ciay-brown flex items-center gap-3 py-4">
                                    <div className="p-2 bg-ciay-cream rounded-md">
                                        <Building2 className="w-5 h-5 text-ciay-gold" />
                                    </div>
                                    {dep.name}
                                </TableCell>
                                <TableCell>
                                    {dep.acronym ? (
                                        <span className="px-2 py-1 bg-ciay-brown/5 text-ciay-brown rounded text-xs font-bold border border-ciay-brown/10">
                                            {dep.acronym}
                                        </span>
                                    ) : <span className="text-gray-300">-</span>}
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                    <div className="flex flex-col">
                                        <span>{dep.admin_email}</span>
                                        <span className="text-xs text-gray-400">{dep.contact_phone || "Sin teléfono"}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(dep.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
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
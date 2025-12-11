"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { userService, dependencyService } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, UserCog, Trash2, Shield, User, Building2, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "official",
    dependency_id: ""
  })

  // Queries
  const { data: users, isLoading } = useQuery({
    queryKey: ["users", search, roleFilter],
    queryFn: () => userService.getAll({ 
        search: search || undefined, 
        role: roleFilter !== "all" ? roleFilter : undefined 
    })
  })

  const { data: dependencies } = useQuery({
    queryKey: ["dependencies"],
    queryFn: dependencyService.getAll
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      toast.success("Usuario creado correctamente")
      setIsDialogOpen(false)
      setFormData({ full_name: "", email: "", password: "", role: "official", dependency_id: "" })
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Error al crear usuario")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      toast.success("Usuario eliminado")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Error al eliminar")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-serif font-bold text-ciay-brown">Gestión de Usuarios</h2>
            <p className="text-ciay-slate text-sm">Administración de accesos y roles del sistema.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button className="bg-ciay-brown hover:bg-ciay-brown/90">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Registrar Usuario</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nombre Completo</Label>
                        <Input 
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Correo Electrónico</Label>
                        <Input 
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Contraseña</Label>
                        <Input 
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Rol</Label>
                            <Select 
                                value={formData.role} 
                                onValueChange={(val) => setFormData({...formData, role: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="official">Funcionario</SelectItem>
                                    <SelectItem value="superadmin">Superadmin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {formData.role === 'official' && (
                            <div className="space-y-2">
                                <Label>Dependencia</Label>
                                <Select 
                                    value={formData.dependency_id} 
                                    onValueChange={(val) => setFormData({...formData, dependency_id: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dependencies?.map((d: any) => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="w-full bg-ciay-brown" disabled={createMutation.isPending}>
                            {createMutation.isPending ? <Loader2 className="animate-spin" /> : "Crear Usuario"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

      <Card className="border-ciay-gold/20 shadow-md">
        <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50/50">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                    placeholder="Buscar por correo..." 
                    className="pl-9 bg-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Filtrar por Rol" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los Roles</SelectItem>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                    <SelectItem value="official">Funcionario</SelectItem>
                    <SelectItem value="citizen">Ciudadano</SelectItem>
                </SelectContent>
            </Select>
        </div>
        
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Dependencia</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto animate-spin" /></TableCell>
                        </TableRow>
                    ) : users?.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-gray-500">No se encontraron usuarios.</TableCell>
                        </TableRow>
                    ) : (
                        users?.map((u: any) => (
                            <TableRow key={u.id}>
                                <TableCell>
                                    <div className="font-medium text-ciay-brown">{u.email}</div>
                                    <div className="text-xs text-gray-400">ID: {u.id.substring(0,8)}...</div>
                                </TableCell>
                                <TableCell>
                                    {u.role === 'superadmin' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                                            <Shield className="w-3 h-3" /> Admin
                                        </span>
                                    ) : u.role === 'official' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                                            <UserCog className="w-3 h-3" /> Funcionario
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                                            <User className="w-3 h-3" /> Ciudadano
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {u.dependency_name ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Building2 className="w-4 h-4 text-ciay-gold" />
                                            {u.dependency_name}
                                        </div>
                                    ) : <span className="text-gray-300 text-xs">-</span>}
                                </TableCell>
                                <TableCell>
                                    {u.is_active ? (
                                        <span className="text-green-600 text-xs font-bold">● Activo</span>
                                    ) : (
                                        <span className="text-red-500 text-xs font-bold">● Inactivo</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-gray-400 hover:text-red-600"
                                        onClick={() => {
                                            if(confirm("¿Eliminar usuario permanentemente?")) deleteMutation.mutate(u.id)
                                        }}
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
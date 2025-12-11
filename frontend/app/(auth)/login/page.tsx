"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, ShieldCheck, Lock, AlertCircle } from "lucide-react"
import { authService } from "@/lib/api"

// Helper para cookies
const setCookie = (name: string, value: string, days: number) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Detectar si venimos de una sesión expirada
  useEffect(() => {
    if (searchParams.get("reason") === "expired") {
        toast.warning("Tu sesión ha expirado. Por favor ingresa nuevamente.", {
            duration: 5000,
            icon: <AlertCircle className="h-5 w-5 text-yellow-500" />
        })
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const data = await authService.login({ email, password })
      
      localStorage.setItem("auth_token", data.access_token)
      localStorage.setItem("user_role", data.user_role)
      setCookie("auth_token", data.access_token, 1)
      
      toast.success("Acceso concedido. Redirigiendo...")
      router.push("/dashboard")

    } catch (error: any) {
      console.error("FALLO EL LOGIN:", error)
      if (error.response) {
        toast.error(`Error: ${error.response.data.detail || 'Credenciales incorrectas'}`)
      } else {
        toast.error("No se pudo conectar con el servidor.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-white border border-ciay-brown/20 rounded-xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-ciay-brown/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-ciay-brown">
          <ShieldCheck className="w-8 h-8 text-ciay-brown" />
        </div>
        <h1 className="text-2xl font-bold text-ciay-brown">Acceso Administrativo</h1>
        <p className="text-ciay-slate text-sm mt-2">Plataforma CRAC Yucatán</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-bold text-ciay-slate uppercase">Usuario / Correo</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="ejemplo@yucatan.gob.mx"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            className="bg-gray-50 border-gray-200 focus:border-ciay-gold focus:ring-ciay-gold/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-bold text-ciay-slate uppercase">Contraseña</Label>
          <Input 
            id="password" 
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            className="bg-gray-50 border-gray-200 focus:border-ciay-gold focus:ring-ciay-gold/50"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-ciay-brown hover:bg-ciay-brown/90 text-white font-bold py-6 rounded-lg shadow-lg shadow-ciay-brown/20" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" /> Iniciar Sesión
            </>
          )}
        </Button>
      </form>
    </div>
  )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <LoginForm />
        </Suspense>
    )
}
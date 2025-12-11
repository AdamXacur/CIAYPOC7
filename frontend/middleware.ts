import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas protegidas que requieren autenticación
const protectedRoutes = ['/dashboard', '/portal']

// Rutas de autenticación
const authRoutes = ['/login', '/register']

export function middleware(request: NextRequest) {
  // Obtener el token de la cookie (más seguro que localStorage para middleware)
  const token = request.cookies.get('auth_token')?.value

  const { pathname } = request.nextUrl

  // 1. Si el usuario está logueado
  if (token) {
    // Y trata de acceder a una página de login/registro, redirigir al dashboard
    if (authRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // 2. Si el usuario NO está logueado
  if (!token) {
    // Y trata de acceder a una ruta protegida, redirigir al login
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Si no se cumple ninguna regla, continuar con la petición normal
  return NextResponse.next()
}

// Configuración para que el middleware se ejecute en las rutas correctas
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
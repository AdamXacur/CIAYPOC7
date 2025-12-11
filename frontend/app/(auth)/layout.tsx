import React from 'react';

// Layout simple para las páginas de autenticación
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ciay-cream flex items-center justify-center p-4">
      {children}
    </div>
  );
}
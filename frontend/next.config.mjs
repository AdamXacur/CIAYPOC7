/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // Evitar problemas de hidratación con extensiones de navegador
  reactStrictMode: false, 
};

export default nextConfig;
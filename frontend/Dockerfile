# Usamos una imagen ligera de Node
FROM node:18-alpine

WORKDIR /app

# Copiamos los archivos de dependencias primero (para aprovechar el caché de Docker)
COPY package.json package-lock.json* ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código fuente
COPY . .

# Exponemos el puerto de Vite
EXPOSE 3000

# Iniciamos en modo desarrollo (asegurando que escuche en 0.0.0.0 para Docker)
CMD ["npm", "run", "dev", "--", "--host"]
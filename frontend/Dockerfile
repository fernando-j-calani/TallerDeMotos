# 1. Usar una imagen oficial de Node.js (necesaria para React)
FROM node:20-alpine

# 2. Crear la carpeta "app" dentro del contenedor
WORKDIR /app

# 3. Copiar el archivo que tiene la lista de librerías de React
COPY package.json ./

# 4. Instalar las librerías
RUN npm install

# 5. Copiar el resto del código del frontend
COPY . ./

# 6. Exponer el puerto 3000
EXPOSE 3000

# 7. Arrancar el servidor de desarrollo de React (Render no usa docker-compose)
CMD ["npm", "start"]
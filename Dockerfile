# === ETAPA 1: Compilación de la app de Angular ===
FROM node:20-alpine AS build_stage

WORKDIR /app

# Copiamos los archivos de dependencias primero para aprovechar la caché de Docker
COPY package*.json ./
RUN npm install

# Copiamos el resto del código del frontend y compilamos
COPY . .
RUN npm run build -- --configuration=production

# === ETAPA 2: Servidor Nginx con HTTPS ===
FROM nginx:alpine

# 1. Instalar OpenSSL para poder generar el certificado de desarrollo
RUN apk add --no-cache openssl

# 2. Crear el directorio y generar los certificados SSL autofirmados
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.key \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Development/OU=IT/CN=localhost"

# 3. Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 4. Copiar los archivos compilados desde la etapa anterior
# NOTA: Asegúrate de que la carpeta dentro de /dist coincida con tu proyecto. 
# Si tu proyecto Angular no genera la subcarpeta "/browser", borra esa palabra del final.
# Reemplaza tu línea 34 por esta:
COPY --from=build_stage /app/dist/*/browser /usr/share/nginx/html/

# Exponer el puerto del Front (80) y el "falso" Back con HTTPS (5001)
EXPOSE 80 5001

CMD ["nginx", "-g", "daemon off;"]
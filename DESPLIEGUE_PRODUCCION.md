# 🚀 Guía de Despliegue a Producción

## ✅ Pre-requisitos Completados

- [x] Build de producción generado (`ng build --configuration production`)
- [x] Archivos de configuración creados (`.htaccess`, `web.config`)
- [ ] Variables de entorno configuradas

## 📝 Checklist de Preparación

### 1. Configuración de Variables de Entorno

Edita `src/environments/environment.prod.ts` y actualiza:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://TU-DOMINIO-API.com/api' // ⚠️ CAMBIAR ESTO
};
```

**Después de cambiar el apiUrl, ejecuta nuevamente:**
```bash
ng build --configuration production
```

### 2. Verificar Archivos Generados

Los archivos de distribución están en: `dist/aula-virtual/browser/`

```
dist/aula-virtual/browser/
├── index.html                  (Punto de entrada)
├── main-[hash].js              (Lógica principal - 953 KB)
├── chunk-[hash].js             (Dependencias - 433 KB)
├── styles-[hash].css           (Estilos - 55 KB)
├── favicon.ico
└── [otros assets]
```

### 3. Opciones de Despliegue

#### 🔹 Opción A: Servidor Apache

1. Copia el contenido de `dist/aula-virtual/browser/` a tu servidor
2. Copia también el archivo `.htaccess` (ya generado)
3. Asegúrate que `mod_rewrite` esté habilitado:
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

#### 🔹 Opción B: Servidor IIS (Windows)

1. Copia el contenido de `dist/aula-virtual/browser/` a tu servidor
2. Copia también el archivo `web.config` (ya generado)
3. Instala el módulo URL Rewrite para IIS

#### 🔹 Opción C: Nginx

Crea un archivo de configuración:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /ruta/a/dist/aula-virtual/browser;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Compresión
    gzip on;
    gzip_types text/css application/javascript application/json;

    # Cache de assets estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 🔹 Opción D: Servicios Cloud

**Vercel (Recomendado para Angular):**
```bash
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist/aula-virtual/browser
```

**Firebase Hosting:**
```bash
npm install -g firebase-tools
firebase init hosting
firebase deploy
```

### 4. Configuración CORS en el Backend

Asegúrate que tu backend NestJS permita peticiones desde tu dominio de producción:

```typescript
// En main.ts del backend
app.enableCors({
  origin: ['https://tu-dominio-frontend.com'],
  credentials: true,
});
```

### 5. Checklist Final

Antes de desplegar, verifica:

- [ ] URL de API actualizada en `environment.prod.ts`
- [ ] Build regenerado con la nueva URL
- [ ] Backend configurado para aceptar peticiones del frontend
- [ ] Certificado SSL/HTTPS configurado (recomendado)
- [ ] Variables de entorno verificadas
- [ ] Pruebas de login y funcionalidades críticas

### 6. Despliegue

**Pasos para desplegar en servidor tradicional:**

1. **Conecta a tu servidor:**
   ```bash
   # SSH
   ssh usuario@tu-servidor.com
   ```

2. **Sube los archivos:**
   ```bash
   # Desde tu máquina local
   scp -r dist/aula-virtual/browser/* usuario@servidor:/ruta/web/
   
   # O usando FTP/SFTP con FileZilla u otro cliente
   ```

3. **Copia el archivo de configuración:**
   ```bash
   # Para Apache
   scp .htaccess usuario@servidor:/ruta/web/
   
   # Para IIS
   scp web.config usuario@servidor:/ruta/web/
   ```

4. **Reinicia el servidor web** (si es necesario)

### 7. Verificación Post-Despliegue

Después de desplegar, verifica:

1. ✅ El sitio carga correctamente en `https://tu-dominio.com`
2. ✅ Las rutas funcionan (ej: `/login`, `/cursos`)
3. ✅ El login funciona correctamente
4. ✅ Las peticiones al backend se completan
5. ✅ Los estilos se cargan correctamente
6. ✅ No hay errores en la consola del navegador

### 8. Comandos Útiles

```bash
# Regenerar build con nueva configuración
ng build --configuration production

# Ver tamaño de los bundles
npm run build -- --stats-json
npx webpack-bundle-analyzer dist/aula-virtual/stats.json

# Test local del build de producción
npx http-server dist/aula-virtual/browser -p 8080 -o
```

### 9. Optimizaciones Adicionales (Opcional)

#### Lazy Loading
Ya implementado en tu aplicación con rutas perezosas.

#### Pre-rendering
```bash
npm install -g @angular/ssr
ng add @angular/ssr
```

#### Service Worker para PWA
```bash
ng add @angular/pwa
ng build --configuration production
```

### 10. Monitoreo y Mantenimiento

- Configura logs de errores (ej: Sentry, LogRocket)
- Configura analytics (ej: Google Analytics)
- Implementa health checks
- Configura backups automáticos

## 🔒 Consideraciones de Seguridad

1. **Variables sensibles:** No incluyas API keys en el frontend
2. **HTTPS:** Usa siempre SSL/TLS en producción
3. **Headers de seguridad:** Ya configurados en `.htaccess` y `web.config`
4. **Autenticación:** Usa JWT con expiración
5. **CORS:** Configura orígenes permitidos en el backend

## 📞 Solución de Problemas

**Problema:** Rutas devuelven 404
- **Solución:** Verifica que `.htaccess` o `web.config` estén en el directorio raíz

**Problema:** API no responde
- **Solución:** Verifica la URL en `environment.prod.ts` y configuración CORS

**Problema:** Archivos CSS/JS no cargan
- **Solución:** Verifica que la ruta base en `index.html` sea correcta

**Problema:** Error de CORS
- **Solución:** Configura el backend para permitir el dominio del frontend

## 📚 Recursos Adicionales

- [Angular Deployment Guide](https://angular.io/guide/deployment)
- [NestJS CORS Configuration](https://docs.nestjs.com/security/cors)
- [SSL Certificate with Let's Encrypt](https://letsencrypt.org/)

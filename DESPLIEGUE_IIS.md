# 🚀 Guía de Despliegue en IIS (Internet Information Services)

## 📋 Requisitos Previos

### 1. Instalar IIS en Windows Server/Windows

**Windows Server:**
- Administrador del Servidor → Agregar roles y características → Servidor Web (IIS)

**Windows 10/11:**
1. Panel de Control → Programas → Activar o desactivar las características de Windows
2. Marcar:
   - ✅ Internet Information Services
   - ✅ Herramientas de administración web
   - ✅ Servicios World Wide Web
   - ✅ Características de desarrollo de aplicaciones → WebSockets (opcional)

### 2. Instalar URL Rewrite Module (OBLIGATORIO)

Este módulo es esencial para que Angular funcione correctamente en IIS.

**Descargar e instalar:**
1. Ir a: https://www.iis.net/downloads/microsoft/url-rewrite
2. Descargar **URL Rewrite Module 2.1**
3. Ejecutar el instalador
4. Reiniciar IIS después de la instalación

**Verificar instalación:**
1. Abrir IIS Manager
2. Seleccionar el sitio
3. Buscar el icono "URL Rewrite" en la vista

## 🔧 Configuración Paso a Paso

### PASO 1: Preparar la Aplicación

1. **Actualizar la URL de la API:**

   Edita `src/environments/environment.prod.ts`:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://tu-dominio.com/api' // Tu URL real
   };
   ```

2. **Generar el build de producción:**
   ```powershell
   cd C:\Users\ASUS\aula-virtual-frontend
   ng build --configuration production
   ```

3. **Verificar los archivos generados:**
   ```
   dist/aula-virtual/browser/
   ├── index.html
   ├── main-[hash].js
   ├── chunk-[hash].js
   ├── styles-[hash].css
   ├── favicon.ico
   └── otros assets...
   ```

### PASO 2: Preparar el Directorio en el Servidor

1. **Crear carpeta para la aplicación:**
   ```powershell
   # En el servidor IIS
   mkdir C:\inetpub\wwwroot\aula-virtual
   ```

2. **Copiar archivos:**
   
   **Opción A - Manualmente:**
   - Copiar todo el contenido de `dist/aula-virtual/browser/*` a `C:\inetpub\wwwroot\aula-virtual\`
   - Copiar el archivo `web.config` a la misma carpeta

   **Opción B - PowerShell:**
   ```powershell
   # Desde tu máquina de desarrollo
   Copy-Item -Path "C:\Users\ASUS\aula-virtual-frontend\dist\aula-virtual\browser\*" `
             -Destination "\\SERVIDOR\C$\inetpub\wwwroot\aula-virtual\" `
             -Recurse -Force
   
   Copy-Item -Path "C:\Users\ASUS\aula-virtual-frontend\web.config" `
             -Destination "\\SERVIDOR\C$\inetpub\wwwroot\aula-virtual\"
   ```

   **Opción C - RDP:**
   - Conectarte por Escritorio Remoto
   - Copiar los archivos directamente

### PASO 3: Configurar el Sitio en IIS

1. **Abrir IIS Manager:**
   - Presionar `Win + R`
   - Escribir `inetmgr` y Enter

2. **Crear un nuevo sitio:**
   
   a. En el panel izquierdo: Click derecho en "Sites" → "Add Website"
   
   b. Configurar:
   ```
   Site name: Aula Virtual
   Physical path: C:\inetpub\wwwroot\aula-virtual
   Binding:
     - Type: http
     - IP address: All Unassigned
     - Port: 80
     - Host name: tu-dominio.com (opcional)
   ```
   
   c. Click "OK"

3. **Configurar Application Pool (Grupo de Aplicaciones):**
   
   a. Click en "Application Pools" en el panel izquierdo
   
   b. Buscar "Aula Virtual"
   
   c. Click derecho → "Basic Settings"
   
   d. Configurar:
   ```
   .NET CLR version: No Managed Code
   Managed pipeline mode: Integrated
   ```

   e. Click derecho → "Advanced Settings"
   
   f. Configurar:
   ```
   Start Mode: AlwaysRunning (opcional, para mejor rendimiento)
   Idle Time-out (minutes): 20
   ```

### PASO 4: Configurar URL Rewrite

El archivo `web.config` ya está configurado, pero verifica:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Angular Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

### PASO 5: Configurar Permisos

1. **Permisos de carpeta:**
   ```powershell
   # Dar permisos a IIS_IUSRS
   icacls "C:\inetpub\wwwroot\aula-virtual" /grant "IIS_IUSRS:(OI)(CI)RX" /T
   
   # Dar permisos al Application Pool Identity
   icacls "C:\inetpub\wwwroot\aula-virtual" /grant "IIS APPPOOL\Aula Virtual:(OI)(CI)RX" /T
   ```

2. **Verificar en IIS Manager:**
   - Seleccionar el sitio
   - Click en "Authentication"
   - Asegurar que "Anonymous Authentication" esté habilitado

### PASO 6: Configurar MIME Types (si es necesario)

En IIS Manager, selecciona el sitio y ve a "MIME Types". Asegúrate de tener:

```
.json     → application/json
.woff     → font/woff
.woff2    → font/woff2
.svg      → image/svg+xml
```

Si faltan, agrégalos manualmente.

### PASO 7: Configurar Compresión (Opcional pero Recomendado)

1. En IIS Manager, selecciona el sitio
2. Doble click en "Compression"
3. Habilitar:
   - ✅ Enable dynamic content compression
   - ✅ Enable static content compression

### PASO 8: Configurar SSL/HTTPS (Recomendado)

#### Opción A: Certificado Autofirmado (Solo para Testing)

```powershell
# Crear certificado
New-SelfSignedCertificate -DnsName "localhost", "tu-dominio.com" `
  -CertStoreLocation "cert:\LocalMachine\My" `
  -FriendlyName "Aula Virtual Dev"

# En IIS Manager:
# 1. Click derecho en el sitio → Edit Bindings
# 2. Add → Type: https, Port: 443, SSL certificate: [seleccionar]
```

#### Opción B: Certificado Real (Producción)

1. Obtener certificado de una CA (Let's Encrypt, Certbot, etc.)
2. Importar certificado en IIS
3. Agregar binding HTTPS con el certificado

#### Configurar Redirección HTTP → HTTPS

Agregar al `web.config` después de las reglas existentes:

```xml
<rule name="Redirect to HTTPS" stopProcessing="true">
  <match url="(.*)" />
  <conditions>
    <add input="{HTTPS}" pattern="off" ignoreCase="true" />
  </conditions>
  <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
</rule>
```

### PASO 9: Configurar CORS en el Backend

⚠️ **IMPORTANTE:** El CORS se configura en el backend NestJS, no en este proyecto frontend.

**Backend URL:** `https://royal-lms-backend.rsdev.site`

En tu backend NestJS (`main.ts`):

```typescript
app.enableCors({
  origin: [
    'http://tu-dominio.com',
    'https://tu-dominio.com',
    'http://localhost:4200',              // Desarrollo local
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
});
```

📖 **Ver configuración completa:** [`CONFIGURACION_CORS_BACKEND.md`](./CONFIGURACION_CORS_BACKEND.md)

### PASO 10: Reiniciar y Verificar

1. **Reiniciar el sitio en IIS:**
   ```powershell
   # PowerShell como Administrador
   Import-Module WebAdministration
   Restart-WebAppPool -Name "Aula Virtual"
   Stop-Website -Name "Aula Virtual"
   Start-Website -Name "Aula Virtual"
   ```

2. **Verificar en el navegador:**
   - http://tu-dominio.com (o http://localhost)
   - Verificar que cargue la aplicación
   - Probar navegación entre rutas
   - Verificar que el login funcione
   - Revisar la consola del navegador (F12)

## ✅ Checklist Final

- [ ] IIS instalado y corriendo
- [ ] URL Rewrite Module instalado
- [ ] Build de producción generado con API URL correcta
- [ ] Archivos copiados a `C:\inetpub\wwwroot\aula-virtual\`
- [ ] Archivo `web.config` en la raíz
- [ ] Sitio web creado en IIS
- [ ] Application Pool configurado (No Managed Code)
- [ ] Permisos de archivo configurados
- [ ] MIME Types verificados
- [ ] Compresión habilitada
- [ ] SSL configurado (si aplica)
- [ ] Backend configurado para aceptar peticiones
- [ ] Sitio testeado y funcionando

## 🔧 Comandos Útiles de PowerShell para IIS

```powershell
# Listar todos los sitios
Get-Website

# Verificar estado del sitio
Get-Website -Name "Aula Virtual"

# Iniciar/Detener sitio
Start-Website -Name "Aula Virtual"
Stop-Website -Name "Aula Virtual"

# Reiniciar Application Pool
Restart-WebAppPool -Name "Aula Virtual"

# Ver logs de IIS
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\*.log" -Tail 50

# Listar Application Pools
Get-IISAppPool

# Reciclar Application Pool
Restart-WebAppPool -Name "Aula Virtual"
```

## 🐛 Solución de Problemas Comunes

### Problema 1: Error 403 - Forbidden
**Causa:** Permisos de archivo incorrectos
**Solución:**
```powershell
icacls "C:\inetpub\wwwroot\aula-virtual" /grant "IIS_IUSRS:(OI)(CI)RX" /T
icacls "C:\inetpub\wwwroot\aula-virtual" /grant "IIS APPPOOL\Aula Virtual:(OI)(CI)RX" /T
```

### Problema 2: Error 404 en rutas de Angular
**Causa:** URL Rewrite no instalado o `web.config` incorrecto
**Solución:**
1. Instalar URL Rewrite Module
2. Verificar que `web.config` esté en la raíz
3. Reiniciar el sitio

### Problema 3: Archivos CSS/JS no cargan (Error 404)
**Causa:** MIME types faltantes o ruta base incorrecta
**Solución:**
1. Verificar MIME types en IIS
2. Verificar que todos los archivos estén copiados
3. Limpiar caché del navegador (Ctrl + Shift + Delete)

### Problema 4: Error 500 - Internal Server Error
**Causa:** Error en `web.config`
**Solución:**
1. Revisar sintaxis del `web.config`
2. Ver logs detallados:
   - IIS Manager → Sitio → Error Pages
   - Habilitar "Detailed errors"

### Problema 5: El sitio es lento
**Solución:**
1. Habilitar compresión en IIS
2. Configurar Application Pool en modo "AlwaysRunning"
3. Habilitar caché de contenido estático
4. Verificar que no haya antivirus bloqueando

### Problema 6: CORS Error
**Causa:** Backend no permite el origen del frontend  
**Solución:** Configura CORS en el backend NestJS

```typescript
// En backend NestJS main.ts
app.enableCors({
  origin: [
    'https://tu-dominio.com',
    'http://localhost:4200',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
});
```

📖 **Ver documentación completa:** [`CONFIGURACION_CORS_BACKEND.md`](./CONFIGURACION_CORS_BACKEND.md)

### Problema 7: WebSocket error (si usas SignalR o Socket.io)
**Solución:**
```powershell
# Habilitar WebSockets en Windows Features
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets
```

En `web.config`, agregar:
```xml
<system.webServer>
  <webSocket enabled="true" />
</system.webServer>
```

## 📊 Monitoreo y Logs

### Ver logs de IIS
```powershell
# Log de acceso
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\*.log" -Tail 50

# Log de errores de Windows
Get-EventLog -LogName Application -Source "IIS*" -Newest 20
```

### Habilitar logs detallados
En IIS Manager:
1. Sitio → Logging
2. Seleccionar campos a registrar
3. Guardar

## 🔄 Actualizar la Aplicación

Cuando necesites actualizar:

```powershell
# 1. Generar nuevo build
cd C:\Users\ASUS\aula-virtual-frontend
ng build --configuration production

# 2. Detener el sitio
Stop-Website -Name "Aula Virtual"

# 3. Hacer backup (opcional)
Copy-Item "C:\inetpub\wwwroot\aula-virtual" `
          "C:\inetpub\wwwroot\aula-virtual.backup" `
          -Recurse

# 4. Copiar nuevos archivos
Copy-Item -Path "dist\aula-virtual\browser\*" `
          -Destination "C:\inetpub\wwwroot\aula-virtual\" `
          -Recurse -Force

# 5. Reiniciar el sitio
Start-Website -Name "Aula Virtual"
Restart-WebAppPool -Name "Aula Virtual"
```

## 🔐 Seguridad Adicional

### Headers de Seguridad

Agregar al `web.config`:

```xml
<system.webServer>
  <httpProtocol>
    <customHeaders>
      <add name="X-Content-Type-Options" value="nosniff" />
      <add name="X-Frame-Options" value="SAMEORIGIN" />
      <add name="X-XSS-Protection" value="1; mode=block" />
      <add name="Strict-Transport-Security" value="max-age=31536000" />
      <remove name="X-Powered-By" />
    </customHeaders>
  </httpProtocol>
</system.webServer>
```

### Limitar tamaño de solicitudes

```xml
<system.webServer>
  <security>
    <requestFiltering>
      <requestLimits maxAllowedContentLength="52428800" /> <!-- 50 MB -->
    </requestFiltering>
  </security>
</system.webServer>
```

## 📱 Contacto y Soporte

Si encuentras problemas:
1. Revisar logs de IIS
2. Verificar consola del navegador (F12)
3. Verificar configuración del backend
4. Revisar firewall de Windows

## 🎯 Resumen Rápido

```powershell
# Todo en uno - Script de despliegue rápido
cd C:\Users\ASUS\aula-virtual-frontend

# Build
ng build --configuration production

# Copiar (ajustar ruta destino)
Copy-Item -Path "dist\aula-virtual\browser\*" -Destination "C:\inetpub\wwwroot\aula-virtual\" -Recurse -Force
Copy-Item -Path "web.config" -Destination "C:\inetpub\wwwroot\aula-virtual\"

# Reiniciar
Restart-WebAppPool -Name "Aula Virtual"
```

¡Listo! Tu aplicación Angular debería estar funcionando en IIS. 🎉

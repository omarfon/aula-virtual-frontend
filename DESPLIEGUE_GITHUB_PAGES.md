# 🚀 Despliegue en GitHub Pages

Esta guía explica cómo desplegar el frontend de Aula Virtual en GitHub Pages.

## 📋 Requisitos Previos

- Repositorio en GitHub: `https://github.com/RoyalSystems-Dev/royal-lms-frontend`
- Rama `main` (o `master`) como rama principal
- Acceso de escritura al repositorio

## 🌐 URL de Producción

Una vez desplegado, el sitio estará disponible en:
```
https://royalsystems-dev.github.io/royal-lms-frontend/
```

## ⚙️ Configuración Inicial

### 1. Habilitar GitHub Pages en el Repositorio

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Pages**
4. En **Source**, selecciona:
   - Source: **GitHub Actions**
5. Guarda los cambios

### 2. Verificar el Workflow de GitHub Actions

El archivo `.github/workflows/deploy.yml` ya está configurado y se ejecutará automáticamente cuando:
- Hagas `push` a la rama `main`
- Lo ejecutes manualmente desde GitHub Actions

### 3. Actualizar la URL del Backend para GitHub Pages

Crea un nuevo archivo de environment para GitHub Pages:

**Opción A: Usar el mismo backend de producción**

El archivo `environment.prod.ts` ya está configurado con:
```typescript
apiUrl: 'https://royal-lms-backend.rsdev.site'
```

**Opción B: Crear environment específico para GitHub Pages**

Puedes crear `src/environments/environment.github.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://royal-lms-backend.rsdev.site'
};
```

## 🚀 Proceso de Despliegue

### Despliegue Automático

1. **Hacer commit y push a main:**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

2. **Verificar el progreso:**
   - Ve a tu repositorio en GitHub
   - Click en la pestaña **Actions**
   - Verás el workflow "Deploy to GitHub Pages" en ejecución
   - Espera que termine (toma ~2-3 minutos)

3. **Acceder al sitio:**
   - Una vez completado, visita: `https://royalsystems-dev.github.io/royal-lms-frontend/`

### Despliegue Manual

1. Ve a tu repositorio en GitHub
2. Click en **Actions**
3. Selecciona el workflow "Deploy to GitHub Pages"
4. Click en **Run workflow** → **Run workflow**
5. Espera a que termine

## 🔧 Build Local para GitHub Pages

Si quieres probar el build localmente antes de desplegar:

```bash
# Build con base-href configurado para GitHub Pages
npm run build -- --configuration production --base-href /royal-lms-frontend/

# El resultado estará en: dist/aula-virtual/browser/
```

Para servir localmente y probar:
```bash
# Instalar http-server si no lo tienes
npm install -g http-server

# Servir el build
cd dist/aula-virtual/browser
http-server -p 8080
```

Abre: `http://localhost:8080`

## 🌍 Configuración CORS en el Backend

⚠️ **IMPORTANTE:** El backend debe permitir peticiones desde GitHub Pages.

Actualiza el backend para incluir la URL de GitHub Pages:

```typescript
// En main.ts del backend NestJS
app.enableCors({
  origin: [
    'http://localhost:4200',                              // Desarrollo local
    'https://royalsystems-dev.github.io',                // GitHub Pages (dominio principal)
    'https://royal-lms-backend.rsdev.site',              // Backend
  ],
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
});
```

📖 Ver [`CONFIGURACION_CORS_BACKEND.md`](./CONFIGURACION_CORS_BACKEND.md) para más detalles.

## 📝 Scripts NPM Útiles

Agrega estos scripts a `package.json`:

```json
{
  "scripts": {
    "build:github": "ng build --configuration production --base-href /royal-lms-frontend/",
    "deploy:github": "npm run build:github && npx angular-cli-ghpages --dir=dist/aula-virtual/browser"
  }
}
```

## 🐛 Solución de Problemas

### Problema: 404 en las rutas al recargar

**Causa:** GitHub Pages no soporta Single Page Applications (SPA) nativamente.

**Solución:** El archivo `404.html` debe redirigir a `index.html`. Esto ya está configurado en el workflow.

### Problema: Recursos no cargan (CSS, JS)

**Causa:** El `base-href` no está configurado correctamente.

**Solución:** 
- Verifica que el build use `--base-href /royal-lms-frontend/`
- Asegúrate que `index.html` tenga: `<base href="/royal-lms-frontend/">`

### Problema: Error de CORS

**Causa:** El backend no permite peticiones desde GitHub Pages.

**Solución:** Agrega la URL de GitHub Pages al CORS del backend (ver sección CORS arriba).

### Problema: El workflow falla en GitHub Actions

**Soluciones:**
1. Verifica que GitHub Pages esté habilitado en Settings
2. Asegúrate que la fuente sea "GitHub Actions"
3. Revisa los logs en la pestaña Actions para ver el error específico
4. Verifica permisos del workflow en Settings → Actions → General

### Problema: Cambios no se reflejan

**Solución:**
1. Espera 1-2 minutos para que GitHub Pages actualice el caché
2. Limpia caché del navegador (Ctrl + Shift + R)
3. Verifica que el workflow haya terminado exitosamente

## 📊 Monitoreo del Despliegue

### Ver estado del despliegue:
1. Repositorio → **Actions**
2. Click en el último workflow run
3. Revisa los logs de cada step

### Ver el sitio desplegado:
1. Repositorio → **Settings** → **Pages**
2. Verás la URL activa: `https://royalsystems-dev.github.io/royal-lms-frontend/`
3. Click en "Visit site"

## 🔄 Actualizar el Sitio

Cada vez que hagas push a `main`, el sitio se actualizará automáticamente:

```bash
# 1. Hacer cambios en el código
git add .
git commit -m "Actualización de funcionalidad XYZ"
git push origin main

# 2. El workflow se ejecuta automáticamente
# 3. En ~2-3 minutos el sitio estará actualizado
```

## 🌟 Ventajas de GitHub Pages

✅ **Gratis** - Sin costo de hosting  
✅ **SSL automático** - HTTPS incluido  
✅ **CI/CD integrado** - Despliegue automático con cada push  
✅ **CDN global** - Rápido en todo el mundo  
✅ **Sin configuración de servidor** - GitHub maneja todo  

## 📚 Recursos

- [GitHub Pages Documentation](https://docs.github.com/es/pages)
- [GitHub Actions for Pages](https://github.com/actions/deploy-pages)
- [Angular Deployment Guide](https://angular.io/guide/deployment)
- [Configuración CORS del Backend](./CONFIGURACION_CORS_BACKEND.md)

## ✅ Checklist de Despliegue

Antes de desplegar, verifica:

- [ ] GitHub Pages habilitado en el repositorio
- [ ] Source configurado como "GitHub Actions"
- [ ] Archivo `.github/workflows/deploy.yml` en el repositorio
- [ ] Backend con CORS configurado para GitHub Pages
- [ ] `environment.prod.ts` con la URL correcta del backend
- [ ] Código commiteado y pusheado a `main`
- [ ] Workflow ejecutado sin errores
- [ ] Sitio accesible en `https://royalsystems-dev.github.io/royal-lms-frontend/`
- [ ] Funcionalidad probada en producción

## 🎯 Próximos Pasos

Después del primer despliegue:

1. **Probar todas las funcionalidades** en la URL de GitHub Pages
2. **Configurar dominio personalizado** (opcional):
   - Settings → Pages → Custom domain
   - Ejemplo: `lms.tu-dominio.com`
3. **Configurar analytics** (opcional):
   - Google Analytics
   - Hotjar
4. **Monitoreo de errores**:
   - Sentry
   - LogRocket

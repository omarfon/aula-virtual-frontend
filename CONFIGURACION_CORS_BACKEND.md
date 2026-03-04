# Configuración CORS para el Backend

## ⚠️ IMPORTANTE
Esta configuración debe aplicarse en el **BACKEND** (repositorio NestJS), no en este repositorio de frontend.

## URL del Frontend en Producción
El frontend puede estar desplegado en:
- **GitHub Pages:** `https://royalsystems-dev.github.io/royal-lms-frontend/`
- **Otro dominio:** `https://tu-dominio-frontend.com` (reemplazar con tu dominio real)
- **Desarrollo:** `http://localhost:4200`

## Configuración en main.ts del Backend

En el archivo `main.ts` de tu backend NestJS, configura CORS de la siguiente manera:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de CORS
  app.enableCors({
    origin: [
      'http://localhost:4200',                              // Angular dev server
      'http://localhost:4201',                              // Servidor alternativo
      'https://royalsystems-dev.github.io',                // GitHub Pages
      'https://tu-dominio-frontend.com',                   // 🔴 REEMPLAZAR con tu dominio de producción
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
  });

  // Prefijo global de API (opcional)
  app.setGlobalPrefix('api');

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  await app.listen(3001);
  console.log(`✅ Backend corriendo en: http://localhost:3001`);
}

bootstrap();
```

## Configuración para Producción

Si usas variables de entorno, crea un archivo `.env` en el backend:

```env
# .env
PORT=3001
FRONTEND_URL=https://tu-dominio-frontend.com
NODE_ENV=production
```

Y luego en `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // URLs permitidas dinámicamente
  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:4201',
    'https://royalsystems-dev.github.io',
    configService.get('FRONTEND_URL') || 'https://tu-dominio-frontend.com',
  ];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  const port = configService.get('PORT') || 3001;
  await app.listen(port);
  console.log(`✅ Backend corriendo en puerto: ${port}`);
  console.log(`✅ CORS habilitado para:`, allowedOrigins);
}

bootstrap();
```

## Verificación

Después de configurar CORS en el backend:

1. **Reinicia el servidor backend:**
   ```bash
   npm run start:dev
   ```

2. **Verifica los logs** que confirmen que CORS está habilitado

3. **Prueba una petición** desde el frontend:
   - Abre el navegador en `http://localhost:4200`
   - Abre las DevTools (F12) → Pestaña Network
   - Verifica que las peticiones HTTP tengan los headers CORS correctos:
     - `Access-Control-Allow-Origin`
     - `Access-Control-Allow-Methods`
     - `Access-Control-Allow-Credentials`

## Problemas Comunes

### Error: "has been blocked by CORS policy"

**Causa:** El backend no está configurado para permitir peticiones desde tu frontend.

**Solución:** 
1. Verifica que la URL del frontend esté en el array `origin`
2. Asegúrate de incluir el protocolo correcto (`http://` o `https://`)
3. No incluyas barras finales: ❌ `http://localhost:4200/` → ✅ `http://localhost:4200`

### Error: "credentials mode is 'include'"

**Causa:** El frontend envía `credentials: true` pero el backend no lo permite.

**Solución:**
```typescript
app.enableCors({
  //... otras configuraciones
  credentials: true, // ✅ Debe estar en true
});
```

### Permitir CUALQUIER origen (⚠️ Solo para desarrollo)

```typescript
// ⚠️ NUNCA en producción
app.enableCors({
  origin: '*', // Permite cualquier origen
  credentials: false,
});
```

## Checklist de Configuración

- [ ] CORS habilitado en `main.ts` del backend
- [ ] URL del frontend de producción agregada al array `origin`
- [ ] `credentials: true` configurado
- [ ] Backend reiniciado después de los cambios
- [ ] Peticiones probadas desde el frontend
- [ ] Headers CORS verificados en DevTools
- [ ] No hay errores de CORS en la consola del navegador

## Backend Desplegado en rsdev.site

Si tu backend está en `https://royal-lms-backend.rsdev.site`, recuerda que debes agregar la URL de tu frontend de producción en la configuración CORS del backend.

**Ejemplo:**
```typescript
app.enableCors({
  origin: [
    'http://localhost:4200',
    'https://tu-frontend.rsdev.site', // Tu dominio de frontend
    'https://otro-dominio-si-aplica.com',
  ],
  // ... resto de configuración
});
```

## Recursos

- [NestJS CORS Documentation](https://docs.nestjs.com/security/cors)
- [MDN - CORS](https://developer.mozilla.org/es/docs/Web/HTTP/CORS)
- [Express CORS middleware](https://expressjs.com/en/resources/middleware/cors.html)

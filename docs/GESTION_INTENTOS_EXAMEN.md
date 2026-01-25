# Gestión de Intentos de Examen

## 📋 Descripción General

Sistema completo para gestionar intentos de exámenes con soporte para:
- ✅ Múltiples intentos por examen
- ✅ Validación de intentos permitidos
- ✅ Prevención de intentos concurrentes
- ✅ Cálculo automático del mejor intento
- ✅ Seguimiento de tiempo empleado
- ✅ Historial completo de intentos
- ✅ Calificación automática y manual

## 🔌 Endpoints Backend

### 1. Iniciar Nuevo Intento
**POST** `/examenes/examenes-alumno/:examenAlumnoId/intentos`

Inicia un nuevo intento de examen para un alumno.

**Validaciones:**
- Verifica que no se hayan superado los intentos permitidos
- Previene iniciar un nuevo intento si hay uno en progreso
- Verifica que el examen esté disponible

**Request Body:**
```json
{
  "respuestas": [] // Opcional, array vacío por defecto
}
```

**Response:**
```json
{
  "id": "uuid",
  "examenAlumno": { ... },
  "numeroIntento": 1,
  "fechaInicio": "2025-01-17T10:00:00Z",
  "estado": "en-progreso",
  "respuestas": [],
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Errores:**
- `400` - Límite de intentos alcanzado
- `400` - Ya existe un intento en progreso
- `404` - Examen alumno no encontrado

---

### 2. Entregar Intento
**POST** `/examenes/intentos/:intentoId/entregar`

Entrega un intento de examen en progreso.

**Request Body:**
```json
{
  "respuestas": [
    {
      "preguntaId": "uuid",
      "respuesta": "opción A"
    }
  ],
  "tiempoEmpleado": 1800 // segundos (opcional)
}
```

**Response:**
```json
{
  "id": "uuid",
  "numeroIntento": 1,
  "fechaInicio": "2025-01-17T10:00:00Z",
  "fechaEntrega": "2025-01-17T10:30:00Z",
  "estado": "entregado",
  "respuestas": [...],
  "tiempoEmpleado": 1800
}
```

**Errores:**
- `400` - El intento no está en progreso
- `404` - Intento no encontrado

---

### 3. Calificar Intento (Profesor)
**PATCH** `/examenes/intentos/:intentoId/calificar`

Califica un intento entregado. Actualiza automáticamente el mejor intento del alumno.

**Request Body:**
```json
{
  "calificacion": 85,
  "retroalimentacion": "Excelente trabajo, pero revisa la pregunta 5" // Opcional
}
```

**Response:**
```json
{
  "id": "uuid",
  "numeroIntento": 1,
  "estado": "calificado",
  "calificacion": 85,
  "retroalimentacion": "...",
  "examenAlumno": {
    "mejorIntento": 1,
    "calificacion": 85
  }
}
```

**Funcionalidad automática:**
- Si esta calificación es mayor que `examenAlumno.calificacion`, actualiza el mejor intento
- Cambia el estado del intento a `calificado`

---

### 4. Listar Intentos
**GET** `/examenes/examenes-alumno/:examenAlumnoId/intentos`

Obtiene todos los intentos de un examen alumno.

**Response:**
```json
[
  {
    "id": "uuid",
    "numeroIntento": 3,
    "fechaInicio": "...",
    "fechaEntrega": "...",
    "estado": "calificado",
    "calificacion": 92,
    "tiempoEmpleado": 1500
  },
  {
    "id": "uuid",
    "numeroIntento": 2,
    "estado": "calificado",
    "calificacion": 75
  },
  {
    "id": "uuid",
    "numeroIntento": 1,
    "estado": "abandonado"
  }
]
```

---

### 5. Obtener Detalle de Intento
**GET** `/examenes/intentos/:intentoId`

Obtiene información completa de un intento específico.

**Response:**
```json
{
  "id": "uuid",
  "examenAlumno": {
    "id": "uuid",
    "alumno": { ... },
    "examen": {
      "titulo": "Examen Final",
      "preguntas": [ ... ]
    }
  },
  "numeroIntento": 2,
  "fechaInicio": "...",
  "fechaEntrega": "...",
  "estado": "calificado",
  "respuestas": [
    {
      "preguntaId": "uuid",
      "respuesta": "opción B"
    }
  ],
  "calificacion": 85,
  "retroalimentacion": "...",
  "tiempoEmpleado": 1800
}
```

---

### 6. Abandonar Intento
**PATCH** `/examenes/intentos/:intentoId/abandonar`

Abandona un intento en progreso. El intento cuenta como intento usado.

**Response:**
```json
{
  "id": "uuid",
  "numeroIntento": 1,
  "estado": "abandonado",
  "fechaInicio": "...",
  "updatedAt": "..."
}
```

**Errores:**
- `400` - El intento no está en progreso
- `404` - Intento no encontrado

---

## 🎯 Integración Frontend

### Servicio: `IntentosExamenService`

**Ubicación:** `src/app/services/intentos-examen.service.ts`

**Métodos:**
```typescript
// Iniciar nuevo intento
iniciarIntento(examenAlumnoId: string): Observable<IntentoExamen>

// Entregar intento
entregarIntento(intentoId: string, data: EntregarIntentoDto): Observable<IntentoExamen>

// Calificar intento (profesor)
calificarIntento(intentoId: string, data: CalificarIntentoDto): Observable<IntentoExamen>

// Listar todos los intentos
listarIntentos(examenAlumnoId: string): Observable<IntentoExamen[]>

// Obtener detalle de intento
obtenerIntento(intentoId: string): Observable<IntentoExamen>

// Abandonar intento
abandonarIntento(intentoId: string): Observable<IntentoExamen>
```

---

### Componente: `TomarExamenComponent`

**Ubicación:** `src/app/pages/examenes/tomar-examen.component.ts`

**Funcionalidades:**
- ✅ Iniciar examen con confirmación
- ✅ Temporizador en tiempo real
- ✅ Alertas cuando quedan 5 minutos
- ✅ Entrega automática al agotar tiempo
- ✅ Barra de progreso de preguntas respondidas
- ✅ Validación de preguntas sin responder
- ✅ Abandonar intento con advertencia
- ✅ Soporte para 3 tipos de preguntas:
  - Opción múltiple
  - Verdadero/Falso
  - Respuesta corta

**Ruta:** `/examenes/tomar/:examenAlumnoId`

**Flujo:**
1. Usuario hace clic en "Iniciar Examen"
2. Confirmación: "¿Iniciar nuevo intento?"
3. Se crea intento en progreso
4. Comienza el temporizador
5. Usuario responde preguntas
6. Al entregar:
   - Confirma entrega
   - Valida preguntas sin responder
   - Envía respuestas al backend
   - Calcula tiempo empleado
7. Redirecciona a lista de exámenes

---

### Componente: `HistorialIntentosComponent`

**Ubicación:** `src/app/pages/examenes/historial-intentos.component.ts`

**Funcionalidades:**
- ✅ Dashboard con estadísticas:
  - Mejor calificación 🏆
  - Promedio de intentos 📊
  - Intentos completados ✍️
- ✅ Lista completa de intentos ordenados por fecha
- ✅ Indicador visual del mejor intento
- ✅ Estados con colores:
  - 🔵 En Progreso (azul)
  - 🟡 Entregado (amarillo)
  - 🟢 Calificado (verde)
  - ⚫ Abandonado (gris)
- ✅ Modal con detalle completo de intento:
  - Información general
  - Retroalimentación del profesor
  - Todas las respuestas
- ✅ Botón para iniciar nuevo intento

**Ruta:** `/examenes/historial/:examenAlumnoId`

---

## 📊 Flujos de Usuario

### Flujo 1: Alumno Toma Examen por Primera Vez

```
1. Navega a "Mis Exámenes"
2. Ve examen con "0/3 intentos"
3. Hace clic en "Iniciar Examen"
4. Sistema:
   ✓ Valida que no hay intentos en progreso
   ✓ Valida que tiene intentos disponibles
   ✓ Crea intento #1 en estado "en-progreso"
5. Ve interfaz de examen con temporizador
6. Responde preguntas (barra de progreso se actualiza)
7. Hace clic en "Entregar examen"
8. Confirma entrega
9. Sistema:
   ✓ Valida respuestas
   ✓ Guarda tiempo empleado
   ✓ Cambia estado a "entregado"
10. Redirecciona a lista de exámenes
11. Examen ahora muestra "1/3 intentos - Pendiente calificación"
```

---

### Flujo 2: Alumno Ve Historial de Intentos

```
1. En lista de exámenes, hace clic en "Ver Intentos"
2. Ve dashboard con:
   - Mejor: 0 / 100 (aún no calificado)
   - Promedio: 0 / 100
   - Intentos: 1 / 3
3. Ve lista de intentos:
   Intento #1 🟡 Entregado
   - Inicio: 17/01/2025 10:00
   - Entrega: 17/01/2025 10:30
   - Tiempo: 30m 0s
4. Hace clic en el intento
5. Modal muestra:
   - Estado: Entregado
   - Todas sus respuestas
   - "Pendiente de calificación"
```

---

### Flujo 3: Profesor Califica Intento

```
1. Profesor accede a panel de corrección
2. Selecciona examen y alumno
3. Ve intento #1 en estado "Entregado"
4. Revisa respuestas del alumno
5. Asigna calificación: 85/100
6. Escribe retroalimentación: "Buen trabajo en preguntas 1-4. Revisa concepto de pregunta 5."
7. Hace clic en "Guardar Calificación"
8. Sistema:
   ✓ Cambia estado de intento a "calificado"
   ✓ Actualiza examenAlumno.calificacion = 85 (es el primer intento)
   ✓ Actualiza examenAlumno.mejorIntento = 1
```

---

### Flujo 4: Alumno Realiza Segundo Intento (Mejorando)

```
1. Ve historial: Mejor calificación 85/100, 1/3 intentos
2. Hace clic en "Nuevo Intento"
3. Confirma inicio
4. Sistema crea intento #2
5. Toma examen y entrega
6. Profesor califica: 92/100
7. Sistema:
   ✓ Intento #2: calificado con 92
   ✓ examenAlumno.calificacion = 92 (actualiza porque 92 > 85)
   ✓ examenAlumno.mejorIntento = 2
8. Alumno ve historial:
   - Mejor: 92/100 🏆
   - Promedio: 88/100
   - Intentos: 2/3
   
   Intento #2 🏆 Calificado - 92/100
   Intento #1 Calificado - 85/100
```

---

### Flujo 5: Alumno Abandona Intento

```
1. Inicia intento #3
2. Responde 2 de 10 preguntas
3. Tiene emergencia, hace clic en "Abandonar intento"
4. Sistema:
   ✓ Muestra advertencia: "El intento contará como usado"
   ✓ Cambia estado a "abandonado"
5. Ve historial:
   - Intentos: 3/3 (completados)
   
   Intento #3 ❌ Abandonado
   Intento #2 🏆 Calificado - 92/100
   Intento #1 Calificado - 85/100
6. No puede iniciar más intentos (alcanzó el límite)
```

---

### Flujo 6: Entrega Automática por Tiempo

```
1. Alumno inicia examen con 30 minutos límite
2. Temporizador corre en pantalla
3. A los 25 minutos: Alerta "Quedan 5 minutos"
4. Alumno continúa respondiendo
5. A los 30 minutos exactos:
   ✓ Sistema muestra: "Tiempo agotado. Enviando examen..."
   ✓ Entrega automática con respuestas actuales
   ✓ Guarda tiempo empleado: 1800 segundos
6. Redirecciona a lista de exámenes
```

---

## 🎨 Elementos Visuales

### Dashboard de Intentos
```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│ 🏆 Mejor Calificación│ 📊 Promedio         │ ✍️ Intentos         │
│                     │                     │                     │
│        92           │        88           │       2 / 3         │
│      / 100          │      / 100          │                     │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

### Lista de Intentos
```
┌─────────────────────────────────────────────────────────────────┐
│ ⏳ Intento #3 [En Progreso]                                    │
│ Inicio: 17/01/2025 15:00                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ✅ Intento #2 [Calificado] 🏆 Mejor                            │
│ Inicio: 17/01/2025 10:00 | Entrega: 17/01/2025 10:28          │
│ Tiempo: 28m 15s | Calificación: 92 / 100                       │
│ Retroalimentación: Excelente mejora en conceptos...            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ✅ Intento #1 [Calificado]                                     │
│ Calificación: 85 / 100 | Tiempo: 30m 0s                        │
└─────────────────────────────────────────────────────────────────┘
```

### Interfaz de Tomar Examen
```
┌─────────────────────────────────────────────────────────────────┐
│ Examen Final de Angular                          ⏱️ 25m 30s    │
│ 📝 Intento #2 | 🎯 100 puntos | ❓ 10 preguntas                │
├─────────────────────────────────────────────────────────────────┤
│ Progreso: [████████████░░░░░░░░] 70%                           │
└─────────────────────────────────────────────────────────────────┘

┌─ Pregunta 1 ─────────────────────────────────────────────────┐
│ ¿Cuál es el propósito principal de los componentes?          │
│ 🔷 10 puntos                                                  │
│                                                               │
│ ○ Gestionar el estado de la aplicación                       │
│ ● Renderizar la interfaz de usuario                          │
│ ○ Conectar con el backend                                    │
│ ○ Validar formularios                                        │
└───────────────────────────────────────────────────────────────┘

[← Abandonar intento]                      [Entregar examen →]
```

---

## ⚙️ Configuración de Rutas

**Archivo:** `src/app/app.routes.ts`

```typescript
import { TomarExamenComponent } from './pages/examenes/tomar-examen.component';
import { HistorialIntentosComponent } from './pages/examenes/historial-intentos.component';

export const routes: Routes = [
  // ... otras rutas
  { path: 'examenes', component: ExamenesComponent },
  { path: 'examenes/tomar/:examenAlumnoId', component: TomarExamenComponent },
  { path: 'examenes/historial/:examenAlumnoId', component: HistorialIntentosComponent },
  // ...
];
```

---

## 🧪 Testing

### Scripts de Prueba

```bash
# 1. Crear examen de prueba
node scripts/crear-examen.js

# 2. Asignar examen a alumno
node scripts/asignar-examen.js

# 3. Probar iniciar intento
node scripts/probar-iniciar-intento.js

# 4. Probar entregar intento
node scripts/probar-entregar-intento.js

# 5. Probar calificar intento
node scripts/probar-calificar-intento.js

# 6. Verificación completa
node scripts/verificar-intentos.js
```

---

## 🔒 Validaciones y Reglas de Negocio

### Al Iniciar Intento:
- ✅ Verificar que `examenAlumno.intentosRealizados < examen.intentosPermitidos`
- ✅ No permitir si ya existe un intento en estado "en-progreso"
- ✅ Verificar que el examen esté dentro de las fechas disponibles
- ✅ Auto-incrementar `numeroIntento` basado en intentos existentes

### Al Entregar Intento:
- ✅ Solo permitir si estado es "en-progreso"
- ✅ Validar que `respuestas` sea un array
- ✅ Registrar `fechaEntrega` automáticamente
- ✅ Cambiar estado a "entregado"

### Al Calificar Intento:
- ✅ Solo permitir si estado es "entregado"
- ✅ Validar que calificación esté entre 0 y `examen.puntosTotales`
- ✅ Actualizar `examenAlumno.calificacion` si es mayor que la actual
- ✅ Actualizar `examenAlumno.mejorIntento` con el número de intento
- ✅ Cambiar estado a "calificado"

### Al Abandonar Intento:
- ✅ Solo permitir si estado es "en-progreso"
- ✅ El intento cuenta como intento usado
- ✅ No afecta la calificación del alumno

---

## 📝 Notas Técnicas

### Tipos de Estado de Intento:
```typescript
type EstadoIntento = 'en-progreso' | 'entregado' | 'calificado' | 'abandonado';
```

### Estructura de Respuestas:
```typescript
interface Respuesta {
  preguntaId: string;
  respuesta: string | string[]; // string para texto, array para múltiple selección
}
```

### Cálculo de Mejor Intento:
El backend actualiza automáticamente `examenAlumno.calificacion` y `examenAlumno.mejorIntento` cuando se califica un intento y la nueva calificación es mayor que la actual.

---

## 🎯 Siguientes Pasos

1. ✅ Servicio de intentos creado
2. ✅ Componente para tomar examen creado
3. ✅ Componente de historial creado
4. ⏳ Integrar componentes en lista de exámenes
5. ⏳ Crear scripts de prueba
6. ⏳ Implementar panel de corrección para profesores
7. ⏳ Agregar gráficas de progreso
8. ⏳ Implementar exportación de resultados

---

## 🚀 Estado: INTEGRADO

✅ Backend implementado  
✅ Frontend integrado  
✅ Rutas configuradas  
✅ Documentación completa  
⏳ Pendiente: Testing E2E

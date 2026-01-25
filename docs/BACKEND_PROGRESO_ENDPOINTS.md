# 📊 Endpoints del Backend para Progreso

## Resumen

El servicio de progreso ahora usa el backend para persistir los datos en la base de datos. Estos son los endpoints que debes implementar en el backend NestJS.

## Endpoints Requeridos

### 1. GET `/progreso/:alumnoId/curso/:cursoId`
**Descripción**: Obtiene el progreso de un alumno en un curso específico

**Response 200**:
```json
{
  "id": "prog-123",
  "alumnoId": "alumno-demo-001",
  "cursoId": "curso-123",
  "fechaInscripcion": "2024-01-15T10:30:00Z",
  "ultimoAcceso": "2024-01-20T14:45:00Z",
  "estado": "en-progreso",
  "progresoGeneral": 45,
  "temasCompletados": [
    {
      "temaId": "tema-1",
      "unidadId": "unidad-1",
      "completado": true,
      "fechaCompletado": "2024-01-18T16:20:00Z"
    }
  ],
  "contenidosVistos": [
    {
      "contenidoId": "cont-1",
      "temaId": "tema-1",
      "visto": true,
      "fechaVisto": "2024-01-18T16:15:00Z"
    }
  ]
}
```

**Response 404**: Si no existe progreso (el frontend creará uno nuevo con POST)

---

### 2. POST `/progreso`
**Descripción**: Crea un nuevo registro de progreso

**Request Body**:
```json
{
  "alumnoId": "alumno-demo-001",
  "cursoId": "curso-123",
  "fechaInscripcion": "2024-01-20T10:00:00Z",
  "ultimoAcceso": "2024-01-20T10:00:00Z",
  "estado": "no-iniciado",
  "progresoGeneral": 0,
  "temasCompletados": [],
  "contenidosVistos": []
}
```

**Response 201**:
```json
{
  "id": "prog-456",
  "alumnoId": "alumno-demo-001",
  "cursoId": "curso-123",
  ...
}
```

---

### 3. PATCH `/progreso/:alumnoId/curso/:cursoId/tema`
**Descripción**: Marca un tema como completado o no completado

**Request Body**:
```json
{
  "cursoId": "curso-123",
  "unidadId": "unidad-1",
  "temaId": "tema-5",
  "completado": true
}
```

**Lógica del Backend**:
- Si `completado: true`: Agregar/actualizar en el array `temasCompletados`
- Si `completado: false`: Remover del array
- Actualizar `ultimoAcceso` con fecha actual
- Recalcular `progresoGeneral` (porcentaje de temas completados)
- Actualizar `estado` si corresponde:
  - `"no-iniciado"` → `"en-progreso"` al primer tema
  - `"en-progreso"` → `"completado"` al 100%

**Response 200**: Objeto `ProgresoAlumno` completo actualizado

---

### 4. PATCH `/progreso/:alumnoId/curso/:cursoId/contenido`
**Descripción**: Marca un contenido como visto

**Request Body**:
```json
{
  "cursoId": "curso-123",
  "contenidoId": "cont-8",
  "temaId": "tema-3",
  "visto": true
}
```

**Lógica del Backend**:
- Agregar/actualizar en el array `contenidosVistos`
- Establecer `fechaVisto` con fecha actual
- Actualizar `ultimoAcceso`
- **NO** recalcular `progresoGeneral` aquí (solo los temas completos cuentan)

**Response 200**: Objeto `ProgresoAlumno` completo actualizado

---

### 5. DELETE `/progreso/:alumnoId/curso/:cursoId`
**Descripción**: Resetea el progreso de un curso (útil para testing)

**Response 204**: Sin contenido

---

## Modelo de Datos (TypeORM/Prisma)

```typescript
// progreso.entity.ts
export class ProgresoAlumno {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  alumnoId: string;

  @Column()
  cursoId: string;

  @Column({ type: 'timestamp' })
  fechaInscripcion: Date;

  @Column({ type: 'timestamp' })
  ultimoAcceso: Date;

  @Column({ 
    type: 'enum', 
    enum: ['no-iniciado', 'en-progreso', 'completado', 'abandonado'] 
  })
  estado: string;

  @Column({ type: 'int', default: 0 })
  progresoGeneral: number;

  @Column({ type: 'jsonb', default: [] })
  temasCompletados: TemaCompletado[];

  @Column({ type: 'jsonb', default: [] })
  contenidosVistos: ContenidoVisto[];
}

interface TemaCompletado {
  temaId: string;
  unidadId: string;
  completado: boolean;
  fechaCompletado?: Date;
}

interface ContenidoVisto {
  contenidoId: string;
  temaId: string;
  visto: boolean;
  fechaVisto?: Date;
}
```

---

## Controlador de Ejemplo (NestJS)

```typescript
// progreso.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ProgresoService } from './progreso.service';
import { MarcarTemaDto, MarcarContenidoDto } from './dto';

@Controller('progreso')
export class ProgresoController {
  constructor(private readonly progresoService: ProgresoService) {}

  @Get(':alumnoId/curso/:cursoId')
  async obtenerProgreso(
    @Param('alumnoId') alumnoId: string,
    @Param('cursoId') cursoId: string
  ) {
    return this.progresoService.obtenerProgreso(alumnoId, cursoId);
  }

  @Post()
  async crearProgreso(@Body() dto: any) {
    return this.progresoService.crearProgreso(dto);
  }

  @Patch(':alumnoId/curso/:cursoId/tema')
  async marcarTema(
    @Param('alumnoId') alumnoId: string,
    @Param('cursoId') cursoId: string,
    @Body() dto: MarcarTemaDto
  ) {
    return this.progresoService.marcarTemaCompletado(alumnoId, cursoId, dto);
  }

  @Patch(':alumnoId/curso/:cursoId/contenido')
  async marcarContenido(
    @Param('alumnoId') alumnoId: string,
    @Param('cursoId') cursoId: string,
    @Body() dto: MarcarContenidoDto
  ) {
    return this.progresoService.marcarContenidoVisto(alumnoId, cursoId, dto);
  }

  @Delete(':alumnoId/curso/:cursoId')
  async resetearProgreso(
    @Param('alumnoId') alumnoId: string,
    @Param('cursoId') cursoId: string
  ) {
    await this.progresoService.resetearProgreso(alumnoId, cursoId);
    return { message: 'Progreso reseteado' };
  }
}
```

---

## DTOs para Validación

```typescript
// dto/marcar-tema.dto.ts
export class MarcarTemaDto {
  @IsString()
  cursoId: string;

  @IsString()
  unidadId: string;

  @IsString()
  temaId: string;

  @IsBoolean()
  completado: boolean;
}

// dto/marcar-contenido.dto.ts
export class MarcarContenidoDto {
  @IsString()
  cursoId: string;

  @IsString()
  contenidoId: string;

  @IsString()
  temaId: string;

  @IsBoolean()
  visto: boolean;
}
```

---

## Servicio Backend (Lógica de Negocio)

```typescript
// progreso.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgresoAlumno } from './progreso.entity';

@Injectable()
export class ProgresoService {
  constructor(
    @InjectRepository(ProgresoAlumno)
    private progresoRepo: Repository<ProgresoAlumno>
  ) {}

  async obtenerProgreso(alumnoId: string, cursoId: string) {
    const progreso = await this.progresoRepo.findOne({
      where: { alumnoId, cursoId }
    });
    
    if (!progreso) {
      throw new NotFoundException('Progreso no encontrado');
    }
    
    return progreso;
  }

  async crearProgreso(dto: any) {
    const progreso = this.progresoRepo.create(dto);
    return this.progresoRepo.save(progreso);
  }

  async marcarTemaCompletado(alumnoId: string, cursoId: string, dto: MarcarTemaDto) {
    const progreso = await this.obtenerProgreso(alumnoId, cursoId);
    
    // Buscar si ya existe
    const index = progreso.temasCompletados.findIndex(
      t => t.temaId === dto.temaId && t.unidadId === dto.unidadId
    );

    if (dto.completado) {
      const temaData = {
        temaId: dto.temaId,
        unidadId: dto.unidadId,
        completado: true,
        fechaCompletado: new Date()
      };

      if (index !== -1) {
        progreso.temasCompletados[index] = temaData;
      } else {
        progreso.temasCompletados.push(temaData);
      }
    } else {
      // Remover si existe
      if (index !== -1) {
        progreso.temasCompletados.splice(index, 1);
      }
    }

    // Actualizar fechas y estado
    progreso.ultimoAcceso = new Date();
    
    // Recalcular progreso (necesitas saber el total de temas del curso)
    // progreso.progresoGeneral = calcularPorcentaje(...);
    
    return this.progresoRepo.save(progreso);
  }

  async marcarContenidoVisto(alumnoId: string, cursoId: string, dto: MarcarContenidoDto) {
    const progreso = await this.obtenerProgreso(alumnoId, cursoId);
    
    const index = progreso.contenidosVistos.findIndex(
      c => c.contenidoId === dto.contenidoId && c.temaId === dto.temaId
    );

    const contenidoData = {
      contenidoId: dto.contenidoId,
      temaId: dto.temaId,
      visto: dto.visto,
      fechaVisto: new Date()
    };

    if (index !== -1) {
      progreso.contenidosVistos[index] = contenidoData;
    } else {
      progreso.contenidosVistos.push(contenidoData);
    }

    progreso.ultimoAcceso = new Date();
    
    return this.progresoRepo.save(progreso);
  }

  async resetearProgreso(alumnoId: string, cursoId: string) {
    const progreso = await this.obtenerProgreso(alumnoId, cursoId);
    await this.progresoRepo.remove(progreso);
  }
}
```

---

## Seguridad y Validaciones

### Importante:
- **Autenticación**: Los endpoints deben requerir autenticación (JWT, session, etc.)
- **Autorización**: Verificar que el alumno solo pueda modificar su propio progreso
- **Validación**: Los DTOs deben validar que `temaId`, `unidadId`, `contenidoId` existan en la BD
- **Rate Limiting**: Limitar la frecuencia de marcado automático para prevenir abuso
- **Transacciones**: Usar transacciones al actualizar múltiples campos

---

## Pruebas con cURL

```bash
# Crear progreso
curl -X POST http://localhost:3001/progreso \
  -H "Content-Type: application/json" \
  -d '{
    "alumnoId": "alumno-demo-001",
    "cursoId": "curso-1",
    "fechaInscripcion": "2024-01-20T10:00:00Z",
    "ultimoAcceso": "2024-01-20T10:00:00Z",
    "estado": "no-iniciado",
    "progresoGeneral": 0,
    "temasCompletados": [],
    "contenidosVistos": []
  }'

# Obtener progreso
curl http://localhost:3001/progreso/alumno-demo-001/curso/curso-1

# Marcar tema completado
curl -X PATCH http://localhost:3001/progreso/alumno-demo-001/curso/curso-1/tema \
  -H "Content-Type: application/json" \
  -d '{
    "cursoId": "curso-1",
    "unidadId": "unidad-1",
    "temaId": "tema-1",
    "completado": true
  }'

# Marcar contenido visto
curl -X PATCH http://localhost:3001/progreso/alumno-demo-001/curso/curso-1/contenido \
  -H "Content-Type: application/json" \
  -d '{
    "cursoId": "curso-1",
    "contenidoId": "cont-1",
    "temaId": "tema-1",
    "visto": true
  }'

# Resetear progreso
curl -X DELETE http://localhost:3001/progreso/alumno-demo-001/curso/curso-1
```

---

## Notas Finales

✅ **Migración completa del frontend**: El `ProgresoService` ahora usa HTTP en lugar de localStorage
✅ **Cache implementado**: El frontend usa un cache en memoria (`Map`) para mejorar rendimiento
✅ **Fallbacks**: Si el backend falla, el servicio retorna datos por defecto (sin persistir)
⏳ **Backend pendiente**: Debes implementar estos endpoints en tu backend NestJS

**Siguiente paso**: Implementar los endpoints en el backend y probar el flujo completo.

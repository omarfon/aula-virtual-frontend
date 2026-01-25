# Ejemplo de Controlador NestJS para Cursos

Este es un ejemplo de cómo debe configurarse el backend NestJS para trabajar con el frontend.

## Controller (cursos.controller.ts)

```typescript
import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CursosService } from './cursos.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';

@ApiTags('cursos')
@Controller('api/cursos')
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los cursos' })
  @ApiResponse({ status: 200, description: 'Lista de cursos' })
  async findAll(
    @Query('categoria') categoria?: string,
    @Query('nivel') nivel?: string,
  ) {
    if (categoria) {
      return this.cursosService.findByCategoria(categoria);
    }
    if (nivel) {
      return this.cursosService.findByNivel(nivel);
    }
    return this.cursosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un curso por ID' })
  @ApiResponse({ status: 200, description: 'Curso encontrado' })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  async findOne(@Param('id') id: string) {
    return this.cursosService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo curso' })
  @ApiResponse({ status: 201, description: 'Curso creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() createCursoDto: CreateCursoDto) {
    return this.cursosService.create(createCursoDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un curso completo' })
  @ApiResponse({ status: 200, description: 'Curso actualizado' })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateCursoDto: UpdateCursoDto,
  ) {
    return this.cursosService.update(id, updateCursoDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar parcialmente un curso' })
  @ApiResponse({ status: 200, description: 'Curso actualizado' })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  async patch(
    @Param('id') id: string,
    @Body() updateCursoDto: Partial<UpdateCursoDto>,
  ) {
    return this.cursosService.patch(id, updateCursoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un curso' })
  @ApiResponse({ status: 200, description: 'Curso eliminado' })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  async remove(@Param('id') id: string) {
    return this.cursosService.remove(id);
  }
}
```

## Service (cursos.service.ts)

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Curso } from './entities/curso.entity';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';

@Injectable()
export class CursosService {
  constructor(
    @InjectRepository(Curso)
    private readonly cursoRepository: Repository<Curso>,
  ) {}

  async findAll(): Promise<Curso[]> {
    return await this.cursoRepository.find({
      relations: ['unidades', 'tareas', 'examenes'],
    });
  }

  async findOne(id: string): Promise<Curso> {
    const curso = await this.cursoRepository.findOne({
      where: { id },
      relations: ['unidades', 'tareas', 'examenes'],
    });

    if (!curso) {
      throw new NotFoundException(`Curso con ID ${id} no encontrado`);
    }

    return curso;
  }

  async findByCategoria(categoria: string): Promise<Curso[]> {
    return await this.cursoRepository.find({
      where: { categoria },
      relations: ['unidades', 'tareas', 'examenes'],
    });
  }

  async findByNivel(nivel: string): Promise<Curso[]> {
    return await this.cursoRepository.find({
      where: { nivel },
      relations: ['unidades', 'tareas', 'examenes'],
    });
  }

  async create(createCursoDto: CreateCursoDto): Promise<Curso> {
    const curso = this.cursoRepository.create(createCursoDto);
    return await this.cursoRepository.save(curso);
  }

  async update(id: string, updateCursoDto: UpdateCursoDto): Promise<Curso> {
    const curso = await this.findOne(id);
    Object.assign(curso, updateCursoDto);
    return await this.cursoRepository.save(curso);
  }

  async patch(id: string, updateCursoDto: Partial<UpdateCursoDto>): Promise<Curso> {
    const curso = await this.findOne(id);
    Object.assign(curso, updateCursoDto);
    return await this.cursoRepository.save(curso);
  }

  async remove(id: string): Promise<void> {
    const curso = await this.findOne(id);
    await this.cursoRepository.remove(curso);
  }
}
```

## Entity (curso.entity.ts)

```typescript
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Unidad } from './unidad.entity';
import { Tarea } from './tarea.entity';
import { Examen } from './examen.entity';

@Entity('cursos')
export class Curso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column('text')
  descripcion: string;

  @Column()
  instructor: string;

  @Column({
    type: 'enum',
    enum: ['Principiante', 'Intermedio', 'Avanzado'],
  })
  nivel: 'Principiante' | 'Intermedio' | 'Avanzado';

  @Column()
  imagen: string;

  @Column()
  categoria: string;

  @Column({ default: 0 })
  estudiantes: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  duracionTotal: number;

  @OneToMany(() => Unidad, unidad => unidad.curso, { cascade: true })
  unidades: Unidad[];

  @OneToMany(() => Tarea, tarea => tarea.curso, { cascade: true })
  tareas: Tarea[];

  @OneToMany(() => Examen, examen => examen.curso, { cascade: true })
  examenes: Examen[];
}
```

## DTOs

### create-curso.dto.ts

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUnidadDto } from './create-unidad.dto';
import { CreateTareaDto } from './create-tarea.dto';
import { CreateExamenDto } from './create-examen.dto';

export class CreateCursoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  instructor: string;

  @ApiProperty({ enum: ['Principiante', 'Intermedio', 'Avanzado'] })
  @IsEnum(['Principiante', 'Intermedio', 'Avanzado'])
  @IsNotEmpty()
  nivel: 'Principiante' | 'Intermedio' | 'Avanzado';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  imagen: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoria: string;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  estudiantes?: number;

  @ApiPropertyOptional({ default: 0, description: 'Duración total en horas' })
  @IsNumber()
  @IsOptional()
  duracionTotal?: number;

  @ApiPropertyOptional({ type: [CreateUnidadDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUnidadDto)
  @IsOptional()
  unidades?: CreateUnidadDto[];

  @ApiPropertyOptional({ type: [CreateTareaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTareaDto)
  @IsOptional()
  tareas?: CreateTareaDto[];

  @ApiPropertyOptional({ type: [CreateExamenDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExamenDto)
  @IsOptional()
  examenes?: CreateExamenDto[];
}
```

### update-curso.dto.ts

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateCursoDto } from './create-curso.dto';

export class UpdateCursoDto extends PartialType(CreateCursoDto) {}
```

## Configuración de CORS (main.ts)

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:4201'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Aula Virtual API')
    .setDescription('API para gestión de cursos')
    .setVersion('1.0')
    .addTag('cursos')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log('🚀 API ejecutándose en http://localhost:3000');
  console.log('📚 Documentación en http://localhost:3000/api/docs');
}
bootstrap();
```

## Module (cursos.module.ts)

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CursosController } from './cursos.controller';
import { CursosService } from './cursos.service';
import { Curso } from './entities/curso.entity';
import { Unidad } from './entities/unidad.entity';
import { Tarea } from './entities/tarea.entity';
import { Examen } from './entities/examen.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Curso, Unidad, Tarea, Examen]),
  ],
  controllers: [CursosController],
  providers: [CursosService],
  exports: [CursosService],
})
export class CursosModule {}
```

## Testing con CURL

```bash
# Obtener todos los cursos
curl http://localhost:3000/api/cursos

# Obtener un curso por ID
curl http://localhost:3000/api/cursos/123e4567-e89b-12d3-a456-426614174000

# Crear un curso
curl -X POST http://localhost:3000/api/cursos \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Curso de Prueba",
    "descripcion": "Descripción del curso",
    "instructor": "Instructor Ejemplo",
    "nivel": "Principiante",
    "imagen": "https://example.com/image.jpg",
    "categoria": "Tecnología"
  }'

# Actualizar un curso
curl -X PUT http://localhost:3000/api/cursos/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Curso Actualizado"
  }'

# Eliminar un curso
curl -X DELETE http://localhost:3000/api/cursos/123e4567-e89b-12d3-a456-426614174000
```

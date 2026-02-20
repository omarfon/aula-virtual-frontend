/**
 * Script para limpiar la base de datos eliminando todos los cursos
 * Ejecutar con: npx ts-node scripts/limpiar-bd.ts
 */

export {};

const API_URL = 'http://localhost:3001';

async function limpiarBD() {
  console.log('🧹 Limpiando base de datos...\n');

  try {
    // Obtener todos los cursos
    const response = await fetch(`${API_URL}/cursos`);
    if (!response.ok) {
      throw new Error(`Error al obtener cursos: ${response.statusText}`);
    }

    const cursos = await response.json();
    console.log(`📋 Encontrados ${cursos.length} cursos para eliminar\n`);

    // Eliminar cada curso
    for (let i = 0; i < cursos.length; i++) {
      const curso = cursos[i];
      console.log(`🗑️  Eliminando curso ${i + 1}/${cursos.length}: ${curso.titulo}`);
      
      const deleteResponse = await fetch(`${API_URL}/cursos/${curso.id}`, {
        method: 'DELETE'
      });

      if (!deleteResponse.ok) {
        console.warn(`⚠️  Error al eliminar curso ${curso.id}: ${deleteResponse.statusText}`);
      } else {
        console.log(`✅ Curso eliminado`);
      }
    }

    console.log('\n🎉 ¡BASE DE DATOS LIMPIADA EXITOSAMENTE!\n');
  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  }
}

limpiarBD();

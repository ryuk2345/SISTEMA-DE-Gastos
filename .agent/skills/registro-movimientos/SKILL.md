---
name: registro-movimientos
description: Usar esta skill al implementar el formulario de registro rápido de gastos/ingresos, el CRUD de movimientos (crear, editar, eliminar), gastos recurrentes automáticos, o la migración de datos históricos desde el Excel/Google Sheets original. Activar también para validación de montos y el historial/listado de movimientos.
---

# Registro de Movimientos — Captura Rápida y CRUD

Reemplaza al Google Form que David usaba antes. La prioridad #1 de esta funcionalidad es la velocidad: debe poder registrarse un gasto en menos de 15 segundos y 4 toques de pantalla.

## Modelo de datos de un movimiento

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Identificador único |
| fecha | Fecha | Default: hoy. Editable para gastos de días anteriores |
| categoria_id | FK → categorías | Ver skill `presupuesto-semaforo` para la relación tipo↔categoría |
| monto | Decimal | Siempre positivo; obligatorio; > 0 |
| descripcion | Texto | Opcional |
| origen | Enum: manual / voz / recurrente / ocr | Para trazabilidad de cómo se capturó |
| creado_en | Timestamp | Automático, no editable por el usuario |

## Formulario de registro rápido — flujo obligatorio

1. Usuario elige **Tipo** primero (Ingreso / Gasto) — default "Gasto".
2. La lista de **Categoría** se filtra dinámicamente según el tipo elegido (ver skill `presupuesto-semaforo`). Debe poder buscarse escribiendo, no solo scrollear.
3. **Monto** con teclado numérico/decimal nativo del iPhone. Validar > 0 antes de habilitar el botón de guardar.
4. **Descripción** opcional, con placeholder de ejemplo (ej. "Almuerzo", "Uber al trabajo").
5. **Fecha** default hoy, editable.
6. Al guardar: confirmación visual breve (toast/snackbar), el formulario se limpia y queda listo para el siguiente registro sin navegar a otra pantalla.

## Normalización de montos

El usuario puede escribir el monto con punto o coma decimal indistintamente (el Excel original mezclaba ambos: "46,17" y "1500"). Normalizar siempre al guardar:

```
function normalizarMonto(input) {
  // Reemplazar coma decimal por punto, remover separadores de miles si los hubiera
  const limpio = input.replace(",", ".");
  const valor = parseFloat(limpio);
  if (isNaN(valor) || valor <= 0) throw new Error("Monto inválido");
  return Math.round(valor * 100) / 100; // redondear a 2 decimales
}
```

## Edición y eliminación

- **Editar**: cualquier campo de un movimiento ya guardado (monto, categoría, fecha, descripción) debe ser editable desde el historial.
- **Eliminar**: requiere confirmación previa explícita (modal o alert nativo), nunca borrado sin confirmar.
- Ambas acciones deben re-disparar el recálculo de dashboard/alertas para el mes afectado (no dejar datos cacheados desactualizados).

## Gastos recurrentes automáticos (prioridad P0 del catálogo de funcionalidades)

Permite configurar un movimiento que se registra solo cada mes sin intervención manual (ej. "Línea Celular", S/ 47, día 1 de cada mes).

- Guardar como una "plantilla de recurrencia" asociada a una categoría, con monto, día del mes, y descripción default.
- Un job/proceso programado debe generar el movimiento real correspondiente cada mes, marcándolo con `origen = "recurrente"`.
- David debe poder pausar, editar o eliminar una recurrencia sin afectar los movimientos ya generados en el pasado.

## Historial / listado de movimientos

- Filtros: por mes, por tipo (Ingreso/Gasto), por categoría.
- Buscador de texto libre sobre el campo `descripcion`.
- Orden cronológico, más reciente primero por defecto.

## Migración de datos históricos (una sola vez, al iniciar el proyecto)

David tiene 26 movimientos ya registrados de junio 2026 en su Google Sheets (hoja "Registro"). Al construir la primera versión:

1. Exportar la hoja "Registro" a CSV.
2. Mapear columnas: `Fecha → fecha`, `Tipo → tipo (vía categoría)`, `Categoría → categoria_id (buscar o crear)`, `Monto (S/) → monto (normalizar decimales)`, `Descripción → descripcion`.
3. Marcar estos movimientos migrados con `origen = "manual"`.
4. Validar al final que los totales migrados coincidan con los valores de referencia del Dashboard original de junio 2026: Ingresos S/ 1,500.00, Gastos S/ 914.67, Balance S/ 585.33, Ahorro S/ 200.00. Si no coinciden, hay un error de mapeo que debe corregirse antes de continuar.

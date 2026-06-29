---
name: presupuesto-semaforo
description: Usar esta skill al implementar o modificar cualquier código relacionado con categorías de gasto, presupuesto mensual, o el sistema de semáforo (🟢🟡🔴) de la app "Mis Finanzas". Cubre la estructura de categorías/grupos, el cálculo de % usado, los umbrales de estado, y las reglas de negocio sobre la relación categoría↔tipo. Activar también cuando se trabaje en CRUD de categorías o en la pantalla de configuración de presupuesto.
---

# Presupuesto y Semáforo — Lógica de Negocio Central

Esta skill documenta la lógica de negocio fundacional de la app "Mis Finanzas" de David, derivada de su sistema original en Google Sheets. Es la fuente de verdad para todo cálculo relacionado con presupuesto y estado de categorías.

## Modelo conceptual

Cada **categoría** de gasto pertenece a un **grupo** (etiqueta libre, editable, solo para agrupar visualmente — NO afecta ningún cálculo) y tiene un **presupuesto mensual** en Soles (S/).

Categorías de referencia (semilla inicial, deben quedar precargadas pero son 100% editables por el usuario):

| Categoría | Grupo | Presupuesto mensual (S/) |
|---|---|---|
| Menú / Alimentación | Fijo Crítico | 400 |
| Pasajes | Fijo Crítico | 198 |
| Línea Celular | Fijo Crítico | 47 |
| Ahorro | Ahorro Obligatorio | 200 |
| Aporte en Casa / Servicios | Otros Básicos | 150 |
| Aseo Personal | Otros Básicos | 30 |
| Salidas / Entretenimiento | Variable | 250 |
| Antojos / Imprevistos | Variable | 100 |
| Otros / Colchón | Libre | 125 |

Ingreso mensual base de referencia: S/ 1,500 (editable).

## Regla de negocio crítica: Categoría ↔ Tipo

Cada categoría tiene un `tipo` fijo: `ingreso` o `gasto`. Esto NO es opcional por movimiento — se define una sola vez al crear la categoría.

**Por qué importa:** en los datos históricos de David, "Trabajos extra / Freelance" (que es un ingreso) quedó guardado como tipo "Gastos" por error de captura manual. El selector de la UI debe mostrar primero "Tipo" (Ingreso/Gasto) y filtrar la lista de categorías según esa elección, para que este error sea estructuralmente imposible.

```
// Pseudocódigo de validación al crear un movimiento
function getCategoriasValidas(tipoSeleccionado) {
  return categorias.filter(c => c.tipo === tipoSeleccionado && c.activa);
}
```

## Cálculo del semáforo (acumulado)

```
porcentajeUsado = montoGastadoEnMes / presupuestoMensual

si porcentajeUsado < umbral_amarillo (default 90%):
    estado = "🟢 OK"
si porcentajeUsado >= umbral_amarillo y < umbral_rojo (default 100%):
    estado = "🟡 Cuidado"
si porcentajeUsado >= umbral_rojo (default 100%):
    estado = "🔴 Excedido"
```

Los umbrales (`umbral_amarillo_acumulado`, `umbral_rojo_acumulado`) deben leerse de la tabla `configuracion`, NUNCA hardcodeados — David debe poder ajustarlos desde la app.

`disponible = presupuestoMensual - montoGastadoEnMes` (puede ser negativo si está excedido; mostrar en rojo si es negativo).

## Fila TOTAL

El total del dashboard se calcula sumando todas las categorías de tipo `gasto`:
- `presupuestoTotal` = suma de presupuestos
- `gastadoTotal` = suma de gastado
- `%UsadoTotal` = gastadoTotal / presupuestoTotal
- El estado de la fila TOTAL usa los mismos umbrales que una categoría individual

## Gestión de categorías (CRUD editable)

La app permite, sin tocar código:
- Crear categoría nueva (nombre, tipo, grupo, presupuesto, ícono/color)
- Editar presupuesto, nombre, grupo o ícono de una categoría existente
- Eliminar categoría — **debe advertir primero si ya tiene movimientos asociados** (no eliminar en cascada silenciosamente; ofrecer "desactivar" como alternativa vía el campo `activa`)
- Editar el ingreso mensual base de referencia

Los "Grupos" son simplemente texto libre asociado a una categoría — no crear una tabla separada rígida de grupos predefinidos; deben poder escribirse/reusarse libremente.

## Errores comunes a evitar

- No mezclar el cálculo de semáforo acumulado con el de velocidad de gasto (ver skill `alertas-velocidad-gasto`) — son dos sistemas complementarios, no el mismo.
- No hardcodear las 9 categorías de la tabla de referencia como enum fijo en el código; son datos semilla (seed), deben vivir en la base de datos y ser mutables.
- Montos: aceptar tanto coma como punto como separador decimal en la entrada del usuario (el Excel original mezclaba ambos formatos), normalizando siempre a un único formato decimal internamente antes de guardar.

---
name: analitica-gastos
description: Usar esta skill al implementar cualquier funcionalidad de analítica, reportes, comparaciones entre meses, detección de patrones de gasto, o proyecciones/simulaciones financieras en la app "Mis Finanzas". Cubre los 3 niveles de madurez analítica definidos en el PRD (básico, patrones, predictivo). Activar para dashboards de tendencias, gráficos comparativos, o cualquier cálculo que use datos históricos de más de un mes.
---

# Módulo de Analítica — 3 Niveles

La analítica de "Mis Finanzas" se construye en 3 niveles de madurez. El modelo de datos debe soportar los 3 desde el diseño inicial (ver tabla `movimientos` con histórico completo), aunque se implementen en fases distintas.

## Nivel 1 — Básico (tendencias y comparaciones)

| Funcionalidad | Lógica |
|---|---|
| Comparación mes vs. mes anterior | Por categoría y total: `((gastoMesActual - gastoMesAnterior) / gastoMesAnterior) * 100`, mostrar con flecha ↑/↓ |
| Promedio histórico por categoría | Promedio de los últimos 3-6 meses cerrados (excluir el mes en curso, que está incompleto) |
| Gasto por día de la semana | Agrupar movimientos por día de semana (lunes-domingo), sumar y promediar, para detectar concentración (ej. fines de semana) |
| Top categorías del mes | Ordenar categorías de tipo `gasto` por monto descendente, tomar las 3 primeras, calcular % del total |
| Línea de tiempo del mes | Serie acumulada día a día del mes en curso, comparada contra una "línea de ritmo ideal" = `presupuestoMensual / diasTotalesDelMes * diaActual` |

## Nivel 2 — Patrones y hábitos

| Funcionalidad | Lógica |
|---|---|
| Categoría "fuera de control" | De todas las categorías, la que tenga mayor variación porcentual positiva respecto a su propio promedio histórico (no comparar categorías distintas entre sí, cada una contra su propio histórico) |
| Patrones temporales | Comparar gasto promedio por categoría en días específicos (ej. viernes) vs. el promedio general de esa categoría en días normales; expresar como múltiplo ("3x más") |
| Gasto recurrente vs. esporádico | Un movimiento es candidato a "recurrente" si existe un movimiento de monto similar (±10%) en la misma categoría en cada uno de los últimos 2-3 meses; el resto se clasifica como esporádico |
| Salud financiera del mes | Contar cuántas categorías están en cada estado de semáforo (ver skill `presupuesto-semaforo`); regla simple: mayoría 🟢 = "Mes saludable", mayoría 🟡 = "Mes ajustado", alguna 🔴 = "Mes en rojo" — mantener esta clasificación simple, NO convertirla en un score numérico complejo sin pedirlo explícitamente |
| Ingreso comprometido en fijos | `(sumaPresupuestoGrupoFijoCritico / ingresoMensualBase) * 100` — cuánto del ingreso ya está comprometido antes de cualquier gasto variable |

## Nivel 3 — Avanzado (proyección y predicción)

| Funcionalidad | Lógica |
|---|---|
| Proyección de cierre de mes | Reusar `gastoProyectadoCierre` de la skill `alertas-velocidad-gasto` — NO duplicar esta fórmula, es la misma lógica vista desde la analítica en vez de desde la alerta |
| Predicción de fecha de exceso | Si `ritmoDiarioActual > 0`, calcular `diaProyectadoExceso = presupuestoMensual / ritmoDiarioActual`; si ese día es ≤ `diasTotalesDelMes`, mostrar la fecha estimada de exceso |
| Simulador "¿qué pasa si...?" | Permite al usuario ingresar un ajuste hipotético (ej. "reducir Antojos en X soles durante N días") y recalcular `gastoProyectadoCierre` y balance del mes con ese ajuste, SIN modificar datos reales — debe ser una vista de simulación pura, nunca persistir el escenario hipotético como movimiento real |
| Reasignación de presupuesto sugerida | Comparar el promedio histórico real de cada categoría contra su presupuesto asignado; sugerir (no aplicar automáticamente) mover presupuesto de categorías sistemáticamente subutilizadas hacia las sistemáticamente excedidas |

## Principios generales para toda la analítica

- **Nunca inventar datos**: si no hay suficiente histórico (ej. menos de 2 meses), mostrar un estado vacío claro ("Necesitas al menos 2 meses de datos para esta comparación") en vez de mostrar cálculos con denominador cero o datos parciales engañosos.
- **El mes en curso está siempre incompleto**: cualquier comparación o promedio histórico debe excluir o marcar claramente el mes en curso como "en progreso", para no compararlo como si fuera un mes cerrado.
- **Reusar, no duplicar**: la lógica de proyección de cierre de mes vive en un solo lugar (ver skill `alertas-velocidad-gasto`) y se reutiliza tanto en alertas como en analítica.

---
name: alertas-velocidad-gasto
description: Usar esta skill al implementar cualquier lógica de proyección de gasto, cálculo de "a qué ritmo se está gastando", notificaciones push, banners de alerta en el dashboard, o detección de exceso de presupuesto ANTES de que ocurra. Esta es la funcionalidad diferenciadora central de la app "Mis Finanzas" v2.0 — activar siempre que el trabajo involucre alertas, predicciones de cierre de mes, o notificaciones al usuario.
---

# Alertas Inteligentes por Velocidad de Gasto

Esta es la funcionalidad insignia de "Mis Finanzas" v2.0. El cambio de paradigma respecto a un control de gastos clásico: en vez de medir solo "cuánto llevas gastado acumulado", el sistema proyecta el ritmo actual hacia el cierre del mes y avisa ANTES de que el exceso ocurra.

## Por qué existe esta skill

Un semáforo basado solo en % acumulado (ver skill `presupuesto-semaforo`) puede mostrar 🟢 verde el día 10 del mes aunque el usuario esté gastando a un ritmo que lo llevará muy por encima del presupuesto al día 30. Esta skill corrige ese punto ciego.

## Fórmula central (obligatoria, no aproximar de otra forma)

```
ritmoDiarioActual = montoGastadoHastaHoy / diasTranscurridosDelMes

gastoProyectadoCierre = ritmoDiarioActual * diasTotalesDelMes

// diasTranscurridosDelMes y diasTotalesDelMes se calculan sobre el mes
// calendario real (ej. 30, 31, 28/29 días), usando la fecha del movimiento
// más reciente o "hoy" si se está calculando en tiempo real.
```

### Ejemplo de referencia para pruebas (usar como caso de test)

Si al día 10 de un mes de 30 días ya se gastaron S/ 200 en "Salidas/Entretenimiento" (presupuesto S/ 250):
- `ritmoDiarioActual` = 200 / 10 = 20
- `gastoProyectadoCierre` = 20 × 30 = 600
- 600 / 250 = 240% del presupuesto proyectado → debe disparar alerta 🔴 crítica, AUNQUE el acumulado actual (200/250 = 80%) se vería 🟢 en el semáforo clásico.

Este caso debe pasar como test unitario antes de considerar la funcionalidad terminada.

## Niveles de alerta de velocidad

```
ratioProyectado = gastoProyectadoCierre / presupuestoMensual

si ratioProyectado <= umbral_amarillo_velocidad (default 100%):
    nivel = "🟢 Ritmo sano" → sin alerta, solo visible en dashboard
si ratioProyectado > umbral_amarillo_velocidad y <= umbral_rojo_velocidad (default 130%):
    nivel = "🟡 Ritmo elevado" → notificación suave
si ratioProyectado > umbral_rojo_velocidad (default 130%):
    nivel = "🔴 Ritmo crítico" → notificación push inmediata + banner destacado
```

**Los umbrales 100%/130% son configurables**, deben leerse de la tabla `configuracion` (`umbral_amarillo_velocidad`, `umbral_rojo_velocidad`), nunca hardcodeados.

## Mensajes de alerta (tono y formato)

- Ritmo elevado: "Vas gastando rápido en [categoría]. A este ritmo, cerrarías el mes en S/ [gastoProyectadoCierre] (presupuesto: S/ [presupuestoMensual])."
- Ritmo crítico: mismo mensaje pero con prioridad de notificación push inmediata.
- Evitar tono alarmista o culposo; el objetivo es informar, no generar ansiedad financiera.

## Alertas complementarias (misma capa de lógica)

1. **Alerta de acumulado clásico** (90%/100%) — se mantiene como respaldo del sistema de velocidad, ver skill `presupuesto-semaforo`.
2. **Alerta de gasto inusual** — un movimiento individual muy por encima del promedio histórico de movimientos en esa categoría. Sugerencia de umbral inicial: monto > 3× el promedio histórico por movimiento de esa categoría (ajustable).
3. **Alerta de fin de mes** — resumen automático en los últimos 3 días del mes calendario, mostrando el cierre proyectado de cada categoría.
4. **Alerta de meta de ahorro en riesgo** — si `gastoProyectadoCierre` de las categorías variables compromete el monto que debía ir a la categoría "Ahorro".

## Requisitos técnicos de notificación (PWA en iOS)

- Las notificaciones push en iOS solo funcionan en PWAs instaladas (vía "Agregar a pantalla de inicio") en iOS 16.4+, usando Web Push API.
- **Nunca depender solo del push**: toda alerta debe tener también una representación visual obligatoria (banner destacado en el dashboard al abrir la app), ya que el push puede no llegar o el usuario puede no haberlo habilitado.
- Centralizar el cálculo de `gastoProyectadoCierre` en backend (no en el cliente), para poder reusarlo tanto en la respuesta del dashboard como en el job que dispara las notificaciones push.

## Distinción visual obligatoria en UI

El dashboard debe diferenciar claramente "lo que ya pasó" (gastado real, barra sólida) de "lo que se proyecta" (estimado a fin de mes, barra o indicador punteado/diferenciado). No mezclar ambos conceptos en un solo número sin distinción visual — es una causa común de confusión del usuario entre acumulado real y proyección.

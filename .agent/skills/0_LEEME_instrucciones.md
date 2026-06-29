# Skills de Antigravity — Mis Finanzas (App de Gastos Personales)

Este paquete contiene 6 skills en formato `SKILL.md` (el estándar abierto que usan Antigravity, Claude Code, Cursor y otras herramientas de desarrollo con IA). Codifican toda la lógica de negocio del PRD v2.0 para que cualquier agente que trabaje en este proyecto en Antigravity tenga el contexto correcto automáticamente, sin que tengas que volver a explicarlo cada vez.

## Qué contiene cada skill

| Skill | Cuándo se activa |
|---|---|
| `presupuesto-semaforo` | Categorías, presupuesto mensual, semáforo 🟢🟡🔴 clásico |
| `alertas-velocidad-gasto` | La funcionalidad insignia: proyección de cierre de mes y alertas antes de exceder |
| `analitica-gastos` | Comparaciones entre meses, patrones, predicciones |
| `registro-movimientos` | Formulario de captura rápida, CRUD, gastos recurrentes, migración del Excel |
| `pwa-ios-setup` | Configuración de la PWA, límites reales de Apple/Safari, notificaciones push |
| `modelo-datos-finanzas` | Esquema completo de base de datos (Supabase/Postgres) |

Cada skill se activa sola — Antigravity lee la descripción de cada una y la carga en el contexto del agente solo cuando tu pedido coincide con ese tema. No necesitas invocarlas manualmente.

## Cómo instalarlas

### Opción A — Solo en este proyecto (recomendado)

1. Copia la carpeta `.agent` completa (la que está dentro de este paquete) a la raíz de tu repositorio del proyecto "Mis Finanzas".
2. La estructura final debe quedar así:
   ```
   tu-proyecto/
   ├── .agent/
   │   └── skills/
   │       ├── presupuesto-semaforo/SKILL.md
   │       ├── alertas-velocidad-gasto/SKILL.md
   │       ├── analitica-gastos/SKILL.md
   │       ├── registro-movimientos/SKILL.md
   │       ├── pwa-ios-setup/SKILL.md
   │       └── modelo-datos-finanzas/SKILL.md
   ├── src/
   └── ...
   ```
3. Abre el proyecto en Antigravity. Las skills se detectan automáticamente, no requieren reinicio ni configuración adicional.

### Opción B — Disponibles en todos tus proyectos (global)

Si quieres que estas skills estén disponibles también en otros proyectos futuros (por ejemplo si reusas la misma lógica de presupuesto en otra app):

- **Mac/Linux:** copia el contenido de `skills/` (no la carpeta `.agent` completa) a `~/.gemini/antigravity/skills/`
- **Windows:** copia el contenido de `skills/` a `C:\Users\TuUsuario\.gemini\antigravity\skills\`

## Cómo probarlas

Una vez instaladas, abre el chat del agente en Antigravity dentro del proyecto y prueba con algo como:

> "Ayúdame a implementar el cálculo del semáforo de presupuesto"

El agente debería cargar automáticamente la skill `presupuesto-semaforo` y usar exactamente la lógica documentada (umbrales 90%/100%, relación categoría↔tipo, etc.) en vez de inventar su propia versión.

## Notas importantes

- Estas skills asumen el stack sugerido en el PRD v2.0 (React/Vue + Supabase). Si cambias de stack, los fragmentos de código SQL de `modelo-datos-finanzas` deberán adaptarse, pero la lógica de negocio (fórmulas, reglas, umbrales) se mantiene igual.
- Las skills son archivos de texto plano (Markdown). Puedes editarlas directamente si en algún momento cambias una regla de negocio (ej. si decides que el umbral de alerta crítica ya no es 130% sino 150%) — solo edita el `SKILL.md` correspondiente y el agente usará la versión actualizada en la siguiente sesión.
- Si más adelante agregas funcionalidades del catálogo P1/P2 del PRD (registro por voz, OCR de boletas, metas de ahorro, etc.), lo natural es crear una skill nueva por funcionalidad siguiendo el mismo formato, para que el contexto siga siendo modular y no se sobrecargue una sola skill con demasiados temas distintos.

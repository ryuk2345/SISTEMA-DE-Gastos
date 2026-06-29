
📊
Mis Finanzas
App Web (PWA) Inteligente de Control de Gastos Personales
Documento de Especificaciones de Producto (PRD)
Versión 2.0 · 28 de junio de 2026 · Analítica + Alertas Inteligentes
Campo
Detalle
Cliente / Product Owner
David
Tipo de proyecto
Reemplazo y modernización de hoja de cálculo (Google Sheets) por una PWA personal con analítica y alertas inteligentes
Usuarios
1 (uso personal, sin multiusuario)
Plataforma objetivo
iPhone (Safari / PWA instalable), responsive para escritorio
Qué cambia vs. v1.0
Se incorpora analítica (básica → predictiva) y alertas por velocidad de gasto, además de un catálogo amplio de funcionalidades nuevas priorizadas

Tabla de Contenido



1. Resumen Ejecutivo
David lleva el control de sus gastos personales en una plantilla de Google Sheets con captura manual, semáforo de presupuesto y cálculos estáticos. Esa base ya cumplió su ciclo: funciona, pero es lenta de usar, no anticipa problemas y no genera ningún aprendizaje sobre los hábitos de gasto.
Esta versión 2.0 del proyecto eleva la ambición: ya no se trata solo de digitalizar el Excel, sino de construir una app financiera personal moderna que (1) registre gastos en segundos, (2) entienda los patrones de gasto de David y (3) avise de forma proactiva antes de que un problema de presupuesto ocurra — no después.
🎯 Objetivo del producto v2.0
Registrar un gasto o ingreso en menos de 15 segundos desde el iPhone.
Anticipar excesos de presupuesto antes de que sucedan, usando la velocidad de gasto real, no solo el monto acumulado.
Entregar analítica que responda preguntas como: '¿en qué gasto más de lo normal este mes?', '¿voy a terminar el mes bien o mal?', '¿qué tendencia tiene mi categoría más problemática?'
Este documento mantiene la lógica validada del sistema actual (categorías, presupuesto, semáforo) como base, y construye encima tres capas nuevas: Analítica, Alertas Inteligentes, y un Catálogo de Funcionalidades Nuevas organizado por prioridad.
2. Contexto: El Sistema Actual (Punto de Partida)
Esta sección resume la lógica de la plantilla de Excel/Sheets vigente, que sigue siendo la base funcional de la app — solo que ahora se construye con analítica y alertas encima, no como reemplazo plano.
2.1 Categorías y presupuesto mensual vigente
Categoría
Grupo
Presupuesto mensual (S/)
Menú / Alimentación
Fijo Crítico
400
Pasajes
Fijo Crítico
198
Línea Celular
Fijo Crítico
47
Ahorro
Ahorro Obligatorio
200
Aporte en Casa / Servicios
Otros Básicos
150
Aseo Personal
Otros Básicos
30
Salidas / Entretenimiento
Variable
250
Antojos / Imprevistos
Variable
100
Otros / Colchón
Libre
125
Ingreso mensual base de referencia: S/ 1,500. Categorías y presupuestos deben seguir siendo 100% editables desde la app (ver sección 5.5).
2.2 Semáforo de presupuesto (se mantiene, y se vuelve más inteligente)
% Usado (acumulado)
Estado
Color
0% – 89%
OK, dentro de presupuesto
🟢 Verde
90% – 99%
Cuidado, cerca del límite
🟡 Amarillo
100% o más
Excedido
🔴 Rojo
Esta lógica de semáforo por acumulado se mantiene como referencia rápida, pero deja de ser la única señal de alerta — en la sección 4 se agrega un segundo sistema de alertas basado en velocidad de gasto, que avisa con anticipación incluso si el % acumulado todavía se ve 'verde'.
2.3 Limitaciones del sistema actual que esta v2.0 busca resolver
	•	Solo mira el pasado acumulado, nunca proyecta hacia adelante: un gasto fuerte el día 5 no genera ninguna alerta aunque condene el resto del mes.
	•	No hay comparación entre meses — cada mes vive aislado, no se ve si David está mejorando o empeorando.
	•	No identifica patrones (ej. que los fines de semana se gasta el triple en 'Salidas/Entretenimiento').
	•	Captura manual lenta vía Google Form.
	•	Cero notificaciones — David se entera de un exceso cuando ya pasó, al revisar el Excel.
3. Objetivos y Alcance del Proyecto
3.1 Objetivos
	•	Reemplazar el Google Form como método de captura de gastos e ingresos.
	•	Construir un módulo de analítica con tres niveles: básico (tendencias y comparaciones), intermedio (patrones y hábitos) y avanzado (proyecciones y predicciones).
	•	Implementar alertas inteligentes basadas en velocidad de gasto: avisar cuando el ritmo actual de una categoría proyecta un exceso antes de fin de mes, no solo cuando ya se excedió.
	•	Permitir editar categorías y presupuestos desde la app.
	•	Funcionar como PWA instalable en iPhone.
	•	Dejar documentado un catálogo amplio de funcionalidades nuevas (sección 6) para que David priorice qué construir además del núcleo.
3.2 Fuera de alcance (v2.0)
⛔ No incluido en esta versión
Multiusuario / cuentas compartidas — uso personal, un solo usuario.
Publicación en App Store — se construye como PWA.
Conexión bancaria automática (Open Banking) o lectura de SMS/correos del banco — queda registrada como idea futura en el catálogo (sección 6).
Modo multi-moneda — todo en Soles (S/).
4. Módulo de Analítica
Se organiza en tres niveles de madurez. El equipo de desarrollo puede construir Nivel 1 primero y los siguientes en fases posteriores, pero el modelo de datos (sección 7) debe soportar los tres desde el inicio para no tener que migrar después.
4.1 Nivel 1 — Analítica básica (tendencias y comparaciones)
Funcionalidad
Descripción
Comparación mes vs. mes anterior
Por categoría y total: '¿gasté más o menos que el mes pasado, y cuánto?' con indicador ↑/↓ y %
Promedio histórico por categoría
Promedio de los últimos 3-6 meses, para saber si el mes actual está por encima o debajo de lo normal
Gasto por día de la semana
Qué días de la semana concentran más gasto (ej. fines de semana vs. entre semana)
Top categorías del mes
Ranking de las 3 categorías donde más se gastó, con % del total
Línea de tiempo del mes
Gráfico de gasto acumulado día a día dentro del mes, comparado contra una línea de 'ritmo ideal' (presupuesto ÷ días del mes)
4.2 Nivel 2 — Patrones y hábitos
Funcionalidad
Descripción
Detección de categoría 'fuera de control'
Identifica automáticamente qué categoría tiene la mayor variación negativa respecto a su promedio histórico
Patrones temporales
Ej. 'Los viernes gastas en promedio 3x más en Salidas/Entretenimiento que un día normal'
Gasto recurrente vs. esporádico
Distingue gastos que se repiten en monto/categoría similar cada mes (ej. Línea Celular) de gastos puntuales (ej. 'Casaca Barclif')
Salud financiera del mes
Score o resumen simple ('Mes saludable', 'Mes ajustado', 'Mes en rojo') basado en cuántas categorías están en 🟡/🔴
Comparación Ingreso vs. Gasto Fijo
Qué % del ingreso ya está comprometido en gastos fijos críticos antes de cualquier gasto variable
4.3 Nivel 3 — Analítica avanzada (proyección y predicción)
Funcionalidad
Descripción
Proyección de cierre de mes
Con el ritmo de gasto actual, calcula '¿con cuánto vas a terminar el mes en cada categoría y en total?' — esta es la base técnica de las alertas de velocidad (sección 5)
Predicción de exceso por categoría
Estima la fecha probable en la que una categoría llegará a 100% de su presupuesto si el ritmo actual no cambia
Simulador '¿qué pasa si...?'
Permite simular: '¿qué pasa si dejo de gastar en Antojos por 2 semanas?' y ver el impacto proyectado en el balance del mes
Recomendación de reasignación de presupuesto
Si una categoría sistemáticamente sobra y otra sistemáticamente falta, sugiere mover presupuesto entre ellas para el próximo mes
5. Alertas Inteligentes (Basadas en Velocidad de Gasto)
Este es el cambio de mentalidad central de la v2.0: pasar de un sistema que mide 'cuánto llevas gastado' a uno que mide 'a qué ritmo estás gastando y qué tan grave es eso para los días que quedan'.
5.1 Lógica central: gasto proyectado vs. presupuesto
🧮 Cómo se calcula la alerta de velocidad
Fórmula base: Ritmo diario actual = Gastado hasta hoy ÷ Días transcurridos del mes
Proyección de cierre: Gasto proyectado = Ritmo diario actual × Días totales del mes
Disparo de alerta: si Gasto proyectado > Presupuesto de la categoría, se dispara la alerta — incluso si el % acumulado todavía se ve verde
Ejemplo ilustrativo: si al día 10 del mes ya gastaste S/ 200 en 'Salidas/Entretenimiento' (presupuesto S/ 250), el acumulado es 80% (🟢 según el semáforo viejo). Pero proyectando ese ritmo a 30 días, terminarías gastando S/ 600 — 240% del presupuesto. La alerta de velocidad avisa esto desde el día 10, no cuando ya es tarde.
5.2 Niveles de alerta de velocidad
Nivel
Condición
Acción
🟢 Ritmo sano
Gasto proyectado ≤ 100% del presupuesto
Sin alerta, solo visible en el dashboard
🟡 Ritmo elevado
Gasto proyectado entre 100% y 130% del presupuesto
Notificación suave: 'Vas gastando rápido en [categoría], a este ritmo cerrarías en S/ X'
🔴 Ritmo crítico
Gasto proyectado mayor a 130% del presupuesto
Notificación push inmediata + indicador destacado en el dashboard
Los umbrales 100% / 130% deben ser configurables (sección 7.3), no fijos en el código.
5.3 Otras alertas complementarias
	•	Alerta de acumulado clásico — se mantiene el aviso al llegar a 90% y 100% del presupuesto acumulado (lógica v1, sección 2.2), como respaldo del sistema de velocidad
	•	Alerta de gasto inusual — un solo movimiento muy por encima del promedio histórico de esa categoría (ej. un gasto de S/ 200 en una categoría donde el promedio por movimiento es S/ 20)
	•	Alerta de fin de mes — resumen automático los últimos 3 días del mes con el cierre proyectado de cada categoría
	•	Alerta de meta de ahorro en riesgo — si el ritmo de gasto variable compromete el monto que David quería destinar a Ahorro
5.4 Canal de notificación
Dado que la app es una PWA en iOS, las notificaciones push tienen requisitos específicos (ver sección 8.3). Como respaldo, toda alerta debe mostrarse también de forma visual destacada al abrir la app (banner en el dashboard), para no depender 100% de que el push llegue.
6. Catálogo de Funcionalidades Nuevas
Listado amplio de ideas más allá del núcleo (captura + dashboard + analítica + alertas), organizadas por prioridad para que David decida qué construir y cuándo. P0 = esencial para que la app reemplace al Excel con ventaja real. P1 = alto valor, se recomienda fuertemente. P2 = 'nice to have', valen la pena pero no son urgentes.
6.1 Captura y registro
Funcionalidad
Prioridad
Descripción
Registro por voz
 P1 · Alto valor 
Decir 'gasté 20 soles en almuerzo' y que la app interprete monto + categoría automáticamente
Escaneo de boletas/recibos (OCR)
 P2 · Nice to have 
Tomar foto de un recibo y que la app extraiga el monto automáticamente
Gastos recurrentes automáticos
 P0 · Esencial 
Programar gastos fijos (ej. Línea Celular) para que se registren solos cada mes sin captura manual
Atajos rápidos / favoritos
 P1 · Alto valor 
Botones de un toque para los 5-6 gastos más frecuentes de David (ej. 'Pasaje S/2')
División de gastos compartidos
 P2 · Nice to have 
Marcar que parte de un gasto fue compartido con alguien (ej. 'salida con Karen') y separar la parte propia
Widget de iOS
 P1 · Alto valor 
Widget en la pantalla de inicio del iPhone para registrar un gasto sin abrir la app completa
6.2 Visualización y reportes
Funcionalidad
Prioridad
Descripción
Reporte mensual descargable (PDF)
 P1 · Alto valor 
Resumen del mes en PDF, útil como respaldo o para revisar fuera de la app
Comparador de hasta 6 meses
 P1 · Alto valor 
Gráfico de barras lado a lado comparando varios meses por categoría
Vista anual / resumen del año
 P2 · Nice to have 
Total gastado, ahorrado e ingresado en el año, con el mes más caro y más económico
Modo oscuro
 P2 · Nice to have 
Tema oscuro para uso nocturno
Exportar a Excel/CSV
 P1 · Alto valor 
Para quienes quieran seguir teniendo respaldo en hoja de cálculo
6.3 Metas y planificación financiera
Funcionalidad
Prioridad
Descripción
Metas de ahorro con objetivo
 P1 · Alto valor 
Ej. 'Ahorrar S/ 3,000 para diciembre' con barra de progreso visible en el dashboard
Fondo de emergencia separado
 P2 · Nice to have 
Categoría especial de ahorro que no se mezcla con el ahorro mensual regular
Planificador de gastos futuros grandes
 P2 · Nice to have 
Registrar un gasto grande conocido a futuro (ej. un viaje) y ver cómo afecta el presupuesto de los próximos meses
Presupuesto inteligente sugerido
 P2 · Nice to have 
Basado en el historial, sugerir un nuevo presupuesto mensual más realista por categoría
6.4 Seguridad y respaldo
Funcionalidad
Prioridad
Descripción
Bloqueo con Face ID / código
 P0 · Esencial 
Dado que son datos financieros personales, bloqueo de acceso a la app con biometría del iPhone
Respaldo automático en la nube
 P0 · Esencial 
Para no depender solo del almacenamiento local del iPhone (ver limitaciones PWA, sección 8.3)
Exportación completa de datos
 P1 · Alto valor 
Botón para descargar todos los datos en cualquier momento (portabilidad, evitar 'lock-in')
6.5 Ideas futuras (más allá de v2.0)
🔭 Para considerar en versiones futuras, no en este alcance
Conexión con cuentas bancarias (Open Banking) para registrar gastos automáticamente sin captura manual.
Asistente conversacional tipo chat para preguntar '¿cuánto gasté en comida este mes?' en lenguaje natural.
Gamificación (rachas de días sin excederse, logros por cumplir metas de ahorro).
Modo familiar/compartido si en el futuro David decide llevar gastos junto a otra persona.
7. Modelo de Datos
Se mantiene la estructura relacional de la v1.0 y se agregan los campos necesarios para soportar analítica y alertas de velocidad desde el diseño inicial.
7.1 Tabla: categorías
Campo
Tipo
Notas
id
UUID / autoincremental
Identificador único
nombre
Texto
Ej. 'Menú / Alimentación'
tipo
Enum: ingreso / gasto
Define en qué selector aparece
grupo
Texto
Ej. 'Fijo Crítico', editable libremente
presupuesto_mensual
Decimal
En Soles (S/)
es_recurrente
Booleano
Si tiene un gasto fijo automático asociado (sección 6.1)
icono / color
Texto
Para identificación visual rápida
activa
Booleano
Permite 'desactivar' sin borrar histórico
7.2 Tabla: movimientos
Campo
Tipo
Notas
id
UUID / autoincremental
Identificador único
fecha
Fecha
Fecha del gasto/ingreso
categoria_id
Referencia a categorías
Relación FK
monto
Decimal
Siempre positivo; el signo lo da el tipo de la categoría
descripcion
Texto
Opcional
origen
Enum: manual / voz / recurrente / OCR
Para saber cómo se capturó (soporta sección 6.1)
creado_en
Fecha y hora
Timestamp automático de creación
7.3 Tabla: configuración
Campo
Tipo
Notas
ingreso_mensual_base
Decimal
Editable (hoy: S/ 1,500)
umbral_amarillo_acumulado
Decimal (%)
Default 90%
umbral_rojo_acumulado
Decimal (%)
Default 100%
umbral_amarillo_velocidad
Decimal (%)
Default 100% del proyectado
umbral_rojo_velocidad
Decimal (%)
Default 130% del proyectado
7.4 Tabla: metas (soporta sección 6.3)
Campo
Tipo
Notas
id
UUID / autoincremental
Identificador único
nombre
Texto
Ej. 'Viaje a Cusco'
monto_objetivo
Decimal
Meta a alcanzar
fecha_objetivo
Fecha
Fecha límite
monto_acumulado
Decimal
Calculado en base a aportes registrados
7.5 Migración de datos históricos
David tiene movimientos ya registrados de junio 2026 en el Google Sheets actual. Se debe considerar un script de migración inicial (import único) desde un export CSV de la hoja 'Registro', mapeando Fecha, Tipo, Categoría, Monto y Descripción. Este histórico es además la base mínima para que la analítica de Nivel 1 (comparación mes vs. mes anterior) tenga sentido desde el primer mes de uso.
8. Requerimientos Técnicos
8.1 Tipo de aplicación: PWA
Aspecto
Requerimiento
Instalable en iPhone
Soporte para 'Agregar a pantalla de inicio' desde Safari, sin barra de navegador al abrirla
Manifest + Service Worker
Cacheo de assets estáticos y registro en cola si no hay conexión
Responsive
Optimizada primero para iPhone, pero debe verse bien en escritorio/tablet
Velocidad
El formulario de registro rápido debe estar listo en menos de 2 segundos
8.2 Stack sugerido
	•	Frontend: React o Vue + framework PWA (Vite PWA plugin o Next.js)
	•	Backend / base de datos: API REST o BaaS (ej. Supabase, Firebase) — simplifica auth y hosting para un solo usuario
	•	Cálculo de analítica/proyecciones: puede vivir como lógica en backend o en el cliente; recomendable centralizarlo en backend para reusarlo también en las notificaciones push
	•	Notificaciones push: Web Push API compatible con iOS 16.4+ (PWA instalada)
8.3 Limitaciones conocidas de PWA en iOS
⚠️ Restricciones de Apple/Safari para PWAs
Las notificaciones push en PWAs de iOS solo funcionan en iOS 16.4+ y requieren que la app ya esté instalada en la pantalla de inicio — crítico para todo el módulo de alertas (sección 5).
El almacenamiento local puede ser limpiado por iOS si la PWA no se abre en un período prolongado — por eso el respaldo en la nube (sección 6.4) no es opcional, es requisito.
Face ID dentro de una PWA depende de WebAuthn; debe validarse con una prueba técnica temprana antes de comprometerlo como funcionalidad P0.
9. Lineamientos de Diseño y UX
	•	Mantener el semáforo de colores como lenguaje visual base, ahora con un segundo ícono/indicador para la alerta de velocidad (para no confundir 'acumulado' con 'proyectado').
	•	El dashboard debe distinguir visualmente entre 'lo que ya pasó' (gastado) y 'lo que se proyecta' (estimado a fin de mes) — por ejemplo con una barra sólida vs. una barra punteada.
	•	Priorizar velocidad de registro: menos toques siempre es mejor.
	•	Botones y tipografía grandes, pensados para uso con una mano.
	•	Idioma español (Perú), moneda en Soles (S/), fecha DD/MM/AAAA.
10. Criterios de Aceptación (Definition of Done del núcleo P0)
La versión núcleo (P0) se considera lista cuando:
	•	David puede instalar la app en su iPhone desde Safari y usarla como app independiente.
	•	Puede registrar un movimiento completo en menos de 4 toques.
	•	El dashboard muestra el semáforo acumulado clásico Y el indicador de velocidad de gasto proyectado, por categoría.
	•	La app dispara al menos una alerta visible (en banner del dashboard) cuando una categoría entra en ritmo elevado (🟡) o crítico (🔴) de velocidad.
	•	Puede ver la comparación mes vs. mes anterior por categoría (analítica Nivel 1).
	•	Puede editar y eliminar movimientos, y gestionar categorías/presupuesto sin ayuda técnica.
	•	Los gastos recurrentes configurados se registran automáticamente sin intervención manual.
	•	El acceso a la app está protegido con Face ID o código (o bloqueo del propio iPhone como mínimo viable, si Face ID en PWA no es técnicamente viable).
	•	Los 26 movimientos históricos de junio 2026 fueron migrados correctamente.
11. Fases Sugeridas de Desarrollo
Fase
Contenido
Resultado esperado
Fase 1 — Base
Modelo de datos completo (incl. campos de analítica/alertas), autenticación, CRUD de categorías y movimientos
Backend funcional
Fase 2 — Captura y PWA
Registro rápido, gastos recurrentes (P0), PWA instalable, bloqueo biométrico
Reemplaza al Google Form con ventaja
Fase 3 — Dashboard y semáforo
Tarjetas resumen, tabla de categorías, semáforo acumulado clásico
Paridad con el Excel actual
Fase 4 — Alertas de velocidad
Cálculo de proyección de cierre, niveles de alerta, banner en dashboard, notificaciones push
El diferenciador clave de la v2.0
Fase 5 — Analítica Nivel 1 y 2
Comparación entre meses, promedios, patrones, detección de categoría fuera de control
David entiende sus hábitos, no solo sus números
Fase 6 — Catálogo P1
Selección de funcionalidades P1 que David priorice del catálogo (sección 6)
A definir según elección de David
Fase 7 — Analítica Nivel 3 y P2
Proyecciones avanzadas, simulador, reasignación sugerida, funcionalidades P2
Producto maduro
12. Anexo: Datos de Referencia
Fuente original: plantilla de Google Sheets de David, hojas 'Respuestas de formulario 1', 'Dashboard', 'Registro' y 'Presupuesto'. Disponible como referencia directa para el equipo de desarrollo, y como dataset base para validar que las nuevas fórmulas de analítica y proyección coincidan con la realidad antes de construir sobre datos sintéticos.
Indicador (junio 2026)
Valor
Ingresos del mes
S/ 1,500.00
Gastos del mes
S/ 914.67
Balance del mes
S/ 585.33
Ahorro registrado
S/ 200.00

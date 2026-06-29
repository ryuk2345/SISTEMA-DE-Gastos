---
name: pwa-ios-setup
description: Usar esta skill al configurar el manifest de la PWA, el service worker, notificaciones push, autenticación con biometría (Face ID), o cualquier aspecto de que la app "Mis Finanzas" funcione correctamente como app instalable en iPhone vía Safari. Activar también ante cualquier duda sobre qué es técnicamente posible o no en una PWA dentro de iOS.
---

# PWA en iOS/iPhone — Configuración y Limitaciones

"Mis Finanzas" se construye como PWA (Progressive Web App) instalable desde Safari — explícitamente NO como app nativa publicada en App Store. Esta skill documenta los requisitos técnicos y, más importante, las limitaciones reales de Apple/Safari que el equipo de desarrollo debe conocer ANTES de comprometer funcionalidades.

## Requisitos mínimos de instalación

- **HTTPS obligatorio** — sin esto, "Agregar a pantalla de inicio" no se comporta como PWA standalone.
- **Web App Manifest** (`manifest.json`) con al menos: `name`, `short_name`, `icons` (varios tamaños, incluir 180x180 y 192x192 mínimo para iOS), `theme_color`, `background_color`, `display: "standalone"`, `start_url`.
- **Meta tags específicas de Apple** en el `<head>` (Safari no siempre respeta el manifest estándar igual que Android/Chrome):
  ```html
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Mis Finanzas">
  <link rel="apple-touch-icon" href="/icon-180.png">
  ```
- **Service Worker** registrado para cacheo de assets estáticos (HTML/CSS/JS/íconos), de forma que la app cargue rápido y el formulario de registro esté listo en menos de 2 segundos.

## Limitaciones reales de Apple/Safari (no negociables, diseñar considerando esto)

1. **Notificaciones push**: solo funcionan en PWAs ya instaladas en la pantalla de inicio (no en Safari abierto como pestaña normal), y requieren iOS 16.4 o superior, vía Web Push API estándar. Si el dispositivo de David tiene una versión anterior, las notificaciones push simplemente no funcionarán — por eso TODA alerta debe tener también un respaldo visual (banner en el dashboard al abrir la app), nunca depender 100% del push.

2. **Almacenamiento local volátil**: iOS puede limpiar el almacenamiento local (localStorage, IndexedDB) de una PWA si no se abre durante un período prolongado. **Consecuencia de diseño obligatoria**: el backend remoto (Supabase/Firebase/API) es la fuente de verdad de los datos, NUNCA solo el almacenamiento local del dispositivo. El almacenamiento local solo debe usarse como caché/cola temporal para soporte offline, no como base de datos principal.

3. **Face ID / biometría**: el acceso vía biometría dentro de una PWA depende de la API WebAuthn, cuyo soporte y comportamiento en Safari/iOS debe validarse con una prueba técnica temprana (spike) antes de comprometerlo como funcionalidad P0 del roadmap. Si WebAuthn no resulta viable o la experiencia es mala, el plan B es depender del bloqueo nativo del propio iPhone (Face ID a nivel de sistema operativo) como mínimo viable, sin biometría propia dentro de la app.

4. **Sin acceso a APIs nativas avanzadas**: cámara y otros sensores tienen soporte limitado vía web APIs estándar; esto es relevante si se construye la funcionalidad de "escaneo de boletas/recibos (OCR)" del catálogo de funcionalidades (prioridad P2) — debe probarse temprano si la calidad de captura de cámara vía navegador es suficiente para OCR confiable.

## Checklist de validación antes de dar por "lista" la PWA

- [ ] Se puede instalar desde Safari vía "Compartir → Agregar a pantalla de inicio"
- [ ] Al abrir desde el ícono instalado, NO se ve la barra de navegador de Safari (modo standalone real)
- [ ] El ícono y nombre mostrados son los correctos (no el favicon genérico ni la URL)
- [ ] La app carga y el formulario de registro rápido está interactivo en menos de 2 segundos
- [ ] Los datos persisten correctamente tras cerrar la app, reiniciar el iPhone, o no abrirla por varios días (prueba real, no solo en desarrollo)
- [ ] Si se implementan notificaciones push, probarlas en un dispositivo con iOS 16.4+ real, no solo en simulador

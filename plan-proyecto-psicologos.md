# Plan de Proyecto — Plataforma de Agendamiento para Agencia de Psicólogos

**Stack:** Next.js 14+ (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL
**Duración estimada:** 8–10 semanas (1 desarrollador)

---

## Fase 0 — Setup y Fundamentos (Semana 1)

### 0.1 Configuración del proyecto
- [x] Inicializar proyecto Next.js con TypeScript y App Router
- [x] Configurar Tailwind CSS y sistema de diseño (colores, tipografías, espaciado del branding del cliente)
- [x] Configurar ESLint, Prettier
- [x] Crear repositorio en GitHub, configurar ramas (`main`, `develop`, `feature/*`)

### 0.2 Base de datos — Supabase
- [x] Crear proyecto en Supabase
- [x] Obtener connection string de PostgreSQL (para Prisma)
- [x] Instalar y configurar Prisma ORM apuntando a Supabase
- [x] Crear schema inicial con los modelos: `Psychologist`, `Patient`, `Appointment`, `IntakeForm`, `Payment`, `User`, `Session`, `Account`, `AdminUser`
- [x] Ejecutar primera migración
- [x] Crear seed script con datos de prueba (2-3 psicólogos ficticios)
- [x] Configurar Supabase Storage:
  - Crear bucket `psychologist-photos` (público)
  - Crear bucket `documents` (privado — para exportaciones de formularios)
- [x] Configurar Row Level Security (RLS) en tablas sensibles (`IntakeForm`, `Payment`):
  - Admin tiene acceso completo
  - Pacientes solo ven sus propios registros

### 0.3 Autenticación
- [x] Instalar y configurar Better Auth
- [x] Configurar provider **Google OAuth** para pacientes:
  - Crear proyecto en Google Cloud Console (o reutilizar el de Calendar API)
  - Obtener Client ID y Client Secret de OAuth 2.0
  - Configurar redirect URIs (localhost + dominio producción)
- [x] Configurar provider **Credentials** para administradores (email + contraseña)
- [x] Crear modelos en Prisma: `User` (pacientes, con googleId), `Session`, `Account`, `AdminUser`
- [x] Implementar página de login admin `/admin/login`
- [x] Implementar middleware de protección para rutas `/admin/*`
- [x] Implementar botón "Continuar con Google" para pacientes en el flujo de agendamiento
- [x] Implementar página básica `/mi-cuenta` (placeholder, se completa en Fase 3)
- [x] Crear layout base del panel admin (sidebar, header, navegación)

### 0.4 Deploy inicial
- [x] Configurar proyecto en Vercel
- [x] Conectar variables de entorno (Supabase URL, Supabase anon key, Supabase service role key, Better Auth secret, Google OAuth credentials)
- [x] Primer deploy funcional (landing placeholder + login admin)

**Entregable:** Proyecto corriendo en Vercel con login de admin funcional y base de datos conectada.

---

## Fase 1 — Landing Page (Semana 2)

### 1.1 Estructura y componentes
- [x] Crear layout principal (`Header`, `Footer`, navegación responsive)
- [x] Implementar `HeroSection` con CTA principal "Agenda tu cita"
- [x] Implementar `HowItWorksSection` (pasos del flujo: elige → agenda → formulario → paga)
- [x] Implementar `FAQSection` (componente de acordeón)
- [x] Implementar `Footer` (contacto, redes, legales)

### 1.2 Sección de psicólogos
- [x] Crear componente `PsychologistCard` (foto, nombre, especialidad, bio corta, tarifa, botón agendar)
- [x] Crear página/sección que lista los psicólogos desde la base de datos (SSR/SSG con ISR)
- [x] Crear página individual `/psicologos/[slug]` con perfil completo del psicólogo
- [x] Configurar Cloudinary (o S3) para almacenamiento de fotos de psicólogos
- [x] Implementar carga optimizada de imágenes (`next/image`)

### 1.3 SEO y rendimiento
- [x] Configurar metadata (title, description, Open Graph) por página
- [x] Agregar schema markup (HealthBusiness, Person para psicólogos)
- [x] Generar sitemap.xml
- [x] Verificar Core Web Vitals (LCP < 3s)

**Entregable:** Landing page pública completa con psicólogos reales cargados desde DB.

---

## Fase 2 — Panel Admin: Gestión de Psicólogos (Semana 3)

### 2.1 CRUD de psicólogos
- [x] Página `/admin/psicologos` — tabla con lista de psicólogos (nombre, especialidad, estado, acciones)
- [x] Página `/admin/psicologos/nuevo` — formulario de creación
  - Campos: nombre, email, foto (upload), especialidad, biografía, tarifa por sesión, duración de sesión
- [x] Página `/admin/psicologos/[id]/editar` — formulario de edición
- [x] Acción de activar/desactivar psicólogo (soft delete)
- [x] Acción de eliminar psicólogo (con confirmación)
- [x] Server Actions o API Routes para cada operación CRUD

### 2.2 Gestión de horarios
- [x] Componente de configuración de horarios semanales por psicólogo
  - Para cada día de la semana: activo/inactivo, hora inicio, hora fin
  - Posibilidad de agregar múltiples bloques por día (ej. mañana y tarde)
- [x] Almacenar horarios en DB (JSON o tabla relacionada `Schedule`)
- [x] Vista previa de disponibilidad semanal

### 2.3 Upload de imágenes
- [ ] Implementar servicio de upload a Supabase Storage (bucket `psychologist-photos`)
- [ ] Generar URL pública de la imagen para mostrar en landing
- [ ] Componente de upload con preview y crop en formulario de psicólogo

**Entregable:** Admin puede crear, editar, activar/desactivar y eliminar psicólogos con horarios y fotos.

---

## Fase 3 — Sistema de Agendamiento (Semanas 4–5)

### 3.1 Motor de disponibilidad
- [ ] Crear función `getAvailableSlots(psychologistId, date)`:
  1. Lee horarios base del psicólogo desde DB (ej. lunes 9-12, 14-18)
  2. Lee citas confirmadas desde DB → descarta esos slots
  3. **Consulta Google Calendar FreeBusy API** para el calendario del psicólogo → descarta bloques ocupados (eventos personales, bloqueos manuales del psicólogo)
  4. Excluye horarios pasados
  5. Retorna solo los slots libres en las tres fuentes
- [ ] API Route: `GET /api/availability?psychologistId=X&date=YYYY-MM-DD`
- [ ] Implementar caché corto (5 min) para FreeBusy queries para no exceder quotas
- [ ] Tests unitarios para la lógica de disponibilidad (slots normales, slots bloqueados por Calendar, slots con cita existente)

### 3.2 UI de agendamiento (público)
- [ ] Página `/agendar` o `/agendar/[psychologistSlug]`
- [ ] Paso 1: Selector de psicólogo (si no viene preseleccionado)
- [ ] **Paso 1.5: Gate de autenticación** — si el usuario no tiene sesión, mostrar pantalla de "Continuar con Google" antes de seguir. Redirect post-login de vuelta al flujo con el psicólogo preseleccionado.
- [ ] Paso 2: Calendario mensual interactivo
  - Mostrar días con disponibilidad destacados
  - Al seleccionar día, mostrar slots de hora disponibles
- [ ] Paso 3: Resumen de selección (psicólogo, fecha, hora, duración, precio)
- [ ] Botón "Continuar al formulario"
- [ ] Crear registro de `Appointment` en estado `pending_form`

### 3.3 Formulario de Inventario de Vida
- [ ] Mapear campos 1:1 del formulario de Ponic.io proporcionado por el cliente
- [ ] **Prellenar nombre y email desde la sesión de Google del paciente**
- [ ] Si el paciente ya tiene citas previas, prellenar teléfono y datos básicos guardados
- [ ] Implementar formulario multi-paso o en secciones:
  - Datos personales
  - Motivo de consulta
  - Historial de salud mental
  - Historial médico
  - Situación familiar / red de apoyo
  - Expectativas de terapia
  - Consentimiento informado (checkbox obligatorio)
- [ ] Validación client-side y server-side de todos los campos
- [ ] Guardar formulario en DB (`IntakeForm`) vinculado al `Appointment`
- [ ] Actualizar estado de cita a `pending_payment`
- [ ] Botón "Continuar al pago"

### 3.4 Bloqueo temporal de slots
- [ ] Al iniciar el proceso de agendamiento, bloquear el slot temporalmente (15 min)
- [ ] Liberar automáticamente si no se completa el flujo (cron job o TTL)
- [ ] Mostrar mensaje si el slot expira durante el proceso

### 3.5 Portal del paciente
- [ ] Página `/mi-cuenta` — datos del paciente (nombre, email de Google, teléfono)
- [ ] Página `/mi-cuenta/citas` — lista de citas pasadas y futuras con estado
- [ ] Middleware de protección para rutas `/mi-cuenta/*` (requiere sesión de Google)

**Entregable:** Un paciente puede seleccionar psicólogo, fecha/hora, llenar el formulario completo. La cita queda en estado pending_payment.

---

## Fase 4 — Integración Wompi (Semana 6)

### 4.1 Configuración
- [ ] Crear cuenta en Wompi sandbox (si no existe)
- [ ] Obtener llaves de prueba (pública y privada)
- [ ] Configurar variables de entorno: `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`
- [ ] Estudiar documentación de Wompi: https://docs.wompi.co/

### 4.2 Flujo de pago
- [ ] Implementar página de checkout `/agendar/pago`
  - Mostrar resumen: psicólogo, fecha, hora, monto
  - **Campo de cupón de descuento:** input para ingresar código + botón "Aplicar"
  - Al aplicar cupón: llamar al backend para validar → mostrar deducción y monto final
  - Integrar widget de Wompi o redirect a pasarela con el monto final (con descuento si aplica)
- [ ] Crear API Route `POST /api/coupons/validate`:
  - Validar que el código exista, esté activo, no esté vencido y no haya superado límite de usos
  - Retornar porcentaje de descuento y monto final calculado
- [ ] Crear transacción en Wompi vía API:
  - `POST /v1/transactions` con monto final, referencia, redirect URL
- [ ] Página de resultado `/agendar/resultado?ref=X`:
  - Consultar estado de la transacción vía API de Wompi
  - Mostrar éxito o fallo al paciente

### 4.3 Webhook de Wompi
- [ ] Crear endpoint `POST /api/webhooks/wompi`
- [ ] Validar firma del webhook (integridad)
- [ ] Al recibir pago aprobado:
  - Actualizar `Payment` a `approved`
  - Actualizar `Appointment` a `confirmed`
  - Disparar creación de evento en Google Calendar (Fase 5)
  - Disparar envío de email de confirmación (Fase 6)
- [ ] Al recibir pago rechazado:
  - Actualizar `Payment` a `rejected`
  - Liberar el slot de la cita
  - Notificar al paciente

### 4.4 Registro de pagos
- [ ] Guardar en DB: `Payment` con wompiTransactionId, amount, discountAmount, finalAmount, couponId, status, method, paidAt
- [ ] Vincular Payment ↔ Appointment ↔ Coupon
- [ ] Al confirmar pago con cupón: incrementar `currentUses` del cupón

### 4.5 Pruebas con sandbox
- [ ] Probar flujo completo con tarjetas de prueba de Wompi
- [ ] Probar webhook con ngrok en local
- [ ] Probar escenarios: pago exitoso, rechazado, pendiente

**Entregable:** Flujo de pago funcional en sandbox. Cita se confirma automáticamente al recibir pago aprobado.

---

## Fase 5 — Integración Google Calendar (Semana 7)

### 5.1 Configuración
- [ ] Crear proyecto en Google Cloud Console (o reutilizar el de OAuth si ya existe)
- [ ] Habilitar Google Calendar API
- [ ] Crear **Service Account** y descargar archivo de credenciales JSON
- [ ] Configurar variables de entorno: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- [ ] **Para cada psicólogo:** compartir su Google Calendar con el email de la Service Account (permisos: "Hacer cambios en eventos")
- [ ] Documentar el paso de compartir calendario como instrucción para onboarding de psicólogos (30 segundos, un solo paso)

### 5.2 Servicio de FreeBusy (consulta de disponibilidad)
- [ ] Implementar `GoogleCalendarService.getOccupiedSlots(calendarId, dateStart, dateEnd)`:
  - Llama a `FreeBusy.query` con el calendarId del psicólogo
  - Retorna lista de bloques ocupados (inicio, fin)
- [ ] Integrar en el motor de disponibilidad de la Fase 3 (`getAvailableSlots`)
- [ ] Testear con eventos reales en calendario de prueba

### 5.3 Creación de eventos
- [ ] Implementar servicio `GoogleCalendarService`:
  - `createEvent(psychologistCalendarId, appointmentData)` → crea evento con:
    - Título: "Consulta — [Nombre paciente]"
    - Fecha/hora de inicio y fin
    - Descripción: datos básicos del paciente y enlace al formulario en el admin
    - Invitado: email del paciente
- [ ] Llamar este servicio desde el webhook de Wompi al confirmar pago
- [ ] Guardar `googleEventId` en el registro de `Appointment`

### 5.3 Sincronización
- [ ] Al cancelar una cita desde admin → eliminar evento de Google Calendar
- [ ] Al reagendar → actualizar evento en Google Calendar

**Entregable:** Al pagar, se crea automáticamente un evento en el Google Calendar del psicólogo con los datos de la cita.

---

## Fase 6 — Emails Transaccionales (Semana 7, en paralelo con Fase 5)

### 6.1 Configuración
- [ ] Crear cuenta en Resend (free tier)
- [ ] Configurar dominio y verificar DNS (SPF, DKIM)
- [ ] Instalar SDK de Resend (`resend`) y React Email (`@react-email/components`)
- [ ] Configurar variable de entorno: `RESEND_API_KEY`
- [ ] Crear carpeta `emails/` con estructura para templates React Email

### 6.2 Templates y envíos
- [ ] Template: **Confirmación de cita** (→ paciente)
  - Datos: nombre del psicólogo, fecha, hora, duración, dirección/enlace de videollamada
- [ ] Template: **Recordatorio 24h antes** (→ paciente)
  - Datos: mismos que confirmación + CTA para ver detalles en `/mi-cuenta/citas`
- [ ] Template: **Nueva cita agendada** (→ psicólogo)
  - Datos: nombre del paciente, fecha, hora, enlace al formulario del paciente en admin
- [ ] Template: **Cita cancelada** (→ psicólogo)
  - Datos: nombre del paciente, fecha y hora de la cita cancelada
- [ ] Template: **Pago rechazado** (→ paciente)
  - Datos: motivo si está disponible, enlace para reintentar
- [ ] Implementar servicio `EmailService` con una función por cada tipo de email
- [ ] Integrar envíos en los flujos correspondientes (webhook Wompi, cancelación desde admin)

### 6.3 Cron de recordatorios
- [ ] Implementar cron job (Vercel Cron o similar) que corra diario
- [ ] Buscar citas confirmadas para las próximas 24h y enviar recordatorio

**Entregable:** Emails automáticos de confirmación, recordatorio y fallo de pago.

---

## Fase 7 — Panel Admin: Citas, Formularios y Finanzas (Semana 8)

### 7.1 Gestión de citas
- [ ] Página `/admin/citas` — tabla con filtros (fecha, psicólogo, estado)
- [ ] Vista de calendario (vista semanal/mensual)
- [ ] Detalle de cita: datos del paciente, estado, pago asociado, enlace al formulario
- [ ] Acciones: cancelar cita, marcar como completada, marcar no-show

### 7.2 Formularios de pacientes
- [ ] Página `/admin/formularios` — lista con filtros (paciente, psicólogo, fecha)
- [ ] Vista detallada del formulario completo de cada paciente
- [ ] Botón de exportar a PDF
- [ ] Botón de exportar lista a CSV

### 7.3 Pagos y finanzas
- [ ] Página `/admin/pagos` — lista de transacciones con estado y filtros
- [ ] Página `/admin/finanzas` — vista por psicólogo:
  - Total recaudado (período seleccionable)
  - Número de consultas realizadas
  - Saldo a favor (total - comisiones de plataforma si aplica)
  - Tabla comparativa entre psicólogos

### 7.4 Dashboard principal
- [ ] Página `/admin` (dashboard):
  - Citas de hoy / esta semana
  - Ingresos del mes
  - Psicólogo más agendado del mes
  - Gráfico de citas por semana (últimas 8 semanas)
  - Gráfico de ingresos por mes (últimos 6 meses)
  - Últimas 5 citas agendadas

### 7.5 Gestión de cupones
- [ ] Modelo `Coupon` en Prisma: code (único), discountPercent, expiresAt, maxUses, currentUses, isActive
- [ ] Página `/admin/cupones` — tabla con lista de cupones (código, descuento, vencimiento, usos, estado)
- [ ] Página `/admin/cupones/nuevo` — formulario de creación
- [ ] Editar y desactivar cupones existentes
- [ ] Métricas por cupón: veces usado, monto total descontado

**Entregable:** Panel admin completo con toda la información de citas, formularios, pagos, cupones y métricas.

---

## Fase 8 — QA, Seguridad y Pulido (Semana 9)

### 8.1 Seguridad
- [ ] Auditar que todas las rutas de admin estén protegidas
- [ ] Validar que los datos de formularios se almacenen cifrados o con acceso restringido
- [ ] Implementar rate limiting en API routes críticas (login, webhooks, agendamiento)
- [ ] Revisar headers de seguridad (CSP, HSTS, etc.)
- [ ] Agregar página de Política de Privacidad y Términos de Servicio
- [ ] Revisar cumplimiento con Ley 1581 de 2012 (Habeas Data)

### 8.2 Testing
- [ ] Tests E2E del flujo completo: agendar → formulario → pago → confirmación
- [ ] Tests de webhook de Wompi (pago exitoso, rechazado, duplicado)
- [ ] Tests de disponibilidad de slots (edge cases: zona horaria, medianoche, slots llenos)
- [ ] Testing manual cross-browser (Chrome, Safari, Firefox, Edge)
- [ ] Testing responsive (móvil, tablet, desktop)

### 8.3 Performance
- [ ] Optimizar imágenes y lazy loading
- [ ] Verificar Core Web Vitals en Vercel Analytics
- [ ] Revisar bundle size

### 8.4 Pulido UX
- [ ] Estados de carga (skeletons, spinners)
- [ ] Mensajes de error user-friendly
- [ ] Animaciones y transiciones suaves
- [ ] Revisar flujo completo desde la perspectiva del paciente (UX walkthrough)

**Entregable:** Plataforma estable, segura y testeada.

---

## Fase 9 — Go Live (Semana 10)

### 9.1 Preparación para producción
- [ ] Migrar llaves de Wompi de sandbox a producción
- [ ] Verificar credenciales de Google Calendar en producción
- [ ] Configurar dominio personalizado en Vercel
- [ ] Configurar SSL (automático en Vercel)
- [ ] Configurar variables de entorno de producción en Vercel
- [ ] Cargar datos reales de psicólogos (fotos, bios, horarios, tarifas)
- [ ] Crear cuenta de admin de producción

### 9.2 Launch
- [ ] Hacer deploy final a producción
- [ ] Prueba de humo: agendar una cita real de prueba con pago real
- [ ] Verificar emails llegan correctamente
- [ ] Verificar evento aparece en Google Calendar
- [ ] Monitorear logs las primeras 24-48h

### 9.3 Entrega al cliente
- [ ] Documentación de uso del panel admin
- [ ] Guía para agregar/editar psicólogos
- [ ] Capacitación al equipo administrativo
- [ ] Entregar credenciales y accesos

**Entregable:** Plataforma en producción, funcionando con datos reales.

---

## Resumen de Fases

| Fase | Semana | Descripción |
|---|---|---|
| 0 | 1 | Setup, DB, auth, deploy inicial |
| 1 | 2 | Landing page |
| 2 | 3 | Admin: gestión de psicólogos |
| 3 | 4–5 | Sistema de agendamiento + formulario |
| 4 | 6 | Integración Wompi |
| 5 | 7 | Integración Google Calendar |
| 6 | 7 | Emails transaccionales |
| 7 | 8 | Admin: citas, formularios, finanzas |
| 8 | 9 | QA, seguridad, pulido |
| 9 | 10 | Go live |

---

## Dependencias Externas a Gestionar Temprano

1. **Wompi:** iniciar proceso de registro/aprobación en Semana 1.
2. **Google Cloud:** crear proyecto y habilitar Calendar API en Semana 1.
3. **Branding:** recibir assets del cliente (logo, colores, tipografías) antes de Semana 2.
4. **Formulario:** confirmar campos exactos del inventario de vida antes de Semana 4.
5. **Dominio:** registrar/configurar dominio antes de Semana 9.
6. **Legal:** texto de política de privacidad y consentimiento informado antes de Semana 8.

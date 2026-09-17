# ALIA v2 — Plan de desarrollo por fases

## Context

ALIA hoy es una plataforma de un solo rol operativo: existe `user.role` como string libre con dos valores reales (`"patient"` sembrado por defecto y `"admin"` creado únicamente por `prisma/seed.ts`). El cliente pidió abrir la operación a tres roles (admin, asistente, psicólogo), dar cuenta propia a los especialistas, dar un portal real al paciente, y rediseñar el embudo de agendamiento porque genera confusión medible: la gente ve la fecha, la hora y el especialista **antes** de llenar el Inventario de Vida y cree que ya terminó.

El resultado esperado al cerrar v2:

- Tres roles con módulos diferenciados, con autorización real (no por middleware).
- Especialistas con cuenta: su calendario, sus clientes, sus links de pago, agendamiento manual y solicitudes de monto personalizado.
- Admin y asistente con bandeja de aprobaciones — montos personalizados **y solicitudes de reembolso**.
- Paciente con dashboard: su especialista, su próxima sesión, cancelar/reagendar, editar formulario y datos, y pagar cobros pendientes — bloqueado de agendar de nuevo en una modalidad mientras tenga ahí una sesión ya realizada y sin pagar.
- Landing con agendamiento sin elegir psicólogo: match automático por carga semanal, con el especialista revelado **al terminar** el formulario. La sección de especialistas de la home deja de mostrar un subconjunto de 3: muestra a **todos** los psicólogos activos, en orden aleatorio.
- Precio y comisión definidos al agendar, no al generar el link. Checkout de Stripe servido bajo **dominio propio** del cliente.
- Terapia de pareja, multa por no presentarse, y fallback de correo a Brevo al topar el free tier de Resend.
- Sección "Clientes" (reemplaza "Formularios"): listado filtrable de pacientes con ficha de detalle.

> **Alineado con el PRD v2 v1.1** (`PRD_ALIA_v2_v1.1.pdf`, feedback directo del cliente). El registro de cambios v1.0→v1.1 del PRD: reembolso ya no se automatiza en Stripe (queda como solicitud aprobada + ejecución manual); asistente sí decide reembolsos; nueva regla de sesión impaga bloqueando agendamiento; landing muestra todos los psicólogos, no 3 al azar; balanceo del match cerrado (por número de sesiones, tope 5/día); dominio propio en Stripe Checkout; "Formularios" evoluciona a "Clientes"; paquetes de sesiones con descuento queda como decisión abierta. Cada fase de abajo señala dónde aplica.

### Hallazgo crítico que condiciona todo el orden

**Los 14 archivos `src/lib/admin/*-actions.ts` no tienen ninguna verificación de sesión ni de rol.** El único portero es `src/proxy.ts`, que exige `session.user.role === "admin"` para `/admin/**`. Hoy eso alcanza porque solo admin entra a `/admin`. En el momento en que asistente y psicólogo entren al mismo espacio, ese portero se abre y cualquiera de ellos puede invocar por POST `deletePsychologist`, `updatePayoutSettings`, `getFinanceByPsychologist` o `voidPayment`. Además `src/app/admin/(dashboard)/layout.tsx` lee la sesión pero nunca valida el rol, y solo 3 rutas API re-verifican.

Por eso la Fase 0 no es opcional ni se puede posponer: es el prerequisito de la Fase 1.

### Decisiones ya tomadas

| Decisión | Elección |
|---|---|
| Orden del embudo nuevo | modalidad → fecha/hora → auth → formulario → **match + reveal del especialista** |
| Paciente recurrente | siempre su mismo especialista asignado, **por modalidad** |
| Espacio de rutas del psicólogo | mismo `/admin` con nav y datos filtrados por permiso |
| Modalidades | individual (60 min) y pareja (120 min), como vías independientes |
| Balanceo del match (PRD §6.6, cerrado en v1.1) | por **número de sesiones** confirmadas en la semana ISO, no por minutos; tope de **5 citas confirmadas/día por especialista**, sin distinguir individual/pareja |
| Reembolsos (PRD §6.4/§9, cerrado en v1.1) | **nunca** se llama a la API de reembolso de Stripe; flujo de solicitud → aprobación (admin o asistente) → ejecución manual del admin en el dashboard de Stripe |
| Landing de especialistas (PRD §6.6) | muestra el 100% de los psicólogos activos, orden aleatorio en cada carga — ya no `MAX_FEATURED = 3` |
| Dominio de Stripe Checkout (PRD §6.7, nuevo) | checkout servido bajo un dominio propio del cliente, verificado por DNS en el dashboard de Stripe |
| "Formularios" → "Clientes" (PRD §6.8, nuevo) | sección compartida por todo el staff con filtros y ficha de detalle, reemplaza la vista actual |
| Sesión impaga bloquea agendar (PRD §6.5/§6.6, nuevo) | por **modalidad** (asunción del PRD, pendiente de confirmar explícitamente con el cliente — ver riesgos) |

### Individual y pareja son dos vías independientes

Un mismo paciente puede llevar terapia de pareja **y** terapia individual en paralelo, y casi siempre con especialistas distintos. Eso no es un detalle de tarifa: es una segunda dimensión del dominio, y toca tres cosas que hoy asumen un solo carril.

1. El especialista asignado no es uno por paciente, es **uno por `(userId, sessionType)`**.
2. La modalidad se pregunta **al inicio de `/agendar`**, no en el formulario, porque el match y la duración del slot dependen de ella.
3. `getActivePatientAppointment` (`src/lib/queries/patient-appointments.ts`), que hoy impone "una cita activa por paciente", bloquearía a alguien con individual activa que quiere agendar pareja. Pasa a ser **una cita activa por modalidad**.

La sesión de pareja dura **2 horas**. El motor de disponibilidad ya lo soporta sin cambios estructurales: `generateTimeSlots(blocks, sessionDuration)` ya recibe la duración como parámetro y `subtractBusyPeriods` compara instantes reales, así que slots de 60 y de 120 min conviven correctamente sobre el mismo horario.

---

## Convenciones de trabajo

- **Rama**: `develop` desde `master`. Todo el trabajo de v2 va a ramas `feat/v2-*` que mergean a `develop`. `master` solo recibe merges de `develop` ya testeado.
- **Commits**: conventional commits, en inglés, un work unit por commit (migración + código + test juntos).
- **PRs**: si una fase pasa de ~400 líneas, se parte en PRs encadenados.
- **Nunca correr `bun run build`** (regla del proyecto). Verificación con `bun run lint`, `bun test` y prueba manual en `bun run dev`.
- **Migraciones**: una migración por fase, nombre descriptivo (`npx prisma migrate dev --name ...`), siempre seguida de `npx prisma generate`.
- **TDD estricto para lógica pura**: matriz de permisos, algoritmo de match, math de precios y selección de transporte de correo se escriben con test primero en `src/lib/__tests__/` (vitest ya configurado, ver `src/lib/__tests__/availability.test.ts` como referencia de estilo).
- **Idioma**: código y comentarios en inglés; todo texto de UI en español neutro.

---

## Fase 0 — Rama y capa de autorización real ✅ implementada

Objetivo: que ninguna server action confíe en el middleware. Sin esto, la Fase 1 abre un hueco de seguridad.

Implementada y verificada contra los 11 archivos reales de `src/lib/admin/*-actions.ts` (no 14 — corrección sobre una exploración anterior), función por función. La matriz de permisos incorpora una aclaración del cliente sobre el alcance del asistente:

- El asistente **sí** puede reclasificar el tipo de comisión de un pago entre los 4 tipos preestablecidos (`RECURRING/NEW/LOYAL/LOYAL_NEW`) y anular pagos pendientes — ejemplo del cliente: corregir a un paciente marcado como "nuevo" que en realidad era recurrente.
- El asistente **no** puede editar los porcentajes globales de cada tipo (`PayoutSettings`, permiso `settings.write`) — exclusivo de admin, sin excepción.
- El asistente **sí** administra cupones y tarifas.
- El asistente **sí** puede decidir aprobaciones (Fase 5), pero esa capacidad nunca debe permitirle fijar un porcentaje de comisión arbitrario — solo elegir entre los tipos ya existentes (ver nota de negocio para la Fase 5, más abajo).
- La gestión del roster de psicólogos (crear/editar/**borrar**) queda solo para admin — no fue mencionada por el cliente y `deletePsychologist` es un borrado físico, el de mayor radio de impacto del lote. Se separó de "editar horarios" (`schedule.write.all`/`schedule.write.own`), que sí es operativo y el asistente puede hacer para cualquier psicólogo.
- `rate.write` para asistente es una inferencia (no confirmada explícitamente, a diferencia de cupones/comisiones/aprobaciones) — un cambio de una línea en `ROLE_PERMISSIONS` si hace falta revertirlo.

### 0.1 Rama — hecho
`develop` creada desde `master`.

### 0.2 Prerequisito de schema: `Psychologist.userId` — hecho
Se detectó en esta fase (no en la 1.1 como se pensó originalmente) que `requireOwnAppointment` necesita resolver qué psicólogo es el actor, y eso requiere el link `Psychologist.userId` que hoy no existía. Se adelantó ese único campo:
- `prisma/schema.prisma`: `Psychologist.userId String? @unique` (sin `@relation` todavía — eso llega en la Fase 1 junto con el enum `Role`).
- Migración `20260910000000_add_psychologist_user_id` — escrita a mano y aplicada con `prisma migrate deploy`, no con `migrate dev`: la base tiene una tabla `_intake_form_dedup_backup` (auditoría intencional de una migración anterior, no declarada en el schema) que `migrate dev` detecta como drift y quiere borrar. `migrate deploy` aplica solo el `.sql` nuevo sin reconciliar drift.

### 0.3 Contrato de permisos — `src/lib/auth/permissions.ts` — hecho (TDD)
- `Role`, `Permission` (19 valores), `ROLE_PERMISSIONS`, `can(role, permission)`, `ALL_PERMISSIONS`, `STAFF_ROLES` + `isStaffRole(raw)`.
- Test en `src/lib/__tests__/permissions.test.ts` — 26 casos, verde.

Matriz completa (permiso → quién lo tiene), verificada función por función:

| Archivo | Función | Permiso | Alcance |
|---|---|---|---|
| `psychologist-actions.ts` | las 5 funciones | `psychologist.write` | solo admin |
| `schedule-actions.ts` | `saveSchedules` | `schedule.write.all` / `schedule.write.own` | admin+asistente: cualquiera · psicólogo: solo el suyo |
| `appointment-actions.ts` | las 6 funciones | `appointment.write` + ownership | admin+asistente: todas · psicólogo: solo las suyas |
| `manual-booking-actions.ts` | `createManualAppointment` | `appointment.write` | psicólogo: se fuerza `psychologistId` propio |
| `payment-actions.ts` | `generatePaymentLink`, `sendPaymentLinkEmail` | `payment.link.create` + ownership | admin+asistente: todas · psicólogo: solo las suyas |
| `payment-actions.ts` | `voidPayment`, `updatePaymentCommission` | `payment.commission.write` | admin+asistente (sin psicólogo) |
| `payment-rate-actions.ts` | las 3 funciones | `rate.write` | admin+asistente |
| `coupon-actions.ts` | las 3 funciones | `coupon.write` | admin+asistente |
| `intake-form-actions.ts` | `updateIntakeForm`, `deleteIntakeForm` | `intake.write` | admin+asistente (sin psicólogo) |
| `report-actions.ts` | `emailSessionsReport` | `appointment.read.all`/`.own` vía `resolvePsychologistScope` | admin+asistente: filtro libre · psicólogo: forzado a lo propio |
| `site-settings-actions.ts`, `payout-settings-actions.ts` | ambas | `settings.write` | solo admin |

Permisos forward-declared (no consumidos aún, para que la matriz y su test queden completos desde ya): `finance.read` (solo admin), `staff.write` (Fase 1.2, solo admin), `approval.request` (Fase 5, psicólogo), `approval.decide` (Fase 5, admin+asistente), `patient.write` (Fase 4.2, psicólogo), `intake.read.all`/`.own` (scoping de queries futuras).

**Nota de negocio para la Fase 5**: cuando se construya `approveRequest`, si el payload fija un porcentaje de comisión arbitrario (en vez de seleccionar entre los `PayoutType` existentes), esa rama debe exigir además `settings.write` — el asistente decide la mayoría de las aprobaciones, pero nunca una que termine cambiando un porcentaje a su gusto.

### 0.4 Helpers de guardia — `src/lib/auth/{errors,require}.ts` — hecho
- `ForbiddenError extends Error` — los catches existentes (`if (err instanceof Error) return {success:false, error: err.message}`) lo absorben sin tocarlos. Las pocas funciones sin try/catch propagan el error tal cual a Next (aceptable: ningún usuario legítimo debería tener el botón visible).
- `getCurrentActor`, `requireActor`, `requirePermission`, `requireOwnAppointment`, `requireScheduleAccess`, `resolvePsychologistScope`.
- `getCurrentActor` normaliza `session.user.role`: hoy solo existen los strings `"admin"` y `"patient"` en la base (assistant/psychologist no tienen cuentas todavía — eso es la Fase 1), y cualquier valor no reconocido cae a `"patient"` por seguridad.

### 0.5 Instrumentadas las 11 acciones — hecho (según la matriz de 0.3)

### 0.6 Las 3 rutas API con chequeo inline — hecho
`citas/reporte` → `appointment.read.all`; `formularios/export.csv` → `intake.read.all`; `formularios/[id]/pdf` → `intake.read.all` o (`intake.read.own` + ownership), dejando el camino listo para cuando el psicólogo vea a sus pacientes en la Fase 4.

### 0.7 Shell y proxy — hecho
- `src/app/admin/(dashboard)/layout.tsx`: `requireActor()`, redirige a `/admin/login` si falla. **No** se le pasa `role` a `AdminShell` todavía — se hace en la Fase 1.3 cuando `sidebar-nav.tsx` lo consuma de verdad.
- `src/proxy.ts`: `isStaffRole(...)` en vez de comparar contra `"admin"` a mano, tanto en el gate de `/admin/**` como en el redirect de `/admin/login`.

**Verificación 0 — hecho**: `bun test` (26/26 en permisos; la única falla en toda la suite es `availability.test.ts`, preexistente y no relacionada — dos tests con fechas hardcodeadas de julio 2026 que ya quedaron en el pasado respecto al reloj actual); `bun run lint` limpio; `bunx tsc --noEmit` sin errores fuera de una caché `.next/types` obsoleta y no relacionada. La prueba real de bloqueo (crear un usuario `assistant` e invocar `updatePayoutSettings` desde la consola) queda para la Fase 1, cuando existan cuentas con esos roles — hoy solo hay `admin` y `patient`, y `admin` tiene todos los permisos, así que nada cambia de comportamiento todavía.

---

## Fase 1 — Roles y cuentas de staff

### 1.1 Schema
- [ ] `prisma/schema.prisma`: enum `Role { ADMIN ASSISTANT PSYCHOLOGIST PATIENT }`. `User.role` pasa de `String @default("patient")` a `Role @default(PATIENT)`.
  - Ojo: better-auth escribe `role` como string vía el plugin `admin` (`src/lib/auth.ts`, `defaultRole: "patient"`). Alinear `defaultRole` al valor del enum y verificar que `additionalFields.role` siga serializando bien en `session.user`.
  - Alternativa si el plugin da problemas: dejar `String` y validar con yup/`Role` en el borde. Decidir al escribir la migración; documentar la elección en el commit.
- [ ] `Psychologist.userId` ya existe (agregado en la Fase 0.2) — esta fase solo agrega la relación `@relation` formal a `User` (`onDelete: SetNull`).
- [ ] Migración `add_roles_and_psychologist_relation` + backfill: `UPDATE "user" SET role='ADMIN' WHERE role='admin'`, resto `PATIENT`.

### 1.2 Alta de cuentas de staff
- [ ] Nueva página `/admin/equipo` (permiso `staff.write`, solo admin): tabla de usuarios staff + sheet de creación.
- [ ] `src/lib/admin/staff-actions.ts`: `createStaffUser({ name, email, role, psychologistId? })` usando `auth.api.createUser` (mismo patrón que `manual-booking-actions.ts:110`) y luego set del rol; `updateStaffRole`, `deactivateStaffUser` (usar `banned` que ya existe en el schema).
- [ ] Al crear un usuario con rol `PSYCHOLOGIST`, exigir seleccionar el `Psychologist` a vincular (select de `getActivePsychologists()`) y escribir `Psychologist.userId`.
- [ ] Enviar correo de bienvenida con set-password reusando `sendPasswordResetEmail` (`src/lib/email.ts:372`).
- [ ] Permitir login por credenciales a los tres roles staff en `/admin/login` y, tras el signIn, validar el rol devuelto antes de `router.push("/admin")` (hoy no lo valida).

### 1.3 Nav y dashboard por rol
- [ ] `src/components/admin/sidebar-nav.tsx`: el array `navSections` hardcodeado pasa a llevar `permission: Permission` por ítem; el componente recibe `role` y filtra con `can(role, item.permission)`.
- [ ] Nuevos ítems: `Aprobaciones` (`/admin/aprobaciones`), `Equipo` (`/admin/equipo`).
- [ ] El ítem existente `Formularios` se renombra a `Clientes` (`/admin/clientes`) — ver Fase 4.2 (PRD §6.8, nuevo en v1.1: reemplaza "Formularios" como punto de entrada, visible para los tres roles de staff con datos filtrados por permiso).
- [ ] `src/components/admin/admin-shell.tsx`: el subtítulo hardcodeado `"Administrador"` pasa a derivarse del rol.
- [ ] `src/app/admin/(dashboard)/page.tsx`: extraer las tarjetas en componentes y renderizar por permiso (psicólogo: sus sesiones de hoy/semana y su ingreso propio; asistente: sesiones y formularios, sin finanzas).
- [ ] `src/lib/admin/alerts-queries.ts` (`getAdminAlerts`): aceptar el actor y filtrar por `psychologistId` cuando corresponda.

**Verificación 1**: crear un usuario de cada rol; entrar con cada uno y confirmar que el sidebar muestra solo lo permitido y que `/admin/finanzas` con rol asistente redirige o muestra "no autorizado".

---

## Fase 2 — Responsive del admin

Se hace **antes** de construir pantallas nuevas: todo lo que se cree después hereda estos primitivos. El shell ya tiene Sheet móvil funcionando (`admin-shell.tsx`); el problema está en el contenido.

### 2.1 Primitivos
- [ ] `src/components/ui/table.tsx`: quitar `whitespace-nowrap` de `TableHead`/`TableCell` y dejarlo opt-in por clase; el `overflow-x-auto` debe vivir en el contenedor de la tabla y no en `<main>`.
- [ ] `src/components/admin/admin-shell.tsx:121`: quitar `overflow-x-auto` de `<main>` para que scrollee la tabla, no la página entera.
- [ ] Crear `src/components/admin/data-table-shell.tsx`: wrapper con `overflow-x-auto` propio + prop `mobileRender?` para pintar tarjetas en `< md` en lugar de tabla.
- [ ] Crear `src/components/admin/page-header.tsx`: reemplaza los 6 `<div className="flex items-center justify-between">` sin `flex-wrap` (`citas`, `finanzas`, `cupones`, `formularios`, `psicologos`, `tarifas`) por `flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.

### 2.2 Arreglos puntuales
- [ ] Sheets con `min-w-lg` (512px, revienta en móvil): `coupon-sheet.tsx:76`, `rate-sheet.tsx:39`, `payout-settings-sheet.tsx`, `psychologist-sheet.tsx:84` → `w-full sm:min-w-lg`.
- [ ] `grid-cols-2` sin prefijo responsive: `new-manual-appointment-dialog.tsx:227,285`, `reschedule-appointment-dialog.tsx:115`, `generate-report-dialog.tsx:99` → `grid-cols-1 sm:grid-cols-2`.
- [ ] Filtros con ancho fijo `w-52` / skeleton `w-96`: `appointments-filters.tsx:51,71`, `finance-filters.tsx`, `payments-filters.tsx`, `period-filter.tsx`, y los `Skeleton className="h-9 w-96"` de `finanzas/page.tsx:52` y `citas/page.tsx:69` → `w-full sm:w-52`.
- [ ] `payment-table.tsx` (13 columnas, el peor caso): definir prioridad de columnas y usar `data-table-shell` con vista de tarjeta en móvil (Persona, Total USD, Estado, acciones).
- [ ] Mismo tratamiento en `appointments-table.tsx`, `coupon-table.tsx`, `psychologist-table.tsx`, `rate-table.tsx` y la tabla inline de `formularios/page.tsx:62` (extraerla a componente primero).

**Verificación 2**: en `bun run dev`, con DevTools a 375px, recorrer las 9 páginas de admin: ningún scroll horizontal de página, ningún sheet cortado, todos los botones alcanzables.

---

## Fase 3 — Modelo de precios de la cita

Va antes del portal del cliente y del panel del especialista porque los dos dependen de que el precio viva en la cita.

Hoy el precio y la comisión se eligen al **generar el link** (`resolveCheckoutUrl` en `src/lib/admin/payment-actions.ts` lee `PaymentRate` por moneda y el admin elige `payoutType` en el diálogo). El cliente quiere que se definan al **agendar**.

### 3.1 Schema
- [ ] Enum `SessionType { INDIVIDUAL COUPLE }` y enum `RateKind { INDIVIDUAL COUPLE NO_SHOW_FEE }`.
- [ ] `Appointment`: `sessionType SessionType @default(INDIVIDUAL)`, `agreedAmount Int?`, `agreedCurrency String?`, `agreedPayoutType PayoutType?`.
- [ ] `Psychologist`: `offeredSessionTypes SessionType[] @default([INDIVIDUAL])` (define quién es candidato para pareja) y `coupleSessionDuration Int @default(120)` junto al `sessionDuration Int @default(60)` que ya existe.
- [ ] `PaymentRate`: cambiar `currency String @unique` por `kind RateKind @default(INDIVIDUAL)` + `@@unique([currency, kind])`. Migración con backfill de las filas existentes a `INDIVIDUAL`.
- [ ] `Payment`: `isNoShowFee Boolean @default(false)`.
- [ ] Helper `getSessionDuration(psychologist, sessionType)` en `src/lib/availability.ts` — único punto que decide 60 vs 120. Test primero.

### 3.2 Lógica
- [ ] `src/lib/admin/payment-rate-queries.ts`: `getRate(currency, kind)`, `getAllRates()` agrupado por kind; `getPublicDisplayRate(country)` sigue usando `INDIVIDUAL`.
- [ ] `resolveCheckoutUrl`: dejar de preguntar moneda/comisión. Nuevo orden de resolución del monto: `appointment.agreedAmount` → si no existe, `getRate(currency, kindDe(appointment))`. La comisión sale de `appointment.agreedPayoutType`.
- [ ] Test primero en `src/lib/__tests__/pricing.test.ts` para el resolutor de monto/comisión/kind (individual, pareja, multa, monto acordado, fallback a tarifa).

### 3.3 UI
- [ ] `new-manual-appointment-dialog.tsx`: agregar selects de tipo de sesión, moneda, monto (prellenado con la tarifa) y comisión. Es donde el cliente pidió "establecer cuánto se cobrará y qué comisión".
- [ ] `generate-payment-link-dialog.tsx`: pasa a ser confirmación (muestra monto/comisión ya acordados) con un enlace "editar precio de esta sesión" para admin.
- [ ] Nuevo diálogo "Editar precio de la sesión" (`appointments-table.tsx`): permite cambiar monto/comisión de una cita autoagendada — requisito explícito del cliente.
- [ ] `/admin/tarifas`: tabs o columna por `kind` para administrar tarifa individual, de pareja y multa de no-show.
- [ ] Multa: en `markNoShow` (`appointment-actions.ts:108`), ofrecer generar un cobro con `kind: NO_SHOW_FEE` e `isNoShowFee: true`.
- [ ] `/admin/psicologos`: en `psychologist-form.tsx`, checkboxes de modalidades atendidas y campo de duración de pareja.
- [ ] La modalidad **no** se pregunta en el formulario de intake — se elige al inicio de `/agendar` (Fase 7.2) y en el diálogo de agendamiento manual. En el formulario aparece solo como dato de contexto de solo lectura.

### 3.4 Dominio propio de Stripe Checkout (PRD §6.7, nuevo en v1.1)
- [ ] Configurar y verificar (DNS) un dominio personalizado (p. ej. `pagos.<dominio-cliente>`) en el dashboard de Stripe para Checkout. Confirmar con el cliente el subdominio exacto y quién gestiona el DNS (ver riesgos).
- [ ] Ajustar `resolveCheckoutUrl`/creación de la Checkout Session para que sirva bajo ese dominio en vez de `checkout.stripe.com`.
- [ ] Verificar que el webhook (`/api/webhook`) y los parámetros de retorno `?pago=exitoso|cancelado` (Fase 6.2) siguen funcionando igual con el dominio nuevo — no es un cambio de lógica de negocio, solo de configuración.

**Verificación 3**: `bun test`; agendar manualmente una sesión de pareja con monto y comisión, confirmar que ocupa 2 horas en el calendario y que Stripe recibe el monto de la tarifa de pareja; marcar un no-show y generar la multa; abrir un link de pago y confirmar que la URL usa el dominio propio configurado, no `stripe.com`.

---

## Fase 4 — Panel del especialista

### 4.1 Horarios y días libres
- [ ] Schema: modelo `TimeOff { id, psychologistId, startsAt, endsAt, reason String?, createdAt }` con índice por `psychologistId`. Migración.
- [ ] `src/lib/availability.ts`: `computeMonthAvailability` recibe los `TimeOff` como periodos ocupados extra (se suman a `busyPeriods` antes de `subtractBusyPeriods`). Test primero en `availability.test.ts`.
- [ ] Página `/admin/mi-calendario` (permiso `schedule.write.own`): reusar `src/components/admin/schedule-editor.tsx` (ya responsive) scoped al `psychologistId` del actor + nueva sección de días libres (crear/eliminar rango).
- [ ] Vista de agenda: reusar el calendario de `/admin/citas` filtrado a sus citas.

### 4.2 Sección Clientes — reemplaza "Formularios" (PRD §6.8, nuevo en v1.1)
El scope creció respecto al plan original: ya no es solo "sus clientes" del psicólogo — `/admin/formularios` evoluciona a `/admin/clientes` como punto de entrada compartido por los tres roles de staff, con datos filtrados por permiso.
- [ ] Query `getPatientsByPsychologist(psychologistId)` en `src/lib/admin/patient-queries.ts` (scope psicólogo) y `getAllPatients(filters)` (scope admin/asistente): usuarios con al menos una cita, conteo de citas pasadas/próximas y último formulario.
- [ ] `/admin/clientes`: listado con filtros — nombre, fecha de ingreso al servicio, psicólogo asignado, modalidad, estado de la sesión más reciente. Permiso `intake.read.all` (admin/asistente, filtro libre) / `intake.read.own` (psicólogo, forzado a lo propio — reusa `resolvePsychologistScope` como en `report-actions.ts`).
- [ ] `/admin/clientes/[userId]`: datos básicos, notas, formulario (reusar `intake-form-detail.tsx`), historial de citas (pasadas y próximas) **por modalidad**, y **historial de pagos** del cliente.
- [ ] Notas por paciente: reusar `Appointment.internalNotes` para notas de sesión y agregar `PatientNote { id, userId, psychologistId, body, createdAt }` para notas de paciente. Migración.
- [ ] Edición de datos básicos del paciente: nueva action `updatePatientProfile({ userId, name, email?, phone?, dateOfBirth? })` que escribe `User.name` y los campos correspondientes dentro de `IntakeForm.data` (validar con `intakeFormAdminUpdateSchema`). Cubre el pedido de "cambiar el nombre de un cliente ya registrado".
- [ ] Retirar la vista vieja de `/admin/formularios` (o dejarla como redirect a `/admin/clientes`) una vez migrada — decidir al implementar.
- [ ] (Pendiente confirmar alcance con el cliente — PRD §6.9, decisión abierta) Si se confirma el alcance acotado de paquetes de sesiones: agregar seguimiento simple (`SessionPackage { id, userId, sessionType, totalSessions, usedSessions, discountApplied, createdAt }`) y mostrar "sesiones restantes" en la ficha de Clientes. No implementar sin confirmación explícita — ver riesgos.

### 4.3 Agendar y cobrar
- [ ] `manual-booking-actions.ts`: cuando el actor es psicólogo, forzar `psychologistId = actor.psychologistId` y permitir el switch `isException`.
- [ ] `/admin/citas` y `/admin/pagos` filtrados por `psychologistId` del actor.
- [ ] Generar link de pago: permitido con monto de tarifa. **Monto personalizado**: el psicólogo no lo aplica directo, crea una solicitud (Fase 5).

**Verificación 4**: con usuario psicólogo, editar horario, crear un día libre y comprobar que esos slots desaparecen del calendario público; ver solo sus pacientes y sus citas; generar un link de pago con tarifa.

---

## Fase 5 — Aprobaciones

### 5.1 Schema y lógica
- [ ] Modelo `ApprovalRequest { id, type ApprovalType, status ApprovalStatus @default(PENDING), requestedByUserId, targetId String?, payload Json, decidedByUserId String?, decidedAt DateTime?, decisionNote String?, createdAt }`; enums `ApprovalType { CUSTOM_PAYMENT_AMOUNT REFUND_REQUEST }` (extensible) y `ApprovalStatus { PENDING APPROVED REJECTED }`. Migración.
- [ ] `src/lib/admin/approval-actions.ts`: `requestApproval(type, targetId, payload)` (permiso `approval.request`), `approveRequest(id, note?)` y `rejectRequest(id, note?)` (permiso `approval.decide`, **admin o asistente** — no solo admin; ver nota de negocio de la Fase 0 para el caso donde el payload fija un porcentaje de comisión arbitrario, que sigue exigiendo `settings.write`).
- [ ] Al aprobar `CUSTOM_PAYMENT_AMOUNT`: escribir `Appointment.agreedAmount/agreedCurrency` y generar el link, reusando `resolveCheckoutUrl`.

### 5.1b `REFUND_REQUEST` (PRD §6.4/§9, nuevo en v1.1 — reemplaza el refund automático)
El caso de uso no es "devolver un pago hecho por adelantado" (en ALIA el cobro es posterior a la sesión) sino corregir un cobro mal hecho: monto o moneda incorrecta, cobro duplicado. **Nunca se llama a la API de reembolso de Stripe.**
- [ ] `requestApproval(REFUND_REQUEST, paymentId, { reason })`: permiso `approval.request` ampliado — a diferencia de `CUSTOM_PAYMENT_AMOUNT` (solo psicólogo sobre su propia cita), acá cualquier staff con acceso al pago puede solicitarlo (admin, asistente, psicólogo sobre lo propio).
- [ ] Schema: agregar valores a `PaymentStatus` (o campo `refundStatus` aparte — decidir al escribir la migración, documentar en el commit) para distinguir "reembolso aprobado, pendiente de ejecución manual" de "reembolso ejecutado".
- [ ] Al aprobar: marcar el `Payment` como reembolso aprobado — **no** dispara ninguna llamada a Stripe.
- [ ] Nueva action `markRefundExecuted(paymentId)` (permiso `payment.commission.write`, solo admin, solo si está en estado "reembolso aprobado"): la usa el admin después de ejecutar el reembolso manualmente desde el dashboard de Stripe.

### 5.2 UI y avisos
- [ ] Página `/admin/aprobaciones`: tabla de pendientes con detalle (quién, qué cita/pago, monto solicitado vs tarifa, o motivo del reembolso) y acciones aprobar/rechazar con nota.
- [ ] `getAdminAlerts`: sumar "N solicitudes pendientes de aprobación" (monto + reembolso) con `href: "/admin/aprobaciones"`.
- [ ] Correo al admin/asistente al crear la solicitud y al solicitante al resolverse (plantillas nuevas en `emails/`, una por tipo).
- [ ] En el diálogo de link de pago, si el actor es psicólogo y pide monto distinto a la tarifa: el botón pasa a "Solicitar aprobación".
- [ ] En `payment-table.tsx`/`appointments-table.tsx` (Fase 8): acción "Solicitar reembolso" visible para cualquier staff con acceso al pago; tras aprobarse, mostrar el estado "reembolso aprobado — pendiente de ejecución manual" y, para admin, el botón "Marcar reembolso ejecutado".

**Verificación 5**: como psicólogo, solicitar un monto personalizado; como admin **o como asistente**, verlo en aprobaciones, aprobarlo y confirmar que el link se genera con el monto aprobado. Generar una solicitud de reembolso sobre un pago mal cobrado, aprobarla y confirmar que el sistema **no** llama a la API de Stripe — solo la deja pendiente de ejecución manual.

---

## Fase 6 — Portal del cliente

Hoy `/mi-cuenta` son 3 archivos: perfil de solo lectura y lista de sesiones con cancelar. Nunca lee `Payment` ni los params `?pago=exitoso|cancelado` que Stripe devuelve.

### 6.1 Estructura
- [ ] `src/app/mi-cuenta/layout.tsx`: agregar `requireActor()` (hoy no valida sesión; solo el proxy) y una nav propia del portal.
- [ ] Agregar enlace a `/mi-cuenta` en `src/components/landing/header.tsx` cuando hay sesión (hoy no existe).
- [ ] Nueva `/mi-cuenta` como dashboard: **una tarjeta de especialista asignado por modalidad activa** (foto, nombre, especialidad, link al perfil), próxima sesión con countdown, cobros pendientes, accesos a formulario y datos. Si el paciente lleva individual y pareja, ve dos tarjetas.

### 6.2 Acciones del paciente
- [ ] `src/lib/patient/appointment-actions.ts`: agregar `rescheduleMyAppointment(appointmentId, date, time)` reusando la lógica de `rescheduleAppointment` extraída a un core compartido (`src/lib/appointments/reschedule-appointment.ts`), con ownership, respetando `MIN_BOOKING_LEAD_MINUTES`, el cap diario y una ventana mínima de aviso (definir: 24h) y **sin** permitir `isException`.
- [ ] `updateMyIntakeForm(data)`: permitir editar el formulario ya enviado (hoy es imposible; `formulario/page.tsx` redirige si la cita está `CONFIRMED`). Nueva ruta `/mi-cuenta/formulario` que reusa `intake-form-flow.tsx` en modo edición con `intakeFormAdminUpdateSchema`.
- [ ] `updateMyProfile({ name, dateOfBirth, phone, ... })`: escribe `User.name` + campos en `IntakeForm.data`. Nueva ruta `/mi-cuenta/perfil`.
- [ ] `createMyPaymentLink(appointmentId)`: para citas `COMPLETED`/`NO_SHOW` con `Payment` `PENDING` o sin pago, genera el link con el monto ya acordado (Fase 3) y redirige a Stripe. Nunca acepta monto del cliente.
- [ ] `/mi-cuenta/citas`: leer `?pago=exitoso|cancelado` y mostrar el toast correspondiente (hoy se ignora).

### 6.3 Especialista asignado por modalidad
- [ ] `src/lib/queries/patient-assignment.ts`:
  - `getAssignedPsychologistId(userId, sessionType)` = psicólogo de la cita más reciente en `CONFIRMED`/`COMPLETED` **con esa `sessionType`**.
  - `getPatientTracks(userId)` → `{ INDIVIDUAL?: Psychologist, COUPLE?: Psychologist }` para el dashboard.
  - **Derivado, sin columna nueva** — un `assignedPsychologistId` por modalidad en `User` sería estado duplicado que se desincroniza con el historial real. Test primero: sin historial, solo individual, solo pareja, ambas con psicólogos distintos, y que una cita `CANCELLED` no cuente.

### 6.4 Bloqueo por sesión impaga (PRD §6.5/§6.6, nuevo en v1.1)
Nueva regla de negocio del cliente: como el cobro se hace después de la sesión, hay que frenar la acumulación de sesiones sin pagar antes de dejar agendar una nueva. El PRD asume que el bloqueo es **por modalidad** (coherente con "una cita activa por modalidad" de la Fase 3), pero recomienda confirmarlo con el cliente — ver riesgos.
- [ ] `hasUnpaidCompletedSession(userId, sessionType)` en `src/lib/queries/patient-appointments.ts`: `true` si existe una cita `COMPLETED`/`NO_SHOW` en esa modalidad con un `Payment` que no está `APPROVED`, ni `VOIDED`, ni con reembolso ejecutado (Fase 5.1b). Test primero.
- [ ] `createAutoAssignedAppointment` (Fase 7.2), `createManualAppointment` y el guard de `createAppointment` (`agendar/[slug]/actions.ts`): rechazar con un código nuevo (`UNPAID_SESSION_PENDING`) si `hasUnpaidCompletedSession` es `true` para esa modalidad.
- [ ] `/mi-cuenta`: banner explícito "tenés una sesión pendiente de pago" con acceso directo a `createMyPaymentLink` cuando el bloqueo aplica.
- [ ] `/agendar`: mismo bloqueo antes de dejar avanzar al paso de horario, con mensaje explicando por qué.
- [ ] `active-appointment-notice.tsx`: cubrir también este caso (hoy solo cubre "ya tenés una cita activa").

**Verificación 6**: con un paciente real, ver su especialista y próxima sesión, reagendar, editar formulario y nombre, y pagar un cobro pendiente end-to-end (Stripe test mode + webhook local). Con un paciente que tiene una sesión `COMPLETED` sin pagar: confirmar que no puede agendar de nuevo en esa modalidad, que el portal le explica por qué, y que pagar el cobro libera el bloqueo.

---

## Fase 7 — Landing y algoritmo de match

### 7.1 Match automático (TDD)
Todo el motor agregado es **por modalidad**: la duración del slot y el conjunto de candidatos cambian según `sessionType`.

- [ ] `src/lib/queries/psychologists.ts`: nuevo `getBookablePsychologists(sessionType)` que filtre por `offeredSessionTypes` y **sí** seleccione `calendarId`, `schedules`, `sessionDuration` y `coupleSessionDuration` (el actual `getActivePsychologists()` no trae ninguno de los cuatro).
- [ ] `src/lib/availability/multi-psychologist.ts`:
  - `getAvailabilityForAllPsychologists(sessionType, year, month)`: para cada candidato, `getScheduleForDay` + `TimeOff` + `getBlockingAppointments` + `getConfirmedCountsByDate` + freebusy, usando `getSessionDuration(psychologist, sessionType)`. Aprovechar que `freebusy.query` acepta varios calendarios en `items` (hoy `getFreeBusyPeriods` manda uno solo) → agregar `getFreeBusyPeriodsForCalendars(calendarIds, timeMin, timeMax)`.
  - `getAggregatedMonthAvailability(sessionType, ...)`: unión de slots — un día/slot está disponible si **al menos un** candidato lo tiene. Con pareja los slots son de 120 min, así que el calendario agregado de pareja es visiblemente más escaso que el individual; es correcto, no es un bug.
  - `matchPsychologistForSlot(sessionType, date, time)`: candidatos = los que atienden esa modalidad y tienen el bloque completo libre; ganador = el de menos citas `CONFIRMED` en la semana ISO de esa fecha; empate → menor carga total del mes; empate → aleatorio estable. **Criterio cerrado por el cliente (PRD §6.6/§9, v1.1)**: el balanceo es por **número de sesiones**, no por minutos — pocos especialistas atienden pareja, así que ponderar por duración no ayudaba al equipo. Ya no es una decisión abierta (ver riesgo #3 más abajo, marcado resuelto).
- [ ] Test primero en `src/lib/__tests__/match-psychologist.test.ts`: sin candidatos; un candidato; empate; que un psicólogo sin `COUPLE` en `offeredSessionTypes` nunca sea candidato de pareja; que un slot de pareja que se solapa con una individual existente quede descartado; que respete `TimeOff` y el cap diario.
- [ ] Cache: reusar el patrón de `getCachedFreeBusyPeriods` (Map + TTL 5 min) para que el calendario agregado no dispare N llamadas por navegación de mes.

### 7.2 Nuevo flujo de agendamiento
Clave de diseño: **el appointment se crea con el psicólogo ya asignado, pero la UI no lo revela hasta que el formulario se envía.** Así el hold de slot (`PENDING_FORM` + `expiresAt` 60 min + follow-ups QStash) queda idéntico y `Appointment.psychologistId` sigue siendo obligatorio — cero cambios de schema.

- [ ] `/agendar` pasa de grilla de psicólogos a: **paso 0 — elegir modalidad** (Individual 60 min / Pareja 120 min, con su precio desde `getPublicDisplayRate(country, kind)`), y luego selector de slot agregado para esa modalidad (reusar `src/components/availability/availability-calendar.tsx` con la fuente agregada).
- [ ] Nuevas rutas sin slug: `/agendar/formulario` y `/agendar/confirmacion`. La confirmación es donde se revela el especialista.
- [ ] Nueva action `createAutoAssignedAppointment({ sessionType, date, time, ... })`: replica los chequeos de `agendar/[slug]/actions.ts` (sesión, cita activa, términos, cap, freebusy, transacción con re-chequeo `SLOT_TAKEN`) pero resolviendo el psicólogo con `matchPsychologistForSlot(sessionType, ...)`. Si el paciente ya tiene especialista asignado **para esa modalidad**, se salta el match y se usa el asignado.
- [ ] `getActivePatientAppointment(userId)` pasa a `getActivePatientAppointment(userId, sessionType)` y filtra por modalidad. Actualizar los 3 llamadores: `agendar/page.tsx`, `agendar/[slug]/page.tsx` y el guard dentro de la transacción de `createAppointment` (`PATIENT_HAS_ACTIVE_APPOINTMENT`). También `src/components/booking/active-appointment-notice.tsx`, que debe decir de qué modalidad es la cita activa.
- [ ] Conservar `/agendar/[slug]/**` para agendar directo desde el perfil de un psicólogo y para pacientes recurrentes, respetando `offeredSessionTypes` de ese psicólogo.
- [ ] `src/components/booking/booking-stepper.tsx`: pasos nuevos → Modalidad / Horario / Formulario / Confirmación (el paso "Psicólogo" se reemplaza, no se suma).
- [ ] `confirm-and-notify.ts` y las plantillas de correo: verificar que el nombre del psicólogo se resuelva bien en el flujo nuevo.

### 7.3 Reordenar el landing y matar la confusión
- [ ] `src/components/landing/psychologist-section/psychologist-section-server.tsx`: `MAX_FEATURED = 3` con `pickRandom` es exactamente la fuente de la queja. **(PRD §6.6, actualizado en v1.1)** No basta con bajarla y linkear a "ver todos": la sección debe mostrar el **100% de los psicólogos activos**, en orden aleatorio en cada carga (shuffle sobre el array completo, no un subconjunto). Bajar igual la sección en `(landing)/page.tsx` (después de FAQ). Mantener además el CTA a una página `/psicologos` (índice completo, hoy no existe — solo hay `/psicologos/[slug]`) para navegación directa.
- [ ] Crear `/psicologos` reusando `PsychologistCard` con todos los activos, e incluirla en `src/app/sitemap.ts`.
- [ ] `how-it-works-section.tsx`: los 5 pasos hardcodeados arrancan con "Elige psicólogo" — reescribir a "Elige modalidad → Elige fecha y hora → Llena tu Inventario de Vida → Te asignamos tu especialista → Sesión y pago".
- [ ] Anti-confusión en el formulario: barra de progreso persistente con "Paso X de 7 — tu sesión NO está confirmada hasta terminar", banner de advertencia visible con el countdown de `expiresAt` (ya existe el dato en `intake-form-flow.tsx`, hay que hacerlo mucho más prominente), y `beforeunload` al intentar salir a mitad del formulario.
- [ ] Ajustar `hero-section.tsx:67` y los CTAs del header/footer al flujo nuevo.

**Verificación 7**: `bun test`; agendar como paciente nuevo sin elegir psicólogo y confirmar que el match cae en el de menor carga semanal; repetir con paciente recurrente y confirmar que le toca su mismo especialista; agendar pareja con el mismo paciente y confirmar que le asigna **otro** especialista y que la cita ocupa 2 horas en Google Calendar; verificar que un `TimeOff` saca al psicólogo de los candidatos y que tener individual activa no bloquea agendar pareja; confirmar que el tope de 5 citas/día se respeta mezclando individuales y pareja; entrar a la home y confirmar que la sección de especialistas muestra a todos los activos (no solo 3) y que el orden cambia entre cargas.

---

## Fase 8 — Misceláneas de pagos

- [ ] Llevar a `payment-table.tsx` las acciones que hoy solo están en `appointments-table.tsx`: **Generar/Regenerar link de pago** y **Enviar por correo** (el diálogo `GeneratePaymentLinkDialog` ya es reusable; hay que pasarle las props que hoy arma la página de citas). Mantenerlas también en sesiones, como pidió el cliente.
- [ ] Uniformar el menú de acciones de ambas tablas extrayendo un `payment-actions-menu.tsx` compartido (evita que vuelvan a divergir: hoy pagos puede anular y cambiar comisión pero no generar link, y sesiones al revés).
- [ ] Registrar la multa de no-show como un `Payment` con `isNoShowFee: true` y mostrarla diferenciada en la tabla y en finanzas.

**Verificación 8**: generar, copiar y enviar un link desde `/admin/pagos` y desde `/admin/citas`, con el mismo resultado.

---

## Fase 9 — Fallback de correo a Brevo

Hoy `src/lib/email.ts` es un singleton de Resend sin try/catch, sin inspeccionar el `{ data, error }` que Resend devuelve sin lanzar, sin reintentos, sin log de envíos y sin conteo diario. Un envío rechazado pasa en silencio.

### 9.1 Trazabilidad primero
- [ ] Modelo `EmailLog { id, to, template, provider String, status EmailStatus, providerMessageId String?, error String?, sentAt DateTime @default(now()) }` + enum `EmailStatus { SENT FAILED }`, índice por `sentAt`. Migración.

### 9.2 Capa de transporte (TDD)
- [ ] `src/lib/email/transport.ts`: interfaz `EmailTransport { name, send(payload): Promise<{ id }> }`, con `resendTransport` y `brevoTransport` (API HTTP de Brevo, `BREVO_API_KEY`).
- [ ] `src/lib/email/send.ts`: `sendEmail(payload)` que (1) cuenta los `EmailLog` de hoy con `provider: "resend"`, (2) elige Brevo si el conteo ≥ `RESEND_DAILY_LIMIT` (env, default 100) o si Resend falla, (3) inspecciona la respuesta de Resend y trata `error` como fallo, (4) escribe el `EmailLog` siempre.
- [ ] Test primero en `src/lib/__tests__/email-transport.test.ts`: bajo el límite usa Resend; en el límite usa Brevo; error de Resend cae a Brevo; ambos fallan → `EmailLog` FAILED y no lanza al caller.
- [ ] Refactorizar las 12 funciones `send*` de `src/lib/email.ts` para pasar por `sendEmail` en vez de `resend.emails.send` directo. Los adjuntos (PDF de intake, reporte de sesiones) deben soportarse en ambos transportes.
- [ ] `/admin/contacto` o nueva sección: mostrar el conteo de correos de hoy por proveedor y los últimos fallos.

**Verificación 9**: `bun test`; con `RESEND_DAILY_LIMIT=0` en local, disparar un correo y confirmar que sale por Brevo y queda en `EmailLog`.

---

## Archivos crítica­mente afectados

| Área | Archivos |
|---|---|
| Autorización (nuevo) | `src/lib/auth/{permissions,require,errors}.ts` |
| Autorización (tocar todos) | `src/lib/admin/*-actions.ts`, `src/lib/admin/*-queries.ts`, `src/proxy.ts`, `src/app/admin/(dashboard)/layout.tsx`, `src/app/api/admin/**` |
| Schema | `prisma/schema.prisma` (+ ~6 migraciones nuevas), `prisma/seed.ts` |
| Shell y nav | `src/components/admin/{admin-shell,sidebar-nav}.tsx` |
| Responsive | `src/components/ui/table.tsx`, `src/components/admin/*-table.tsx`, `*-sheet.tsx`, `*-filters.tsx`, `*-dialog.tsx` |
| Precios | `src/lib/admin/payment-actions.ts`, `payment-rate-{actions,queries}.ts`, `src/lib/payment-math.ts`, `src/components/admin/generate-payment-link-dialog.tsx` |
| Disponibilidad y match | `src/lib/availability.ts`, `src/lib/availability/multi-psychologist.ts` (nuevo), `src/lib/google-calendar.ts`, `src/lib/queries/psychologists.ts` |
| Embudo | `src/app/(landing)/agendar/**`, `src/components/booking/**`, `src/components/landing/**` |
| Portal cliente | `src/app/mi-cuenta/**`, `src/lib/patient/appointment-actions.ts` |
| Correo | `src/lib/email.ts`, `src/lib/email/**` (nuevo), `emails/**` |
| Clientes (nuevo, reemplaza Formularios) | `src/app/admin/clientes/**` (antes `formularios`), `src/lib/admin/patient-queries.ts` |
| Aprobaciones y reembolsos | `src/lib/admin/approval-actions.ts` (nuevo), `emails/refund-*` (nuevo) |
| Dominio Stripe Checkout | `src/lib/admin/payment-actions.ts` (`resolveCheckoutUrl`), configuración en el dashboard de Stripe (fuera del repo) |

## Riesgos y decisiones abiertas

1. **`User.role` a enum vs. seguir con `String`**: better-auth escribe ese campo por su cuenta. Si el enum de Prisma pelea con el plugin `admin`, se queda `String` con validación en el borde. Se decide al escribir la migración de Fase 1.
2. **Ventana mínima para que el paciente reagende**: propongo 24h. Sigue pendiente de confirmar con el cliente (el PRD v1.1 lo deja igual: "propuesta inicial de 24 horas").
3. ~~**Balanceo del match**~~ — **Resuelto por el cliente (PRD §6.6/§9, v1.1)**: por **número de sesiones** confirmadas en la semana ISO (no por minutos) — pocos especialistas atienden pareja, así que ponderar por duración no le servía al equipo. El tope diario `DAILY_CONFIRMED_APPOINTMENT_CAP = 5` se mantiene en 5, mezclando individuales y pareja sin distinción. Ya no es una decisión abierta.
4. **La segunda persona de la pareja** no tiene cuenta ni formulario propio en este plan: la cita cuelga de un solo `User` y el Inventario de Vida es uno. Sigue fuera de alcance de v2 (confirmado en el PRD v1.1, sin cambios). Si el cliente necesita dos formularios o dos usuarios vinculados por cita, es un modelo distinto y hay que planificarlo aparte.
5. **Coupons están muertos** en el path de pago (`resolveCheckoutUrl` escribe `discountAmount: 0, couponId: null` siempre), aunque el CRUD y el webhook existen. Sigue fuera de alcance de v2 (confirmado en el PRD v1.1).
6. ~~**Cancelar una cita con pago `APPROVED` lo marca `VOIDED` sin llamar al refund de Stripe**~~ — **Resuelto parcialmente por el cliente (PRD §6.4/§9, v1.1)**: se descarta automatizar el refund contra la API de Stripe. `cancel-appointment.ts` sigue marcando `VOIDED` sin tocar Stripe; si hace falta devolver dinero, el staff genera una **solicitud de reembolso** (Fase 5.1b) que aprueba admin/asistente y ejecuta el admin manualmente en el dashboard de Stripe. Queda abierto si, más adelante, se justifica automatizar la llamada a la API de reembolso.
7. **Vercel Hobby limita cada cron a una vez por día**, así que cualquier proceso nuevo que necesite más frecuencia va por QStash, no por cron.
8. **(Nuevo, PRD §6.5/§6.6/§9, v1.1) Alcance exacto del bloqueo por sesión impaga**: el PRD asume que bloquea **por modalidad** (una individual impaga bloquea solo nuevas individuales, no pareja) — coherente con el resto del diseño, pero recomienda confirmarlo explícitamente con el cliente antes de implementar la Fase 6.4.
9. **(Nuevo, PRD §6.9, v1.1) Alcance de paquetes de sesiones con descuento**: decisión abierta con el cliente — si v2 entrega solo un campo de seguimiento simple (N sesiones totales/usadas/descuento, mostrado en la ficha de Clientes) o si requiere un modelo de "paquete" completo (vencimiento, reglas de descuento, venta desde el embudo público), que quedaría fuera de v2 como fase adicional. Impacta si entra en la Fase 4.2 o no. **No implementar sin confirmar el alcance.**
10. **(Nuevo, PRD §6.7/§9, v1.1) Dominio de Stripe Checkout**: confirmar con el cliente el subdominio exacto a usar (p. ej. `pagos.dominio.com`) y quién gestiona el DNS — la verificación del dominio personalizado en Stripe depende de un registro DNS que debe crear el dueño del dominio.

## Verificación global de v2

```bash
git checkout develop
bun install
npx prisma migrate dev && npx prisma generate
bun run lint
bun test
bun run dev
```

Recorrido manual, en este orden: login de cada rol → sidebar por rol → 375px en las 9 páginas de admin → especialista edita horario y saca día libre → agendar público sin elegir psicólogo → formulario completo → reveal del especialista → paciente entra a su portal, reagenda y paga → admin ve el pago aprobado en pagos y finanzas → solicitud de monto personalizado aprobada (admin **y** asistente) → solicitud de reembolso aprobada, confirmando que **no** se llama a la API de Stripe → paciente con sesión `COMPLETED` sin pagar no puede agendar de nuevo en esa modalidad hasta pagar → home muestra todos los psicólogos activos en orden aleatorio → link de pago abre bajo el dominio propio configurado en Stripe → sección Clientes filtra por nombre/fecha/psicólogo y muestra la ficha completa → correo con `RESEND_DAILY_LIMIT=0` saliendo por Brevo.

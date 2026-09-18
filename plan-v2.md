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

## Fase 1 — Roles y cuentas de staff ✅ implementada

### 1.1 Schema — hecho
- [x] **Decisión: `User.role` se queda `String`, no pasa a enum de Prisma.** El plugin `admin` de better-auth escribe ese campo con sus propios valores (`defaultRole: "patient"`, `additionalFields.role.defaultValue: "patient"`); forzar un enum de Prisma habría exigido que esas escrituras coincidan con los nombres exactos del enum, fricción real sin ganancia de seguridad — `src/lib/auth/permissions.ts` (`Role`, `isStaffRole`) ya normaliza y valida el string en el borde de la app. Documentado en el commit `feat(schema): add formal Psychologist-User relation`.
- [x] `Psychologist.userId` ya existía (Fase 0.2) — se agregó la relación `@relation` formal (`user User? @relation(..., onDelete: SetNull)`) más el back-relation `User.psychologistProfile`.
- [x] Migración `20260917120000_add_psychologist_user_relation` (solo el FK, sin backfill — al no migrar a enum no hacía falta transformar datos), escrita a mano y aplicada con `prisma migrate deploy` por el mismo motivo que en la Fase 0.2 (`_intake_form_dedup_backup` fuera de schema).

### 1.2 Alta de cuentas de staff — hecho
- [x] `/admin/equipo` (permiso `staff.write`, gate propio además del layout — es el punto de entrada para crear cuentas admin) con `staff-table.tsx` + `staff-sheet.tsx`.
- [x] `src/lib/admin/staff-actions.ts`: `createStaffUser`, `updateStaffRole` (desvincula `Psychologist.userId` si el rol deja de ser psicólogo), `setStaffUserBanned`.
  - **Desviación del plan**: `createStaffUser` escribe el usuario directo por Prisma (mismo patrón que el admin sembrado en `prisma/seed.ts`) en vez de `auth.api.createUser` — ese endpoint corre el RBAC propio del plugin `admin` de better-auth contra un vocabulario de roles (`admin`/`user`) que nunca configuramos para `assistant`/`psychologist`.
  - El correo de bienvenida reusa `auth.api.requestPasswordReset` (dispara `sendResetPassword` → `sendPasswordResetEmail`, ya wireado en `auth.ts`) en vez de `sendPasswordResetEmail` directo — su endpoint `resetPassword` crea la cuenta de credenciales en el primer uso, así que no hace falta generar una password aquí.
- [x] Alta con rol psicólogo exige `psychologistId` (solo psicólogos sin cuenta vinculada, `getUnlinkedPsychologists()`).
- [x] `/admin/login`: valida `isStaffRole` tras el `signIn.email` antes de redirigir; si no es staff, `signOut` + error.

### 1.3 Nav y dashboard por rol — hecho, con alcance recortado
- [x] `sidebar-nav.tsx` recibe `role` y filtra cada ítem con `can(role, item.permission)`.
- [x] Ítem nuevo: `Equipo` (`staff.write`).
- [ ] **Diferido a Fase 5**: ítem `Aprobaciones` — la página no existe todavía, así que no se agrega un link muerto.
- [x] **Completado en la Fase 4.0**: `Sesiones` y `Pagos` ya se muestran también al rol `psychologist` — sus queries de listado (`/admin/citas`, `/admin/pagos`) quedaron scoped por `psychologistId` en esa fase.
- [x] **Completado en la Fase 4.2**: el ítem `Formularios` se renombró a `Clientes` (`/admin/clientes`), visible también para psicólogo vía `anyPermission: ["intake.read.all", "intake.read.own"]`.
- [x] `admin-shell.tsx`: subtítulo derivado del rol (`ROLE_LABELS`).
- [x] `page.tsx` bifurca por actor: `StaffDashboard` (admin ve todo; asistente igual pero sin tarjeta/gráfico de ingresos, gateado en `finance.read`) y `PsychologistDashboard` (nuevo, 100% scoped a su propio `psychologistId`: sus sesiones, sus pacientes, su comisión — nunca cifras de otros ni totales de plataforma). Nuevas queries en `dashboard-queries.ts`: `getPsychologistDashboardStats/*Trend`.
- [x] `alerts-queries.ts` (`getAdminAlerts(actor)`): devuelve `[]` para `psychologist` en vez de enlazar a páginas que su nav no muestra y cuyas queries no están scoped — su propio dashboard ya cubre "sesiones de hoy" directamente. Admin/asistente sin cambios.

**Verificación 1**: pendiente la prueba manual real (crear un usuario de cada rol y entrar con cada uno) — el código pasa `bunx tsc --noEmit`, lint de los archivos tocados y `bun test` (mismos 4 fallos preexistentes de siempre, 0 relacionados).

---

## Fase 2 — Responsive del admin ✅ implementada

Se hizo antes de construir pantallas nuevas, como estaba planeado.

### 2.1 Primitivos — hecho
- [x] `table.tsx`: `whitespace-nowrap` ya no es forzado en `TableHead`/`TableCell`.
- [x] `admin-shell.tsx`: `<main>` pasó de `overflow-x-auto` a `overflow-x-hidden` — competía con el `overflow-x-auto` propio de cada `Table`, y con dos ancestros scrolleables la página entera se corría en vez de solo la tabla.
- [x] `data-table-shell.tsx` (nuevo): `overflow-x-auto` propio + `mobileRender?` para tarjetas en `< sm`.
- [x] `page-header.tsx` (nuevo): reemplaza los 6 headers sin `flex-wrap` en `citas`, `finanzas`, `cupones`, `formularios`, `psicologos`, `tarifas`.

### 2.2 Arreglos puntuales — hecho
- [x] Los 4 sheets con `min-w-lg` fijo → `w-full sm:min-w-lg` (incluye `staff-sheet.tsx`, construido ya responsive desde el inicio).
- [x] Los 3 `grid-cols-2` sin prefijo → `grid-cols-1 sm:grid-cols-2`.
- [x] Filtros y skeletons con ancho fijo → `w-full sm:w-<size>` (`appointments-filters`, `payments-filters`, `period-filter`, y los skeletons de `citas`/`finanzas`/**`pagos`** — este último no estaba en el plan original pero tenía el mismo bug).
- [x] `payment-table.tsx` (13 columnas): tarjeta móvil vía `data-table-shell`, priorizando Persona/Estado/Total(USD) como pedía el plan, más el selector de comisión y las acciones. Lógica interactiva (`useTransition`, handlers) extraída a `usePaymentRowActions` para que la fila de escritorio y la tarjeta no dupliquen tres handlers cada una.
- [x] Mismo tratamiento en `appointments-table.tsx` (con `useAppointmentActions` + `AppointmentActionsMenu` compartidos) y en `coupon-table.tsx`/`psychologist-table.tsx` (sin extracción de hooks — su estado de edición/toggle ya vivía a nivel de tabla, no por fila).
- [x] `formularios/page.tsx:62`: tabla inline extraída a `intake-form-table.tsx`, con su propia tarjeta móvil.
- [ ] **`rate-table.tsx` deliberadamente sin tocar**: son 2 columnas reales (Moneda, Monto) + una acción — no revienta a 375px, así que agregarle una tarjeta hubiera sido ceremonia sin problema que resolver.

**Verificación 2**: `bunx tsc --noEmit` limpio, lint limpio en todos los archivos tocados, `bun test` sin regresiones. Pendiente el recorrido visual real en DevTools a 375px.

**Verificación 2**: en `bun run dev`, con DevTools a 375px, recorrer las 9 páginas de admin: ningún scroll horizontal de página, ningún sheet cortado, todos los botones alcanzables.

---

## Fase 3 — Modelo de precios de la cita ✅ implementada

Implementada según el plan corregido (`vamos-a-desarrollar-la-reflective-tulip.md`, escrito tras dos exploraciones exhaustivas del código real). Dos desviaciones deliberadas: `resolveCheckoutUrl` conserva moneda/comisión como *overrides* opcionales (los necesitan la multa de no-show y el diálogo de editar precio) en vez de eliminarlos por completo, y "editar precio" se resolvió con una acción nueva (`updateAgreedPrice`) en vez de extender `updatePaymentCommission`, por la inmutabilidad de las Checkout Sessions de Stripe.

### 3.1 Schema — hecho
- [x] Enum `SessionType { INDIVIDUAL COUPLE }` y enum `RateKind { INDIVIDUAL COUPLE NO_SHOW_FEE }`.
- [x] `Appointment`: `sessionType SessionType @default(INDIVIDUAL)`, `agreedAmount Int?`, `agreedCurrency String?`, `agreedPayoutType PayoutType?`.
- [x] `Psychologist`: `offeredSessionTypes SessionType[] @default([INDIVIDUAL])` y `coupleSessionDuration Int @default(120)` junto al `sessionDuration` existente.
- [x] `PaymentRate`: `currency String @unique` → `kind RateKind @default(INDIVIDUAL)` + `@@unique([currency, kind])`.
- [x] `Payment`: `isNoShowFee Boolean @default(false)`.
- [x] `getSessionDuration(psychologist, sessionType)` en `src/lib/availability.ts` — TDD primero, test en `availability.test.ts`.
- Migración `20260918000000_add_session_pricing_model` — escrita a mano y aplicada con `prisma migrate deploy` (mismo motivo que las Fases 0/1: la tabla `_intake_form_dedup_backup` fuera de schema hace que `migrate dev` detecte drift). El drop del unique constraint viejo de `PaymentRate.currency` no se hardcodeó por nombre: la migración lo busca dinámicamente vía `pg_constraint` antes de borrarlo, por si el nombre real no coincidía con el supuesto.
- **En el mismo commit**: `payment-rate-actions.ts` (`createRate`/`updateRate`) actualizado a `findUnique({ currency_kind: { currency, kind } })` / `findFirst({ currency, kind, NOT: { id } })`.

### 3.2 Lógica — hecho (TDD)
- [x] `payment-rate-queries.ts`: `getRateByCurrency` renombrado a `getRate(currency, kind = "INDIVIDUAL")`; `getAllRates()` ordena por `[kind, currency]`; `getPublicDisplayRate` filtra `kind: "INDIVIDUAL"` explícito.
- [x] `src/lib/pricing.ts` (nuevo, mismo patrón sin DB que `payment-math.ts`): `sessionTypeToRateKind`, `resolvePaymentAmount({ customAmount, agreedAmount, fallbackRateAmount })`, `resolvePayoutType({ requestedPayoutType, agreedPayoutType, fallback })` — precedencia `override > agreed > fallback`. Test primero en `pricing.test.ts`, 10 casos.
- [x] **Desviación**: `resolveCheckoutUrl` no eliminó moneda/comisión como parámetros — pasaron a `overrides` opcionales (`{ currency?, payoutType?, customAmount?, kind? }`), porque la multa de no-show y "editar precio" sí necesitan forzar un valor explícito por encima del acordado. La aritmética se delegó a las funciones puras de `pricing.ts`.
- [x] `createNoShowFeeCharge(appointmentId)` (nueva acción en `payment-actions.ts`, separada de `markNoShow` — una acción, una responsabilidad): llama a `resolveCheckoutUrl` con `kind: "NO_SHOW_FEE"`; el `upsert` existente sobre `appointmentId` sobreescribe la misma fila `Payment` con `isNoShowFee: true`.
- [x] `updateAgreedPrice(appointmentId, { amount, currency, payoutType })` (nueva acción, no extiende `updatePaymentCommission`): escribe en los campos de `Appointment` y regenera el checkout solo si ya existe un pago; bloquea la edición si el pago ya está `APPROVED`. **Desviación explícita del plan original**, motivada porque las Checkout Sessions de Stripe son inmutables — mutar `Payment` directo habría dejado links viejos sirviendo un monto desactualizado.

### 3.3 UI — hecho
- [x] `new-manual-appointment-dialog.tsx`: selects de tipo de sesión, moneda, monto (prellenado desde `getRate`) y comisión; el selector de psicólogo filtra pareja según `offeredSessionTypes`.
- [x] `generate-payment-link-dialog.tsx`: reescrito como confirmación de solo lectura (monto/comisión ya acordados) + enlace a "Editar precio de esta sesión".
- [x] `edit-appointment-price-dialog.tsx` (nuevo) + menú "Editar precio de la sesión" en `appointments-table.tsx`, gateado con `canEditPrice` (`payment.commission.write`).
- [x] `/admin/tarifas`: `kind` como select/columna en `rate-form.tsx`/`rate-sheet.tsx`/`rate-table.tsx`.
- [x] "Cobrar multa por inasistencia" en `appointments-table.tsx`, gateado solo por `canChargeNoShowFee` (`status === "NO_SHOW"`) — **corrección propia durante la implementación**: al principio también exigía `canEditPrice`, pero cobrar la tarifa fija de multa equivale a generar cualquier link de pago (`payment.link.create`, que el psicólogo sí tiene), no una decisión de precio.
- [x] `psychologist-form.tsx`: checkboxes de `offeredSessionTypes` + `coupleSessionDuration` con su **propio** array de opciones (`[90, 120, 150]`, default 120), sin tocar el array de `sessionDuration` individual.
- [ ] **Sin cambios, diferido a Fase 7.2**: la modalidad sigue sin preguntarse en `/agendar` público (todavía no existe el paso 0 de elegir modalidad) — el autoagendado sigue creando siempre `sessionType: INDIVIDUAL` por default hasta esa fase.

### 3.4 Dominio propio de Stripe Checkout — explícitamente fuera de alcance
- [x] Documentado con un comentario/TODO en el punto de integración (`payment-actions.ts`, junto a `createPaymentCheckoutSession`) — requiere configuración externa en Stripe y confirmación de subdominio con el cliente, fuera de esta sesión.

**Verificación 3**: `bunx tsc --noEmit` limpio, `bunx biome check` limpio en los archivos tocados, `bun test` sin regresiones (mismos 4 fallos preexistentes de siempre). Pendiente la verificación manual real contra la base de prod (agendar pareja con monto y comisión, marcar no-show y cobrar la multa, editar el precio de una cita autoagendada) — con el mismo cuidado de no tocar sesiones/pagos reales salvo que sea explícitamente para probar.

---

## Fase 4 — Panel del especialista ✅ implementada

Implementada según el plan corregido. El hallazgo más importante de la etapa de planificación se confirmó en el código real: `/admin/citas` y `/admin/pagos` leían `psychologistId` directo de la URL sin pasar por `resolvePsychologistScope` — un hueco de seguridad real (un psicólogo podía ver citas y pagos de cualquier colega cambiando el query param) — así que se adelantó como Fase 4.0 antes de construir nada nuevo.

### 4.0 Scoping real de `/admin/citas` y `/admin/pagos` (adelantado) — hecho
- [x] Ambas páginas resuelven el filtro con `resolvePsychologistScope(actor, params.psychologistId)` (mismo patrón que `report-actions.ts`) en vez de leer el query param crudo.
- [x] El dropdown de filtro por psicólogo se oculta por completo para un actor psicólogo (`appointments-filters.tsx`/`payments-filters.tsx`, prop `psychologists` ahora opcional) en vez de mostrarlo poblado con nombres de colegas.
- [x] `sidebar-nav.tsx`: "Sesiones" y "Pagos" pasan a mostrarse también al rol `psychologist` (gates ajustados a `appointment.write` / `payment.link.create`), ya que ahora sí están scoped — cierra el diferimiento anotado en la Fase 1.3.

### 4.1 Horarios y días libres — hecho (TDD)
- [x] Schema `TimeOff { id, psychologistId, startsAt, endsAt, reason?, createdAt }` — migración `20260918010000_add_time_off`.
- [x] `timeOffToBusyPeriods(timeOffs)` en `availability.ts` (espejo de `appointmentsToBusyPeriods`), test en `availability.test.ts`.
- [x] **Confirmado sin cambios** (como anticipaba el plan corregido): `computeMonthAvailability` ya es genérica sobre `busyPeriods` — no necesitó tocarse. El trabajo real fue en los 3 call sites reales de `computeMonthAvailability(` (grepeados, no supuestos): `psicologos/[slug]/actions.ts`, `psicologos/[slug]/page.tsx` y `agendar/[slug]/page.tsx`, cada uno sumando `getTimeOffOverlapping` + `timeOffToBusyPeriods` al array de periodos ocupados.
- [x] `getTimeOffForPsychologist`, `getTimeOffOverlapping`, `createTimeOff`, `deleteTimeOff` en `time-off-actions.ts`, gateadas con `requireScheduleAccess`. **Corrección de seguridad propia**: `deleteTimeOff(id)` resuelve el ownership contra el `psychologistId` real de la fila en la base, no contra un parámetro que mandara el cliente.
- [x] `/admin/mi-calendario` (permiso `schedule.write.own`): reusa `schedule-editor.tsx` sin cambios + `TimeOffEditor` nuevo (listar/crear/borrar días libres). `saveSchedules` ahora también revalida esta ruta.
- [x] **Desviación**: no se construyó una vista de agenda nueva — al quedar `/admin/citas` scoped por la Fase 4.0, el propio menú lateral ya cumple ese rol para el psicólogo.
- [x] `sidebar-nav.tsx`: ítem "Mi calendario" con `roles: ["psychologist"]` (gate por rol exacto, no por permiso) para que admin, que tiene todos los permisos, no lo vea también.

### 4.2 Sección Clientes — reemplaza "Formularios" — hecho (TDD)
- [x] **Desviación**: en vez de `getPatientsByPsychologist` + `getAllPatients` (dos funciones), una sola `getPatients(filters)` en `src/lib/admin/patient-queries.ts` — el scoping se resuelve a nivel de página con `resolvePsychologistScope`, mismo patrón que `getAllAppointments`/`getAllPayments`, en vez de duplicar la misma query de Prisma.
- [x] `/admin/clientes`: listado con búsqueda por nombre/correo, filtro de psicólogo (oculto para actor psicólogo, igual que 4.0) y rango de fecha de ingreso. **Alcance recortado respecto al plan**: no se expuso filtro de modalidad ni de "estado de la sesión más reciente" en la UI — `getPatients` ya acepta `sessionType` como filtro interno, queda listo para sumarlo a `client-filters.tsx` si hace falta.
- [x] `/admin/clientes/[userId]`: datos básicos (ver/editar), notas, historial de citas con el pago inline por cita (badge de modalidad + estado). **Desviación**: no se separaron citas y pagos en dos historiales ni se agrupó por modalidad — cada fila de cita ya muestra su `sessionType` y su pago juntos, ahorrando una sección redundante.
- [x] `PatientNote { id, userId, psychologistId, body, createdAt }` — migración `20260918020000_add_patient_note`. `Appointment.internalNotes` (ya existente) se deja intacto para notas de sesión; `patient-notes.tsx` es un feed cronológico inverso, sin edición/borrado en v1.
- [x] `updatePatientProfile(userId, { name, phone?, dateOfBirth? })` — validador propio y angosto (`validators/patient.ts`), **no reusa `intakeFormAdminUpdateSchema`** (bloquearía un cambio simple de nombre por datos viejos incompletos del formulario). **Desviación deliberada del plan**: `email` queda completamente fuera de los campos editables (el plan lo listaba como opcional) — es el identificador de login de better-auth, y cambiarlo a mano podría desincronizar la sesión/cuenta de Google.
- [x] `/admin/formularios` pasa a `redirect("/admin/clientes")`. La ruta de detalle `/admin/formularios/[appointmentId]` se deja **sin tocar** — el link del evento de Google Calendar (`calendar-events.ts`) apunta ahí. `intake-form-actions.ts` ahora también revalida `/admin/clientes`.
- [x] `intake-form-table.tsx` eliminado (confirmado huérfano por grep, reemplazado por `patient-table.tsx`).
- [x] `alerts-queries.ts`: reactivadas y scoped las alertas para actor psicólogo (antes devolvía `[]` con un comentario que decía "Fase 4 no está lista" — con citas/pagos/clientes ya scoped, esa premisa quedó obsoleta) — corrección propia, cierra el diferimiento anotado en la Fase 1.3.
- [ ] **No implementado, por decisión abierta con el cliente**: paquetes de sesiones con descuento (PRD §6.9) — sigue fuera de alcance hasta confirmar el modelo exacto.

### 4.3 Agendar y cobrar — hecho, confirmado sin cambios de código
- [x] Confirmado en el código (no solo en el plan): `createManualAppointment` ya forzaba `psychologistId = actor.psychologistId` para un psicólogo y `isException` ya era un switch sin restricción de rol, visible incondicionalmente en `new-manual-appointment-dialog.tsx` — nada que agregar ahí.
- [x] `/admin/citas` y `/admin/pagos` filtrados por `psychologistId` del actor — cubierto por la Fase 4.0.
- [x] "Generar link con tarifa" — cubierto por la Fase 3.
- [x] Monto personalizado (depende de Fase 5): solo se dejó el gancho — un comentario TODO en `edit-appointment-price-dialog.tsx` señalando dónde integrará la aprobación cuando exista. No se construyó el flujo de aprobación.

**Verificación 4**: `bunx tsc --noEmit` limpio, `bunx biome check` limpio, `bun test` sin regresiones (60 pass, 4 fallos preexistentes de siempre). Pendiente la verificación manual real contra la base de prod: como psicólogo, confirmar que `/admin/citas`/`/admin/pagos` muestran solo lo propio sin el filtro de psicólogo visible; editar horario propio y crear un día libre en `/admin/mi-calendario`, confirmando que esos bloques desaparecen del calendario público; entrar a `/admin/clientes`, filtrar, abrir una ficha, agregar una nota y editar nombre/teléfono — todo con el mismo cuidado de no tocar sesiones/pagos reales salvo que sea explícitamente para probar.

---

## Fase 5 — Aprobaciones ✅ implementada

### 5.1 Schema y lógica — hecho
- [x] Modelo `ApprovalRequest { id, type ApprovalType, status ApprovalStatus @default(PENDING), requestedByUserId, targetId, payload Json, decidedByUserId, decidedAt, decisionNote, createdAt }`; enums `ApprovalType { CUSTOM_PAYMENT_AMOUNT REFUND_REQUEST }` y `ApprovalStatus { PENDING APPROVED REJECTED }`. Migración `20260919000000_add_approvals_and_refund_status`. **Desviación menor**: `targetId` quedó `String` (no `String?`) — ambos tipos de solicitud siempre tienen un target real, no había caso de uso para dejarlo opcional.
- [x] `src/lib/auth/permissions.ts`: `approval.request`/`approval.decide`/`settings.write` ya estaban forward-declared desde la Fase 0 — solo hizo falta un fix de una línea (`approval.request` faltaba en el array de `assistant`, necesario para que asistente pueda solicitar `REFUND_REQUEST`), con test primero en `permissions.test.ts`.
- [x] `src/lib/approvals.ts` (TDD, puro): `requiresSettingsWriteEscalation(payoutType)` — el punto de aplicación de la regla de negocio de la Fase 0 (comisión arbitraria fuera de los 4 `PayoutType` exige `settings.write`).
- [x] `src/lib/admin/approval-actions.ts`: `requestApproval(type, targetId, payload)` (permiso `approval.request`), `approveRequest(id, note?)` y `rejectRequest(id, note?)` (permiso `approval.decide`, admin o asistente).
- [x] Al aprobar `CUSTOM_PAYMENT_AMOUNT`: escribe `Appointment.agreedAmount/agreedCurrency/agreedPayoutType` y solo regenera el link si ya existe un `Payment` (mismo precedente que `updateAgreedPrice`), reusando `resolveCheckoutUrl` (exportada desde `payment-actions.ts`, sin cambios de firma).

### 5.1b `REFUND_REQUEST` — hecho
- [x] `requestApproval(REFUND_REQUEST, paymentId, { reason })`: cualquier staff con acceso al pago (admin, asistente, psicólogo sobre lo propio vía `requireOwnAppointment`).
- [x] **Decisión de schema**: `Payment.refundStatus RefundStatus? { PENDING_EXECUTION EXECUTED }` como campo nuevo, no valores nuevos de `PaymentStatus` — evita tocar los switches/`Record` existentes exhaustivos sobre `PaymentStatus` (p. ej. `statusConfig` de `payment-table.tsx`).
- [x] Al aprobar: `Payment.refundStatus = "PENDING_EXECUTION"` — **no** dispara ninguna llamada a Stripe (verificado: `approveRequest` solo hace `prisma.payment.update`).
- [x] `markRefundExecuted(paymentId)` (permiso `payment.commission.write` + chequeo explícito `actor.role === "admin"`, solo si `refundStatus === "PENDING_EXECUTION"`) — tampoco llama a Stripe.

### 5.2 UI y avisos — hecho
- [x] Página `/admin/aprobaciones` (`approvals-table.tsx` + `decide-approval-dialog.tsx`): lista scoped (admin/asistente ven todas, psicólogo solo las propias, solo lectura), aprobar/rechazar con nota. `getApprovals` resuelve el contexto polimórfico de `targetId` (appointmentId vs paymentId) por lote, sin N+1.
- [x] `getAdminAlerts`: alerta agregada "N solicitudes pendientes de aprobación", scoped por `requestedByUserId` para un psicólogo (no hay columna `psychologistId` en `ApprovalRequest`).
- [x] Dos plantillas de correo (`approval-requested.tsx`, `approval-decided.tsx`), parametrizadas por tipo en vez de 4 plantillas separadas — el texto entre monto/reembolso se superpone demasiado como para justificar la duplicación.
- [x] `generate-payment-link-dialog.tsx`: **bug real cerrado de paso** — el botón "Editar precio de esta sesión" se mostraba sin condición alguna, así que un psicólogo lo veía y al usarlo chocaba con el `ForbiddenError` de `updateAgreedPrice`. Ahora, con `canEditPrice=false`, el botón pasa a "Solicitar aprobación de monto" (`RequestCustomAmountDialog`, nuevo).
- [ ] **Diferido a Fase 8** (como estaba previsto): acción "Solicitar reembolso" en `payment-table.tsx`/`appointments-table.tsx`, y el estado "reembolso aprobado — pendiente de ejecución" + botón "Marcar reembolso ejecutado" en esas tablas. El backend completo ya existe (`requestApproval("REFUND_REQUEST", ...)`, `approveRequest`, `markRefundExecuted`); solo falta el punto de entrada en la UI de pagos/citas.

**Verificación 5**: `bunx tsc --noEmit` limpio, `bunx biome check` limpio en los archivos tocados, `bun test` sin regresiones (64 pass, mismos 4 fallos preexistentes). Pendiente la verificación manual real: como psicólogo, solicitar un monto personalizado; como admin **y** como asistente, verlo en aprobaciones, aprobarlo y confirmar que el link se genera con el monto aprobado; generar una solicitud de reembolso sobre un pago mal cobrado (sin botón dedicado todavía — invocar la action directo), aprobarla y confirmar que el sistema **no** llama a la API de Stripe.

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
| Clientes (nuevo, reemplaza Formularios) | `src/app/admin/(dashboard)/clientes/**` (antes `formularios`), `src/lib/admin/patient-queries.ts` |
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

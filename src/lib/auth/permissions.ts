/**
 * Role/permission contract for ALIA v2 staff accounts.
 *
 * This is the single source of truth for "who can do what". Server actions
 * and API routes never compare against role strings directly — they call
 * `can(role, permission)` (or the `require*` helpers in `./require`), so the
 * matrix stays defined in exactly one place.
 *
 * A permission being declared here does not mean a server action already
 * enforces it — some are forward-declared for features landing in later v2
 * phases (approvals, staff accounts, per-role dashboards) so the matrix and
 * its test suite are complete from day one, and those phases only need to
 * consume an existing contract instead of extending it.
 */

export type Role = "admin" | "assistant" | "psychologist" | "patient";

export type Permission =
    // Finance visibility (admin dashboard, /admin/finanzas).
    | "finance.read"
    // Psychologist roster CRUD (create/update/delete/toggle-active/photo).
    // Deliberately admin-only: `deletePsychologist` is a hard delete, the
    // highest blast-radius action in the admin action set.
    | "psychologist.write"
    // Editing a psychologist's weekly schedule — separate from roster
    // management: admin/assistant can edit anyone's, a psychologist only
    // their own.
    | "schedule.write.all"
    | "schedule.write.own"
    // Creating/cancelling/completing/rescheduling/annotating appointments.
    | "appointment.write"
    // Reading appointment data for reports/queries.
    | "appointment.read.all"
    | "appointment.read.own"
    // Generating or emailing a Stripe payment link for a session.
    | "payment.link.create"
    // Reclassifying a payment's commission type among the existing
    // PayoutType values (RECURRING/NEW/LOYAL/LOYAL_NEW) and voiding pending
    // payments. Deliberately distinct from `settings.write`: this picks
    // among already-established types, it never sets an arbitrary percentage.
    | "payment.commission.write"
    // Session price per currency/kind (PaymentRate) — distinct from
    // commission split.
    | "rate.write"
    | "coupon.write"
    // Editing/deleting a patient's submitted intake form.
    | "intake.write"
    | "intake.read.all"
    | "intake.read.own"
    // Global configuration: site contact settings and, critically, the
    // PayoutSettings percentages themselves. Admin-only, no exceptions —
    // this is the one thing an assistant deciding an approval must never be
    // able to reach indirectly.
    | "settings.write"
    // Creating/editing staff accounts (Fase 1.2).
    | "staff.write"
    // Approval workflow (Fase 5): a psychologist requests something
    // (e.g. a custom payment amount); admin/assistant decide it.
    | "approval.request"
    | "approval.decide"
    // Editing a patient's basic profile fields (name, phone, dob) from a
    // psychologist's own patient list (Fase 4.2) — narrower than
    // `intake.write`, which also touches consent-versioned form data.
    | "patient.write";

export const ALL_PERMISSIONS: readonly Permission[] = [
    "finance.read",
    "psychologist.write",
    "schedule.write.all",
    "schedule.write.own",
    "appointment.write",
    "appointment.read.all",
    "appointment.read.own",
    "payment.link.create",
    "payment.commission.write",
    "rate.write",
    "coupon.write",
    "intake.write",
    "intake.read.all",
    "intake.read.own",
    "settings.write",
    "staff.write",
    "approval.request",
    "approval.decide",
    "patient.write",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
    admin: ALL_PERMISSIONS,
    assistant: [
        "appointment.write",
        "appointment.read.all",
        "payment.link.create",
        "payment.commission.write",
        "rate.write",
        "coupon.write",
        "intake.write",
        "intake.read.all",
        "schedule.write.all",
        "approval.decide",
        "approval.request",
    ],
    psychologist: [
        "appointment.write",
        "appointment.read.own",
        "payment.link.create",
        "schedule.write.own",
        "intake.read.own",
        "approval.request",
        "patient.write",
    ],
    patient: [],
};

export function can(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].includes(permission);
}

/** Roles that are allowed into `/admin/**` at all (fine-grained gating on
 * top of that lives in `can`/the `require*` helpers, not here). */
export const STAFF_ROLES: readonly Role[] = [
    "admin",
    "assistant",
    "psychologist",
];

export function isStaffRole(raw: string | undefined | null): raw is Role {
    return STAFF_ROLES.includes(raw as Role);
}

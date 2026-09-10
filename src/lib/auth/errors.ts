/**
 * Thrown by the `require*` guards in `./require` when the current actor
 * lacks a permission or ownership of the resource they're trying to touch.
 *
 * Deliberately extends `Error`: most server actions already wrap their body
 * in `try { ... } catch (err) { if (err instanceof Error) return { success:
 * false, error: err.message }; ... }`, so raising this inside an action that
 * already has that pattern needs no change to the catch block itself.
 */
export class ForbiddenError extends Error {
    constructor(message = "No autorizado") {
        super(message);
        this.name = "ForbiddenError";
    }
}

export type ActionResult =
    | { success: true }
    | { success: false; error: string };

/**
 * Global toast notification dispatcher.
 * Fire from any client-side code: import { toast } from "@/lib/toast"
 *
 * Usage:
 *   toast.success("User created successfully");
 *   toast.error("Something went wrong");
 *   toast.info("Syncing to database...");
 *   toast.warning("This action is irreversible");
 */

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastPayload {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

function fire(message: string, type: ToastType, duration = 4000) {
  if (typeof window === "undefined") return;
  const payload: ToastPayload = { id: Date.now() + Math.random(), message, type, duration };
  window.dispatchEvent(new CustomEvent("app:toast", { detail: payload }));
}

export const toast = {
  success: (msg: string, duration?: number) => fire(msg, "success", duration),
  error:   (msg: string, duration?: number) => fire(msg, "error",   duration ?? 5000),
  info:    (msg: string, duration?: number) => fire(msg, "info",    duration),
  warning: (msg: string, duration?: number) => fire(msg, "warning", duration),
};

"use client";
import { useState, useEffect, useCallback } from "react";
import type { PaymentRecord } from "@/lib/data/properties";

// ─── localStorage keys (UI state only — not business data) ───
const LS_DISMISSED  = "estate_notif_dismissed";
const LS_EMAIL_SENT = "estate_notif_email_sent";

// ─── Types ────────────────────────────────────────────────────
export interface PaymentNotification {
  id: string;
  blockId: string;
  blockNumber: number;
  plotNumber: string;
  purchaserName: string;
  payment: PaymentRecord;
  daysUntilDue: number;   // negative = overdue
  severity: "overdue" | "critical" | "warning" | "info";
  dismissed: boolean;
}

// DB row returned by /api/notifications/payment-data
interface PaymentRow {
  id: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
  paidDate: string | null;
  status: string;
  notified: boolean;
  notes: string | null;
  plotNumber: string;
  purchaserName: string;
  blockId: string;
  blockNumber: number;
}

// ─── Helpers ──────────────────────────────────────────────────
function getDaysUntilDue(dueDateStr: string): number {
  const due = new Date(dueDateStr);
  const now = new Date();
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getSeverity(days: number): PaymentNotification["severity"] {
  if (days < 0)   return "overdue";
  if (days <= 7)  return "critical";
  if (days <= 30) return "warning";
  return "info";
}

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function saveSet(key: string, ids: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...ids]));
}

// ─── API scanner (replaces localStorage scan) ─────────────────
async function fetchPaymentNotifications(
  dismissed: Set<string>
): Promise<PaymentNotification[]> {
  try {
    const res = await fetch("/api/notifications/payment-data");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows: PaymentRow[] = await res.json();

    const results: PaymentNotification[] = [];

    for (const row of rows) {
      if (!row.dueDate) continue;
      const days = getDaysUntilDue(row.dueDate);
      if (days > 90) continue; // only alert within 90-day window

      const notifId = `${row.blockId}_${row.plotNumber}_${row.id}`;

      results.push({
        id:            notifId,
        blockId:       row.blockId,
        blockNumber:   row.blockNumber,
        plotNumber:    row.plotNumber,
        purchaserName: row.purchaserName ?? "",
        payment: {
          id:          row.id,
          description: row.description,
          amount:      Number(row.amount),
          currency:    row.currency as "ETB" | "USD",
          dueDate:     row.dueDate,
          paidDate:    row.paidDate ?? undefined,
          status:      row.status as PaymentRecord["status"],
          notified:    row.notified,
          notes:       row.notes ?? undefined,
        },
        daysUntilDue: days,
        severity:     getSeverity(days),
        dismissed:    dismissed.has(notifId),
      });
    }

    return results.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  } catch (err) {
    console.error("[NotificationStore] fetchPaymentNotifications error:", err);
    return [];
  }
}

// ─── Auto-email (fire-and-forget) ────────────────────────────
async function autoEmailAlerts(
  alerts: PaymentNotification[],
  alreadySent: Set<string>
) {
  const pending = alerts.filter(
    n => (n.severity === "overdue" || n.severity === "critical") && !alreadySent.has(n.id)
  );
  if (!pending.length) return;

  const payload = pending.map(n => ({
    blockId:            n.blockId,
    blockNumber:        n.blockNumber,
    plotNumber:         n.plotNumber,
    paymentDescription: n.payment.description,
    amount:             n.payment.amount,
    currency:           n.payment.currency,
    dueDate:            n.payment.dueDate,
    daysUntilDue:       n.daysUntilDue,
    purchaserName:      n.purchaserName,
  }));

  try {
    const res = await fetch("/api/notifications/payment-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const next = new Set(alreadySent);
      pending.forEach(n => next.add(n.id));
      saveSet(LS_EMAIL_SENT, next);
    }
  } catch (err) {
    console.error("[AutoAlert] Failed to send payment emails:", err);
  }
}

// ─── Hook ─────────────────────────────────────────────────────
export function useNotificationStore() {
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [dismissed, setDismissed]         = useState<Set<string>>(new Set());
  const [ready, setReady]                 = useState(false);

  const refresh = useCallback(async () => {
    const d      = loadSet(LS_DISMISSED);
    const notifs = await fetchPaymentNotifications(d);
    setDismissed(d);
    setNotifications(notifs);
    setReady(true);

    // Auto-email overdue/critical alerts (deduped by localStorage set)
    const alreadySent = loadSet(LS_EMAIL_SENT);
    autoEmailAlerts(notifs, alreadySent);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000); // re-scan every 60 s
    return () => clearInterval(interval);
  }, [refresh]);

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      saveSet(LS_DISMISSED, next);
      return next;
    });
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, dismissed: true } : n)
    );
  }, []);

  const dismissAll = useCallback(() => {
    const ids = notifications.map(n => n.id);
    setDismissed(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      saveSet(LS_DISMISSED, next);
      return next;
    });
    setNotifications(prev => prev.map(n => ({ ...n, dismissed: true })));
  }, [notifications]);

  const active        = notifications.filter(n => !n.dismissed);
  const overdueCount  = active.filter(n => n.severity === "overdue").length;
  const criticalCount = active.filter(n => n.severity === "critical").length;

  return {
    notifications,
    active,
    dismissed,
    overdueCount,
    criticalCount,
    totalCount: active.length,
    ready,
    dismiss,
    dismissAll,
    refresh,
  };
}

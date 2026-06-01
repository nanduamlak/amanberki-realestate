"use client";
import { useState, useEffect, useCallback } from "react";
import type { Property, PropertyStatus } from "@/lib/data/properties";

export type EditableProperty = Omit<Property, "plotsDetail">;

// ─── API helpers ──────────────────────────────────────────────
async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API ${res.status}`);
  }
  return res.json();
}

export function usePropertyStore() {
  const [list, setList]   = useState<EditableProperty[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]  = useState<string | null>(null);

  // ── Load from DB ──────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const data: EditableProperty[] = await apiFetch("/api/properties");
      setList(data);
      setError(null);
    } catch (err) {
      console.error("[PropertyStore] load error:", err);
      setError("Failed to load properties");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Add ───────────────────────────────────────────────────
  const add = useCallback(async (p: EditableProperty) => {
    setSaving(true);
    try {
      await apiFetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      await load();
    } catch (err) {
      console.error("[PropertyStore] add error:", err);
      throw err; // let the UI show the error
    } finally {
      setSaving(false);
    }
  }, [load]);

  // ── Update ────────────────────────────────────────────────
  const update = useCallback(async (id: string, patch: Partial<EditableProperty>) => {
    setSaving(true);
    // Optimistic update
    setList(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    try {
      await apiFetch(`/api/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch (err) {
      console.error("[PropertyStore] update error:", err);
      await load(); // rollback on error
      throw err;
    } finally {
      setSaving(false);
    }
  }, [load]);

  // ── Remove ────────────────────────────────────────────────
  const remove = useCallback(async (id: string) => {
    setSaving(true);
    setList(prev => prev.filter(p => p.id !== id)); // optimistic
    try {
      await apiFetch(`/api/properties/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("[PropertyStore] remove error:", err);
      await load(); // rollback
      throw err;
    } finally {
      setSaving(false);
    }
  }, [load]);

  // ── Reset (reload from DB) ────────────────────────────────
  const reset = useCallback(() => load(), [load]);

  return { list, ready, saving, error, add, update, remove, reset };
}

// ─── Constants ────────────────────────────────────────────────
export const STATUSES: PropertyStatus[] = [
  "available", "sold", "reserved", "under-construction",
];
export const ZONES = ["Zone I G+1", "Zone II G+0"] as const;

export const BLANK_PROPERTY: EditableProperty = {
  id: "", blockNumber: 0, zone: "Zone I G+1", status: "available",
  price: 0, primaryPlots: "", noOfPlots: 0, area: 0,
  plotSize: "", bufferPlots: "0", noOfBufferPlots: 0,
  soldPlots: 0, activePlots: 0, remark: "", description: "",
};

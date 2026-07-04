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

// ─── Module-level singleton state ────────────────────────────
// Shared across ALL component instances — no re-fetch on navigation
let globalList: EditableProperty[] = [];
let globalReady = false;
let globalSaving = false;
let globalError: string | null = null;
let fetchPromise: Promise<void> | null = null;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

function getSnapshot() {
  return {
    list: globalList,
    ready: globalReady,
    saving: globalSaving,
    error: globalError,
  };
}

async function loadFromDB() {
  try {
    const data: EditableProperty[] = await apiFetch("/api/properties");
    globalList = data;
    globalError = null;
  } catch (err) {
    console.error("[PropertyStore] load error:", err);
    globalError = "Failed to load properties";
  } finally {
    globalReady = true;
    fetchPromise = null;
    notify();
  }
}

function ensureLoaded() {
  if (globalReady) return; // already loaded — nothing to do
  if (fetchPromise) return; // already in flight — wait for it
  fetchPromise = loadFromDB();
}

// ─── Hook ─────────────────────────────────────────────────────
export function usePropertyStore() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Subscribe to store updates
    const listener: Listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);

    // Trigger initial load if not already loaded/loading
    ensureLoaded();

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const { list, ready, saving, error } = getSnapshot();

  // ── Force reload (e.g., after writes) ────────────────────────
  const reset = useCallback(async () => {
    globalReady = false;
    globalList = [];
    fetchPromise = loadFromDB();
    notify();
    await fetchPromise;
  }, []);

  // ── Add ───────────────────────────────────────────────────────
  const add = useCallback(async (p: EditableProperty) => {
    globalSaving = true;
    notify();
    try {
      await apiFetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      await reset();
    } catch (err) {
      console.error("[PropertyStore] add error:", err);
      globalSaving = false;
      notify();
      throw err;
    }
  }, [reset]);

  // ── Update ────────────────────────────────────────────────────
  const update = useCallback(async (id: string, patch: Partial<EditableProperty>) => {
    globalSaving = true;
    // Optimistic update
    globalList = globalList.map((p) => (p.id === id ? { ...p, ...patch } : p));
    notify();
    try {
      await apiFetch(`/api/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch (err) {
      console.error("[PropertyStore] update error:", err);
      await reset(); // rollback on error
      throw err;
    } finally {
      globalSaving = false;
      notify();
    }
  }, [reset]);

  // ── Remove ────────────────────────────────────────────────────
  const remove = useCallback(async (id: string) => {
    globalSaving = true;
    globalList = globalList.filter((p) => p.id !== id); // optimistic
    notify();
    try {
      await apiFetch(`/api/properties/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("[PropertyStore] remove error:", err);
      await reset(); // rollback
      throw err;
    } finally {
      globalSaving = false;
      notify();
    }
  }, [reset]);

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

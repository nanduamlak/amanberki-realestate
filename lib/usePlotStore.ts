"use client";
import { useState, useEffect, useCallback } from "react";
import type { PlotDetail } from "@/lib/data/properties";

export type { PlotDetail };

export function usePlotStore(blockId: string) {
  const [plots, setPlots] = useState<PlotDetail[]>([]);
  const [ready, setReady]  = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Load from API ─────────────────────────────────────────
  const load = useCallback(async () => {
    if (!blockId) return;
    try {
      const res = await fetch(`/api/properties/${blockId}/plots`);
      if (!res.ok) throw new Error("Failed to fetch plots");
      const data: PlotDetail[] = await res.json();
      setPlots(data);
    } catch (err) {
      console.error("[PlotStore] load error:", err);
    } finally {
      setReady(true);
    }
  }, [blockId]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  // ── Add ───────────────────────────────────────────────────
  const add = useCallback(async (p: PlotDetail) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/properties/${blockId}/plots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      if (!res.ok) throw new Error(await res.text());
      await load(); // refresh from DB
    } finally {
      setSaving(false);
    }
  }, [blockId, load]);

  // ── Update ────────────────────────────────────────────────
  const update = useCallback(async (plotNumber: string, patch: Partial<PlotDetail>) => {
    setSaving(true);
    // Optimistic update for snappy UI
    setPlots(prev => prev.map(p => p.plotNumber === plotNumber ? { ...p, ...patch } : p));
    try {
      const current = plots.find(p => p.plotNumber === plotNumber);
      const merged  = { ...current, ...patch, plotNumber };
      const res = await fetch(`/api/properties/${blockId}/plots`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged),
      });
      if (!res.ok) throw new Error(await res.text());
      await load(); // sync DB truth
    } catch (err) {
      console.error("[PlotStore] update error:", err);
      await load(); // rollback optimistic update
    } finally {
      setSaving(false);
    }
  }, [blockId, plots, load]);

  // ── Remove ────────────────────────────────────────────────
  const remove = useCallback(async (plotNumber: string) => {
    setSaving(true);
    setPlots(prev => prev.filter(p => p.plotNumber !== plotNumber)); // optimistic
    try {
      const res = await fetch(
        `/api/properties/${blockId}/plots?plotNumber=${encodeURIComponent(plotNumber)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      console.error("[PlotStore] remove error:", err);
      await load(); // rollback
    } finally {
      setSaving(false);
    }
  }, [blockId, load]);

  // ── Reset (reload from DB) ────────────────────────────────
  const reset = useCallback(() => load(), [load]);

  return { plots, ready, saving, add, update, remove, reset };
}

// ─── Constants (unchanged — used by forms) ────────────────────
export const BLANK_PLOT: PlotDetail = {
  plotNumber: "", plotSize: 0, builtArea: "", purchaserName: "",
  titleDeedsStatus: "", constructionStatus: "", remark: "",
  houseType: "", floors: undefined, bedrooms: undefined, bathrooms: undefined,
  livingRooms: undefined, kitchen: undefined, dining: undefined,
  garage: undefined, balcony: false, garden: false, rooftop: false,
  orientation: "", yearBuilt: undefined,
  contractorName: "", referenceNo: "", buyerGroup: null,
  ownershipHistory: [], paymentSchedule: [],
  amenities: ["Road Access", "Water Supply", "Electricity Grid", "Compound Wall", "Security Gate", "Green Belt"],
};

export const HOUSE_TYPES = ["Villa", "Townhouse", "Duplex", "Apartment", "Studio", "Commercial", "G+1", "G+2"] as const;
export const DEED_STATUSES = ["issued", "pending", "not-issued"] as const;
export const CONSTRUCTION_STATUSES = [
  "", "Bare Land", "Foundation", "Blockwork", "Roofing",
  "Plastering", "Finishing", "Carried out", "Occupied",
] as const;
export const PLOT_AMENITIES = [
  "Road Access", "Water Supply", "Electricity Grid",
  "Compound Wall", "Security Gate", "Green Belt",
] as const;

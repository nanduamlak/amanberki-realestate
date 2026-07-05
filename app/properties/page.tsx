"use client";
import { formatPriceRange } from "@/lib/utils";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRole } from "@/lib/RoleContext";
import { useRouter } from "next/navigation";
import {
  usePropertyStore, ZONES, BLANK_PROPERTY, type EditableProperty,
} from "@/lib/usePropertyStore";

import {
  Plus, Pencil, Trash2, Search, RotateCcw, ShieldAlert,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Save, Building2, Filter, Layers,
  ExternalLink, MapPin, DollarSign, TrendingUp, Check, AlertCircle, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/lib/toast";

/* ── helpers ─────────────────────────────────────────────────────────── */
// Occupancy filter buckets — derived from real plot data, NOT the legacy status field
type OccupancyFilter = "all" | "full" | "partial" | "empty";

/** Returns 0-100 sold percentage for a block */
function soldPct(soldPlots: number, noOfPlots: number) {
  if (!noOfPlots) return 0;
  return Math.round((soldPlots / noOfPlots) * 100);
}

/** Which occupancy bucket does a block fall into? */
function occupancyBucket(soldPlots: number, noOfPlots: number): OccupancyFilter {
  const pct = soldPct(soldPlots, noOfPlots);
  if (pct === 100) return "full";
  if (pct === 0)   return "empty";
  return "partial";
}

// These are only used in the add/edit form modal
type PropertyStatus = "available" | "sold" | "reserved" | "under-construction";
const STATUSES: PropertyStatus[] = ["available", "sold", "reserved", "under-construction"];
const STATUS_LABEL: Record<PropertyStatus, string> = {
  available: "Available", sold: "Sold",
  reserved: "Reserved", "under-construction": "Under Construction",
};

function nextId(list: EditableProperty[]) {
  const nums = list.map(p => parseInt(p.id.replace("BLOCK-", "")) || 0);
  const max = nums.length ? Math.max(...nums) : 0;
  return `BLOCK-${String(max + 1).padStart(3, "0")}`;
}

function nextBlockNumber(list: EditableProperty[]) {
  const max = list.length ? Math.max(...list.map(p => p.blockNumber || 0)) : 0;
  return max + 1;
}

/* ── form modal ──────────────────────────────────────────────────────── */
function PropertyFormModal({
  initial, onSave, onClose, isNew,
}: {
  initial: EditableProperty;
  onSave: (p: EditableProperty) => void;
  onClose: () => void;
  isNew: boolean;
}) {
  const [form, setForm] = useState<EditableProperty>(initial);
  const set = (k: keyof EditableProperty, v: string | number | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const valid = form.id.trim() && form.blockNumber > 0;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(10,18,30,.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{ animation: "pmIn .2s cubic-bezier(.4,0,.2,1)" }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes pmIn{from{opacity:0;transform:scale(.96) translateY(14px)}to{opacity:1;transform:none}}`}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0086D1]/10 flex items-center justify-center">
              <Building2 size={18} className="text-[#0086D1]" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">
                {isNew ? "Add New Property" : `Edit ${form.id}`}
              </h2>
              <p className="text-xs text-slate-500">Fill in the block details below</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* IDs */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Block ID *" hint="e.g. BLOCK-001">
              <input className={INPUT} value={form.id} onChange={e => set("id", e.target.value.toUpperCase())} placeholder="BLOCK-001" />
            </Field>
            <Field label="Block Number *">
              <input className={INPUT} type="number" value={form.blockNumber || ""} onChange={e => set("blockNumber", Number(e.target.value))} placeholder="1" />
            </Field>
          </div>

          {/* Zone — full width now that Status is removed */}
          <Field label="Zone">
            <select className={INPUT} value={form.zone} onChange={e => set("zone", e.target.value as typeof ZONES[number])}>
              {ZONES.map(z => <option key={z}>{z}</option>)}
            </select>
          </Field>

          {/* Price + Area */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price ($)" hint="0 = unlisted">
              <input className={INPUT} type="number" value={form.price || ""} onChange={e => set("price", Number(e.target.value))} placeholder="0" />
            </Field>
            <Field label="Total Area (m²)">
              <input className={INPUT} type="number" value={form.area || ""} onChange={e => set("area", Number(e.target.value))} placeholder="0" />
            </Field>
          </div>


          {/* Description */}
          <Field label="Description">
            <textarea
              className={INPUT + " resize-none"}
              rows={2}
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Optional description…"
            />
          </Field>
          <Field label="Remark">
            <textarea
              className={INPUT + " resize-none"}
              rows={2}
              value={form.remark}
              onChange={e => set("remark", e.target.value)}
              placeholder="Optional internal note…"
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <button onClick={onClose} className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-all">
            Cancel
          </button>
          <button
            onClick={() => valid && onSave(form)}
            disabled={!valid}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0086D1] text-white font-bold text-sm hover:bg-[#006eb0] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow"
          >
            <Save size={14} /> {isNew ? "Add Property" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── delete confirm ──────────────────────────────────────────────────── */
function DeleteModal({ id, onConfirm, onClose }: { id: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" style={{ background: "rgba(10,18,30,.65)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-rose-600" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-center text-base mb-1">Delete Property?</h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          <strong className="text-slate-800">{id}</strong> will be permanently removed from the demo store.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-sm text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-all shadow">Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── small helpers ───────────────────────────────────────────────────── */
const INPUT = "w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0086D1]/25 focus:border-[#0086D1] transition-all font-medium text-slate-900 placeholder:text-slate-400";
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}{hint && <span className="ml-1 font-normal normal-case text-slate-400">({hint})</span>}</label>
      {children}
    </div>
  );
}

type SortKey = "blockNumber" | "soldPlots" | "zone" | "price" | "area" | "noOfPlots";

function SortIcon({ k, sortKey, sortAsc }: { k: SortKey; sortKey: SortKey; sortAsc: boolean }) {
  return sortKey === k ? (sortAsc ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : <ChevronUp size={13} className="opacity-20" />;
}

/* ══ MAIN PAGE ══════════════════════════════════════════════════════════ */
export default function PropertiesPage() {
  const { isSuperAdmin, isAdmin, isLoading } = useRole();
  const router = useRouter();
  const { list, ready, add, update, remove, reset } = usePropertyStore();

  /* canManage = true only for admin / super_admin */
  const canManage = isSuperAdmin || isAdmin;

  const [search, setSearch] = useState("");
  const [occupancyFilter, setOccupancyFilter] = useState<OccupancyFilter>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<"all" | "listed" | "unlisted">("all");
  const [sortKey, setSortKey] = useState<SortKey>("blockNumber");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sortAsc, setSortAsc] = useState(true);
  const [formTarget, setFormTarget] = useState<EditableProperty | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  /* ── Zone Price Management ── */
  interface ZonePrice {
    zone: string;
    price: number;
    priceMax: number | null;
    blockCount: number;
    lastUpdated: string;
  }
  const [zonePrices, setZonePrices]           = useState<ZonePrice[]>([]);
  const [pricesReady, setPricesReady]         = useState(false);
  const [editingZone, setEditingZone]         = useState<string | null>(null);
  const [editPrice, setEditPrice]             = useState("");
  const [editPriceMax, setEditPriceMax]       = useState("");
  const [isRangeMode, setIsRangeMode]         = useState(false);
  const [savingZone, setSavingZone]           = useState(false);

  const fetchZonePrices = useCallback(async () => {
    try {
      const res = await fetch("/api/properties/zone-prices");
      if (res.ok) { setZonePrices(await res.json()); setPricesReady(true); }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchZonePrices(); }, [fetchZonePrices]);

  const openZoneEdit = (zp: ZonePrice) => {
    setEditingZone(zp.zone);
    setEditPrice(zp.price > 0 ? String(zp.price / 1_000_000) : "");
    setEditPriceMax(zp.priceMax ? String(zp.priceMax / 1_000_000) : "");
    setIsRangeMode(!!zp.priceMax && zp.priceMax !== zp.price);
  };

  const saveZonePrice = async () => {
    if (!editingZone) return;
    const price = parseFloat(editPrice) * 1_000_000;
    const priceMax = isRangeMode && editPriceMax ? parseFloat(editPriceMax) * 1_000_000 : null;
    if (isNaN(price) || price <= 0) { toast.error("Enter a valid price"); return; }
    if (isRangeMode && priceMax && priceMax <= price) { toast.error("Max price must be greater than min price"); return; }
    setSavingZone(true);
    try {
      const res = await fetch("/api/properties/zone-prices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone: editingZone, price, priceMax }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      toast.success(`${editingZone} price updated — ${data.blocksUpdated} blocks affected`);
      setEditingZone(null);
      fetchZonePrices();
      // Also refresh the main property list so table prices update
      reset(); // triggers store refetch
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to update price");
    } finally {
      setSavingZone(false);
    }
  };

  /* filtered + sorted list */
  const filtered = useMemo(() => {
    let data = [...list];
    if (occupancyFilter !== "all") data = data.filter(p => occupancyBucket(p.soldPlots, p.noOfPlots) === occupancyFilter);
    if (zoneFilter !== "all") data = data.filter(p => p.zone === zoneFilter);
    if (priceFilter === "listed") data = data.filter(p => p.price > 0);
    if (priceFilter === "unlisted") data = data.filter(p => p.price === 0);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(p =>
        p.id.toLowerCase().includes(q) ||
        String(p.blockNumber).includes(q) ||
        p.zone.toLowerCase().includes(q) ||
        p.primaryPlots.toLowerCase().includes(q)
      );
    }
    data.sort((a, b) => {
      const av = a[sortKey] as number | string;
      const bv = b[sortKey] as number | string;
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
    return data;
  }, [list, search, occupancyFilter, zoneFilter, priceFilter, sortKey, sortAsc]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(true); }
  };

  const openAdd = () => { 
    setIsNew(true); 
    setFormTarget({ 
      ...BLANK_PROPERTY, 
      id: nextId(list),
      blockNumber: nextBlockNumber(list)
    }); 
  };
  const openEdit = (p: EditableProperty) => { setIsNew(false); setFormTarget({ ...p }); };

  const handleSave = (p: EditableProperty) => {
    if (isNew) {
      add(p);
      toast.success(`Block ${p.id} added successfully`);
    } else {
      update(p.id, p);
      toast.success(`Block ${p.id} updated`);
    }
    setFormTarget(null);
  };
  const handleDelete = () => {
    if (deleteTarget) {
      remove(deleteTarget);
      toast.info(`Block ${deleteTarget} deleted`);
      setDeleteTarget(null);
    }
  };
  const handleReset = () => {
    reset();
    toast.info("All blocks reset to default data");
  };

  /* ── stats banner — plot-level aggregates ── */
  const plotStats = useMemo(() => {
    const totalPlots  = list.reduce((s, p) => s + p.noOfPlots, 0);
    const soldPlots   = list.reduce((s, p) => s + p.soldPlots, 0);
    const availPlots  = list.reduce((s, p) => s + p.activePlots, 0);
    const fullBlocks  = list.filter(p => occupancyBucket(p.soldPlots, p.noOfPlots) === "full").length;
    return { totalBlocks: list.length, totalPlots, soldPlots, availPlots, fullBlocks };
  }, [list]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0086D1]/10 text-[#0086D1] text-xs font-bold uppercase tracking-wider mb-3">
              <Building2 size={13} /> Properties
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Block Inventory</h1>
            <p className="text-slate-500 text-sm mt-1">
              {canManage ? "Admin view · add, edit and delete blocks" : "Browse all property blocks"}
            </p>
          </div>
          {canManage && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setResetTarget(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-white transition-all">
                <RotateCcw size={14} /> Reset
              </button>
              <button onClick={openAdd}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0086D1] text-white font-bold text-sm hover:bg-[#006eb0] transition-all shadow-md">
                <Plus size={16} /> Add Property
              </button>
            </div>
          )}
        </div>

        {/* ── STAT CARDS — plot-level ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Total Blocks",   value: plotStats.totalBlocks,  sub: "blocks",  color: "text-slate-900  bg-white        border-slate-200"  },
            { label: "Total Plots",    value: plotStats.totalPlots,   sub: "plots",   color: "text-slate-700  bg-slate-50     border-slate-200"  },
            { label: "Sold Plots",     value: plotStats.soldPlots,    sub: "sold",    color: "text-rose-700   bg-rose-50      border-rose-200"   },
            { label: "Avail. Plots",   value: plotStats.availPlots,   sub: "avail",   color: "text-emerald-700 bg-emerald-50  border-emerald-200"},
            { label: "Fully Sold",     value: plotStats.fullBlocks,   sub: "blocks",  color: "text-rose-800   bg-rose-100     border-rose-300"   },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.color}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{s.label}</p>
              <p className="text-2xl font-black mt-0.5">{s.value}</p>
              <p className="text-[10px] opacity-50 font-semibold">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── ZONE PRICE MANAGEMENT (admin only) ── */}
        {canManage && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-[#0086D1]/10 flex items-center justify-center">
                  <TrendingUp size={14} className="text-[#0086D1]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Zone Price Management</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Prices apply to all blocks within a zone</p>
                </div>
              </div>
              <button
                onClick={fetchZonePrices}
                className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                title="Refresh prices"
              >
                <RefreshCw size={13} />
              </button>
            </div>

            {/* Zone price cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {!pricesReady ? (
                [1, 2].map(i => (
                  <div key={i} className="p-5 animate-pulse">
                    <div className="h-3 bg-slate-100 rounded w-24 mb-3" />
                    <div className="h-8 bg-slate-100 rounded w-36" />
                  </div>
                ))
              ) : (
                zonePrices.map(zp => (
                  <div key={zp.zone} className="p-5">
                    {editingZone === zp.zone ? (
                      /* ── Edit form ── */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{zp.zone}</span>
                          <button onClick={() => setEditingZone(null)} className="text-slate-400 hover:text-slate-600">
                            <X size={13} />
                          </button>
                        </div>

                        {/* Range toggle */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <div
                            onClick={() => setIsRangeMode(v => !v)}
                            className={`w-8 h-4 rounded-full transition-colors relative ${
                              isRangeMode ? "bg-[#0086D1]" : "bg-slate-200"
                            }`}
                          >
                            <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${
                              isRangeMode ? "left-4" : "left-0.5"
                            }`} />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-600">Price range (min – max)</span>
                        </label>

                        <div className={`grid gap-2 ${isRangeMode ? "grid-cols-2" : "grid-cols-1"}`}>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              {isRangeMode ? "Min Price (M ETB)" : "Price (M ETB)"}
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={editPrice}
                              onChange={e => setEditPrice(e.target.value)}
                              placeholder="e.g. 11.2"
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0086D1]/20 focus:border-[#0086D1]"
                            />
                          </div>
                          {isRangeMode && (
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Max Price (M ETB)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={editPriceMax}
                                onChange={e => setEditPriceMax(e.target.value)}
                                placeholder="e.g. 7.5"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0086D1]/20 focus:border-[#0086D1]"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={saveZonePrice}
                            disabled={savingZone || !editPrice}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0086D1] text-white text-xs font-black hover:bg-[#006daa] disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
                          >
                            {savingZone ? (
                              <><RefreshCw size={11} className="animate-spin" /> Saving…</>
                            ) : (
                              <><Check size={11} /> Save Changes</>
                            )}
                          </button>
                          <button onClick={() => setEditingZone(null)} className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2 py-2">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── Display ── */
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{zp.zone}</span>
                            <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-full">
                              {zp.blockCount} blocks
                            </span>
                          </div>
                          <div className="text-2xl font-black text-slate-900 leading-none">
                            {zp.price > 0 ? formatPriceRange(zp.price, zp.priceMax) : (
                              <span className="text-slate-300 text-base font-bold">Not set</span>
                            )}
                          </div>
                          {zp.lastUpdated && (
                            <p className="text-[9px] text-slate-400 mt-1.5 font-medium">
                              Last updated: {new Date(zp.lastUpdated).toLocaleDateString("en-GB", {
                                day: "2-digit", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit"
                              })}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => openZoneEdit(zp)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-[#0086D1] hover:text-white hover:border-[#0086D1] transition-all"
                        >
                          <Pencil size={11} /> Update
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TOOLBAR ── */}
        <div className="flex flex-wrap gap-2 p-3 bg-white rounded-2xl border border-slate-200/60 shadow-sm items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search block, ID, zone, plots…"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0086D1]/20 transition-all border border-transparent focus:border-[#0086D1]/30"
            />
          </div>
          {/* Occupancy filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <Filter size={12} className="text-slate-400" />
            <select value={occupancyFilter} onChange={e => { setOccupancyFilter(e.target.value as OccupancyFilter); setCurrentPage(1); }}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer">
              <option value="all">All Occupancy</option>
              <option value="full">Fully Sold</option>
              <option value="partial">Partially Sold</option>
              <option value="empty">No Sales Yet</option>
            </select>
          </div>
          {/* Zone */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <MapPin size={12} className="text-slate-400" />
            <select value={zoneFilter} onChange={e => { setZoneFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer">
              <option value="all">All Zones</option>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          {/* Price */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <DollarSign size={12} className="text-slate-400" />
            <select value={priceFilter} onChange={e => { setPriceFilter(e.target.value as "all" | "listed" | "unlisted"); setCurrentPage(1); }}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer">
              <option value="all">All Prices</option>
              <option value="listed">Listed Only</option>
              <option value="unlisted">Unlisted Only</option>
            </select>
          </div>
          {/* Clear filters */}
          {(occupancyFilter !== "all" || zoneFilter !== "all" || priceFilter !== "all" || search) && (
            <button onClick={() => { setSearch(""); setOccupancyFilter("all"); setZoneFilter("all"); setPriceFilter("all"); setCurrentPage(1); }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 font-bold text-xs hover:bg-rose-100 transition-all">
              <X size={11} /> Clear
            </button>
          )}
          <span className="ml-auto text-xs font-bold text-slate-400 whitespace-nowrap">{filtered.length} / {list.length}</span>
        </div>

        {/* ── DATA TABLE ── */}
        {!ready ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm font-semibold">Loading…</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <colgroup>
                  <col style={{ width: "48px" }} /><col style={{ width: "108px" }} /><col style={{ width: "150px" }} /><col style={{ width: "200px" }} /><col style={{ width: "80px" }} /><col style={{ width: "110px" }} /><col style={{ width: "110px" }} /><col />
                </colgroup>
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200">
                    <th onClick={() => toggleSort("blockNumber")} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">
                      <span className="flex items-center gap-1">#<SortIcon k="blockNumber" sortKey={sortKey} sortAsc={sortAsc} /></span>
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                      Block ID
                    </th>
                    <th onClick={() => toggleSort("zone")} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">
                      <span className="flex items-center gap-1">Zone<SortIcon k="zone" sortKey={sortKey} sortAsc={sortAsc} /></span>
                    </th>
                    <th onClick={() => toggleSort("soldPlots")} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">
                      <span className="flex items-center gap-1">Plot Occupancy<SortIcon k="soldPlots" sortKey={sortKey} sortAsc={sortAsc} /></span>
                    </th>
                    <th onClick={() => toggleSort("noOfPlots")} className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">
                      <span className="flex items-center justify-end gap-1">Plots<SortIcon k="noOfPlots" sortKey={sortKey} sortAsc={sortAsc} /></span>
                    </th>
                    <th onClick={() => toggleSort("area")} className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">
                      <span className="flex items-center justify-end gap-1">Area m²<SortIcon k="area" sortKey={sortKey} sortAsc={sortAsc} /></span>
                    </th>
                    <th onClick={() => toggleSort("price")} className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">
                      <span className="flex items-center justify-end gap-1">Price<SortIcon k="price" sortKey={sortKey} sortAsc={sortAsc} /></span>
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center"><Building2 size={24} className="text-slate-300" /></div>
                        <p className="font-bold text-slate-500">No properties match your filters</p>
                        <button onClick={() => { setSearch(""); setOccupancyFilter("all"); setZoneFilter("all"); setPriceFilter("all"); setCurrentPage(1); }}
                          className="text-xs font-bold text-[#0086D1] hover:underline">Clear all filters</button>
                      </div>
                    </td></tr>
                  )}
                  {paginatedItems.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      {/* # chip */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="w-8 h-8 rounded-lg bg-[#0086D1]/10 flex items-center justify-center font-black text-[#0086D1] text-sm">{(p as any).blockLabel ?? p.blockNumber}</div>
                      </td>
                      {/* Block ID */}
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{p.id}</span>
                      </td>
                      {/* Zone */}
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-700 font-semibold text-sm">
                          <MapPin size={11} className="text-slate-400 shrink-0" />{p.zone}
                        </div>
                      </td>
                      {/* Plot Occupancy Bar */}
                      <td className="px-4 py-3.5 align-middle">
                        <PlotRatioBar soldPlots={p.soldPlots} totalPlots={p.noOfPlots} activePlots={p.activePlots} />
                      </td>
                      {/* Plots */}
                      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                        <span className="font-black text-slate-800">{p.noOfPlots}</span>
                        <span className="text-[10px] text-slate-400 ml-1">plots</span>
                      </td>
                      {/* Area */}
                      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                        <span className="font-bold text-slate-700">{p.area.toLocaleString()}</span>
                        <span className="text-[10px] font-normal text-slate-400 ml-1">m²</span>
                      </td>
                      {/* Price */}
                      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                        {p.price > 0
                          ? <span className="font-black text-[#0086D1]">{formatPriceRange(p.price, p.priceMax)}</span>
                          : <span className="text-slate-300 font-medium text-xs">Unlisted</span>}
                      </td>
                      {/* Actions */}
                      <td className="px-3 py-3.5 align-middle">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <Link href={`/property/${p.id}`} title="View Detail Page"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wide transition-all">
                            <ExternalLink size={11} /> View
                          </Link>
                          {canManage && (
                            <>
                              <Link href={`/properties/${p.id}/plots`} title="Manage Plots"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0086D1]/10 hover:bg-[#0086D1]/20 text-[#0086D1] font-bold text-[10px] uppercase tracking-wide transition-all">
                                <Layers size={11} /> Plots
                              </Link>
                              <button onClick={() => openEdit(p)} title="Edit"
                                className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-all border border-amber-100">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => setDeleteTarget(p.id)} title="Delete"
                                className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all border border-rose-100">
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Showing {filtered.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} properties
              </span>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-white transition-all shadow-sm bg-slate-50"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <div className="flex items-center gap-1 mx-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === page ? "bg-[#0086D1] text-white shadow-md border border-[#0086D1]" : "text-slate-600 hover:bg-slate-200 border border-transparent"}`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-white transition-all shadow-sm bg-slate-50"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
             
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {formTarget && (
        <PropertyFormModal
          initial={formTarget}
          isNew={isNew}
          onSave={handleSave}
          onClose={() => setFormTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          id={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {resetTarget && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" style={{ background: "rgba(10,18,30,.65)", backdropFilter: "blur(6px)" }} onClick={() => setResetTarget(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-3"><RotateCcw size={22} className="text-amber-600" /></div>
            <h3 className="font-extrabold text-slate-900 text-center mb-1">Reset to defaults?</h3>
            <p className="text-sm text-slate-500 text-center mb-5">All edits will be discarded and the original seed data will be restored.</p>
            <div className="flex gap-3">
              <button onClick={() => setResetTarget(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setResetTarget(false); handleReset(); }} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 shadow">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── PlotRatioBar ──────────────────────────────────────────────────────── */
function PlotRatioBar({
  soldPlots,
  totalPlots,
  activePlots,
}: {
  soldPlots: number;
  totalPlots: number;
  activePlots: number;
}) {
  if (!totalPlots) {
    return <span className="text-[11px] text-slate-300 font-medium italic">No plots</span>;
  }

  const pct = Math.round((soldPlots / totalPlots) * 100);

  return (
    <div className="flex flex-col gap-1 min-w-[160px]">
      {/* Numbers row */}
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-rose-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
          {soldPlots} sold
        </span>
        <span className="text-slate-400 font-semibold">{pct}%</span>
        <span className="text-emerald-600 flex items-center gap-1">
          {activePlots} avail
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
        <div
          className="h-full bg-rose-400 transition-all duration-500 rounded-l-full"
          style={{ width: `${pct}%` }}
        />
        <div
          className="h-full bg-emerald-400 transition-all duration-500 rounded-r-full"
          style={{ width: `${100 - pct}%` }}
        />
      </div>
      {/* Total label */}
      <div className="text-[10px] text-slate-400 font-semibold text-center">
        {soldPlots} / {totalPlots} plots sold
      </div>
    </div>
  );
}

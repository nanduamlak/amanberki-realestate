"use client";
import React, { useState, useMemo, use } from "react";
import { useRole } from "@/lib/RoleContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePlotStore, BLANK_PLOT, HOUSE_TYPES, DEED_STATUSES, CONSTRUCTION_STATUSES, PLOT_AMENITIES, type PlotDetail } from "@/lib/usePlotStore";

import { usePropertyStore } from "@/lib/usePropertyStore";
import type { PaymentRecord } from "@/lib/data/properties";
import { Plus, Pencil, Trash2, X, Save, ArrowLeft, RotateCcw, BedDouble, Bath, Car, Home, ShieldCheck, Search, Filter, ExternalLink, DollarSign, CalendarClock, CheckCircle2, AlertCircle } from "lucide-react";

/* ── helpers ─────────────────────────────────────────────── */
const INPUT = "w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0086D1]/25 focus:border-[#0086D1] transition-all font-medium text-slate-900 placeholder:text-slate-400";
const CHK = "w-4 h-4 accent-[#0086D1] cursor-pointer";

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">{label}</label>
      {children}
    </div>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input type="checkbox" className={CHK} checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </label>
  );
}

/* ── delete confirm ─────────────────────────────────────── */
function DeleteModal({ label, onConfirm, onClose }: { label: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      style={{ background: "rgba(10,18,30,.65)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-3"><Trash2 size={22} className="text-rose-600" /></div>
        <h3 className="font-extrabold text-slate-900 text-center mb-1">Delete Plot?</h3>
        <p className="text-sm text-slate-500 text-center mb-5"><strong>{label}</strong> will be removed.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 shadow">Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ══ MAIN PAGE ══════════════════════════════════════════════ */
export default function PlotManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isSuperAdmin, isAdmin, isLoading } = useRole();
  const router = useRouter();
  const { plots, ready, add, update, remove, reset } = usePlotStore(id);
  const { list: propertyList } = usePropertyStore();
  const property = propertyList.find(p => p.id === id);

  const [formTarget, setFormTarget]   = useState<PlotDetail | null>(null);
  const [isNew, setIsNew]             = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch]               = useState("");
  const [deedFilter, setDeedFilter]         = useState("all");
  const [constFilter, setConstFilter]       = useState("all");
  const [contractorFilter, setContractorFilter] = useState("all");
  const [houseFilter, setHouseFilter]       = useState("all");

  // ── Derive unique filter options from actual plot data ──────
  // This guarantees the dropdowns always reflect what's in the DB
  const deedOptions = useMemo(() => {
    const vals = new Set<string>();
    plots.forEach(p => { if (p.titleDeedsStatus?.trim()) vals.add(p.titleDeedsStatus.trim()); });
    return Array.from(vals).sort();
  }, [plots]);

  const constOptions = useMemo(() => {
    const vals = new Set<string>();
    plots.forEach(p => { if (p.constructionStatus?.trim()) vals.add(p.constructionStatus.trim()); });
    return Array.from(vals).sort();
  }, [plots]);

  const contractorOptions = useMemo(() => {
    const vals = new Set<string>();
    plots.forEach(p => { if (p.contractorName?.trim()) vals.add(p.contractorName.trim()); });
    return Array.from(vals).sort();
  }, [plots]);

  const houseOptions = useMemo(() => {
    const vals = new Set<string>();
    plots.forEach(p => { if (p.houseType?.trim()) vals.add(p.houseType.trim()); });
    return Array.from(vals).sort();
  }, [plots]);

  // ── Filtered list ────────────────────────────────────────────
  const filtered = useMemo(() => {
    let data = [...plots];
    if (deedFilter       !== "all") data = data.filter(p => (p.titleDeedsStatus  ?? "").trim().toLowerCase() === deedFilter.toLowerCase());
    if (constFilter      !== "all") data = data.filter(p => (p.constructionStatus ?? "").trim().toLowerCase() === constFilter.toLowerCase());
    if (contractorFilter !== "all") data = data.filter(p => (p.contractorName    ?? "").trim().toLowerCase() === contractorFilter.toLowerCase());
    if (houseFilter      !== "all") data = data.filter(p => (p.houseType         ?? "").trim().toLowerCase() === houseFilter.toLowerCase());
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(p =>
        p.plotNumber.toLowerCase().includes(q) ||
        (p.purchaserName  ?? "").toLowerCase().includes(q) ||
        (p.contractorName ?? "").toLowerCase().includes(q) ||
        (p.houseType      ?? "").toLowerCase().includes(q) ||
        (p.constructionStatus ?? "").toLowerCase().includes(q)
      );
    }
    data.sort((a, b) => {
      const na = parseInt(a.plotNumber, 10);
      const nb = parseInt(b.plotNumber, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      if (!isNaN(na)) return -1;
      if (!isNaN(nb)) return 1;
      return a.plotNumber.localeCompare(b.plotNumber);
    });
    return data;
  }, [plots, search, deedFilter, constFilter, contractorFilter, houseFilter]);

  // ── Summary stats (always from full plots list, not filtered) ─
  // A plot is considered "sold" when the purchaser is a real buyer
  // (not the company itself, which owns unsold plots)
  const COMPANY_NAMES = ["tulu dimtu real estate", "tulu dimtu"];
  const isSold = (p: PlotDetail) => {
    const name = (p.purchaserName ?? "").trim().toLowerCase();
    return name !== "" && !COMPANY_NAMES.some(c => name.includes(c));
  };
  const stats = useMemo(() => ({
    total:      plots.length,
    sold:       plots.filter(isSold).length,
    available:  plots.filter(p => !isSold(p)).length,
    deedIssued: plots.filter(p => (p.titleDeedsStatus ?? "").trim().toUpperCase() === "ISSUED").length,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [plots]);

  const nextPlotNumber = () => {
    const nums = plots.map(p => parseInt(p.plotNumber) || 0);
    return String((nums.length ? Math.max(...nums) : 0) + 1);
  };

  const openAdd = () => { 
    setIsNew(true); 
    setFormTarget({ ...BLANK_PLOT, plotNumber: nextPlotNumber() }); 
  };
  
  const openEdit = (p: PlotDetail) => { 
    setIsNew(false); 
    setFormTarget({ ...p }); 
  };

  const handleSave = () => {
    if (!formTarget) return;
    if (isNew) add(formTarget); else update(formTarget.plotNumber, formTarget);
    setFormTarget(null);
  };

  const s = <K extends keyof PlotDetail>(k: K, v: PlotDetail[K]) => {
    if (!formTarget) return;
    setFormTarget(p => p ? ({ ...p, [k]: v }) : null);
  };

  const handlePaymentFieldChange = (idx: number, key: string, val: any) => {
    if (!formTarget) return;
    const ps = [...(formTarget.paymentSchedule || [])];
    const item = { ...ps[idx], [key]: val };

    if (!item.termType) item.termType = "one_term";

    const total      = Number(item.totalAmount)  || 0;
    const downPaid   = Number(item.downPayment)  || 0;
    // Installments = what still needs to be paid via terms
    const installments = Math.max(0, total - downPaid);

    if (item.termType === "one_term") {
      // Auto-set term amount to computed installment value
      if (key === "totalAmount" || key === "downPayment") {
        item.amount = installments;
      }

      const toBePaid = Number(item.amount) || 0;

      if (item.status === "paid") {
        item.remainingAmount = 0;
        item.paidAmount = toBePaid;
        if (!item.paidDate) {
          item.paidDate = new Date().toISOString().split("T")[0];
        }
      } else {
        item.remainingAmount = toBePaid;
        item.paidAmount = 0;
        item.paidDate = undefined;
      }
    } else {
      // two_term: split installments across terms
      if (key === "totalAmount" || key === "downPayment") {
        // Reset term1 to full installment; term2 auto-derives from amount
        item.amount = installments;
        item.amountTerm2 = 0;
      } else if (key === "amount") {
        const term1 = Number(item.amount) || 0;
        item.amountTerm2 = Math.max(0, installments - term1);
      }

      if (item.status === "paid" && !item.paidDate) {
        item.paidDate = new Date().toISOString().split("T")[0];
      } else if (item.status !== "paid") {
        item.paidDate = undefined;
      }

      if (item.statusTerm2 === "paid" && !item.paidDateTerm2) {
        item.paidDateTerm2 = new Date().toISOString().split("T")[0];
      } else if (item.statusTerm2 !== "paid") {
        item.paidDateTerm2 = undefined;
      }

      const t1Remaining = item.status === "paid" || item.status === "waived" ? 0 : (Number(item.amount) || 0);
      const t2Remaining = item.statusTerm2 === "paid" || item.statusTerm2 === "waived" ? 0 : (Number(item.amountTerm2) || 0);
      item.remainingAmount = t1Remaining + t2Remaining;

      const t1Paid = item.status === "paid" ? (Number(item.amount) || 0) : 0;
      const t2Paid = item.statusTerm2 === "paid" ? (Number(item.amountTerm2) || 0) : 0;
      item.paidAmount = t1Paid + t2Paid;
    }

    ps[idx] = item;
    s("paymentSchedule", ps);
  };

  const valid = formTarget ? (formTarget.plotNumber.trim() !== "" && parseFloat(String(formTarget.plotSize).split("+")[0]) > 0) : false;

  if (!isLoading && !isSuperAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50">
        <ShieldCheck size={32} className="text-rose-500" />
        <p className="font-bold text-slate-800">Access Denied</p>
        <button onClick={() => router.push("/properties")} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm">Back</button>
      </div>
    );
  }

  if (!isLoading && !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50">
        <p className="font-bold text-slate-800">Block <code>{id}</code> not found.</p>
        <button onClick={() => router.push("/properties")} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm">← Back</button>
      </div>
    );
  }

  // ── RENDER DETAILED EDIT PAGE VIEW ──
  if (formTarget) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
          
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-slate-200/60 pb-6">
            <button 
              onClick={() => setFormTarget(null)}
              className="h-10 w-10 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition-all shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Block {property?.blockNumber}
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {isNew ? "Add New Plot" : `Edit Plot #${formTarget.plotNumber}`}
              </h1>
            </div>
          </div>

          {/* Form Cards */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 space-y-6 shadow-sm">
            
            {/* Basic Info */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-[#0086D1] mb-4">Plot Specifications</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Plot Number *">
                  <input className={INPUT} value={formTarget.plotNumber} onChange={e => s("plotNumber", e.target.value)} placeholder="1" />
                </Field>
                <Field label="Plot Size (m²) *">
                  <input className={INPUT} type="number" value={formTarget.plotSize || ""} onChange={e => s("plotSize", Number(e.target.value))} placeholder="400" />
                </Field>
                <Field label="Built Area">
                  <input className={INPUT} value={formTarget.builtArea} onChange={e => s("builtArea", e.target.value)} placeholder="320 m²" />
                </Field>
              </div>
            </div>

            {/* Purchaser Info */}
            <div className="border-t border-slate-100 pt-6">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#0086D1] mb-4">Purchaser &amp; Group</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Purchaser Name">
                  <input className={INPUT} value={formTarget.purchaserName} onChange={e => s("purchaserName", e.target.value)} placeholder="Full name or company" />
                </Field>
                <Field label="Reference No">
                  <input className={INPUT} value={formTarget.referenceNo || ""} onChange={e => s("referenceNo", e.target.value)} placeholder="Ref-001" />
                </Field>
              </div>

              {/* Buyer Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Field label={<span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-orange-500"></span>Buyer Group <span className="text-[9px] text-slate-400 font-normal">(optional)</span></span>}>
                  <input
                    list="buyer-groups-list"
                    className={INPUT}
                    value={formTarget.buyerGroup ?? ""}
                    onChange={e => s("buyerGroup", e.target.value || null)}
                    placeholder="e.g. Panorama"
                  />
                  <datalist id="buyer-groups-list">
                    <option value="Panorama" />
                  </datalist>
                </Field>
                <Field label="Contractor Name">
                  <input className={INPUT} value={formTarget.contractorName || ""} onChange={e => s("contractorName", e.target.value)} placeholder="Contractor Ltd." />
                </Field>
              </div>
            </div>

            {/* Legal Status */}
            <div className="border-t border-slate-100 pt-6">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#0086D1] mb-4">Legal &amp; Construction Status</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Title Deeds Status">
                  <select className={INPUT} value={formTarget.titleDeedsStatus} onChange={e => s("titleDeedsStatus", e.target.value)}>
                    <option value="">— select —</option>
                    {DEED_STATUSES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Construction Status">
                  <select className={INPUT} value={formTarget.constructionStatus} onChange={e => s("constructionStatus", e.target.value)}>
                    {CONSTRUCTION_STATUSES.map(c => <option key={c} value={c}>{c || "— select —"}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* House Details */}
            <div className="border-t border-slate-100 pt-6">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#0086D1] mb-4">House / Unit Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <Field label="House Type">
                  <select className={INPUT} value={formTarget.houseType ?? ""} onChange={e => s("houseType", e.target.value)}>
                    <option value="">— select —</option>
                    {HOUSE_TYPES.map(h => <option key={h}>{h}</option>)}
                  </select>
                </Field>
                <Field label="Floors">
                  <input 
                    className={INPUT} 
                    type="number" 
                    min="0"
                    value={formTarget.floors ?? ""} 
                    onChange={e => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      s("floors", val !== undefined ? Math.max(0, val) : undefined);
                    }} 
                    placeholder="2" 
                  />
                </Field>
                <Field label="Year Built">
                  <input 
                    className={INPUT} 
                    type="number" 
                    min="0"
                    value={formTarget.yearBuilt ?? ""} 
                    onChange={e => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      s("yearBuilt", val !== undefined ? Math.max(0, val) : undefined);
                    }} 
                    placeholder="2024" 
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {([
                  ["bedrooms", "Bedrooms"], ["bathrooms", "Bathrooms"],
                  ["livingRooms", "Living Rooms"], ["kitchen", "Kitchen"],
                  ["dining", "Dining"], ["garage", "Garage / Parking"],
                ] as [keyof PlotDetail, string][]).map(([k, lbl]) => (
                  <Field key={k} label={lbl}>
                    <input className={INPUT} type="number" min="0"
                      value={(formTarget[k] as number | undefined) ?? ""}
                      onChange={e => s(k, e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0" />
                  </Field>
                ))}
              </div>

              <Field label="Orientation">
                <input className={INPUT} value={formTarget.orientation ?? ""} onChange={e => s("orientation", e.target.value)} placeholder="e.g. North-East Facing" />
              </Field>

              {/* Checkboxes */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <CheckField label="Has Balcony" checked={!!formTarget.balcony} onChange={v => s("balcony", v)} />
                <CheckField label="Has Garden" checked={!!formTarget.garden} onChange={v => s("garden", v)} />
                <CheckField label="Has Rooftop Access" checked={!!formTarget.rooftop} onChange={v => s("rooftop", v)} />
              </div>
            </div>

            {/* Remarks */}
            <div className="border-t border-slate-100 pt-6">
              <Field label="Remarks &amp; Notes">
                <textarea rows={3} className={INPUT} value={formTarget.remark || ""} onChange={e => s("remark", e.target.value)} placeholder="Enter details..." />
              </Field>
            </div>

            {/* Amenities */}
            <div className="border-t border-slate-100 pt-6">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#0086D1] mb-3">Property Amenities</p>
              <p className="text-xs text-slate-400 mb-4">Select which amenities apply to this plot</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PLOT_AMENITIES.map(amenity => {
                  const checked = (formTarget.amenities ?? []).includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => {
                        const current = formTarget.amenities ?? [];
                        const next = checked
                          ? current.filter(a => a !== amenity)
                          : [...current, amenity];
                        s("amenities", next);
                      }}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all select-none ${
                        checked
                          ? "border-[#0086D1] bg-[#0086D1]/8 text-[#0086D1]"
                          : "border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                        checked ? "bg-[#0086D1] border-[#0086D1]" : "bg-white border-slate-300"
                      }`}>
                        {checked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Payment Schedule Card */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-[#0086D1]">Payment Schedule</p>
                <p className="text-xs text-slate-500 mt-0.5">Specify payment installments and due dates</p>
              </div>
              <button 
                onClick={() => {
                  const ps = [...(formTarget.paymentSchedule || [])];
                  ps.push({ 
                    id: `pay-${Date.now()}`,
                    description: `Installment ${ps.length + 1}`,
                    currency: "ETB", 
                    amount: 0, 
                    status: "pending", 
                    dueDate: new Date().toISOString().split("T")[0] 
                  });
                  s("paymentSchedule", ps);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50/50 font-bold text-xs hover:bg-indigo-50 transition-all"
              >
                <Plus size={14} /> Add Payment
              </button>
            </div>

            {/* List */}
            <div className="space-y-4">
              {formTarget.paymentSchedule?.map((pay, idx) => (
                <div key={idx} className="relative p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  {/* Delete payment button */}
                  <button 
                    onClick={() => {
                      const ps = formTarget.paymentSchedule!.filter((_, i) => i !== idx);
                      s("paymentSchedule", ps);
                    }}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pr-6">
                    <Field label="Currency *">
                      <input className={INPUT + " py-1.5 text-xs font-bold"} value={pay.currency || "ETB"}
                        onChange={e => handlePaymentFieldChange(idx, "currency", e.target.value)} />
                    </Field>
                    <Field label="Term Config *">
                      <select className={INPUT + " py-1.5 text-xs font-semibold"} value={pay.termType || "one_term"}
                        onChange={e => handlePaymentFieldChange(idx, "termType", e.target.value)}>
                        <option value="one_term">One Term</option>
                        <option value="two_term">Two Terms (Split)</option>
                      </select>
                    </Field>
                    <Field label="Total Agreement Value *">
                      <input className={INPUT + " py-1.5 text-xs font-extrabold text-slate-900"} type="number" value={pay.totalAmount ?? ""}
                        onChange={e => handlePaymentFieldChange(idx, "totalAmount", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="e.g. 2500000" />
                    </Field>
                    <Field label="Paid Amount">
                      <input
                        className={INPUT + " py-1.5 text-xs font-bold text-emerald-700 border-emerald-200 focus:border-emerald-400"}
                        type="number"
                        value={pay.downPayment ?? ""}
                        onChange={e => handlePaymentFieldChange(idx, "downPayment", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="0"
                      />
                    </Field>
                  </div>

                  {/* Installment summary bar */}
                  {(pay.totalAmount ?? 0) > 0 && (
                    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
                      <span className="text-slate-500">Agreement:</span>
                      <span className="font-extrabold text-slate-800">{pay.currency} {(pay.totalAmount ?? 0).toLocaleString()}</span>
                      <span className="text-slate-300">−</span>
                      <span className="text-slate-500">Paid:</span>
                      <span className="font-extrabold text-emerald-700">{pay.currency} {(pay.downPayment ?? 0).toLocaleString()}</span>
                      <span className="text-slate-300">=</span>
                      <span className="text-slate-500">Installments:</span>
                      <span className="font-extrabold text-[#0086D1]">
                        {pay.currency} {Math.max(0, (pay.totalAmount ?? 0) - (pay.downPayment ?? 0)).toLocaleString()}
                      </span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <span className="text-slate-400">Remaining:</span>
                        <span className="font-extrabold text-rose-600">{pay.currency} {(pay.remainingAmount ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Conditional Terms Rendering */}
                  {pay.termType === "two_term" ? (
                    <div className="space-y-4 pt-3 border-t border-dashed border-slate-200">
                      {/* Term 1 Box */}
                      <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-3 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#0086D1]">1st Installment (Term 1)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Field label="Amount to be Paid *">
                            <input className={INPUT + " py-1.5 text-xs"} type="number" value={pay.amount ?? ""}
                              onChange={e => handlePaymentFieldChange(idx, "amount", e.target.value ? Number(e.target.value) : undefined)}
                              placeholder="Amount" />
                          </Field>
                          <Field label="Due Date *">
                            <input className={INPUT + " py-1.5 text-xs"} type="date" value={pay.dueDate}
                              onChange={e => handlePaymentFieldChange(idx, "dueDate", e.target.value)} />
                          </Field>
                          <Field label="Status *">
                            <select className={INPUT + " py-1.5 text-xs font-semibold"} value={pay.status}
                              onChange={e => handlePaymentFieldChange(idx, "status", e.target.value)}>
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="overdue">Overdue</option>
                              <option value="waived">Waived</option>
                            </select>
                          </Field>
                        </div>
                        {pay.status === "paid" && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Field label="Paid Date">
                              <input className={INPUT + " py-1.5 text-xs"} type="date" value={pay.paidDate || ""}
                                onChange={e => handlePaymentFieldChange(idx, "paidDate", e.target.value)} />
                            </Field>
                          </div>
                        )}
                      </div>

                      {/* Term 2 Box */}
                      <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-3 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider text-purple-600">2nd Installment (Term 2)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount to be Paid *</label>
                            <div className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center justify-between">
                              <span>{(pay.amountTerm2 || 0).toLocaleString()}</span>
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Auto</span>
                            </div>
                          </div>
                          <Field label="Due Date *">
                            <input className={INPUT + " py-1.5 text-xs"} type="date" value={pay.dueDateTerm2 || ""}
                              onChange={e => handlePaymentFieldChange(idx, "dueDateTerm2", e.target.value)} />
                          </Field>
                          <Field label="Status *">
                            <select className={INPUT + " py-1.5 text-xs font-semibold"} value={pay.statusTerm2 || "pending"}
                              onChange={e => handlePaymentFieldChange(idx, "statusTerm2", e.target.value)}>
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="overdue">Overdue</option>
                              <option value="waived">Waived</option>
                            </select>
                          </Field>
                        </div>
                        {pay.statusTerm2 === "paid" && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Field label="Paid Date">
                              <input className={INPUT + " py-1.5 text-xs"} type="date" value={pay.paidDateTerm2 || ""}
                                onChange={e => handlePaymentFieldChange(idx, "paidDateTerm2", e.target.value)} />
                            </Field>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* One Term Box */
                    <div className="pt-3 border-t border-dashed border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Field label="Amount to be Paid *">
                          <input className={INPUT + " py-1.5 text-xs"} type="number" value={pay.amount ?? ""}
                            onChange={e => handlePaymentFieldChange(idx, "amount", e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Amount" />
                        </Field>
                        <Field label="Due Date *">
                          <input className={INPUT + " py-1.5 text-xs"} type="date" value={pay.dueDate}
                            onChange={e => handlePaymentFieldChange(idx, "dueDate", e.target.value)} />
                        </Field>
                        <Field label="Status *">
                          <select className={INPUT + " py-1.5 text-xs font-semibold"} value={pay.status}
                            onChange={e => handlePaymentFieldChange(idx, "status", e.target.value)}>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                            <option value="waived">Waived</option>
                          </select>
                        </Field>
                      </div>
                      {pay.status === "paid" && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Field label="Paid Date">
                            <input className={INPUT + " py-1.5 text-xs"} type="date" value={pay.paidDate || ""}
                              onChange={e => handlePaymentFieldChange(idx, "paidDate", e.target.value)} />
                          </Field>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {(!formTarget.paymentSchedule || formTarget.paymentSchedule.length === 0) && (
                <div className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-2 bg-slate-50/50">
                  <DollarSign size={18} className="text-slate-300" />
                  No payments scheduled. Click Add Payment to create one.
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button 
              onClick={() => setFormTarget(null)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-all bg-white"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={!valid}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0086D1] text-white font-bold text-sm hover:bg-[#006eb0] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <Save size={15} />
              {isNew ? "Add Plot" : "Save Changes"}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ── RENDER LIST VIEW ──
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <button onClick={() => router.push("/properties")}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold text-sm mb-3 transition-colors">
              <ArrowLeft size={14} /> Back to Properties
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0086D1]/10 flex items-center justify-center shrink-0">
                <Home size={22} className="text-[#0086D1]" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Block {property?.blockNumber} — Plot Management</h1>
                <p className="text-sm text-slate-500">{id} · {property?.zone} · {property?.noOfPlots} defined plots</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* <button onClick={() => { if (confirm("Reset plots to original seed data?")) reset(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-white transition-all">
              <RotateCcw size={14} /> Reset
            </button> */}
            <button onClick={openAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0086D1] text-white font-bold text-sm hover:bg-[#006eb0] transition-all shadow-md">
              <Plus size={16} /> Add Plot
            </button>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Plots", value: stats.total,      color: "bg-white border-slate-200 text-slate-900" },
            { label: "Sold",        value: stats.sold,        color: "bg-[#0086D1]/5 border-[#0086D1]/20 text-[#0086D1]" },
            { label: "Available",   value: stats.available,   color: "bg-amber-50 border-amber-200 text-amber-700" },
            { label: "Deed Issued", value: stats.deedIssued,  color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.color}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{s.label}</p>
              <p className="text-2xl font-black mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── FILTER TOOLBAR ── */}
        <div className="flex flex-wrap gap-2 p-3 bg-white rounded-2xl border border-slate-200/60 shadow-sm items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search plot #, purchaser, contractor…"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0086D1]/20 transition-all border border-transparent focus:border-[#0086D1]/30" />
          </div>

          {/* Deed status */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <ShieldCheck size={12} className="text-slate-400" />
            <select value={deedFilter} onChange={e => setDeedFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer">
              <option value="all">All Deeds</option>
              {deedOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Construction stage */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <Filter size={12} className="text-slate-400" />
            <select value={constFilter} onChange={e => setConstFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer">
              <option value="all">All Stages</option>
              {constOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Contractor */}
          {contractorOptions.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              <Home size={12} className="text-slate-400" />
              <select value={contractorFilter} onChange={e => setContractorFilter(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer">
                <option value="all">All Contractors</option>
                {contractorOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* House type — hidden if no data */}
          {houseOptions.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              <Home size={12} className="text-slate-400" />
              <select value={houseFilter} onChange={e => setHouseFilter(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer">
                <option value="all">All Types</option>
                {houseOptions.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          )}

          {(search || deedFilter !== "all" || constFilter !== "all" || contractorFilter !== "all" || houseFilter !== "all") && (
            <button onClick={() => { setSearch(""); setDeedFilter("all"); setConstFilter("all"); setContractorFilter("all"); setHouseFilter("all"); }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 font-bold text-xs hover:bg-rose-100 transition-all">
              <X size={11} /> Clear
            </button>
          )}
          <span className="ml-auto text-xs font-bold text-slate-400">{filtered.length} / {plots.length}</span>
        </div>

        {/* ── TABLE ── */}
        {!ready ? (
          <div className="py-16 text-center text-slate-400 font-semibold text-sm">Loading plots…</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-4 py-3 text-left w-14">Plot ID</th>
                    <th className="px-4 py-3 text-right w-20">Size m²</th>
                    <th className="px-4 py-3 text-right w-24">Built Area</th>
                    <th className="px-4 py-3 text-left">Purchaser</th>
                    <th className="px-4 py-3 text-left">Contractor</th>
                    <th className="px-4 py-3 text-left">Construction Status</th>
                    <th className="px-4 py-3 text-left">Title Deeds Status</th>
                    <th className="px-4 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center"><Home size={20} className="text-slate-300" /></div>
                        <p className="font-bold text-slate-500">{plots.length === 0 ? "No plots yet" : "No plots match your filters"}</p>
                        {plots.length > 0 && <button onClick={() => { setSearch(""); setDeedFilter("all"); setConstFilter("all"); setContractorFilter("all"); setHouseFilter("all"); }} className="text-xs font-bold text-[#0086D1] hover:underline">Clear filters</button>}
                        {plots.length === 0 && <button onClick={openAdd} className="px-4 py-2 bg-[#0086D1] text-white rounded-xl font-bold text-sm">Add First Plot</button>}
                      </div>
                    </td></tr>
                  )}
                  {filtered.map(p => (
                    <tr key={p.plotNumber} className="hover:bg-[#0086D1]/3 transition-colors border-b border-slate-50 last:border-0">
                      <td className="px-4 py-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0086D1]/10 flex items-center justify-center font-black text-[#0086D1]">{p.plotNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-700">{p.plotSize || "—"} <span className="text-[10px] text-slate-400">m²</span></td>
                      <td className="px-4 py-3 text-right text-slate-500 font-medium">{p.builtArea || <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 max-w-[160px] truncate">{p.purchaserName || <span className="text-slate-300 italic text-xs">Unassigned</span>}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium max-w-[140px] truncate">{p.contractorName || <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap text-sm">{p.constructionStatus || <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3">
                        {p.titleDeedsStatus?.trim() ? (() => {
                          const ds = p.titleDeedsStatus.trim().toUpperCase();
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              ds === "ISSUED"     ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              ds === "PENDING"    ? "bg-amber-50 text-amber-700 border-amber-200" :
                              ds === "NOT ISSUED" ? "bg-rose-50 text-rose-600 border-rose-200" :
                              "bg-slate-100 text-slate-500 border-slate-200"}`}>
                              {ds === "ISSUED" && <ShieldCheck size={10} />}{p.titleDeedsStatus.trim()}
                            </span>
                          );
                        })() : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/property/${id}?plot=${p.plotNumber}`} title="View Detail"
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wide transition-all">
                            <ExternalLink size={11} /> View
                          </Link>
                          <button onClick={() => openEdit(p)} title="Edit"
                            className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-all border border-amber-100">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(p.plotNumber)} title="Delete"
                            className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all border border-rose-100">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">{filtered.length} of {plots.length} plots · {id}</span>
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteModal
          label={`Plot #${deleteTarget}`}
          onConfirm={() => { remove(deleteTarget); setDeleteTarget(null); }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

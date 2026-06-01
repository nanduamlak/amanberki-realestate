"use client";
import { useState, useMemo, use } from "react";
import { useRole } from "@/lib/RoleContext";
import { useRouter } from "next/navigation";
import { usePlotStore, BLANK_PLOT, HOUSE_TYPES, DEED_STATUSES, CONSTRUCTION_STATUSES, type PlotDetail } from "@/lib/usePlotStore";
import { usePropertyStore } from "@/lib/usePropertyStore";
import type { PaymentRecord } from "@/lib/data/properties";
import { Plus, Pencil, Trash2, X, Save, ArrowLeft, RotateCcw, BedDouble, Bath, Car, Home, ShieldCheck, Search, Filter, ExternalLink, DollarSign, CalendarClock, CheckCircle2, AlertCircle } from "lucide-react";

/* ── helpers ─────────────────────────────────────────────── */
const INPUT = "w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0086D1]/25 focus:border-[#0086D1] transition-all font-medium text-slate-900 placeholder:text-slate-400";
const CHK = "w-4 h-4 accent-[#0086D1] cursor-pointer";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
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

/* ── form modal ──────────────────────────────────────────── */
function PlotFormModal({ initial, isNew, onSave, onClose }: {
  initial: PlotDetail; isNew: boolean;
  onSave: (p: PlotDetail) => void; onClose: () => void;
}) {
  const [f, setF] = useState<PlotDetail>(initial);
  const s = <K extends keyof PlotDetail>(k: K, v: PlotDetail[K]) => setF(p => ({ ...p, [k]: v }));
  const valid = f.plotNumber.trim() !== "" && f.plotSize > 0;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(10,18,30,.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{ animation: "pmIn .2s ease" }} onClick={e => e.stopPropagation()}>
        <style>{`@keyframes pmIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}`}</style>

        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <h2 className="font-extrabold text-slate-900">{isNew ? "Add Plot" : `Edit Plot #${f.plotNumber}`}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"><X size={14} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Basic */}
          <p className="text-[10px] font-black uppercase tracking-widest text-[#0086D1]">Plot Information</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Plot Number *">
              <input className={INPUT} value={f.plotNumber} onChange={e => s("plotNumber", e.target.value)} placeholder="1" />
            </Field>
            <Field label="Plot Size (m²) *">
              <input className={INPUT} type="number" value={f.plotSize || ""} onChange={e => s("plotSize", Number(e.target.value))} placeholder="400" />
            </Field>
            <Field label="Built Area">
              <input className={INPUT} value={f.builtArea} onChange={e => s("builtArea", e.target.value)} placeholder="320 m²" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Purchaser Name">
              <input className={INPUT} value={f.purchaserName} onChange={e => s("purchaserName", e.target.value)} placeholder="Full name or company" />
            </Field>
            <Field label="Reference No">
              <input className={INPUT} value={f.referenceNo || ""} onChange={e => s("referenceNo", e.target.value)} placeholder="Ref-001" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Title Deeds Status">
              <select className={INPUT} value={f.titleDeedsStatus} onChange={e => s("titleDeedsStatus", e.target.value)}>
                <option value="">— select —</option>
                {DEED_STATUSES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Contractor Name">
              <input className={INPUT} value={f.contractorName || ""} onChange={e => s("contractorName", e.target.value)} placeholder="Contractor Ltd." />
            </Field>
          </div>

          <Field label="Construction Status">
            <select className={INPUT} value={f.constructionStatus} onChange={e => s("constructionStatus", e.target.value)}>
              {CONSTRUCTION_STATUSES.map(c => <option key={c} value={c}>{c || "— select —"}</option>)}
            </select>
          </Field>

          {/* House */}
          <p className="text-[10px] font-black uppercase tracking-widest text-[#0086D1] pt-2 border-t border-slate-100">House / Unit Details</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="House Type">
              <select className={INPUT} value={f.houseType ?? ""} onChange={e => s("houseType", e.target.value)}>
                <option value="">— select —</option>
                {HOUSE_TYPES.map(h => <option key={h}>{h}</option>)}
              </select>
            </Field>
            <Field label="Floors">
              <input className={INPUT} type="number" value={f.floors ?? ""} onChange={e => s("floors", e.target.value ? Number(e.target.value) : undefined)} placeholder="2" />
            </Field>
            <Field label="Year Built">
              <input className={INPUT} type="number" value={f.yearBuilt ?? ""} onChange={e => s("yearBuilt", e.target.value ? Number(e.target.value) : undefined)} placeholder="2024" />
            </Field>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {([
              ["bedrooms", "Bedrooms"], ["bathrooms", "Bathrooms"],
              ["livingRooms", "Living Rooms"], ["kitchen", "Kitchen"],
              ["dining", "Dining"], ["garage", "Garage / Parking"],
            ] as [keyof PlotDetail, string][]).map(([k, lbl]) => (
              <Field key={k} label={lbl}>
                <input className={INPUT} type="number" min="0"
                  value={(f[k] as number | undefined) ?? ""}
                  onChange={e => s(k, e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="0" />
              </Field>
            ))}
          </div>

          <Field label="Orientation">
            <input className={INPUT} value={f.orientation ?? ""} onChange={e => s("orientation", e.target.value)} placeholder="e.g. North-East Facing" />
          </Field>

          <div className="flex flex-wrap gap-6">
            <CheckField label="Balcony" checked={!!f.balcony} onChange={v => s("balcony", v)} />
            <CheckField label="Garden" checked={!!f.garden} onChange={v => s("garden", v)} />
            <CheckField label="Rooftop" checked={!!f.rooftop} onChange={v => s("rooftop", v)} />
          </div>

          {/* Ownership History */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#0086D1]">Ownership History</p>
            <button type="button" onClick={() => {
              const h = f.ownershipHistory || [];
              s("ownershipHistory", [...h, { ownerName: "", transferDate: "", status: "Previous", notes: "" }]);
            }} className="text-[#0086D1] text-xs font-bold flex items-center gap-1 hover:underline">
              <Plus size={12} /> Add Record
            </button>
          </div>
          
          <div className="space-y-3">
            {(f.ownershipHistory || []).map((hist, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl relative">
                <button type="button" onClick={() => {
                  const h = [...(f.ownershipHistory || [])];
                  h.splice(idx, 1);
                  s("ownershipHistory", h);
                }} className="absolute top-2 right-2 text-rose-400 hover:text-rose-600 p-1"><Trash2 size={14}/></button>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 pr-6">
                  <Field label="Owner Name">
                    <input className={INPUT + " py-1.5 text-xs"} value={hist.ownerName} onChange={e => {
                      const h = [...(f.ownershipHistory || [])];
                      h[idx] = { ...h[idx], ownerName: e.target.value };
                      s("ownershipHistory", h);
                    }} placeholder="Name" />
                  </Field>
                  <Field label="Transfer Date">
                    <input className={INPUT + " py-1.5 text-xs"} type="date" value={hist.transferDate} onChange={e => {
                      const h = [...(f.ownershipHistory || [])];
                      h[idx] = { ...h[idx], transferDate: e.target.value };
                      s("ownershipHistory", h);
                    }} />
                  </Field>
                  <Field label="Status">
                    <select className={INPUT + " py-1.5 text-xs"} value={hist.status} onChange={e => {
                      const h = [...(f.ownershipHistory || [])];
                      h[idx] = { ...h[idx], status: e.target.value as "Current" | "Previous" };
                      s("ownershipHistory", h);
                    }}>
                      <option value="Current">Current</option>
                      <option value="Previous">Previous</option>
                    </select>
                  </Field>
                </div>
                <Field label="Notes">
                  <input className={INPUT + " py-1.5 text-xs"} value={hist.notes || ""} onChange={e => {
                    const h = [...(f.ownershipHistory || [])];
                    h[idx] = { ...h[idx], notes: e.target.value };
                    s("ownershipHistory", h);
                  }} placeholder="Optional note" />
                </Field>
              </div>
            ))}
            {(!f.ownershipHistory || f.ownershipHistory.length === 0) && (
              <div className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-xl">
                No history records. Click Add Record to insert one.
              </div>
            )}
          </div>

          {/* Notes */}
          <p className="text-[10px] font-black uppercase tracking-widest text-[#0086D1] pt-2 border-t border-slate-100">Notes</p>
          <Field label="Remark">
            <textarea className={INPUT + " resize-none"} rows={2} value={f.remark} onChange={e => s("remark", e.target.value)} placeholder="Any internal note…" />
          </Field>

          {/* Payment Schedule */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5">
              <DollarSign size={12} /> Payment Schedule
            </p>
            <button type="button" onClick={() => {
              const ps = f.paymentSchedule || [];
              const newId = `pay-${Date.now()}`;
              s("paymentSchedule", [...ps, {
                id: newId,
                description: "",
                amount: 0,
                currency: "ETB" as const,
                dueDate: "",
                status: "pending" as const,
                notes: "",
              }]);
            }} className="text-emerald-600 text-xs font-bold flex items-center gap-1 hover:underline">
              <Plus size={12} /> Add Payment
            </button>
          </div>

          <div className="space-y-3">
            {(f.paymentSchedule || []).map((pay, idx) => {
              const daysLeft = pay.dueDate
                ? Math.round((new Date(pay.dueDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000)
                : null;
              const isOverdue = daysLeft !== null && daysLeft < 0 && pay.status === "pending";
              return (
                <div key={pay.id} className={`p-3.5 rounded-xl border relative ${
                  pay.status === "paid" ? "bg-emerald-50 border-emerald-100" :
                  isOverdue ? "bg-red-50 border-red-200" :
                  "bg-slate-50 border-slate-100"
                }`}>
                  {/* Status indicator */}
                  <div className="flex items-center justify-between mb-3 pr-6">
                    <div className="flex items-center gap-2">
                      {pay.status === "paid"
                        ? <CheckCircle2 size={14} className="text-emerald-500" />
                        : isOverdue
                          ? <AlertCircle size={14} className="text-red-500" />
                          : <CalendarClock size={14} className="text-amber-500" />
                      }
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        pay.status === "paid" ? "text-emerald-600" :
                        isOverdue ? "text-red-600" : "text-amber-600"
                      }`}>
                        {pay.status === "paid" ? "Paid" : isOverdue ? `Overdue by ${Math.abs(daysLeft!)}d` : daysLeft !== null ? `${daysLeft}d remaining` : "No date set"}
                      </span>
                    </div>
                    <button type="button" onClick={() => {
                      const ps = [...(f.paymentSchedule || [])];
                      ps.splice(idx, 1);
                      s("paymentSchedule", ps);
                    }} className="absolute top-2.5 right-2.5 text-rose-400 hover:text-rose-600 p-1"><Trash2 size={13}/></button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <Field label="Description">
                      <input className={INPUT + " py-1.5 text-xs"} value={pay.description}
                        onChange={e => { const ps = [...(f.paymentSchedule || [])]; ps[idx] = {...ps[idx], description: e.target.value}; s("paymentSchedule", ps); }}
                        placeholder="Down Payment / Installment 2…" />
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Amount">
                        <input className={INPUT + " py-1.5 text-xs"} type="number" value={pay.amount || ""}
                          onChange={e => { const ps = [...(f.paymentSchedule || [])]; ps[idx] = {...ps[idx], amount: Number(e.target.value)}; s("paymentSchedule", ps); }}
                          placeholder="0" />
                      </Field>
                      <Field label="Currency">
                        <select className={INPUT + " py-1.5 text-xs"} value={pay.currency}
                          onChange={e => { const ps = [...(f.paymentSchedule || [])]; ps[idx] = {...ps[idx], currency: e.target.value as "ETB"|"USD"}; s("paymentSchedule", ps); }}>
                          <option value="ETB">ETB</option>
                          <option value="USD">USD</option>
                        </select>
                      </Field>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Due Date">
                      <input className={INPUT + " py-1.5 text-xs"} type="date" value={pay.dueDate}
                        onChange={e => { const ps = [...(f.paymentSchedule || [])]; ps[idx] = {...ps[idx], dueDate: e.target.value}; s("paymentSchedule", ps); }} />
                    </Field>
                    <Field label="Status">
                      <select className={INPUT + " py-1.5 text-xs"} value={pay.status}
                        onChange={e => { const ps = [...(f.paymentSchedule || [])]; ps[idx] = {...ps[idx], status: e.target.value as PaymentRecord["status"]}; s("paymentSchedule", ps); }}>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="waived">Waived</option>
                      </select>
                    </Field>
                  </div>

                  {pay.dueDate && pay.status === "paid" && (
                    <div className="mt-3">
                      <Field label="Paid Date">
                        <input className={INPUT + " py-1.5 text-xs"} type="date" value={pay.paidDate || ""}
                          onChange={e => { const ps = [...(f.paymentSchedule || [])]; ps[idx] = {...ps[idx], paidDate: e.target.value}; s("paymentSchedule", ps); }} />
                      </Field>
                    </div>
                  )}
                </div>
              );
            })}
            {(!f.paymentSchedule || f.paymentSchedule.length === 0) && (
              <div className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-2">
                <DollarSign size={18} className="text-slate-300" />
                No payments scheduled. Click Add Payment to create one.
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <button onClick={onClose} className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-all">Cancel</button>
          <button onClick={() => valid && onSave(f)} disabled={!valid}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0086D1] text-white font-bold text-sm hover:bg-[#006eb0] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow">
            <Save size={14} />{isNew ? "Add Plot" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
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
  const [search, setSearch]           = useState("");
  const [deedFilter, setDeedFilter]   = useState("all");
  const [constFilter, setConstFilter] = useState("all");
  const [houseFilter, setHouseFilter] = useState("all");

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

  const nextPlotNumber = () => {
    const nums = plots.map(p => parseInt(p.plotNumber) || 0);
    return String((nums.length ? Math.max(...nums) : 0) + 1);
  };

  const openAdd = () => { setIsNew(true); setFormTarget({ ...BLANK_PLOT, plotNumber: nextPlotNumber() }); };
  const openEdit = (p: PlotDetail) => { setIsNew(false); setFormTarget({ ...p }); };

  const handleSave = (p: PlotDetail) => {
    if (isNew) add(p); else update(p.plotNumber, p);
    setFormTarget(null);
  };

  /* summary stats */
  const stats = useMemo(() => ({
    total: plots.length,
    withBuyer: plots.filter(p => p.purchaserName).length,
    deedIssued: plots.filter(p => p.titleDeedsStatus === "issued").length,
    built: plots.filter(p => p.constructionStatus && !["", "Bare Land"].includes(p.constructionStatus)).length,
  }), [plots]);

  const filtered = useMemo(() => {
    let data = [...plots];
    if (deedFilter  !== "all") data = data.filter(p => p.titleDeedsStatus === deedFilter);
    if (constFilter !== "all") data = data.filter(p => p.constructionStatus === constFilter);
    if (houseFilter !== "all") data = data.filter(p => p.houseType === houseFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(p =>
        p.plotNumber.includes(q) ||
        p.purchaserName.toLowerCase().includes(q) ||
        (p.houseType ?? "").toLowerCase().includes(q) ||
        (p.constructionStatus ?? "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [plots, search, deedFilter, constFilter, houseFilter]);

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
            <button onClick={() => { if (confirm("Reset plots to original seed data?")) reset(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-white transition-all">
              <RotateCcw size={14} /> Reset
            </button>
            <button onClick={openAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0086D1] text-white font-bold text-sm hover:bg-[#006eb0] transition-all shadow-md">
              <Plus size={16} /> Add Plot
            </button>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Plots", value: stats.total, color: "bg-white border-slate-200 text-slate-900" },
            { label: "With Purchaser", value: stats.withBuyer, color: "bg-[#0086D1]/5 border-[#0086D1]/20 text-[#0086D1]" },
            { label: "Deed Issued", value: stats.deedIssued, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
            { label: "Under Const.", value: stats.built, color: "bg-violet-50 border-violet-200 text-violet-700" },
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
              placeholder="Search plot #, purchaser, type…"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0086D1]/20 transition-all border border-transparent focus:border-[#0086D1]/30" />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <ShieldCheck size={12} className="text-slate-400" />
            <select value={deedFilter} onChange={e => setDeedFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer">
              <option value="all">All Deeds</option>
              {DEED_STATUSES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <Filter size={12} className="text-slate-400" />
            <select value={constFilter} onChange={e => setConstFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer">
              <option value="all">All Stages</option>
              {CONSTRUCTION_STATUSES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <Home size={12} className="text-slate-400" />
            <select value={houseFilter} onChange={e => setHouseFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer">
              <option value="all">All Types</option>
              {HOUSE_TYPES.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          {(search || deedFilter !== "all" || constFilter !== "all" || houseFilter !== "all") && (
            <button onClick={() => { setSearch(""); setDeedFilter("all"); setConstFilter("all"); setHouseFilter("all"); }}
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
                    <th className="px-4 py-3 text-left w-14">Plot #</th>
                    <th className="px-4 py-3 text-right w-20">Size m²</th>
                    <th className="px-4 py-3 text-right w-24">Built Area</th>
                    <th className="px-4 py-3 text-left">Purchaser</th>
                    <th className="px-4 py-3 text-left">Title Deed</th>
                    <th className="px-4 py-3 text-left">Construction</th>
                    <th className="px-4 py-3 text-left hidden lg:table-cell">House Type</th>
                    <th className="px-4 py-3 text-center hidden lg:table-cell">Beds</th>
                    <th className="px-4 py-3 text-center hidden lg:table-cell">Baths</th>
                    <th className="px-4 py-3 text-center hidden lg:table-cell">Garage</th>
                    <th className="px-4 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 && (
                    <tr><td colSpan={11} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center"><Home size={20} className="text-slate-300" /></div>
                        <p className="font-bold text-slate-500">{plots.length === 0 ? "No plots yet" : "No plots match your filters"}</p>
                        {plots.length > 0 && <button onClick={() => { setSearch(""); setDeedFilter("all"); setConstFilter("all"); setHouseFilter("all"); }} className="text-xs font-bold text-[#0086D1] hover:underline">Clear filters</button>}
                        {plots.length === 0 && <button onClick={openAdd} className="px-4 py-2 bg-[#0086D1] text-white rounded-xl font-bold text-sm">Add First Plot</button>}
                      </div>
                    </td></tr>
                  )}
                  {filtered.map(p => (
                    <tr key={p.plotNumber} className="hover:bg-[#0086D1]/3 transition-colors border-b border-slate-50 last:border-0">
                      <td className="px-4 py-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0086D1]/10 flex items-center justify-center font-black text-[#0086D1]">{p.plotNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-700">{p.plotSize.toLocaleString()} <span className="text-[10px] text-slate-400">m²</span></td>
                      <td className="px-4 py-3 text-right text-slate-500 font-medium">{p.builtArea || <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 max-w-[160px] truncate">{p.purchaserName || <span className="text-slate-300 italic text-xs">Unassigned</span>}</td>
                      <td className="px-4 py-3">
                        {p.titleDeedsStatus ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            p.titleDeedsStatus === "issued"  ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            p.titleDeedsStatus === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-slate-100 text-slate-500 border-slate-200"}`}>
                            {p.titleDeedsStatus === "issued" && <ShieldCheck size={10} />}{p.titleDeedsStatus}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap text-sm">{p.constructionStatus || <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {p.houseType ? <span className="flex items-center gap-1 text-slate-600 font-semibold"><Home size={13} className="text-[#0086D1]" />{p.houseType}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {p.bedrooms != null ? <span className="flex items-center justify-center gap-1 font-bold text-slate-700"><BedDouble size={12} className="text-indigo-400" />{p.bedrooms}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {p.bathrooms != null ? <span className="flex items-center justify-center gap-1 font-bold text-slate-700"><Bath size={12} className="text-cyan-400" />{p.bathrooms}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {p.garage != null ? <span className="flex items-center justify-center gap-1 font-bold text-slate-700"><Car size={12} className="text-slate-400" />{p.garage}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      {/* Always-visible actions */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <a href={`/property/${id}?plot=${p.plotNumber}`} title="View Detail"
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wide transition-all">
                            <ExternalLink size={11} /> View
                          </a>
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
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Demo · localStorage
              </span>
            </div>
          </div>
        )}
      </div>

      {formTarget && (
        <PlotFormModal initial={formTarget} isNew={isNew} onSave={handleSave} onClose={() => setFormTarget(null)} />
      )}
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

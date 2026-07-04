"use client";
import { formatPriceRange } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useState, useEffect } from "react";
import Image from "next/image";
import { usePropertyStore } from "@/lib/usePropertyStore";
import { usePlotStore } from "@/lib/usePlotStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Square,
  Layers,
  MapPin,
  CheckCircle2,
  Phone,
  Mail,
  Bell,
  ClipboardList,
  Map,
  X,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Video,
  Ruler,
  Building2,
  BedDouble,
  Bath,
  Car,
  Utensils,
  Sofa,
  Trees,
  Compass,
  CalendarDays,
  Home,
  User,
  FileText,
  HardHat,
  ShieldCheck,
  Star,
  Share2,
  Download,
  Briefcase,
  Hash,
  History,
  DollarSign,
  AlertCircle,
  Sofa as SofaIcon,
  Utensils as UtensilsIcon,
  Compass as CompassIcon,
  CalendarDays as CalendarDaysIcon,
  Clock,
  ShieldAlert,
  MapPin as MapPinIcon,
  CheckCircle2 as CheckCircle2Icon
} from "lucide-react";
import Link from "next/link";
import type { PlotDetail } from "@/lib/data/properties";

const CONSTRUCTION_STAGES = [
  "Land Survey",
  "Foundation",
  "Blockwork",
  "Roofing",
  "Plastering",
  "Finishing",
  "Handed Over",
];

function getStageIndex(status: string): number {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("survey")) return 0;
  if (s.includes("foundation") || s.includes("footing")) return 1;
  if (s.includes("block")) return 2;
  if (s.includes("roof")) return 3;
  if (s.includes("plaster")) return 4;
  if (s.includes("finish") || s.includes("complet")) return 5;
  if (s.includes("hand") || s.includes("occupi") || s.includes("carried")) return 6;
  return -1;
}

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  sold: "Sold",
  reserved: "Reserved",
  "under-construction": "Under Construction",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  available: "default",
  sold: "destructive",
  reserved: "secondary",
  "under-construction": "outline",
};

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  // Live store — single source of truth from PostgreSQL
  const { list: propertyList, ready: propReady } = usePropertyStore();
  const property = propertyList.find(p => p.id === id) ?? null;

  // Live plot store — overrides per-plot details edited in /properties/[id]/plots
  const { plots: livePlots, ready: plotsReady } = usePlotStore(id);

  const [selectedPlot, setSelectedPlot] = useState<PlotDetail | null>(null);
  const searchParams = useSearchParams();

  // Auto-open detail view when ?plot= is present in the URL
  useEffect(() => {
    const plotParam = searchParams.get("plot");
    if (!plotParam || !plotsReady) return;
    const target = livePlots.find(p => p.plotNumber === plotParam);
    if (target) {
      Promise.resolve().then(() => {
        setSelectedPlot(target);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, plotsReady, livePlots]);

  // Load saved hotspot polygons from localStorage (same source as Site Map page)
  const [hotspots, setHotspots] = useState<{ id: number; points: { x: number; y: number }[] }[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem("estate_hotspots_poly");
    if (saved) {
      try { setHotspots(JSON.parse(saved)); } catch { }
    }
  }, []);

  // Wait for stores to hydrate before rendering (avoids flash of stale data)
  if (!propReady || !plotsReady) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 font-semibold">Loading…</div>;
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-secondary/30">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <p className="text-muted-foreground">Property not found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  // ── RENDER DETAILED PLOT VIEW INSTEAD OF POPUP ──
  if (selectedPlot) {
    const stageIdx = getStageIndex(selectedPlot.constructionStatus);
    
    // Payment aggregation
    const paymentSchedule = selectedPlot.paymentSchedule || [];
    const totalPayment = paymentSchedule.reduce((s, p) => s + (p.totalAmount ?? p.amount), 0);
    const paidPayment  = paymentSchedule.reduce((s, p) => s + (p.paidAmount ?? (p.status === "paid" ? p.amount : 0)), 0);
    const overduePayments = paymentSchedule.filter(p => {
      const d = p.dueDate ? Math.round((new Date(p.dueDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000) : null;
      return p.status === "pending" && d !== null && d < 0;
    });
    const paymentPct = totalPayment > 0 ? Math.round((paidPayment / totalPayment) * 100) : 0;
    const currency = paymentSchedule[0]?.currency ?? "ETB";

    return (
      <div className="min-h-screen bg-[#f8fafc] text-foreground pb-20">
        
        {/* Sticky Detail Header */}
        <div className="bg-white border-b border-slate-200/60 sticky top-0 z-30 px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push(`/properties/${id}/plots`)}
                className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition-all shrink-0"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
                    Plot Detail
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Block {property.blockNumber} · {property.zone}
                  </span>
                </div>
                <h1 className="text-xl font-black text-slate-900 leading-tight mt-1">Plot #{selectedPlot.plotNumber} Specifications</h1>
              </div>
            </div>
            
            <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${selectedPlot.constructionStatus?.toLowerCase().includes("occupi") || selectedPlot.constructionStatus?.toLowerCase().includes("carried")
              ? "bg-emerald-100 text-emerald-700"
              : selectedPlot.constructionStatus
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-500"
              }`}>
              {selectedPlot.constructionStatus || "Bare Land"}
            </span>
          </div>
        </div>

        {/* Detail Content */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 columns: specifications */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Key Specs Grid */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Layers size={16} className="text-indigo-600" /> Key Metrics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: <Ruler size={16} className="text-[#0086D1]" />, label: "Plot Size", value: selectedPlot.plotSize ? `${selectedPlot.plotSize} m²` : "—" },
                    { icon: <Building2 size={16} className="text-violet-500" />, label: "Built Area", value: selectedPlot.builtArea || "—" },
                    { icon: <Square size={16} className="text-emerald-500" />, label: "Land Area", value: selectedPlot.plotSize ? `${selectedPlot.plotSize} m²` : "—" },
                    { icon: <CalendarDays size={16} className="text-amber-500" />, label: "Zone", value: property?.zone?.replace("Zone ", "") ?? "—" },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-slate-500">{s.icon}<span className="text-[10px] font-bold uppercase tracking-wider">{s.label}</span></div>
                      <p className="text-sm font-extrabold text-slate-900">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal & documentation rows */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600" /> Legal &amp; Documentation Details
                </h3>
                <div className="rounded-xl border border-slate-150 overflow-hidden divide-y divide-slate-100">
                  {[
                    { icon: <FileText size={14} />, label: "Title Deeds Status", value: selectedPlot.titleDeedsStatus || "Not Issued" },
                    { icon: <ShieldCheck size={14} />, label: "Construction Status", value: selectedPlot.constructionStatus || "Bare Land" },
                    { icon: <Briefcase size={14} />, label: "Contractor Name", value: selectedPlot.contractorName || "—" },
                    { icon: <Hash size={14} />, label: "Reference No", value: selectedPlot.referenceNo || "—" },
                    { icon: <HardHat size={14} />, label: "Plot Number Identification", value: `Plot ${selectedPlot.plotNumber}` },
                    { icon: <Layers size={14} />, label: "Zone Classification", value: property?.zone ?? "—" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                        {row.icon}{row.label}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Construction timeline */}
              {selectedPlot.constructionStatus && (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                    <HardHat size={16} className="text-indigo-600" /> Construction Milestone Tracker
                  </h3>
                  <div className="relative pt-4">
                    {/* Track */}
                    <div className="absolute top-[30px] left-0 right-0 h-0.5 bg-slate-200" />
                    <div
                      className="absolute top-[30px] left-0 h-0.5 bg-[#0086D1] transition-all duration-700"
                      style={{ width: stageIdx >= 0 ? `${(stageIdx / (CONSTRUCTION_STAGES.length - 1)) * 100}%` : "0%" }}
                    />
                    <div className="relative flex justify-between">
                      {CONSTRUCTION_STAGES.map((stage, i) => (
                        <div key={stage} className="flex flex-col items-center gap-1.5" style={{ width: `${100 / CONSTRUCTION_STAGES.length}%` }}>
                          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center z-10 transition-all ${i <= stageIdx ? "border-[#0086D1] bg-[#0086D1] text-white" : "border-slate-300 bg-white text-slate-400"
                            }`}>
                            {i <= stageIdx ? <CheckCircle2 size={12} /> : <span className="text-[9px] font-black">{i + 1}</span>}
                          </div>
                          <span className={`text-[8px] font-bold text-center leading-tight ${i <= stageIdx ? "text-[#0086D1]" : "text-slate-400"}`}>
                            {stage}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* House/Unit Details */}
              {(selectedPlot.bedrooms || selectedPlot.houseType || selectedPlot.floors) && (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Home size={16} className="text-indigo-600" /> House &amp; Structural Details
                  </h3>
                  
                  {/* Hero specs summary */}
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#0086D1]/8 to-violet-500/5 border border-[#0086D1]/15 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-[#0086D1]/10 flex items-center justify-center shrink-0">
                      <Home size={18} className="text-[#0086D1]" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900">{selectedPlot.houseType ?? "Residential Unit"}</p>
                      <p className="text-xs text-slate-500">{selectedPlot.floors ? `${selectedPlot.floors} Storey${selectedPlot.floors > 1 ? "s" : ""}` : ""}{selectedPlot.yearBuilt ? ` · Built ${selectedPlot.yearBuilt}` : ""}</p>
                    </div>
                    {selectedPlot.orientation && (
                      <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-500 bg-white border border-slate-100 px-2.5 py-1 rounded-full shadow-sm">
                        <Compass size={11} className="text-[#0086D1]" />{selectedPlot.orientation}
                      </span>
                    )}
                  </div>

                  {/* Room counters grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: <BedDouble size={16} className="text-indigo-500" />, label: "Bedrooms", value: selectedPlot.bedrooms },
                      { icon: <Bath size={16} className="text-cyan-500" />, label: "Bathrooms", value: selectedPlot.bathrooms },
                      { icon: <Sofa size={16} className="text-violet-500" />, label: "Living Rooms", value: selectedPlot.livingRooms },
                      { icon: <Utensils size={16} className="text-amber-500" />, label: "Kitchen", value: selectedPlot.kitchen },
                      { icon: <Utensils size={16} className="text-orange-400" />, label: "Dining", value: selectedPlot.dining },
                      { icon: <Car size={16} className="text-slate-500" />, label: "Garage / Park", value: selectedPlot.garage },
                    ].filter(s => s.value !== undefined && s.value !== null).map(s => (
                      <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center gap-1 text-center">
                        {s.icon}
                        <span className="text-lg font-black text-slate-900">{s.value}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Features badges */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedPlot.balcony && <span className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 border border-sky-100 text-sky-700 rounded-full text-[10px] font-semibold"><CheckCircle2 size={11} />Balcony</span>}
                    {selectedPlot.garden && <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold"><Trees size={11} />Garden</span>}
                    {selectedPlot.rooftop && <span className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 border border-violet-100 text-violet-700 rounded-full text-[10px] font-semibold"><Building2 size={11} />Rooftop</span>}
                  </div>
                </div>
              )}

              {/* Amenities */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Star size={16} className="text-indigo-600" /> Property Amenities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {["Road Access", "Water Supply", "Electricity Grid", "Compound Wall", "Security Gate", "Green Belt"].map(a => (
                    <span key={a} className="flex items-center gap-1 px-2.5 py-1 bg-[#0086D1]/8 border border-[#0086D1]/20 text-[#0086D1] rounded-full text-xs font-semibold">
                      <CheckCircle2 size={11} />{a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              {selectedPlot.remark && (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                    <ClipboardList size={16} className="text-indigo-600" /> Notes &amp; Remarks
                  </h3>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-900 leading-relaxed font-semibold flex gap-2">
                    <span className="mt-0.5 shrink-0">💬</span>
                    <span>{selectedPlot.remark}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Right column: Purchaser + Payments */}
            <div className="space-y-8">
              
              {/* Purchaser Details Card */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                  <User size={16} className="text-indigo-600" /> Purchaser Info
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0086D1]/10 flex items-center justify-center shrink-0">
                    <User size={18} className="text-[#0086D1]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate leading-snug">
                      {selectedPlot.purchaserName || "Available — No Buyer Yet"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Owner of Record</p>
                  </div>
                </div>
                {selectedPlot.titleDeedsStatus && (
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                      <ShieldCheck size={12} /> Deeds: {selectedPlot.titleDeedsStatus}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Schedule Card */}
              {paymentSchedule.length > 0 && (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-5">
                  <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                    <DollarSign size={16} className="text-indigo-600" /> Payment Schedule
                  </h3>

                  {/* Summary Bar */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-slate-50 border border-emerald-100 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Total Value</span>
                      <span className="text-xs font-black text-slate-800">{currency} {totalPayment.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Paid Amount</span>
                      <span className="text-xs font-black text-emerald-600">{paymentPct}% ({currency} {paidPayment.toLocaleString()})</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${paymentPct}%` }} />
                    </div>
                    {overduePayments.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-3 text-[10px] font-black text-red-600 uppercase tracking-wide">
                        <AlertCircle size={12} />
                        {overduePayments.length} Overdue Installment{overduePayments.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>

                  {/* Milestones list */}
                  <div className="space-y-4">
                    {paymentSchedule.map((pay, idx) => {
                      const isTwoTerm = pay.termType === "two_term";
                      const daysLeft = pay.dueDate
                        ? Math.round((new Date(pay.dueDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000)
                        : null;
                      const isOverdue = pay.status === "pending" && daysLeft !== null && daysLeft < 0;
                      const dayLabel = pay.status === "paid"
                        ? pay.paidDate ? `Paid ${new Date(pay.paidDate).toLocaleDateString("en-GB")}` : "Paid"
                        : daysLeft === null ? "No date set"
                        : daysLeft === 0 ? "Due today"
                        : isOverdue ? `Overdue by ${Math.abs(daysLeft)}d`
                        : `${daysLeft}d remaining`;

                      const daysLeftT2 = pay.dueDateTerm2
                        ? Math.round((new Date(pay.dueDateTerm2).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000)
                        : null;
                      const isOverdueT2 = pay.statusTerm2 === "pending" && daysLeftT2 !== null && daysLeftT2 < 0;
                      const dayLabelT2 = pay.statusTerm2 === "paid"
                        ? pay.paidDateTerm2 ? `Paid ${new Date(pay.paidDateTerm2).toLocaleDateString("en-GB")}` : "Paid"
                        : daysLeftT2 === null ? "No date set"
                        : daysLeftT2 === 0 ? "Due today"
                        : isOverdueT2 ? `Overdue by ${Math.abs(daysLeftT2)}d`
                        : `${daysLeftT2}d remaining`;

                      const TermBadge = ({ status, overdue }: { status: string; overdue: boolean }) => (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          overdue ? "bg-red-50 text-red-700 border-red-100" :
                          status === "waived" ? "bg-slate-100 text-slate-400 border-slate-200" :
                          "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
                          {status}
                        </span>
                      );

                      return (
                        <div key={idx} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div>
                              <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                                {isTwoTerm ? "Two Terms Split" : "Single Term"}
                              </p>
                              <h4 className="text-xs font-bold text-slate-900 mt-0.5">{pay.description || `Milestone ${idx + 1}`}</h4>
                            </div>
                            <span className="text-[11px] font-black text-slate-800">{pay.currency} {(pay.totalAmount ?? pay.amount).toLocaleString()}</span>
                          </div>

                          {isTwoTerm ? (
                            <div className="space-y-3">
                              {/* Term 1 */}
                              <div className="flex items-center justify-between text-xs">
                                <div>
                                  <p className="text-[8px] font-black uppercase text-[#0086D1]">1st Installment</p>
                                  <p className="font-bold text-slate-700 mt-0.5">{pay.currency} {pay.amount.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                  <TermBadge status={pay.status} overdue={isOverdue} />
                                  <p className="text-[8px] text-slate-400 font-semibold mt-1">{dayLabel}</p>
                                </div>
                              </div>
                              {/* Term 2 */}
                              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                                <div>
                                  <p className="text-[8px] font-black uppercase text-purple-600">2nd Installment</p>
                                  <p className="font-bold text-slate-700 mt-0.5">{pay.currency} {(pay.amountTerm2 ?? 0).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                  <TermBadge status={pay.statusTerm2 || "pending"} overdue={isOverdueT2} />
                                  <p className="text-[8px] text-slate-400 font-semibold mt-1">{dayLabelT2}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-xs">
                              <div>
                                <p className="text-[8px] font-black uppercase text-slate-400">Installment Amount</p>
                                <p className="font-bold text-slate-700 mt-0.5">{pay.currency} {pay.amount.toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <TermBadge status={pay.status} overdue={isOverdue} />
                                <p className="text-[8px] text-slate-400 font-semibold mt-1">{dayLabel}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── RENDER STANDARD BLOCK DETAILS VIEW ──
  const pricePerSqm = Math.round(property.price / property.area);

  return (
    <div className="min-h-screen bg-slate-50 text-foreground pb-20">

      {/* Hero Banner */}
      <div className="relative bg-white border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline mb-6"
            >
              ← Back
            </button>
            <div className="mb-4">
              <Badge variant={STATUS_VARIANTS[property.status]} className="text-sm px-3 py-1 uppercase tracking-wider font-bold">
                {STATUS_LABELS[property.status]}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">
              Block {property.blockNumber} <span className="text-slate-400 font-light">|</span> {property.noOfPlots} Plots
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5 capitalize text-slate-700">
                <Map size={16} /> {property.primaryPlots}
              </span>
              <span>•</span>
              <span>{property.zone}</span>
              <span>•</span>
              <span>{property.area} m²</span>
            </div>
          </div>

          <div className="md:text-right">
            <p className="text-sm font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Listed Price</p>
            <div className="text-3xl font-extrabold text-primary">
              {formatPriceRange(property.price, property.priceMax)}
            </div>
            {property.priceMax && property.priceMax !== property.price && (
              <p className="text-xs text-slate-400 mt-1 font-medium">Price range per plot</p>
            )}
          </div>
        </div>
      </div>

      {/* Detail Layout */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Key Facts */}
          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <ClipboardList className="text-primary" /> Property Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Plots</p>
                  <p className="text-2xl font-bold flex items-center gap-2"><Map size={20} className="text-muted-foreground" /> {property.noOfPlots}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Plots</p>
                  <p className="text-2xl font-bold flex items-center gap-2"><CheckCircle2Icon size={20} className="text-muted-foreground" /> {property.activePlots}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Area</p>
                  <p className="text-2xl font-bold flex items-center gap-2"><Square size={20} className="text-muted-foreground" /> {property.area} <span className="text-sm font-normal">m²</span></p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Plot Size</p>
                  <p className="text-2xl font-bold flex items-center gap-2"><Layers size={20} className="text-muted-foreground" /> {property.plotSize} <span className="text-sm font-normal">m²</span></p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Buffer Plots</p>
                  <p className="text-2xl font-bold mt-1">{property.noOfBufferPlots}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Sold Plots</p>
                  <p className="text-2xl font-bold mt-1 text-rose-600">{property.soldPlots}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <MapPinIcon className="text-primary" /> Description
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 leading-relaxed space-y-4">
              <p>{property.description}</p>
              <p>Located in the prestigious <strong className="text-slate-900 font-semibold">{property.zone}</strong> of Aman Berki Estates, Block {property.blockNumber} offers a perfect blend of modern architecture and comfortable living.</p>
            </CardContent>
          </Card>

          {/* Remarks */}
          {property.remark && (
            <Card className="shadow-sm border-border border-amber-200">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-amber-700">
                  <ClipboardList className="text-amber-600" /> Remarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-amber-50 p-4 rounded-xl text-amber-900 font-medium">
                  {property.remark}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plot Details — reads from live store */}
          {(() => {
            const displayPlots = livePlots;
            if (displayPlots.length === 0) return null;
            return (
              <Card className="shadow-sm border-border">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Map size={20} className="text-primary" /> Individual Plots
                    <span className="ml-auto text-[10px] font-bold text-slate-400 normal-case">{displayPlots.length} plots</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {displayPlots.map((plot) => (
                      <button
                        key={plot.plotNumber}
                        onClick={() => setSelectedPlot(plot as PlotDetail)}
                        className="bg-slate-50 border border-slate-200 p-4 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left flex flex-col justify-center items-center gap-1 group"
                      >
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider group-hover:text-primary transition-colors">Plot</span>
                        <span className="text-2xl font-black text-slate-900">{plot.plotNumber}</span>
                        <span className="text-xs text-slate-400 font-medium">{plot.plotSize} m²</span>
                        {plot.purchaserName && (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full truncate max-w-full">Sold</span>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Nearby Blocks */}
          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Map className="text-primary" /> Nearby Blocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {[property.blockNumber - 2, property.blockNumber - 1, property.blockNumber + 1, property.blockNumber + 2]
                  .filter((n) => n >= 1 && n <= 44 && n !== property.blockNumber)
                  .map((n) => {
                    const nearId = `BLOCK-${n.toString().padStart(3, "0")}`;
                    return (
                      <Button key={n} variant="outline" onClick={() => router.push(`/property/${nearId}`)}>
                        Block {n} →
                      </Button>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          <Card className="shadow-lg border-primary/20 bg-white">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Listed Value</p>
                <p className="text-4xl font-extrabold text-primary mb-1">
                  {property.price > 0 ? `${formatPriceRange(property.price, property.priceMax)}` : "Unlisted"}
                </p>
                {property.price > 0 && <p className="text-sm text-slate-500">${pricePerSqm.toLocaleString()} per m²</p>}
              </div>

              <div className="space-y-3 mb-8">
                {property.status === "available" && (
                  <>
                    <Button className="w-full text-base py-6 shadow-md"><Phone className="mr-2 h-5 w-5" /> Schedule Viewing</Button>
                    <Button variant="outline" className="w-full text-base py-6"><Mail className="mr-2 h-5 w-5" /> Send Inquiry</Button>
                  </>
                )}
                {property.status !== "available" && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-2.5 text-xs text-amber-900 font-semibold leading-relaxed">
                    <span className="mt-0.5 shrink-0">ℹ️</span>
                    <span>This block has active purchase reservations or is under construction development. Contact us for direct resale options.</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h4 className="font-extrabold text-slate-900 text-sm">Site Features</h4>
                <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
                  <li className="flex items-center gap-2"><CheckCircle2Icon size={14} className="text-primary shrink-0" /> Gated Community Compound</li>
                  <li className="flex items-center gap-2"><CheckCircle2Icon size={14} className="text-primary shrink-0" /> 24/7 Professional Security Patrol</li>
                  <li className="flex items-center gap-2"><CheckCircle2Icon size={14} className="text-primary shrink-0" /> Full Utility Connections</li>
                  <li className="flex items-center gap-2"><CheckCircle2Icon size={14} className="text-primary shrink-0" /> High Resale Appreciation</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

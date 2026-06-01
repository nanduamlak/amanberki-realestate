"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useState, useEffect } from "react";
import Image from "next/image";
import { usePropertyStore } from "@/lib/usePropertyStore";
import { usePlotStore } from "@/lib/usePlotStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
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
} from "lucide-react";
import Link from "next/link";
import type { PlotDetail } from "@/lib/data/properties";

// Mock media assets — replace with real URLs from your storage
const PLOT_IMAGES = [
  "/photo_2026-04-10_14-23-37.webp",
  "/photo_2025-10-23_10-45-31 (2).jpg",
];

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
  const [mediaTab, setMediaTab] = useState<"photos" | "video">("photos");
  const [activeImg, setActiveImg] = useState(0);
  const searchParams = useSearchParams();

  // Auto-open modal when ?plot= is present in the URL
  useEffect(() => {
    const plotParam = searchParams.get("plot");
    if (!plotParam || !plotsReady) return;
    const target = livePlots.find(p => p.plotNumber === plotParam);
    if (target) setSelectedPlot(target);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, plotsReady, livePlots]);

  // Load saved hotspot polygons from localStorage (same source as Site Map page)
  const [hotspots, setHotspots] = useState<{ id: number; points: { x: number; y: number }[] }[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem("estate_hotspots_poly");
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
            <div className="text-4xl font-extrabold text-primary">${property.price.toLocaleString()}</div>
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
                  <p className="text-2xl font-bold flex items-center gap-2"><CheckCircle2 size={20} className="text-muted-foreground" /> {property.activePlots}</p>
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
                  <p className="text-2xl font-bold flex items-center gap-2 mt-1">
                    {property.noOfBufferPlots}
                  </p>
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
                <MapPin className="text-primary" /> Description
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

          {/* Plot Details — reads from live store (reflects edits from /properties/[id]/plots) */}
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
          {/* <Card className="shadow-lg border-primary/20 bg-white">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Listed Value</p>
                <p className="text-4xl font-extrabold text-primary mb-1">
                  {property.price > 0 ? `$${property.price.toLocaleString()}` : "Unlisted"}
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
                {property.status === "reserved" && (
                  <Button variant="secondary" className="w-full text-base py-6"><ClipboardList className="mr-2 h-5 w-5" /> Join Waitlist</Button>
                )}
                {property.status === "sold" && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center font-semibold border border-red-100">
                    This property has been sold.
                  </div>
                )}
                {property.status === "under-construction" && (
                  <Button className="w-full text-base py-6"><Bell className="mr-2 h-5 w-5" /> Notify When Ready</Button>
                )}
              </div>

              <div className="space-y-4 pt-6 border-t border-border">
                <h3 className="font-semibold text-slate-900">Property Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between pb-2 border-b border-slate-100"><span className="text-muted-foreground">Block ID</span><span className="font-semibold text-slate-900">{property.id}</span></div>
                  <div className="flex justify-between pb-2 border-b border-slate-100"><span className="text-muted-foreground">Plots</span><span className="font-semibold text-slate-900">{property.primaryPlots}</span></div>
                  <div className="flex justify-between pb-2 border-b border-slate-100"><span className="text-muted-foreground">Zone</span><span className="font-semibold text-slate-900">{property.zone}</span></div>
                  <div className="flex justify-between pb-2"><span className="text-muted-foreground">Area</span><span className="font-semibold text-slate-900">{property.area} m²</span></div>
                </div>
              </div>
            </CardContent>
          </Card> */}

          <Card className="shadow-sm border-border overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MapPin size={14} className="text-primary" /> Site Location Map
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Aerial map with the current block highlighted, all others dimmed */}
              <div
                className="relative w-full cursor-pointer group"
                onClick={() => router.push("/")}
                title="View full master plan"
              >
                <Image
                  src="/photo_2025-10-23_10-45-31 (2).jpg"
                  alt="Site Map"
                  width={800}
                  height={450}
                  className="w-full h-auto block"
                  draggable={false}
                />

                {/* SVG polygon overlay */}
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full"
                >
                  {hotspots.map((hs) => {
                    const isSelected = hs.id === property.blockNumber;
                    const pts = hs.points.map((p) => `${p.x},${p.y}`).join(" ");
                    if (isSelected) {
                      return (
                        <g key={hs.id}>
                          {/* Highlight ring */}
                          <polygon
                            points={pts}
                            fill="rgba(0,134,209,0.35)"
                            stroke="#0086D1"
                            strokeWidth={0.5}
                          />
                        </g>
                      );
                    }
                    return (
                      <polygon
                        key={hs.id}
                        points={pts}
                        fill="rgba(0,0,0,0.45)"
                        stroke="transparent"
                        strokeWidth={0}
                      />
                    );
                  })}
                </svg>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                  <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    View Full Master Plan →
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-3 text-xs font-semibold text-slate-600">
                <span className="inline-block w-3 h-3 rounded-sm bg-[#0086D1]/60 border border-[#0086D1]" />
                Block {property.blockNumber} — Selected
                <span className="ml-auto text-slate-400 font-medium">All others dimmed</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


      {/* ── PLOT DETAIL MODAL ────────────────────────────────────────────── */}
      {selectedPlot && (() => {
        const stageIdx = getStageIndex(selectedPlot.constructionStatus);
        return (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6"
            style={{ background: "rgba(10,18,30,0.65)", backdropFilter: "blur(6px)" }}
            onClick={() => setSelectedPlot(null)}
          >
            {/* Modal card */}
            <div
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
              style={{ animation: "modalIn .22s cubic-bezier(.4,0,.2,1)" }}
              onClick={e => e.stopPropagation()}
            >
              <style>{`
                @keyframes modalIn { from { opacity:0; transform:scale(.95) translateY(16px); } to { opacity:1; transform:none; } }
              `}</style>

              {/* ── MEDIA GALLERY ── */}
              <div className="relative w-full bg-slate-900 shrink-0" style={{ height: 240 }}>
                {/* Tab switcher */}
                <div className="absolute top-3 left-3 z-10 flex gap-1.5">
                  <button
                    onClick={() => setMediaTab("photos")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${mediaTab === "photos" ? "bg-white text-slate-900 shadow" : "bg-black/40 text-white"}`}
                  ><ImageIcon size={12} /> Photos</button>
                  <button
                    onClick={() => setMediaTab("video")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${mediaTab === "video" ? "bg-white text-slate-900 shadow" : "bg-black/40 text-white"}`}
                  ><Video size={12} /> Video Tour</button>
                </div>

                {/* Close btn */}
                <button
                  onClick={() => setSelectedPlot(null)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all"
                ><X size={16} /></button>

                {mediaTab === "photos" ? (
                  <>
                    <Image
                      src={PLOT_IMAGES[activeImg]}
                      alt={`Plot ${selectedPlot.plotNumber}`}
                      fill
                      className="object-cover"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Prev / Next */}
                    {PLOT_IMAGES.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveImg(i => (i - 1 + PLOT_IMAGES.length) % PLOT_IMAGES.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
                        ><ChevronLeft size={16} /></button>
                        <button
                          onClick={() => setActiveImg(i => (i + 1) % PLOT_IMAGES.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
                        ><ChevronRight size={16} /></button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {PLOT_IMAGES.map((_, i) => (
                            <button key={i} onClick={() => setActiveImg(i)}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImg ? "bg-white scale-125" : "bg-white/50"}`}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Plot # badge */}
                    <div className="absolute bottom-4 left-4 text-white">
                      <span className="text-xs font-semibold opacity-70 uppercase tracking-widest">Plot</span>
                      <div className="text-3xl font-black leading-none">#{selectedPlot.plotNumber}</div>
                    </div>

                    {/* Action icons */}
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button className="w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-all" title="Share"><Share2 size={14} /></button>
                      <button className="w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-all" title="Download"><Download size={14} /></button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
                      <Video size={28} className="text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">Video tour coming soon</p>
                    <p className="text-xs text-slate-600">Contact us to schedule a live walkthrough</p>
                  </div>
                )}
              </div>

              {/* ── SCROLLABLE BODY ── */}
              <div className="flex-1 overflow-y-auto">

                {/* Header row */}
                <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Plot {selectedPlot.plotNumber} — Full Details</h2>
                    <p className="text-sm text-slate-500 mt-0.5 font-medium">Block {property?.blockNumber} · {property?.zone}</p>
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

                {/* ── KEY STATS GRID ── */}
                <div className="px-6 pb-4">
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

                {/* ── OWNERSHIP TIMELINE ── */}
                <div className="px-6 pb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <History size={14} /> Ownership History
                  </h3>
                  
                  {selectedPlot.ownershipHistory && selectedPlot.ownershipHistory.length > 0 ? (
                    <div className="relative border-l-2 border-slate-100 ml-4 space-y-6">
                      {selectedPlot.ownershipHistory.map((hist, idx) => (
                        <div key={idx} className="relative pl-6">
                          {/* Timeline Dot */}
                          <div className={`absolute -left-[9px] top-2 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                            hist.status === "Current" ? "bg-[#0086D1]" : "bg-slate-300"
                          }`}>
                            {hist.status === "Current" && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                          </div>
                          
                          {/* Content */}
                          <div className={`p-4 rounded-xl border ${
                            hist.status === "Current" ? "bg-blue-50/50 border-blue-100" : "bg-slate-50 border-slate-100"
                          }`}>
                            <div className="flex items-start justify-between gap-4 mb-1">
                              <div>
                                <p className="font-bold text-slate-900">{hist.ownerName}</p>
                                <p className="text-xs text-slate-500 font-medium">{hist.status} Owner</p>
                              </div>
                              <span className="shrink-0 text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md shadow-sm border border-slate-100">
                                {hist.transferDate}
                              </span>
                            </div>
                            {hist.notes && (
                              <p className="text-sm text-slate-600 mt-2 bg-white/60 p-2.5 rounded-lg border border-slate-100/50">
                                {hist.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Fallback to simple view if no history array exists */
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0086D1]/10 flex items-center justify-center shrink-0">
                        <User size={18} className="text-[#0086D1]" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{selectedPlot.purchaserName || "Available — No Buyer Yet"}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Purchaser of Record</p>
                      </div>
                      {selectedPlot.titleDeedsStatus && (
                        <span className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          <ShieldCheck size={12} />{selectedPlot.titleDeedsStatus}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* ── LEGAL DETAILS ── */}
                <div className="px-6 pb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Legal & Documentation</h3>
                  <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                    {[
                      { icon: <FileText size={14} />, label: "Title Deeds Status", value: selectedPlot.titleDeedsStatus || "Not Issued" },
                      { icon: <ShieldCheck size={14} />, label: "Construction Status", value: selectedPlot.constructionStatus || "Bare Land" },
                      { icon: <Briefcase size={14} />, label: "Contractor Name", value: selectedPlot.contractorName || "—" },
                      { icon: <Hash size={14} />, label: "Reference No", value: selectedPlot.referenceNo || "—" },
                      { icon: <HardHat size={14} />, label: "Plot Number", value: `Plot ${selectedPlot.plotNumber}` },
                      { icon: <Layers size={14} />, label: "Zone Classification", value: property?.zone ?? "—" },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                          {row.icon}{row.label}
                        </div>
                        <span className="text-sm font-bold text-slate-800">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── CONSTRUCTION TIMELINE ── */}
                {selectedPlot.constructionStatus && (
                  <div className="px-6 pb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Construction Progress</h3>
                    <div className="relative">
                      {/* Track */}
                      <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-slate-200" />
                      <div
                        className="absolute top-3.5 left-0 h-0.5 bg-[#0086D1] transition-all duration-700"
                        style={{ width: stageIdx >= 0 ? `${(stageIdx / (CONSTRUCTION_STAGES.length - 1)) * 100}%` : "0%" }}
                      />
                      <div className="relative flex justify-between">
                        {CONSTRUCTION_STAGES.map((stage, i) => (
                          <div key={stage} className="flex flex-col items-center gap-1.5" style={{ width: `${100 / CONSTRUCTION_STAGES.length}%` }}>
                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center z-10 transition-all ${i <= stageIdx ? "border-[#0086D1] bg-[#0086D1] text-white" : "border-slate-300 bg-white text-slate-400"
                              }`}>
                              {i <= stageIdx ? <CheckCircle2 size={14} /> : <span className="text-[9px] font-black">{i + 1}</span>}
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

                {/* ── AMENITIES ── */}
                <div className="px-6 pb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Included Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {["Road Access", "Water Supply", "Electricity Grid", "Compound Wall", "Security Gate", "Green Belt"].map(a => (
                      <span key={a} className="flex items-center gap-1 px-2.5 py-1 bg-[#0086D1]/8 border border-[#0086D1]/20 text-[#0086D1] rounded-full text-xs font-semibold">
                        <CheckCircle2 size={11} />{a}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ── REMARKS ── */}
                {selectedPlot.remark && (
                  <div className="px-6 pb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Notes & Remarks</h3>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-900 leading-relaxed font-medium flex gap-2">
                      <span className="mt-0.5 shrink-0">💬</span>
                      <span>{selectedPlot.remark}</span>
                    </div>
                  </div>
                )}

                {/* ── HOUSE / UNIT DETAILS ── */}
                {(selectedPlot.bedrooms || selectedPlot.houseType || selectedPlot.floors) && (
                  <div className="px-6 pb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">House / Unit Details</h3>

                    {/* House type + floors hero */}
                    <div className="flex items-center gap-3 mb-3 p-3 bg-gradient-to-r from-[#0086D1]/8 to-violet-500/5 border border-[#0086D1]/15 rounded-xl">
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

                    {/* Room counts */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { icon: <BedDouble size={16} className="text-indigo-500" />, label: "Bedrooms", value: selectedPlot.bedrooms },
                        { icon: <Bath size={16} className="text-cyan-500" />, label: "Bathrooms", value: selectedPlot.bathrooms },
                        { icon: <Sofa size={16} className="text-violet-500" />, label: "Living Rooms", value: selectedPlot.livingRooms },
                        { icon: <Utensils size={16} className="text-amber-500" />, label: "Kitchen", value: selectedPlot.kitchen },
                        { icon: <Utensils size={16} className="text-orange-400" />, label: "Dining", value: selectedPlot.dining },
                        { icon: <Car size={16} className="text-slate-500" />, label: "Garage", value: selectedPlot.garage },
                      ].filter(s => s.value !== undefined && s.value !== null).map(s => (
                        <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center gap-1 text-center">
                          {s.icon}
                          <span className="text-lg font-black text-slate-900">{s.value}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{s.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Feature tags */}
                    <div className="flex flex-wrap gap-2">
                      {selectedPlot.balcony && <span className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 border border-sky-100 text-sky-700 rounded-full text-xs font-semibold"><CheckCircle2 size={11} />Balcony</span>}
                      {selectedPlot.garden && <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-xs font-semibold"><Trees size={11} />Garden</span>}
                      {selectedPlot.rooftop && <span className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 border border-violet-100 text-violet-700 rounded-full text-xs font-semibold"><Building2 size={11} />Rooftop</span>}
                      {(selectedPlot.garage ?? 0) > 0 && <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-xs font-semibold"><Car size={11} />Parking ×{selectedPlot.garage}</span>}
                      {selectedPlot.yearBuilt && <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-700 rounded-full text-xs font-semibold"><CalendarDays size={11} />Built {selectedPlot.yearBuilt}</span>}
                    </div>
                  </div>
                )}

                {/* ── PAYMENT SCHEDULE ── */}
                {selectedPlot.paymentSchedule && selectedPlot.paymentSchedule.length > 0 && (
                  <div className="px-6 pb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                      <DollarSign size={14} className="text-emerald-500" /> Payment Schedule
                    </h3>

                    {/* Summary bar */}
                    {(() => {
                      const total     = selectedPlot.paymentSchedule!.reduce((s, p) => s + p.amount, 0);
                      const paid      = selectedPlot.paymentSchedule!.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
                      const overdue   = selectedPlot.paymentSchedule!.filter(p => {
                        const d = p.dueDate ? Math.round((new Date(p.dueDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000) : null;
                        return p.status === "pending" && d !== null && d < 0;
                      });
                      const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
                      const currency = selectedPlot.paymentSchedule![0]?.currency ?? "ETB";
                      return (
                        <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-slate-50 border border-emerald-100 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-600">Total: {currency} {total.toLocaleString()}</span>
                            <span className="text-xs font-black text-emerald-600">{pct}% Paid</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          {overdue.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-red-600">
                              <AlertCircle size={12} />
                              {overdue.length} payment{overdue.length > 1 ? "s" : ""} overdue — {currency} {overdue.reduce((s, p) => s + p.amount, 0).toLocaleString()}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Payment rows */}
                    <div className="space-y-2">
                      {selectedPlot.paymentSchedule.map((pay, idx) => {
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
                        return (
                          <div key={idx} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                            pay.status === "paid" ? "bg-emerald-50 border-emerald-100" :
                            isOverdue ? "bg-red-50 border-red-200" :
                            pay.status === "waived" ? "bg-slate-50 border-slate-100 opacity-60" :
                            "bg-white border-slate-100"
                          }`}>
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                pay.status === "paid" ? "bg-emerald-100" :
                                isOverdue ? "bg-red-100" : "bg-amber-50"
                              }`}>
                                {pay.status === "paid"
                                  ? <CheckCircle2 size={14} className="text-emerald-600" />
                                  : isOverdue
                                    ? <AlertCircle size={14} className="text-red-500" />
                                    : <DollarSign size={14} className="text-amber-500" />
                                }
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{pay.description}</p>
                                <p className={`text-[11px] font-semibold ${
                                  pay.status === "paid" ? "text-emerald-600" :
                                  isOverdue ? "text-red-600" : "text-amber-600"
                                }`}>{dayLabel}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-extrabold text-slate-900">{pay.currency} {pay.amount.toLocaleString()}</p>
                              {pay.dueDate && <p className="text-[10px] text-slate-400">{new Date(pay.dueDate).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── FOOTER ── */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-400 font-medium">Plot {selectedPlot.plotNumber} · Block {property?.blockNumber}</span>
                <Button onClick={() => setSelectedPlot(null)} variant="outline" className="font-bold text-sm rounded-xl border-slate-200">Close</Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { PropertyStatus } from "@/lib/data/properties";
import { usePropertyStore } from "@/lib/usePropertyStore";
import { usePlotStore } from "@/lib/usePlotStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, Search, X, ArrowRight, Eye, EyeOff, Thermometer, Layers, CheckSquare, BarChart3, Printer, Maximize2, Minimize2, GitCompare, Link2, Download, FileDown } from "lucide-react";
import { useRole } from "@/lib/RoleContext";
import { toast } from "@/lib/toast";

const STATUS_COLORS: Record<PropertyStatus, string> = {
  available: "#22c55e", sold: "#ef4444", reserved: "#f97316", "under-construction": "#a855f7",
};
const STATUS_LABELS: Record<PropertyStatus, string> = {
  available: "Available", sold: "Sold", reserved: "Reserved", "under-construction": "Under Construction",
};
const STATUS_BG: Record<PropertyStatus, string> = {
  available: "bg-emerald-500", sold: "bg-red-500", reserved: "bg-orange-500", "under-construction": "bg-purple-500",
};

interface Point { x: number; y: number; }
interface BlockHotspot { shape_id?: string; id: number; points: Point[]; label?: string | null; }

type ViewMode = "status" | "heatmap" | "zone";
const ZONE_COLORS: Record<string, string> = { "Zone I G+1": "#0086D1", "Zone II G+0": "#22c55e" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function seededRand(s: number) { const x = Math.sin(s) * 10000; return x - Math.floor(x); }
function blockSaleMonth(id: number) { return Math.floor(seededRand(id * 7 + 3) * 12); }
function heatColor(price: number, min: number, max: number, hov: boolean) {
  const t = max > min ? (price - min) / (max - min) : 0;
  return `rgba(${Math.round(224 - 224 * t)},${Math.round(242 - 156 * t)},${Math.round(254 - 45 * t)},${hov ? 0.9 : 0.65})`;
}

function getCentroid(pts: Point[]) {
  if (!pts?.length) return { x: 0, y: 0 };
  const s = pts.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: s.x / pts.length, y: s.y / pts.length };
}

export default function HomePage() {
  const router = useRouter();
  const { permissions, isLoading: roleLoading, isSuperAdmin } = useRole();
  const { list: properties, update } = usePropertyStore();
  const [filter, setFilter] = useState<PropertyStatus | "all">("all");
  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; block: number } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [hotspots, setHotspots] = useState<BlockHotspot[]>([]);
  const [selectedBlockForEdit, setSelectedBlockForEdit] = useState<number>(1);
  const [selectedShapeIdForEdit, setSelectedShapeIdForEdit] = useState<string | null>(null);
  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
  const isDraggingRef = useRef(false);

  const [drawerBlock, setDrawerBlock] = useState<number | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHighlight, setSearchHighlight] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // Analytics state
  const [viewMode, setViewMode] = useState<ViewMode>("status");
  const [timelineActive, setTimelineActive] = useState(false);
  const [timelineMonth, setTimelineMonth] = useState(11);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<PropertyStatus>("available");
  // Productivity state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [compareBlocks, setCompareBlocks] = useState<number[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const mapCardRef = useRef<HTMLDivElement>(null);
  // UX Polish state
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPoint = useRef<{ x: number; y: number } | null>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef(1);
  const mapImageRef = useRef<HTMLDivElement>(null);

  // ── Inventory stats — same source as the Management Dashboard ────────────
  // Uses /api/properties/plot-analytics (same endpoint as dashboard page)
  // Shows only: Available (activePlots) and Sold (soldPlots)
  const [inventoryStats, setInventoryStats] = useState({ total: 0, available: 0, sold: 0 });
  useEffect(() => {
    fetch("/api/properties/plot-analytics")
      .then(r => r.json())
      .then(d => {
        const s = d?.summary;
        if (s && typeof s.activePlots === "number") {
          setInventoryStats({
            total:     s.totalPlots   ?? 0,
            available: s.activePlots  ?? 0,
            sold:      s.soldPlots    ?? 0,
          });
        }
      })
      .catch(() => {/* silently stay at 0 */});
  }, []);

  // Load hotspots: DB is authoritative, localStorage is instant fallback
  useEffect(() => {
    async function loadHotspots() {
      // 1. Instant render from localStorage (no flicker)
      let localData: BlockHotspot[] = [];
      const cached = localStorage.getItem("estate_hotspots_poly");
      if (cached) {
        try { localData = JSON.parse(cached); setHotspots(localData); } catch { }
      }

      // 2. Fetch from DB
      try {
        const res = await fetch("/api/hotspots");
        if (!res.ok) throw new Error("DB fetch failed");
        const data = await res.json();

        if (Array.isArray(data.hotspots) && data.hotspots.length > 0) {
          // DB has data — use it as source of truth
          setHotspots(data.hotspots);
          localStorage.setItem("estate_hotspots_poly", JSON.stringify(data.hotspots));

        } else if (localData.length > 0) {
          // DB is EMPTY but localStorage has drawings — auto-migrate silently
          console.info(`[Hotspots] DB empty — migrating ${localData.length} blocks from localStorage…`);
          try {
            const migrateRes = await fetch("/api/hotspots", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ hotspots: localData }),
            });
            if (migrateRes.ok) {
              const { upserted } = await migrateRes.json();
              console.info(`[Hotspots] ✅ Migrated ${upserted} blocks to DB.`);
              toast.success(`Map data migrated — ${upserted} blocks saved to database`);
            } else {
              toast.error("Auto-migration failed — data is still in localStorage");
            }
          } catch { toast.error("Could not reach database during migration"); }
        }
      } catch {
        console.warn("[Hotspots] Could not reach DB, using localStorage fallback.");
      }
    }

    loadHotspots();

    // Consume the one-time welcome toast set by the login page
    const welcomeMsg = sessionStorage.getItem("welcome_toast");
    if (welcomeMsg) {
      sessionStorage.removeItem("welcome_toast");
      // Slight delay so the Toaster is mounted before we fire
      setTimeout(() => toast.success(welcomeMsg, 5000), 300);
    }

    const ov = localStorage.getItem("estate_status_overrides");
    // NOTE: legacy status overrides from localStorage — kept for session continuity only.
    // New bulk status changes are persisted directly to the DB via the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ov) { try { localStorage.removeItem("estate_status_overrides"); } catch { } }
    const params = new URLSearchParams(window.location.search);
    const bp = params.get("block");
    if (bp) {
      const n = parseInt(bp, 10);
      if (n >= 1) {
        Promise.resolve().then(() => setDrawerBlock(n));
      }
    }
    // Feature 10: fullscreen change listener
    const onFsc = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsc);
    return () => document.removeEventListener("fullscreenchange", onFsc);
  }, []);

  function getLocalProp(blockId: number) {
    return properties.find(p => p.blockNumber === blockId) ?? null;
  }

  function getEffectiveStatus(blockId: number): PropertyStatus {
    const prop = getLocalProp(blockId);
    if (!prop) return "available";
    if (timelineActive && (prop.status === "sold" || prop.status === "reserved") && blockSaleMonth(blockId) > timelineMonth) return "available";
    return prop.status;
  }

  const isBlockDimmed = useCallback((blockId: number): boolean => {
    if (viewMode !== "status" || filter === "all") return false;
    const prop = getLocalProp(blockId);
    if (!prop) return true;
    if (filter === "available") return prop.activePlots === 0;
    if (filter === "sold") return prop.soldPlots === 0;
    if (filter === "reserved") return prop.status !== "reserved";
    if (filter === "under-construction") return prop.status !== "under-construction";
    return false;
  }, [filter, viewMode, properties]);


  const priceRange = useMemo(() => {
    const prices = properties.map(p => p.price);
    return { min: Math.min(...prices, 0), max: Math.max(...prices, 1) };
  }, [properties]);

  const zoneSummary = useMemo(() => (["Zone I G+1", "Zone II G+0"] as const).map(zone => {
    const zp = properties.filter(p => p.zone === zone);
    return { zone, total: zp.length, available: zp.filter(p => getEffectiveStatus(p.blockNumber) === "available").length, sold: zp.filter(p => getEffectiveStatus(p.blockNumber) === "sold").length, avgPrice: zp.length ? Math.round(zp.reduce((s, p) => s + p.price, 0) / zp.length) : 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [properties, timelineActive, timelineMonth]);

  const salesByMonth = useMemo(() => {
    const m = Array(12).fill(0);
    properties.forEach(p => { if (p.status === "sold" || p.status === "reserved") m[blockSaleMonth(p.blockNumber)]++; });
    return m;
  }, []);

  function getMapCoordinates(clientX: number, clientY: number, containerRect: DOMRect) {
    const mouseX = clientX - containerRect.left;
    const mouseY = clientY - containerRect.top;
    const unscaledX = (mouseX - transform.x) / transform.scale;
    const unscaledY = (mouseY - transform.y) / transform.scale;
    return {
      x: (unscaledX / containerRect.width) * 100,
      y: (unscaledY / containerRect.height) * 100
    };
  }

  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!editMode) return;
    if (isDraggingRef.current) return; // Don't add a point if we just dragged
    const rect = e.currentTarget.getBoundingClientRect();
    const { x, y } = getMapCoordinates(e.clientX, e.clientY, rect);
    setDraftPoints([...draftPoints, { x, y }]);
  }

  function handleMapMouseMove(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    if (!editMode && isPanning && lastPanPoint.current && transform.scale > 1) {
      const dx = clientX - lastPanPoint.current.x;
      const dy = clientY - lastPanPoint.current.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastPanPoint.current = { x: clientX, y: clientY };
      return;
    }

    if (!editMode || draggingPointIndex === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const { x, y } = getMapCoordinates(clientX, clientY, rect);

    isDraggingRef.current = true; // Mark as dragging so click event doesn't add a point

    setDraftPoints(prev => {
      const newPts = [...prev];
      newPts[draggingPointIndex] = { x, y };
      return newPts;
    });
  }

  function handleMapMouseUp() {
    if (isPanning) {
      setIsPanning(false);
      lastPanPoint.current = null;
    }
    if (draggingPointIndex !== null) {
      setDraggingPointIndex(null);
      // Keep isDraggingRef true for a tiny bit so click event doesn't fire and add a point
      setTimeout(() => { isDraggingRef.current = false; }, 50);
    }
  }

  async function handleCompleteShape() {
    if (draftPoints.length < 3) { alert("Please click at least 3 points!"); return; }
    const newHotspots = [...hotspots];
    const newShapeId = selectedShapeIdForEdit || crypto.randomUUID();

    const i = newHotspots.findIndex(h => h.shape_id === selectedShapeIdForEdit);
    const newShape: BlockHotspot = { shape_id: newShapeId, id: selectedBlockForEdit, points: draftPoints };

    if (i >= 0) newHotspots[i] = newShape;
    else newHotspots.push(newShape);

    setHotspots(newHotspots);
    // Instant backup to localStorage
    localStorage.setItem("estate_hotspots_poly", JSON.stringify(newHotspots));
    setDraftPoints([]);
    setSelectedShapeIdForEdit(null); // Reset after saving
    if (!selectedShapeIdForEdit && selectedBlockForEdit < properties.length) setSelectedBlockForEdit(selectedBlockForEdit + 1);

    // Persist to DB (non-blocking — UI updates immediately from state)
    toast.info("Saving block to database…", 1500);
    try {
      const res = await fetch("/api/hotspots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotspots: [newShape] }),
      });
      if (res.ok) toast.success(`Block ${selectedBlockForEdit} saved to database`);
      else toast.error("Failed to save block — check your connection");
    } catch {
      toast.error("Could not reach database — block saved to localStorage only");
    }
  }

  function handlePolygonClick(blockId: number, shapeId: string | undefined, e: React.MouseEvent) {
    if (editMode) {
      e.stopPropagation();
      setSelectedBlockForEdit(blockId);
      setSelectedShapeIdForEdit(shapeId || null);
      const existing = hotspots.find(h => h.shape_id === shapeId);
      if (existing) {
        setDraftPoints(existing.points);
      } else {
        setDraftPoints([]);
      }
      return;
    }
    if (selectionMode) {
      setSelectedBlocks(prev => { const n = new Set(prev); if (n.has(blockId)) n.delete(blockId); else n.add(blockId); return n; });
      return;
    }
    setDrawerBlock(blockId);
  }

  async function applyBulkStatus() {
    const blockIds = [...selectedBlocks];
    toast.info(`Saving ${blockIds.length} block${blockIds.length !== 1 ? 's' : ''} to database…`, 1500);

    const results = await Promise.allSettled(
      blockIds.map(blockNum => {
        const prop = properties.find(p => p.blockNumber === blockNum);
        if (!prop) return Promise.resolve();
        return update(prop.id, { status: bulkStatus });
      })
    );

    const failed = results.filter(r => r.status === "rejected").length;
    if (failed > 0) {
      toast.error(`${failed} block(s) failed to update`);
    } else {
      toast.success(`Updated ${blockIds.length} block${blockIds.length !== 1 ? 's' : ''} to "${bulkStatus}"`);
    }
    setSelectedBlocks(new Set());
    setSelectionMode(false);
  }


  function getBlockColor(blockId: number, isHovered: boolean, isSearched: boolean): string {
    const prop = getLocalProp(blockId);
    if (!prop) return "transparent";
    const status = getEffectiveStatus(blockId);
    if (selectedBlocks.has(blockId)) return "rgba(0,134,209,0.5)";
    if (viewMode === "heatmap") return heatColor(prop.price, priceRange.min, priceRange.max, isHovered);
    if (viewMode === "zone") return ZONE_COLORS[prop.zone] + (isHovered ? "55" : "28");
    if (isBlockDimmed(blockId)) return "rgba(0,0,0,0.5)";
    if (isSearched) return STATUS_COLORS[status] + "55";
    return isHovered ? STATUS_COLORS[status] + "33" : "transparent";
  }

  function getBlockBorder(blockId: number, isHovered: boolean, isEditing: boolean, isSearched: boolean): string {
    if (isEditing) return "#fff";
    const prop = getLocalProp(blockId);
    if (!prop) return "transparent";
    const status = getEffectiveStatus(blockId);
    if (selectedBlocks.has(blockId)) return "#0086D1";
    if (viewMode === "heatmap") return isHovered ? "#fff" : "rgba(255,255,255,0.3)";
    if (viewMode === "zone") return ZONE_COLORS[prop.zone] + (isHovered ? "ff" : "88");
    if (isBlockDimmed(blockId)) return "transparent";
    if (isSearched) return "#fff";
    return isHovered ? "#ffffff" : STATUS_COLORS[status] + "66";
  }

  function handleSearch(q: string) {
    setSearchQuery(q);
    const cleanQ = q.trim().toUpperCase();
    if (!cleanQ) {
      setSearchHighlight(null);
      setHoveredBlock(null);
      return;
    }

    // Try matching blockLabel (e.g. 46A, 46B)
    const foundProp = properties.find(
      p => p.blockLabel?.toUpperCase() === cleanQ || 
           `B${p.blockLabel}`.toUpperCase() === cleanQ
    );
    if (foundProp) {
      setSearchHighlight(foundProp.blockNumber);
      setHoveredBlock(foundProp.blockNumber);
      if (!editMode && !selectionMode) setDrawerBlock(foundProp.blockNumber);
      return;
    }

    // Fallback to numeric search
    const num = parseInt(q.replace(/\D/g, ""), 10);
    if (!isNaN(num) && num >= 1) {
      setSearchHighlight(num); setHoveredBlock(num);
      if (!editMode && !selectionMode) setDrawerBlock(num);
    } else { setSearchHighlight(null); setHoveredBlock(null); }
  }

  const drawerProp = drawerBlock ? getLocalProp(drawerBlock) : null;

  // Feature 11: sync URL when drawer opens/closes
  useEffect(() => {
    const url = new URL(window.location.href);
    if (drawerBlock) url.searchParams.set("block", String(drawerBlock));
    else url.searchParams.delete("block");
    window.history.replaceState({}, "", url.toString());
  }, [drawerBlock]);

  // Feature 10: toggle fullscreen on the map card
  function toggleFullscreen() {
    if (!document.fullscreenElement) mapCardRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }

  // Feature 9: print
  function handlePrint() { window.print(); }

  // Feature 12: toggle comparison
  function toggleCompare(blockId: number) {
    setCompareBlocks(prev => {
      if (prev.includes(blockId)) return prev.filter(b => b !== blockId);
      if (prev.length >= 3) return prev;
      return [...prev, blockId];
    });
  }



  // Feature 16: pinch-to-zoom touch handlers
  function getTouchDist(t: React.TouchList) {
    return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  }
  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) { pinchStartDist.current = getTouchDist(e.touches); pinchStartZoom.current = transform.scale; }
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchStartDist.current) {
      const ratio = getTouchDist(e.touches) / pinchStartDist.current;
      setTransform(prev => ({ ...prev, scale: Math.min(6, Math.max(1, pinchStartZoom.current * ratio)) }));
    }
  }
  function handleTouchEnd() { pinchStartDist.current = null; }

  // True Google Maps Style Zoom effect
  useEffect(() => {
    const el = mapImageRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return; // Only zoom with Ctrl key
      e.preventDefault(); // Prevent browser zoom

      if (editMode) return; // Don't zoom in edit mode

      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setTransform(prev => {
        const zoomSpeed = 0.003;
        const delta = -e.deltaY * zoomSpeed;
        let newScale = prev.scale * (1 + delta);
        newScale = Math.min(8, Math.max(1, newScale));

        if (newScale === 1) return { scale: 1, x: 0, y: 0 };

        const scaleRatio = newScale / prev.scale;
        const newX = mouseX - (mouseX - prev.x) * scaleRatio;
        const newY = mouseY - (mouseY - prev.y) * scaleRatio;

        return { scale: newScale, x: newX, y: newY };
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [editMode]);

  return (
    <div className="min-h-screen bg-slate-50 text-foreground pb-20 relative">

      {/* ── LIVE INVENTORY BAR — Available vs Sold (mirrors dashboard) ───── */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-[1500px] mx-auto">
          <div className="flex flex-wrap items-center gap-6 mb-3">

            {/* AVAILABLE — active plots not yet sold */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available</span>
              <span className="text-sm font-black text-slate-900">{inventoryStats.available}</span>
              <span className="text-xs text-slate-400">({inventoryStats.total ? Math.round((inventoryStats.available / inventoryStats.total) * 100) : 0}%)</span>
            </div>

            {/* SOLD — plots successfully closed */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sold</span>
              <span className="text-sm font-black text-slate-900">{inventoryStats.sold}</span>
              <span className="text-xs text-slate-400">({inventoryStats.total ? Math.round((inventoryStats.sold / inventoryStats.total) * 100) : 0}%)</span>
            </div>

            {/* Summary metadata */}
            <div className="ml-auto flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                <span className="font-bold text-slate-500">Blocks:</span>
                <span className="font-black text-slate-900">{properties.length}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                <span className="font-bold text-slate-500">Total Plots:</span>
                <span className="font-black text-slate-900">{inventoryStats.total}</span>
              </div>
            </div>
          </div>

          {/* Two-segment progress bar: Available (green) | Sold (red) */}
          <div className="flex w-full h-2 rounded-full overflow-hidden gap-px">
            <div className="bg-emerald-500" style={{ width: `${inventoryStats.total ? (inventoryStats.available / inventoryStats.total) * 100 : 0}%`, transition: "width 0.5s" }} />
            <div className="bg-red-500"    style={{ width: `${inventoryStats.total ? (inventoryStats.sold      / inventoryStats.total) * 100 : 0}%`, transition: "width 0.5s" }} />
          </div>
        </div>
      </div>

      {/* Page header + Feature 3: Search */}
      <section className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-start">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-3">
            <MapIcon size={16} /> Interactive Master Plan
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Aman Berki Properties</h1>
        </div>

        {/* Feature 3: Block Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search block number (e.g. 12)…"
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setSearchHighlight(null); setHoveredBlock(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
          {searchHighlight && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-20 text-sm">
              {(() => {
                const p = getLocalProp(searchHighlight);
                if (!p) return <span className="text-slate-400">Block not found</span>;
                return (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">Block {p.blockLabel ?? p.blockNumber} — {p.noOfPlots} Plots</span>
                      <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: STATUS_COLORS[p.status], background: STATUS_COLORS[p.status] + "20" }}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </div>
                    <button onClick={() => setDrawerBlock(searchHighlight)} className="text-primary text-xs font-bold hover:underline">View →</button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </section>

      {/* Feature 9: Print styles */}
      <style>{`
        @media print {
          nav, aside, header, .print-hide { display: none !important; }
          body { background: white !important; }
          .print-map { page-break-inside: avoid; }
        }
      `}</style>

      {/* Map Container */}
      <div className="max-w-[1500px] mx-auto px-4 md:px-6 print-map">
        <Card ref={mapCardRef} className="overflow-hidden border border-slate-200/60 shadow-lg bg-white rounded-2xl">

          {/* Map Header */}
          <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-4 bg-white">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Interactive Master Plan</h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Click any block to view property details</p>
            </div>

            {/* ── Toolbar: super_admin only — others get DWG download ─── */}
            {!roleLoading && isSuperAdmin ? (
              <div className="flex items-center gap-3 flex-wrap">
                {/* Status filter */}
                <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                  {(["all", "available", "sold", "reserved", "under-construction"] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                      {f === "all" ? "All" : STATUS_LABELS[f as PropertyStatus]}
                    </button>
                  ))}
                </div>

                {/* Analytics tools */}
                {permissions.canUseAnalytics && (
                  <>
                    <div className="w-px h-7 bg-slate-200" />
                    <button onClick={() => setViewMode(v => v === "heatmap" ? "status" : "heatmap")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "heatmap" ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                      <Thermometer size={12} /> Heatmap
                    </button>
                    <button onClick={() => setViewMode(v => v === "zone" ? "status" : "zone")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "zone" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                      <Layers size={12} /> Zones
                    </button>
                    <button onClick={() => setTimelineActive(v => !v)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${timelineActive ? "bg-violet-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                      <BarChart3 size={12} /> Timeline
                    </button>
                  </>
                )}

                {/* Bulk Select */}
                {permissions.canBulkUpdateStatus && (
                  <button onClick={() => { setSelectionMode(v => !v); setSelectedBlocks(new Set()); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${selectionMode ? "bg-[#0086D1] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    <CheckSquare size={12} /> Select
                  </button>
                )}

                 {/* Labels toggle */}
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setShowLabels(v => !v)}
                   className={`font-bold text-xs rounded-xl gap-1.5 ${showLabels ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600"}`}
                 >
                   {showLabels ? <Eye size={13} /> : <EyeOff size={13} />}
                   {showLabels ? "Details On" : "Details Off"}
                 </Button>

                {/* Draw Blocks */}
                {permissions.canDrawBlocks && (
                  <>
                    <div className="w-px h-7 bg-slate-200" />
                    <Button
                      variant={editMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setEditMode(!editMode); setDraftPoints([]); }}
                      className={`font-bold text-xs rounded-xl ${!editMode && "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      {editMode ? "Exit Draw Mode" : "✏️ Draw Blocks"}
                    </Button>
                  </>
                )}

                <div className="w-px h-7 bg-slate-200" />

                {/* Print */}
                {permissions.canExportPrint && (
                  <button onClick={handlePrint} title="Print / Export Map"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all print:hidden">
                    <Printer size={12} /> Print
                  </button>
                )}

                {/* Compare */}
                <button onClick={() => setShowCompare(v => !v)} title="Compare blocks"
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${showCompare || compareBlocks.length > 0 ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  <GitCompare size={12} /> Compare{compareBlocks.length > 0 ? ` (${compareBlocks.length})` : ""}
                </button>

                {/* Fullscreen */}
                <button onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                  {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                  {isFullscreen ? "Exit" : "Fullscreen"}
                </button>
              </div>
            ) : (
              /* Download Site Map DWG — visible to admin / user roles */
              <a
                href="/Tulu Dimtu Sitmap.dwg"
                download="Tulu Dimtu Sitmap.dwg"
                className="group flex items-center gap-3 px-5 py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0086D1] bg-slate-50 hover:bg-blue-50 transition-all duration-200"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-slate-200 group-hover:border-[#0086D1] group-hover:bg-[#0086D1]/10 transition-all shadow-sm">
                  <FileDown size={18} className="text-slate-500 group-hover:text-[#0086D1] transition-colors" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800 group-hover:text-[#0086D1] transition-colors leading-tight">Download Site Map</p>
                  <p className="text-xs text-slate-400 font-medium">Tulu Dimtu Sitmap.dwg · AutoCAD</p>
                </div>
                <Download size={14} className="ml-1 text-slate-400 group-hover:text-[#0086D1] transition-colors" />
              </a>
            )}
          </div>

          {/* Edit Mode Toolbar */}
          {editMode && (
            <div className="p-3 bg-amber-50 border-b border-amber-200 flex flex-wrap gap-4 items-center">
              <span className="text-amber-700 font-bold text-sm">🛠 Polygon Drawing Mode Active</span>
              <span className="text-sm text-amber-900">
                {selectedShapeIdForEdit ? "Editing Shape — Block:" : "Drawing New — Block:"}
                <input type="number" min="1" value={selectedBlockForEdit} onChange={e => setSelectedBlockForEdit(Number(e.target.value))}
                  className="ml-2 p-1 w-20 bg-white border border-amber-300 rounded text-sm font-bold" />
              </span>
              <Button size="sm" onClick={handleCompleteShape} className="bg-amber-600 hover:bg-amber-700 text-white">Save Shape</Button>
              <Button size="sm" variant="ghost" onClick={() => { setDraftPoints([]); setSelectedShapeIdForEdit(null); }} className="text-red-600 hover:bg-red-50">Clear</Button>

              {/* Sync ALL hotspots to DB in one shot */}
              <Button size="sm" variant="secondary" className="ml-auto text-xs" onClick={async () => {
                if (hotspots.length === 0) { toast.warning("No blocks drawn yet!"); return; }
                toast.info(`Syncing ${hotspots.length} blocks to database…`, 1500);
                try {
                  const res = await fetch("/api/hotspots", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ hotspots }),
                  });
                  if (res.ok) toast.success(`All ${hotspots.length} blocks synced to database`);
                  else toast.error("Sync failed — check your connection");
                } catch { toast.error("Could not reach database"); }
              }}>
                🗄️ Sync All ({hotspots.length}) to DB
              </Button>
            </div>
          )}

          {/* Heatmap legend */}
          {viewMode === "heatmap" && (
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Low ${(priceRange.min / 1000).toFixed(0)}K</span>
              <div className="flex-1 h-3 rounded-full" style={{ background: "linear-gradient(to right,rgba(224,242,254,0.9),rgba(0,134,209,0.9),rgba(30,58,95,0.9))" }} />
              <span className="text-xs font-bold text-slate-500">High ${(priceRange.max / 1000).toFixed(0)}K</span>
            </div>
          )}

          {/* Zone summary cards */}
          {viewMode === "zone" && (
            <div className="px-5 py-4 border-b border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3">
              {zoneSummary.map(z => (
                <div key={z.zone} className="rounded-xl p-3 border text-sm" style={{ borderColor: ZONE_COLORS[z.zone] + "50", background: ZONE_COLORS[z.zone] + "0a" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-slate-900">Zone {z.zone}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: ZONE_COLORS[z.zone] }}>{z.total} units</span>
                  </div>
                  <div className="space-y-0.5 text-xs text-slate-600">
                    <div className="flex justify-between"><span>Available</span><span className="font-bold text-emerald-600">{z.available}</span></div>
                    <div className="flex justify-between"><span>Sold</span><span className="font-bold text-red-500">{z.sold}</span></div>
                    <div className="flex justify-between"><span>Avg Price</span><span className="font-bold text-slate-800">${(z.avgPrice / 1000).toFixed(0)}K</span></div>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(z.available / z.total) * 100}%`, background: ZONE_COLORS[z.zone] }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Timeline slider */}
          {timelineActive && (
            <div className="px-5 py-4 bg-violet-50 border-b border-violet-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-violet-800">📅 Sales Timeline — as of <span className="text-violet-600">{MONTHS[timelineMonth]}</span></span>
                <span className="text-xs font-semibold text-violet-600">{salesByMonth.slice(0, timelineMonth + 1).reduce((a, b) => a + b, 0)} plots sold/reserved by this date</span>
              </div>
              <div className="flex items-end gap-0.5 h-10 mb-2">
                {salesByMonth.map((n, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full rounded-sm" style={{ height: `${salesByMonth[i] ? (n / Math.max(...salesByMonth)) * 100 : 0}%`, minHeight: n > 0 ? 3 : 0, background: i <= timelineMonth ? "#7c3aed" : "#e2e8f0", transition: "all 0.3s" }} />
                  </div>
                ))}
              </div>
              <input type="range" min={0} max={11} value={timelineMonth} onChange={e => setTimelineMonth(+e.target.value)} className="w-full accent-violet-600" />
              <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-0.5">{MONTHS.map(m => <span key={m}>{m}</span>)}</div>
            </div>
          )}

          {/* Aerial Image + SVG Overlay — single zoom wrapper fixes fullscreen mismatch */}
          <div
            ref={mapImageRef}
            className="relative w-full bg-slate-100 overflow-hidden"
            style={{ cursor: editMode ? (draggingPointIndex !== null ? "grabbing" : "crosshair") : (isPanning ? "grabbing" : transform.scale > 1 ? "grab" : "default") }}
            onClick={handleMapClick}
            onMouseDown={(e) => {
              if (!editMode && transform.scale > 1) {
                setIsPanning(true);
                lastPanPoint.current = { x: e.clientX, y: e.clientY };
              }
            }}
            onMouseMove={handleMapMouseMove}
            onMouseUp={handleMapMouseUp}
            onMouseLeave={() => {
              if (isPanning) { setIsPanning(false); lastPanPoint.current = null; }
              if (draggingPointIndex !== null) { setDraggingPointIndex(null); isDraggingRef.current = false; }
              if (!editMode) { setHoveredBlock(null); setTooltip(null); }
            }}
            onTouchStart={(e) => {
              handleTouchStart(e);
              if (!editMode && transform.scale > 1 && e.touches.length === 1) {
                setIsPanning(true);
                lastPanPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
              }
            }}
            onTouchMove={(e) => { handleTouchMove(e); handleMapMouseMove(e); }}
            onTouchEnd={() => { handleTouchEnd(); handleMapMouseUp(); }}
          >
            {/* Single zoom wrapper — image + SVG scale together, keeping perfect alignment */}
            <div
              className="relative"
              style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: "0 0", transition: isPanning ? "none" : "transform 0.05s ease-out" }}
            >
              <Image
                src="/tuludimtu.png"
                alt="Aman Berki Properties Site Map"
                width={1672} height={941}
                className={`w-full h-auto block ${editMode ? "opacity-90" : ""}`}
                priority draggable={false}
              />

              {/* SVG absolutely on top of the image — same dimensions, always aligned */}
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full"
              >
                <defs />
                {hotspots.map((hs, idx) => {
                  const isHovered = hoveredBlock === hs.id;
                  const isSearched = searchHighlight === hs.id;
                  const isEditingThis = editMode && selectedShapeIdForEdit === hs.shape_id;
                  const isDimmed = isBlockDimmed(hs.id);
                  const centroid = getCentroid(hs.points);
                  const showLabel = !isDimmed;

                  const isNearby = false;

                  return (
                    <g key={hs.shape_id || `hs-${idx}`}>
                      <polygon
                        points={hs.points.map(p => `${p.x},${p.y}`).join(" ")}
                        fill={getBlockColor(hs.id, isHovered, isSearched)}
                        stroke={getBlockBorder(hs.id, isHovered, isEditingThis, isSearched)}
                        strokeWidth={isHovered || isEditingThis || isSearched ? 0.35 : 0.15}
                        style={{ cursor: "pointer", transition: "fill 0.4s ease, opacity 0.4s ease" }}
                        opacity={isDimmed ? 0.35 : 1}
                        onMouseEnter={e => {
                          if (!editMode) {
                            setHoveredBlock(hs.id);
                            const container = (e.target as SVGElement).closest("svg")!.parentElement!;
                            const rect = container.getBoundingClientRect();
                            setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, block: hs.id });
                          }
                        }}
                        onMouseMove={e => {
                          if (!editMode && hoveredBlock === hs.id) {
                            const container = (e.target as SVGElement).closest("svg")!.parentElement!;
                            const rect = container.getBoundingClientRect();
                            setTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev);
                          }
                        }}
                        onMouseLeave={() => { if (!editMode && !searchHighlight) { setHoveredBlock(null); setTooltip(null); } }}
                        onClick={e => handlePolygonClick(hs.id, hs.shape_id, e)}
                      />
                      {/* Premium Always-On Block Label Badge */}
                      {showLabel && (() => {
                        const p = getLocalProp(hs.id);
                        const isDetailed = showLabels || isHovered || isSearched || selectedBlocks.has(hs.id);
                        
                        const labelText = p?.blockLabel ?? hs.label ?? hs.id.toString();
                        const idStr = `B${labelText}`;
                        const charLength = idStr.length;
                        
                        // Calculate proportional width & height depending on text length and detail state
                        let width = 2.4;
                        if (isDetailed) {
                          if (charLength >= 4) width = 4.8;
                          else if (charLength === 3) width = 4.2;
                          else width = 3.6;
                        } else {
                          if (charLength >= 4) width = 4.4;
                          else if (charLength === 3) width = 3.8;
                          else width = 3.2;
                        }
                        
                        const height = isDetailed ? 5.2 : 3.5;
                        
                        const x = centroid.x - width / 2;
                        const y = centroid.y - height / 2;
                        
                        return (
                          <g 
                            style={{ pointerEvents: "none" }}
                            transform={`translate(${centroid.x}, ${centroid.y}) scale(${isHovered ? 1.18 : 1}) translate(${-centroid.x}, ${-centroid.y})`}
                          >
                            {/* Glassmorphic/dark premium pill background */}
                            <rect
                              x={x}
                              y={y}
                              width={width}
                              height={height}
                              rx={0.8}
                              ry={0.8}
                              fill="rgba(15, 23, 42, 0.9)"
                              stroke={isHovered || isSearched ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.18)"}
                              strokeWidth={0.08}
                              style={{
                                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
                                transition: "stroke 0.2s ease, fill 0.2s ease"
                              }}
                            />
                            
                            {/* Block ID text */}
                            <text
                              x={centroid.x}
                              y={isDetailed ? centroid.y - 0.95 : centroid.y + 0.05}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#ffffff"
                              fontSize={1.1}
                              fontWeight="900"
                              letterSpacing="-0.02em"
                            >
                              {idStr}
                            </text>
                            
                            {/* Sold/Active Details if detailed */}
                            {isDetailed && p && (
                              <text
                                x={centroid.x}
                                y={centroid.y + 1.15}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize={0.75}
                                fontWeight="bold"
                                fill={p.activePlots > 0 ? "#4ade80" : "#f87171"}
                              >
                                {p.soldPlots}/{p.noOfPlots}
                              </text>
                            )}

                            {/* Tiny status dot indicator on the top-right corner of the badge */}
                            {p && (
                              <circle
                                cx={centroid.x + width / 2 - 0.45}
                                cy={centroid.y - height / 2 + 0.45}
                                r={0.35}
                                fill={p.activePlots > 0 ? "#10b981" : "#ef4444"}
                                stroke="#ffffff"
                                strokeWidth={0.08}
                                style={{
                                  filter: "drop-shadow(0 0.5px 1px rgba(0,0,0,0.5))"
                                }}
                              />
                            )}
                          </g>
                        );
                      })()}
                    </g>
                  );
                })}

                {/* Draft polygon in draw mode */}
                {editMode && draftPoints.length > 0 && (
                  <g pointerEvents="all">
                    {draftPoints.length >= 3 && <polygon points={draftPoints.map(p => `${p.x},${p.y}`).join(" ")} fill="rgba(245,166,35,0.4)" stroke="none" pointerEvents="none" />}
                    {draftPoints.length > 1 && <polyline points={draftPoints.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#d97706" strokeWidth="0.3" strokeDasharray="0.5 0.5" pointerEvents="none" />}
                    {draftPoints.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={draggingPointIndex === i ? "0.8" : "0.5"}
                        fill={draggingPointIndex === i ? "#fbbf24" : "#fff"}
                        stroke="#000"
                        strokeWidth="0.2"
                        style={{ cursor: "grab" }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDraggingPointIndex(i);
                          isDraggingRef.current = false;
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          setDraggingPointIndex(i);
                          isDraggingRef.current = false;
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setDraftPoints(prev => prev.filter((_, idx) => idx !== i));
                        }}
                      />
                    ))}
                  </g>
                )}
              </svg>
            </div>{/* end single zoom wrapper */}

            {/* Hover tooltip — outside zoom wrapper so it stays at correct screen position */}
            {tooltip && hoveredBlock && !editMode && !drawerBlock && (() => {
              const prop = getLocalProp(hoveredBlock);
              if (!prop) return null;

              // ── Cursor-follow positioning ─────────────────────────────
              // Tooltip follows the mouse with a fixed offset so it never
              // sits on top of the hovered block polygon.
              const TW = 288;    // tooltip width
              const TH = 180;    // tooltip approx height
              const OFFSET = 18; // gap between cursor tip and tooltip edge
              const MARGIN = 8;  // min px gap from container edge

              const container = mapImageRef.current;
              const cw = container?.offsetWidth  ?? 800;
              const ch = container?.offsetHeight ?? 600;

              // Prefer top-right of cursor; flip horizontally if near right edge
              const flipLeft  = tooltip.x + OFFSET + TW > cw - MARGIN;
              // Prefer above cursor; flip below if near top edge
              const showBelow = tooltip.y - OFFSET - TH < MARGIN;

              const left = flipLeft
                ? tooltip.x - OFFSET - TW
                : tooltip.x + OFFSET;
              const top  = showBelow
                ? tooltip.y + OFFSET
                : tooltip.y - OFFSET - TH;

              // Arrow is always on the side closest to the cursor
              const arrowLeft = flipLeft ? TW - 24 : 16;

              return (
                <div
                  className="absolute z-50 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-4 text-sm pointer-events-none"
                  style={{ left, top, width: TW }}
                >
                  {/* Title */}
                  <div className="font-extrabold text-base text-white truncate mb-2">
                    Block {prop.blockLabel ?? prop.blockNumber} — {prop.noOfPlots} Plots
                  </div>

                  {/* Area */}
                  <div className="text-slate-400 text-xs font-semibold mb-2">
                    📐 {prop.area.toLocaleString()} m²
                    {prop.plotSize ? <span className="ml-2 text-slate-500">· {prop.plotSize} m²/plot</span> : null}
                  </div>

                  {/* Available | Sold bar */}
                  <div className="flex items-center gap-2 bg-slate-800 px-2.5 py-1.5 rounded-lg mb-3">
                    <span className="font-bold text-emerald-400">{prop.activePlots} Available</span>
                    <span className="text-slate-600">|</span>
                    <span className="font-bold text-red-400">{prop.soldPlots} Sold</span>
                  </div>

                  {/* Price */}
                  <div className="text-white font-extrabold text-xl">
                    {prop.price > 0
                      ? prop.priceMax && prop.priceMax > prop.price
                        ? `ETB ${(prop.price / 1_000_000).toFixed(1)}M – ${(prop.priceMax / 1_000_000).toFixed(1)}M`
                        : `ETB ${prop.price.toLocaleString()}`
                      : <span className="text-slate-500 text-base font-semibold">Price not set</span>
                    }
                  </div>

                  {/* CTA */}
                  <div className="mt-2.5 text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold bg-slate-800 py-1.5 rounded-md">
                    Click to open details →
                  </div>

                  {/* Dynamic arrow — points toward the cursor */}
                  {showBelow
                    ? <div className="absolute -top-2 w-4 h-4 bg-slate-900 rotate-45 border-l border-t border-slate-700" style={{ left: arrowLeft }} />
                    : <div className="absolute -bottom-2 w-4 h-4 bg-slate-900 rotate-45 border-r border-b border-slate-700" style={{ left: arrowLeft }} />
                  }
                </div>
              );
            })()}

            {/* Feature 16: Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-30">
              <button onClick={() => setTransform(prev => {
                const newScale = Math.min(8, prev.scale + 0.5);
                if (newScale === prev.scale) return prev;
                const r = mapImageRef.current?.getBoundingClientRect();
                if (!r) return { ...prev, scale: newScale };
                const mouseX = r.width / 2;
                const mouseY = r.height / 2;
                const scaleRatio = newScale / prev.scale;
                return { scale: newScale, x: mouseX - (mouseX - prev.x) * scaleRatio, y: mouseY - (mouseY - prev.y) * scaleRatio };
              })}
                className="w-9 h-9 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl shadow-md flex items-center justify-center text-slate-700 font-extrabold text-lg hover:bg-white transition-all active:scale-95">
                +
              </button>
              <button
                className="w-9 h-9 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl shadow-md flex items-center justify-center text-slate-500 text-xs font-bold hover:bg-white transition-all cursor-default">
                {Math.round(transform.scale * 100)}%
              </button>
              <button onClick={() => setTransform(prev => {
                const newScale = Math.max(1, prev.scale - 0.5);
                if (newScale === prev.scale) return prev;
                if (newScale === 1) return { scale: 1, x: 0, y: 0 };
                const r = mapImageRef.current?.getBoundingClientRect();
                if (!r) return { ...prev, scale: newScale };
                const mouseX = r.width / 2;
                const mouseY = r.height / 2;
                const scaleRatio = newScale / prev.scale;
                return { scale: newScale, x: mouseX - (mouseX - prev.x) * scaleRatio, y: mouseY - (mouseY - prev.y) * scaleRatio };
              })}
                className="w-9 h-9 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl shadow-md flex items-center justify-center text-slate-700 font-extrabold text-lg hover:bg-white transition-all active:scale-95">
                −
              </button>
              {transform.scale > 1 && (
                <button onClick={() => setTransform({ scale: 1, x: 0, y: 0 })}
                  className="w-9 h-9 bg-slate-800 text-white rounded-xl shadow-md flex items-center justify-center text-[9px] font-bold hover:bg-slate-700 transition-all">
                  FIT
                </button>
              )}
            </div>

            {/* Feature 12 (Minimap): thumbnail in bottom-left corner */}
            {showMinimap && hotspots.length > 0 && (
              <div className="absolute bottom-4 left-4 z-30 rounded-xl overflow-hidden shadow-xl border-2 border-white/80 bg-slate-900" style={{ width: 140, height: 79 }}>
                <Image
                  src="/tuludimtu.png"
                  alt="Minimap"
                  width={1672} height={941}
                  className="w-full h-full object-cover opacity-70"
                  draggable={false}
                />
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                  {hotspots.map(hs => {
                    const isActive = hs.id === hoveredBlock || hs.id === drawerBlock || searchHighlight === hs.id;
                    if (!isActive) return null;
                    const status = getEffectiveStatus(hs.id);
                    return (
                      <polygon key={hs.id}
                        points={hs.points.map(p => `${p.x},${p.y}`).join(" ")}
                        fill={STATUS_COLORS[status] + "80"}
                        stroke={STATUS_COLORS[status]}
                        strokeWidth={0.8}
                      />
                    );
                  })}
                </svg>
                <button onClick={() => setShowMinimap(false)}
                  className="absolute top-1 right-1 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white text-[8px] hover:bg-black/80">
                  ✕
                </button>
              </div>
            )}
            {!showMinimap && (
              <button onClick={() => setShowMinimap(true)}
                className="absolute bottom-4 left-4 z-30 w-9 h-9 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl shadow-md flex items-center justify-center text-[9px] font-bold text-slate-600 hover:bg-white transition-all">
                MAP
              </button>
            )}
          </div>

          {/* Bulk action bar */}
          {selectionMode && selectedBlocks.size > 0 && (
            <div className="px-5 py-3 bg-[#0086D1]/5 border-t border-[#0086D1]/20 flex items-center gap-3 flex-wrap">
              <span className="text-sm font-bold text-slate-700">{selectedBlocks.size} block{selectedBlocks.size > 1 ? "s" : ""} selected</span>
              <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value as PropertyStatus)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                {(["available", "sold", "reserved", "under-construction"] as PropertyStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              <Button size="sm" onClick={applyBulkStatus} className="bg-[#0086D1] text-white font-bold text-xs">Apply to {selectedBlocks.size} block{selectedBlocks.size > 1 ? "s" : ""}</Button>
              <Button size="sm" variant="ghost" onClick={() => { setSelectedBlocks(new Set()); setSelectionMode(false); }} className="text-xs">Cancel</Button>

            </div>
          )}

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs font-medium text-slate-500">
            <span>🧭 North ↑ · Scale 1:2500 · Aman Berki Properties Master Plan</span>
            <span>{hotspots.length} / {properties.length} mapped</span>
          </div>
        </Card>
      </div>

      {/* ── FEATURE 1: QUICK-VIEW SIDE DRAWER ──────────────────────────────── */}
      {/* Backdrop */}
      {drawerBlock && (
        <div className="fixed inset-0 bg-black/30 z-[90] backdrop-blur-[2px]"
          onClick={() => { setDrawerBlock(null); setSearchHighlight(null); setSearchQuery(""); setHoveredBlock(null); }} />
      )}

      {/* Drawer panel */}
      <div className={`fixed top-0 right-0 h-full w-[420px] max-w-[95vw] bg-white shadow-2xl z-[100] flex flex-col transition-transform duration-300 ease-in-out ${drawerBlock ? "translate-x-0" : "translate-x-full"}`}>
        {drawerProp && (
          <>
            {/* ── Pinned header ── */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500 font-semibold">{drawerProp.zone}</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Block {drawerProp.blockLabel ?? drawerProp.blockNumber} — {drawerProp.noOfPlots} Plots
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{drawerProp.primaryPlots}</p>
              </div>
              <button onClick={() => { setDrawerBlock(null); setSearchHighlight(null); setSearchQuery(""); setHoveredBlock(null); }}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <X size={18} className="text-slate-600" />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto">

              {/* Price */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Listed Value</p>
                <p className="text-3xl font-extrabold text-primary">
                  {drawerProp.price > 0
                    ? drawerProp.priceMax && drawerProp.priceMax > drawerProp.price
                      ? `ETB ${(drawerProp.price / 1_000_000).toFixed(1)}M – ${(drawerProp.priceMax / 1_000_000).toFixed(1)}M`
                      : `ETB ${drawerProp.price.toLocaleString()}`
                    : "Price not set"
                  }
                </p>
                {drawerProp.price > 0 && drawerProp.area > 0 && (
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    ETB {Math.round(drawerProp.price / drawerProp.area).toLocaleString()} / m²
                  </p>
                )}
              </div>

              {/* Key stats */}
              <div className="px-6 py-5 grid grid-cols-2 gap-4 border-b border-slate-100">
                {[
                  { label: "Total Plots",  value: drawerProp.noOfPlots },
                  { label: "Active Plots", value: drawerProp.activePlots },
                  { label: "Total Area",   value: `${drawerProp.area.toLocaleString()} m²` },
                  { label: "Plot Size",    value: drawerProp.plotSize ? `${drawerProp.plotSize} m²` : "—" },
                  { label: "Sold Plots",   value: drawerProp.soldPlots },
                  { label: "Buffer Plots", value: drawerProp.noOfBufferPlots },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
                    <p className="text-base font-extrabold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* Visual Plot Matrix */}
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plots Map Breakdown</p>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
                    {drawerProp.soldPlots} Sold / {drawerProp.activePlots} Avail
                  </span>
                </div>
                <BlockPlotsList key={drawerProp.id} blockId={drawerProp.id} />
              </div>

              {/* Description */}
              {(drawerProp.description || drawerProp.remark) && (
                <div className="px-6 py-5 border-b border-slate-100">
                  {drawerProp.description && (
                    <>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">{drawerProp.description}</p>
                    </>
                  )}
                  {drawerProp.remark && (
                    <>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Remarks</p>
                      <p className="text-sm text-slate-800 leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-200">{drawerProp.remark}</p>
                    </>
                  )}
                </div>
              )}

            </div>{/* end scrollable body */}

            {/* ── Pinned CTA ── */}
            <div className="px-6 py-4 shrink-0 border-t border-slate-100 bg-white">
              <Button
                className="w-full py-5 font-bold rounded-xl bg-[#0086D1] hover:bg-[#006daa] text-white gap-2"
                onClick={() => router.push(`/property/${drawerProp.id}`)}
              >
                View Full Details <ArrowRight size={16} />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Feature 12: Block Comparison Panel */}
      {showCompare && (
        <div className="fixed bottom-0 left-0 right-0 z-[80] bg-white border-t-2 border-teal-400 shadow-2xl print:hidden">
          <div className="max-w-[1500px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GitCompare size={16} className="text-teal-600" />
                <span className="font-extrabold text-slate-900">Block Comparison</span>
                <span className="text-xs text-slate-500 font-medium">({compareBlocks.length}/3 selected — click blocks on the map or use Compare button)</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCompareBlocks([])} className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50">Clear all</button>
                <button onClick={() => setShowCompare(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200"><X size={14} /></button>
              </div>
            </div>
            {compareBlocks.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium pb-2">Open a block&apos;s drawer and click &quot;Compare&quot; to add it here (up to 3 blocks).</p>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${compareBlocks.length}, 1fr)` }}>
                {compareBlocks.map(blockId => {
                  const p = getLocalProp(blockId);
                  if (!p) return null;
                  return (
                    <div key={blockId} className="border border-slate-200 rounded-xl p-4 relative" style={{ borderTop: `3px solid ${STATUS_COLORS[p.status]}` }}>
                      <button onClick={() => toggleCompare(blockId)} className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500"><X size={12} /></button>
                      <div className="text-xs font-bold px-2 py-0.5 rounded-full text-white mb-2 inline-block" style={{ background: STATUS_COLORS[p.status] }}>{STATUS_LABELS[p.status]}</div>
                      <h3 className="font-extrabold text-slate-900 text-base mb-0.5">Block {p.blockLabel ?? p.blockNumber}</h3>
                      <p className="text-xs text-slate-500 capitalize mb-3">Zone {p.zone}</p>
                      <div className="text-2xl font-extrabold text-[#0086D1] mb-3">${p.price.toLocaleString()}</div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-50 rounded-lg p-2"><div className="font-bold text-slate-900">{p.noOfPlots}</div><div className="text-slate-400">Plots</div></div>
                        <div className="bg-slate-50 rounded-lg p-2"><div className="font-bold text-slate-900">{p.area}</div><div className="text-slate-400">m²</div></div>
                        <div className="bg-slate-50 rounded-lg p-2"><div className="font-bold text-slate-900">{p.activePlots}</div><div className="text-slate-400">Active</div></div>
                      </div>
                      <button onClick={() => router.push(`/property/${p.id}`)} className="mt-3 w-full py-2 text-xs font-bold text-[#0086D1] border border-[#0086D1]/30 rounded-lg hover:bg-[#0086D1]/5 transition-all">View Full Details →</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function BlockPlotsList({ blockId }: { blockId: string }) {
  const router = useRouter();
  const { plots, ready } = usePlotStore(blockId);

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-6 text-slate-400 text-xs font-medium gap-2">
        <div className="w-4 h-4 border-2 border-[#0086D1] border-t-transparent rounded-full animate-spin" />
        Loading plot breakdown...
      </div>
    );
  }

  if (plots.length === 0) {
    return <p className="text-xs text-slate-400 italic py-2">No plots recorded for this block yet.</p>;
  }

  return (
    <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
      {plots.map(plot => {
        const isSold = plot.purchaserName && 
                       !plot.purchaserName.toLowerCase().includes("tulu dimtu") && 
                       plot.purchaserName.trim() !== "";
        return (
          <div
            key={plot.plotNumber}
            onClick={() => router.push(`/property/${blockId}?plot=${plot.plotNumber}`)}
            className={`p-2 rounded-xl border text-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm group relative ${
              isSold
                ? "bg-red-50/50 hover:bg-red-50 border-red-100 hover:border-red-200 text-red-700"
                : "bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100 hover:border-emerald-200 text-emerald-700"
            }`}
            title={`Plot ${plot.plotNumber} (${plot.plotSize} m²) - ${isSold ? `Sold to ${plot.purchaserName}` : "Available"}`}
          >
            <div className="text-xs font-black">P{plot.plotNumber}</div>
            <div className="text-[9px] font-bold opacity-60">{plot.plotSize} m²</div>
            <span className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isSold ? "bg-red-500" : "bg-emerald-500"}`} />
          </div>
        );
      })}
    </div>
  );
}

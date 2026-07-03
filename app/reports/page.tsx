"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { usePropertyStore } from "@/lib/usePropertyStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Download, Filter, FileSpreadsheet, BarChart as BarChartIcon, CheckCircle2, CircleDollarSign, Map, Printer, PieChart as PieChartIcon, TrendingUp, Layers, Shield, Hammer
} from "lucide-react";
import { toast } from "@/lib/toast";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ComposedChart, Line, Area, AreaChart, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";


const COLORS = {
  available: "#10b981", // emerald-500
  sold: "#f43f5e",      // rose-500
  reserved: "#f59e0b",  // amber-500
  underConstruction: "#8b5cf6", // violet-500
  issued: "#06b6d4",    // cyan-500
  notIssued: "#f43f5e",
  pending: "#f59e0b",
  notSpecified: "#94a3b8",
};

const CONSTRUCTION_COLORS = ["#10b981","#06b6d4","#8b5cf6","#f59e0b","#94a3b8","#f43f5e"];

interface PlotAnalytics {
  titleDeeds: { status: string; count: number }[];
  constructionStatus: { bucket: string; count: number }[];
  zonePlots: { zone: string; totalPlots: number; soldPlots: number; availablePlots: number; deedsIssued: number; deedsNotIssued: number; deedsPending: number }[];
  topBlocks: { id: string; blockNumber: number; zone: string; status: string; totalPlots: number; soldPlots: number; totalArea: number; deedsIssued: number }[];
}

type OccupancyFilter = "all" | "full" | "partial" | "empty";
function occupancyBucket(soldPlots: number, noOfPlots: number): OccupancyFilter {
  if (!noOfPlots) return "empty";
  const pct = Math.round((soldPlots / noOfPlots) * 100);
  if (pct === 100) return "full";
  if (pct === 0)   return "empty";
  return "partial";
}

export default function ReportsPage() {
  const { list, ready } = usePropertyStore();
  const [plotAnalytics, setPlotAnalytics] = useState<PlotAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [plotsList, setPlotsList] = useState<any[]>([]);
  const [plotsLoading, setPlotsLoading] = useState(true);
  const [ledgerSearch, setLedgerSearch] = useState("");

  useEffect(() => {
    fetch("/api/properties/plot-analytics")
      .then(r => r.json())
      .then(d => { setPlotAnalytics(d); setAnalyticsLoading(false); })
      .catch(() => setAnalyticsLoading(false));

    fetch("/api/plots")
      .then(r => r.json())
      .then(d => { setPlotsList(d); setPlotsLoading(false); })
      .catch(() => setPlotsLoading(false));
  }, []);

  // State variables for plot-centric filters
  const [plotTypeFilter, setPlotTypeFilter] = useState<string>("all");
  const [deedsFilter, setDeedsFilter] = useState<string>("all");
  const [constructionFilter, setConstructionFilter] = useState<string>("all");
  const [contractorFilter, setContractorFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  // Get dynamic unique contractor names from plots
  const contractorsList = useMemo(() => {
    const names = new Set<string>();
    plotsList.forEach(p => {
      if (p.contractorName && p.contractorName.trim()) {
        names.add(p.contractorName.trim());
      }
    });
    return Array.from(names).sort();
  }, [plotsList]);

  // Get dynamic unique buyer groups from plots
  const groupsList = useMemo(() => {
    const groups = new Set<string>();
    plotsList.forEach(p => {
      if (p.buyerGroup && p.buyerGroup.trim()) {
        groups.add(p.buyerGroup.trim());
      }
    });
    return Array.from(groups).sort();
  }, [plotsList]);

  // Construction bucket mapper helper
  function getConstructionBucket(status: string): string {
    const s = (status || "").toLowerCase().trim();
    if (s.includes("completed") || s.includes("occupied")) return "Completed / Occupied";
    if (s.includes("plastering") || s.includes("finishing")) return "Plastering / Finishing";
    if (s.includes("block work") || s.includes("roof")) return "Block Work + Roofing";
    if (s.includes("slab") || s.includes("foundation") || s.includes("column") || s.includes("stonemason") || s.includes("grade beam")) return "Foundation / Structure";
    if (s.includes("bare land") || s === "") return "Bare Land / Not Started";
    return "Other";
  }

  // Helper to determine if a plot is sold
  const isPlotSold = (purchaser: string) => {
    const name = (purchaser || "").toLowerCase().trim();
    return name && !name.includes("tulu dimtu") && !name.includes("under review") && !name.includes("???") && name !== "community center";
  };

  // 1. Computed list of plots for the detailed ledger, dynamically filtered
  const filteredPlots = useMemo(() => {
    let data = [...plotsList];

    // Zone filter
    if (zoneFilter !== "all") {
      data = data.filter(p => p.zone === zoneFilter);
    }

    // Plot Type (Active vs Sold) filter
    if (plotTypeFilter !== "all") {
      if (plotTypeFilter === "sold") {
        data = data.filter(p => isPlotSold(p.purchaserName));
      } else if (plotTypeFilter === "active") {
        data = data.filter(p => !isPlotSold(p.purchaserName));
      }
    }

    // Title Deeds Status filter
    if (deedsFilter !== "all") {
      if (deedsFilter === "Not Specified") {
        data = data.filter(p => !p.titleDeedsStatus || p.titleDeedsStatus.trim() === "" || p.titleDeedsStatus === "Not Specified" || p.titleDeedsStatus === "N/A");
      } else {
        data = data.filter(p => p.titleDeedsStatus === deedsFilter);
      }
    }

    // Construction Status filter
    if (constructionFilter !== "all") {
      data = data.filter(p => getConstructionBucket(p.constructionStatus) === constructionFilter);
    }

    // Contractor filter
    if (contractorFilter !== "all") {
      data = data.filter(p => p.contractorName === contractorFilter);
    }

    // Buyer Group filter (e.g. Panorama)
    if (groupFilter !== "all") {
      data = data.filter(p => (p.buyerGroup ?? "").trim() === groupFilter);
    }

    // Ledger Search input
    if (ledgerSearch) {
      const q = ledgerSearch.toLowerCase();
      data = data.filter(p =>
        String(p.blockNumber).includes(q) ||
        String(p.plotNumber).toLowerCase().includes(q) ||
        (p.purchaserName || "").toLowerCase().includes(q) ||
        (p.contractorName || "").toLowerCase().includes(q) ||
        (p.constructionStatus || "").toLowerCase().includes(q) ||
        (p.buyerGroup || "").toLowerCase().includes(q) ||
        (p.remark || "").toLowerCase().includes(q)
      );
    }

    return data;
  }, [plotsList, zoneFilter, plotTypeFilter, deedsFilter, constructionFilter, contractorFilter, groupFilter, ledgerSearch]);

  // 2. Summary widgets based on filtered plots
  const summary = useMemo(() => {
    const totalPlots = filteredPlots.length;
    
    // Total blocks represented by filtered plots
    const uniqueBlocks = new Set(filteredPlots.map(p => p.blockId));
    const totalBlocks = uniqueBlocks.size;
    
    const soldCount = filteredPlots.filter(p => isPlotSold(p.purchaserName)).length;
    const availCount = totalPlots - soldCount;
    
    const totalArea = filteredPlots.reduce((sum, p) => sum + (p.plotSize || 0), 0);
    
    return { totalBlocks, totalPlots, totalSoldPlots: soldCount, totalAvailPlots: availCount, totalArea };
  }, [filteredPlots]);

  // Chart 1: Status Distribution (Pie of Plots)
  const statusData = useMemo(() => {
    const sold = filteredPlots.filter(p => isPlotSold(p.purchaserName)).length;
    const avail = filteredPlots.length - sold;
    return [
      { name: "Available Plots", value: avail, color: COLORS.available },
      { name: "Sold Plots", value: sold, color: COLORS.sold }
    ].filter(d => d.value > 0);
  }, [filteredPlots]);

  // Chart 2: Zone vs Plots Stacked Bar Chart
  const zoneValueData = useMemo(() => {
    const zones = ["Zone I G+1", "Zone II G+0"] as const;
    return zones.map(zone => {
      const zonePlots = filteredPlots.filter(p => p.zone === zone);
      const sold = zonePlots.filter(p => isPlotSold(p.purchaserName)).length;
      const avail = zonePlots.length - sold;
      return {
        name: zone,
        AvailablePlots: avail,
        SoldPlots: sold,
      };
    }).filter(d => d.AvailablePlots > 0 || d.SoldPlots > 0);
  }, [filteredPlots]);

  // Chart 3: Area vs Plots by Block
  const blockTrendData = useMemo(() => {
    const blocksMap: Record<number, { name: string; Plots: number; Area: number }> = {};
    filteredPlots.forEach(p => {
      const b = p.blockNumber;
      if (!blocksMap[b]) {
        blocksMap[b] = { name: `B-${b}`, Plots: 0, Area: 0 };
      }
      blocksMap[b].Plots++;
      blocksMap[b].Area += (p.plotSize || 0);
    });
    return Object.keys(blocksMap)
      .map(Number)
      .sort((a, b) => a - b)
      .slice(0, 20)
      .map(b => blocksMap[b]);
  }, [filteredPlots]);

  // Chart 4: Title Deeds Status from filtered plots
  const titleDeedsChartData = useMemo(() => {
    const counts: Record<string, number> = { "ISSUED": 0, "NOT ISSUED": 0, "PENDING": 0, "Not Specified": 0 };
    filteredPlots.forEach(p => {
      const status = p.titleDeedsStatus || "Not Specified";
      const cleanStatus = (status.trim() === "" || status === "N/A") ? "Not Specified" : status;
      counts[cleanStatus] = (counts[cleanStatus] || 0) + 1;
    });
    const colorMap: Record<string, string> = {
      "ISSUED": COLORS.issued,
      "NOT ISSUED": COLORS.notIssued,
      "PENDING": COLORS.pending,
      "Not Specified": COLORS.notSpecified,
    };
    return Object.keys(counts).map(statusName => ({
      name: statusName,
      value: counts[statusName],
      color: colorMap[statusName] || "#94a3b8",
    })).filter(d => d.value > 0);
  }, [filteredPlots]);

  // Chart 5: Zone-level plot analysis dynamically from filtered plots
  const zonePlotChartData = useMemo(() => {
    const zones = ["Zone I G+1", "Zone II G+0"] as const;
    return zones.map(zone => {
      const zonePlots = filteredPlots.filter(p => p.zone === zone);
      const sold = zonePlots.filter(p => isPlotSold(p.purchaserName)).length;
      const avail = zonePlots.length - sold;
      const deeds = zonePlots.filter(p => p.titleDeedsStatus === "ISSUED").length;
      return {
        name: zone === "Zone I G+1" ? "Zone I" : "Zone II",
        "Total Plots": zonePlots.length,
        "Sold": sold,
        "Available": avail,
        "Deeds Issued": deeds,
      };
    });
  }, [filteredPlots]);

  // Chart 6: Dynamic Construction Status Breakdown from filtered plots
  const constructionChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredPlots.forEach(p => {
      const bucket = getConstructionBucket(p.constructionStatus);
      counts[bucket] = (counts[bucket] || 0) + 1;
    });
    return Object.keys(counts).map(bucket => ({
      bucket,
      count: counts[bucket],
    })).sort((a, b) => b.count - a.count);
  }, [filteredPlots]);




  const groupedLedger = useMemo(() => {
    const zones: Record<string, Record<number, any[]>> = {};

    filteredPlots.forEach(plot => {
      const z = plot.zone;
      const b = plot.blockNumber;
      if (!zones[z]) zones[z] = {};
      if (!zones[z][b]) zones[z][b] = [];
      zones[z][b].push(plot);
    });

    return Object.keys(zones).sort().map(zoneName => {
      const blocksMap = zones[zoneName];
      const blocks = Object.keys(blocksMap)
        .map(Number)
        .sort((a, b) => a - b)
        .map(blockNum => ({
          blockNumber: blockNum,
          // Use blockLabel from the first plot in this block (all plots same block)
          blockLabel: (blocksMap[blockNum][0]?.blockLabel ?? null) as string | null,
          plots: blocksMap[blockNum],
        }));
      return {
        zoneName,
        blocks,
      };
    });
  }, [filteredPlots]);

  const handleExportCSV = () => {
    if (filteredPlots.length === 0) {
      toast.warning("No data to export based on current filters.");
      return;
    }

    try {
      // EXACT columns as Tulu Dimtu Inventory.xlsx
      const headers = [
        "Block No.", "Plot No.", "Plot Size", "Built-up Area", 
        "Purchaser Name", "Title Deeds Status", "Contractor", "Construction Status", "Remark"
      ];

      const rows = filteredPlots.map(p => [
        p.blockNumber, 
        p.plotNumber, 
        p.plotSize || "", 
        p.builtArea || "",
        `"${(p.purchaserName || "").replace(/"/g, '""')}"`,
        `"${(p.titleDeedsStatus || "").replace(/"/g, '""')}"`,
        `"${(p.contractorName || "").replace(/"/g, '""')}"`,
        `"${(p.constructionStatus || "").replace(/"/g, '""')}"`,
        `"${(p.remark || "").replace(/"/g, '""')}"`
      ]);

      // Using BOM (\uFEFF) for proper UTF-8 Excel compatibility
      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Tulu_Dimtu_Inventory_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Detailed ledger exported exactly like Excel spreadsheet!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export ledger.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 font-semibold">Loading Analytics…</div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-foreground pb-20 relative print:bg-white print:pb-0">
      {/* Background Decor - hidden on print */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none print:hidden" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-10 relative z-10">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 print:mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4 print:hidden">
              <BarChartIcon size={14} /> Executive Analytics
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 text-slate-900">
              Portfolio Intelligence Report
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl print:text-sm">
              Comprehensive analytics, valuation metrics, and block inventory performance.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 print:hidden shrink-0">
            <button 
              onClick={handlePrint}
              className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all duration-300 flex items-center gap-2"
            >
              <Printer size={18} /> Print Report
            </button>
            <button 
              onClick={handleExportCSV}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all duration-300 flex items-center gap-2"
            >
              <Download size={18} /> Export Dataset
            </button>
          </div>
        </div>

        {/* Filters - hidden on print */}
        <Card className="border border-slate-200/60 shadow-sm bg-white mb-8 rounded-2xl print:hidden">
          <CardContent className="p-4 sm:p-6 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2 text-slate-500 font-semibold shrink-0">
              <Filter size={18} /> Plot Parameters & Filters:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">

              {/* 1. Plot Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plot Type</label>
                <select
                  value={plotTypeFilter}
                  onChange={(e) => { setPlotTypeFilter(e.target.value); }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="all">All Plots (Active & Sold)</option>
                  <option value="active">Active Only (Available)</option>
                  <option value="sold">Sold Only</option>
                </select>
              </div>

              {/* 2. Zone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zone</label>
                <select
                  value={zoneFilter}
                  onChange={(e) => { setZoneFilter(e.target.value); }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="all">All Zones</option>
                  <option value="Zone I G+1">Zone I G+1</option>
                  <option value="Zone II G+0">Zone II G+0</option>
                </select>
              </div>

              {/* 3. Title Deeds Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Title Deeds Status</label>
                <select
                  value={deedsFilter}
                  onChange={(e) => { setDeedsFilter(e.target.value); }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="all">All Deed Statuses</option>
                  <option value="ISSUED">ISSUED</option>
                  <option value="NOT ISSUED">NOT ISSUED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="Not Specified">Not Specified / Blank</option>
                </select>
              </div>

              {/* 4. Construction Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Construction Status</label>
                <select
                  value={constructionFilter}
                  onChange={(e) => { setConstructionFilter(e.target.value); }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="all">All Progress Stages</option>
                  <option value="Completed / Occupied">Completed / Occupied</option>
                  <option value="Plastering / Finishing">Plastering / Finishing</option>
                  <option value="Block Work + Roofing">Block Work + Roofing</option>
                  <option value="Foundation / Structure">Foundation / Structure</option>
                  <option value="Bare Land / Not Started">Bare Land / Not Started</option>
                  <option value="Other">Other / Uncategorized</option>
                </select>
              </div>

              {/* 5. Contractor */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contractor</label>
                <select
                  value={contractorFilter}
                  onChange={(e) => { setContractorFilter(e.target.value); }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="all">All Contractors</option>
                  {contractorsList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 6. Buyer Group — Panorama */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-500"></span>
                  Buyer Group
                </label>
                <select
                  value={groupFilter}
                  onChange={(e) => { setGroupFilter(e.target.value); }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition-all"
                >
                  <option value="all">All Purchasers</option>
                  <option value="Panorama">🟠 Panorama Group</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Executive Summary Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border border-slate-200/60 shadow-sm rounded-2xl print:shadow-none print:border-slate-300">
            <CardContent className="p-4 sm:p-5 flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 print:border print:border-slate-200">
                <FileSpreadsheet size={22} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Assets</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{summary.totalBlocks} <span className="text-sm font-semibold text-slate-400 ml-1">Blocks</span></div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-slate-200/60 shadow-sm rounded-2xl print:shadow-none print:border-slate-300">
            <CardContent className="p-4 sm:p-5 flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 print:border print:border-slate-200">
                <Layers size={22} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Plots</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{summary.totalPlots}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/60 shadow-sm rounded-2xl print:shadow-none print:border-slate-300">
            <CardContent className="p-4 sm:p-5 flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 print:border print:border-slate-200">
                <CircleDollarSign size={22} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sold Plots</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{summary.totalSoldPlots}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/60 shadow-sm rounded-2xl print:shadow-none print:border-slate-300">
            <CardContent className="p-4 sm:p-5 flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 print:border print:border-slate-200">
                <CheckCircle2 size={22} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Available Plots</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{summary.totalAvailPlots}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visual Analytics - Multiple Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:block print:space-y-6">
          
          {/* Status Distribution Pie Chart */}
          <Card className="border border-slate-200/60 shadow-sm bg-white rounded-2xl print:shadow-none print:break-inside-avoid">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <PieChartIcon className="text-indigo-600" size={20} /> Inventory Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-full sm:w-1/2 h-[220px]">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 600 }}
                        formatter={(value: any) => [`${value} Blocks`, "Count"]}
                      />
                      <Pie
                        data={statusData}
                        cx="50%" cy="50%"
                        innerRadius={65} outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">No data available</div>
                )}
              </div>
              <div className="w-full sm:w-1/2 space-y-4">
                {statusData.map((stat) => (
                  <div key={stat.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: stat.color }} />
                      <span className="font-semibold text-slate-600 text-sm">{stat.name}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">
                      {stat.value} <span className="text-slate-400 font-medium text-[10px] ml-1">({summary.totalPlots > 0 ? Math.round((stat.value / summary.totalPlots) * 100) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>          {/* Plots Distribution by Zone Bar Chart */}
          <Card className="border border-slate-200/60 shadow-sm bg-white rounded-2xl print:shadow-none print:break-inside-avoid">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Layers className="text-emerald-600" size={20} /> Plots Distribution by Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[260px]">
              {zoneValueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={zoneValueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 600 }}
                      formatter={(value: any) => [`${value} Plots`, "Count"]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar name="Sold Plots" dataKey="SoldPlots" stackId="a" fill={COLORS.sold} radius={[0, 0, 4, 4]} />
                    <Bar name="Available Plots" dataKey="AvailablePlots" stackId="a" fill={COLORS.available} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Area vs Plots Distribution (Full Width) */}
          <Card className="lg:col-span-2 border border-slate-200/60 shadow-sm bg-white rounded-2xl print:shadow-none print:break-inside-avoid">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Layers className="text-amber-600" size={20} /> Area vs Plot Density (Sampled Blocks)
              </CardTitle>
              <CardDescription>Visualizing the relationship between total area and number of plots per block.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 h-[300px]">
              {blockTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={blockTrendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 600 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area yAxisId="left" type="monotone" name="Total Area (m²)" dataKey="Area" fill="#fef3c7" stroke="#f59e0b" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" name="Number of Plots" dataKey="Plots" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* NEW: Plot-Level Analytics Section */}
        {filteredPlots.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:block print:space-y-6">
            
            {/* Title Deeds Status Pie */}
            <Card className="border border-slate-200/60 shadow-sm bg-white rounded-2xl print:shadow-none print:break-inside-avoid">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Shield className="text-cyan-600" size={20} /> Title Deeds Status
                </CardTitle>
                <CardDescription>Breakdown of title deed issuance across {summary.totalPlots} plots</CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-full sm:w-1/2 h-[220px]">
                  {titleDeedsChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 600 }}
                          formatter={(value: any) => [`${value} Plots`, "Count"]}
                        />
                        <Pie data={titleDeedsChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                          {titleDeedsChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data</div>}
                </div>
                <div className="w-full sm:w-1/2 space-y-3">
                  {titleDeedsChartData.map(d => {
                    const total = summary.totalPlots;
                    return (
                      <div key={d.name} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="font-semibold text-slate-600 text-sm">{d.name}</span>
                        </div>
                        <div className="font-bold text-slate-900 text-sm">
                          {d.value} <span className="text-slate-400 font-medium text-[10px] ml-1">({total > 0 ? Math.round((d.value/total)*100) : 0}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Construction Status Bar */}
            <Card className="border border-slate-200/60 shadow-sm bg-white rounded-2xl print:shadow-none print:break-inside-avoid">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Hammer className="text-violet-600" size={20} /> Construction Status Breakdown
                </CardTitle>
                <CardDescription>Progress stages across plots in the inventory</CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[280px]">
                {constructionChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={constructionChartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis type="category" dataKey="bucket" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={130} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 600 }}
                        formatter={(value: any) => [`${value} Plots`, "Count"]}
                      />
                      <Bar dataKey="count" name="Plots" radius={[0, 4, 4, 0]}>
                        {constructionChartData.map((_, i) => (
                          <Cell key={i} fill={CONSTRUCTION_COLORS[i % CONSTRUCTION_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data</div>}
              </CardContent>
            </Card>

            {/* Zone-Level Plot Analysis (Full Width) */}
            <Card className="lg:col-span-2 border border-slate-200/60 shadow-sm bg-white rounded-2xl print:shadow-none print:break-inside-avoid">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Layers className="text-indigo-600" size={20} /> Zone-Level Plot Analysis
                </CardTitle>
                <CardDescription>Comparison of total, sold, available plots and title deeds issued by zone</CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[280px]">
                {zonePlotChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={zonePlotChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 600 }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar name="Total Plots" dataKey="Total Plots" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar name="Sold" dataKey="Sold" fill={COLORS.sold} radius={[4, 4, 0, 0]} />
                      <Bar name="Available" dataKey="Available" fill={COLORS.available} radius={[4, 4, 0, 0]} />
                      <Bar name="Deeds Issued" dataKey="Deeds Issued" fill={COLORS.issued} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data</div>}
              </CardContent>
            </Card>

          </div>
        )}

        {/* Detailed Data Table */}
        <Card className="border border-slate-200/60 shadow-sm bg-white rounded-2xl overflow-hidden print:shadow-none print:border-slate-300 print:break-before-page">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50/50 gap-4">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="text-indigo-600" size={18} /> Detailed Inventory Ledger
              </h3>
              <p className="text-xs text-slate-500 mt-1">Replicating columns and styles from Tulu Dimtu Inventory.xlsx</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
              <input
                type="text"
                value={ledgerSearch}
                onChange={e => { setLedgerSearch(e.target.value); }}
                placeholder="Search purchaser, contractor, plot..."
                className="px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 min-w-[200px]"
              />
              <Badge variant="outline" className="bg-white justify-center shrink-0">{filteredPlots.length} Records</Badge>
            </div>
          </div>
          
          <div className="p-3 bg-[#f1f5f9]">
            <div className="overflow-auto" style={{ maxHeight: "72vh" }}>
            {plotsLoading ? (
              <div className="py-12 text-center text-slate-400 font-medium bg-white rounded-xl border border-slate-200">
                Loading Ledger Data...
              </div>
            ) : filteredPlots.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium bg-white rounded-xl border border-slate-200">
                No plots match the selected filter parameters.
              </div>
            ) : (
              groupedLedger.map((zone, zoneIdx) => (
                <div key={zone.zoneName} className="mb-10 last:mb-0 bg-white border border-slate-300 shadow-sm print:break-inside-avoid">
                  {/* Zone Header Row */}
                  <div className="text-center py-1.5 bg-white border-b border-slate-300">
                    <h2 className="text-sm font-extrabold text-slate-950 tracking-wide uppercase">{zone.zoneName}</h2>
                  </div>

                  <table className="w-full text-[10px] table-auto border-collapse">
                    <colgroup>
                      <col style={{ width: "46px" }} />   {/* Block No. */}
                      <col style={{ width: "44px" }} />   {/* Plot No. */}
                      <col style={{ width: "58px" }} />   {/* Plot Size */}
                      <col style={{ width: "54px" }} />   {/* Built-up Area */}
                      <col style={{ width: "170px" }} />  {/* Purchaser Name */}
                      <col style={{ width: "88px" }} />   {/* Title Deeds Status */}
                      <col style={{ width: "80px" }} />   {/* Contractor */}
                      <col style={{ width: "130px" }} />  {/* Construction Status */}
                      <col />                             {/* Remark — fills rest */}
                    </colgroup>
                    <thead>
                      <tr className="bg-[#92d050] text-slate-900 border-b border-slate-300 font-bold">
                        <th className="border border-slate-300 px-1.5 py-1 text-left text-[10px] font-bold whitespace-nowrap">Block No.</th>
                        <th className="border border-slate-300 px-1.5 py-1 text-center text-[10px] font-bold whitespace-nowrap">Plot No.</th>
                        <th className="border border-slate-300 px-1.5 py-1 text-center text-[10px] font-bold whitespace-nowrap">Plot Size<br />(Sq.M)</th>
                        <th className="border border-slate-300 px-1.5 py-1 text-left text-[10px] font-bold whitespace-nowrap">Built-up<br />Area</th>
                        <th className="border border-slate-300 px-1.5 py-1 text-left text-[10px] font-bold whitespace-nowrap">Purchaser Name</th>
                        <th className="border border-slate-300 px-1.5 py-1 text-center text-[10px] font-bold whitespace-nowrap">Title Deeds<br />Status</th>
                        <th className="border border-slate-300 px-1.5 py-1 text-left text-[10px] font-bold whitespace-nowrap">Contractor</th>
                        <th className="border border-slate-300 px-1.5 py-1 text-left text-[10px] font-bold whitespace-nowrap">Construction Status</th>
                        <th className="border border-slate-300 px-1.5 py-1 text-left text-[10px] font-bold whitespace-nowrap">Remark\Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zone.blocks.map((block, blockIdx) => (
                        <React.Fragment key={block.blockNumber}>
                          {block.plots.map((plot, plotIdx) => {
                            const isTuluDimtu = (plot.purchaserName || "").toLowerCase().includes("tulu dimtu");
                            const isPanorama   = (plot.buyerGroup ?? "").trim().toLowerCase() === "panorama";
                            return (
                              <tr key={plot.id} className="hover:bg-amber-50/30 bg-white text-slate-800">
                                {/* Merged Block No. cell */}
                                {plotIdx === 0 && (
                                  <td
                                    rowSpan={block.plots.length}
                                    className="border border-slate-300 px-1 py-1 text-center align-middle font-black text-xl text-slate-900 bg-white leading-none"
                                  >
                                    {block.blockLabel ?? block.blockNumber}
                                  </td>
                                )}
                                <td className="border border-slate-300 px-1.5 py-0.5 text-center text-indigo-600 font-bold whitespace-nowrap">{plot.plotNumber}</td>
                                <td className="border border-slate-300 px-1.5 py-0.5 text-center text-slate-900 font-medium whitespace-nowrap">{plot.plotSize || "—"}</td>
                                <td className="border border-slate-300 px-1.5 py-0.5 text-left text-slate-600 font-medium whitespace-nowrap">{plot.builtArea || "—"}</td>
                                <td
                                  className={`border border-slate-300 px-1.5 py-0.5 text-left overflow-hidden text-ellipsis whitespace-nowrap ${
                                    isPanorama  ? "text-orange-500 font-bold" :
                                    isTuluDimtu ? "text-[#7030a0] font-bold" :
                                    "text-slate-900 font-semibold"
                                  }`}
                                  title={plot.purchaserName}
                                >
                                  {plot.purchaserName || <span className="text-slate-300 font-normal italic">—</span>}
                                </td>
                                <td className="border border-slate-300 px-1.5 py-0.5 text-center font-bold text-slate-800 whitespace-nowrap">
                                  {plot.titleDeedsStatus || "—"}
                                </td>
                                <td className="border border-slate-300 px-1.5 py-0.5 text-left text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis" title={plot.contractorName}>{plot.contractorName || "—"}</td>
                                <td className="border border-slate-300 px-1.5 py-0.5 text-left text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis" title={plot.constructionStatus}>
                                  {plot.constructionStatus || "—"}
                                </td>
                                <td className="border border-slate-300 px-1.5 py-0.5 text-left text-slate-600 font-normal leading-snug">{plot.remark || "—"}</td>
                              </tr>
                            );
                          })}
                          {/* Divider row between blocks */}
                          {blockIdx < zone.blocks.length - 1 && (
                            <tr className="bg-[#7f7f7f]">
                              <td colSpan={9} className="border border-slate-300 py-1"></td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>

                </div>
              ))
            )}
            </div>
          </div>

        </Card>

      </div>
    </div>
  );
}

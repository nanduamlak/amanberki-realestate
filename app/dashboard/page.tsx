"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRole } from "@/lib/RoleContext";
import { usePropertyStore } from "@/lib/usePropertyStore";
import { useRouter } from "next/navigation";
import { formatPriceRange } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  HardHat,
  BarChart3,
  Maximize,
  TrendingUp,
  Map,
  ArrowUpRight,
  Sparkles,
  PieChart as PieChartIcon,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Ruler,
  GitFork,
  Route
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { toast } from "@/lib/toast";

export default function DashboardPage() {
  const router = useRouter();
  const { isSuperAdmin, isAdmin } = useRole();
  const canManage = isSuperAdmin || isAdmin;

  // Show welcome toast exactly once after login redirect
  useEffect(() => {
    const msg = sessionStorage.getItem("welcome_toast");
    if (msg) {
      sessionStorage.removeItem("welcome_toast");
      setTimeout(() => toast.success(msg), 300);
    }
  }, []);

  const { list, reset: resetStore } = usePropertyStore();

  const [plotAnalytics, setPlotAnalytics] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch analytics from DB ────────────────────────────────
  const loadAnalytics = useCallback(async () => {
    try {
      const d = await fetch("/api/properties/plot-analytics").then(r => r.json());
      setPlotAnalytics(d);
    } catch (err) {
      console.error("[Dashboard] Failed to load plot analytics:", err);
    }
  }, []);

  // Force-reload everything on mount (ensures fresh data after editing plots)
  useEffect(() => {
    resetStore();
    loadAnalytics();
  }, [resetStore, loadAnalytics]);

  // Re-fetch when user tabs back to this page
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        resetStore();
        loadAnalytics();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [resetStore, loadAnalytics]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([resetStore(), loadAnalytics()]);
    setRefreshing(false);
  }, [resetStore, loadAnalytics]);

  // ── KPI values — prefer live DB summary, fall back to list ──
  const dbSummary = plotAnalytics?.summary;

  const totalBlocks      = dbSummary?.totalBlocks      ?? list.length;
  const totalPlots       = dbSummary?.totalPlots       ?? list.reduce((s, p) => s + (p.noOfPlots || 0), 0);
  const totalSoldPlots   = dbSummary?.soldPlots        ?? list.reduce((s, p) => s + (p.soldPlots || 0), 0);
  const totalActivePlots = dbSummary?.activePlots      ?? list.reduce((s, p) => s + (p.activePlots || 0), 0);
  const totalArea        = dbSummary?.totalArea        ?? list.reduce((s, p) => s + (p.area || 0), 0);

  const deedsIssued    = plotAnalytics?.titleDeeds?.find((x: any) => x.status === "ISSUED")?.count    || 0;
  const deedsNotIssued = plotAnalytics?.titleDeeds?.find((x: any) => x.status === "NOT ISSUED")?.count || 0;
  const deedsPending   = plotAnalytics?.titleDeeds?.find((x: any) => x.status === "PENDING")?.count   || 0;

  // Derived block counts from real plot ratios
  const counts = {
    fullySold:     list.filter((p) => p.soldPlots === p.noOfPlots && p.noOfPlots > 0).length,
    empty:         list.filter((p) => p.soldPlots === 0).length,
    partiallySold: list.filter((p) => p.soldPlots > 0 && p.soldPlots < p.noOfPlots).length,
  };

  const totalValue = list.reduce((s, p) => s + (p.price || 0), 0);
  const avgPrice   = totalBlocks > 0 ? Math.round(totalValue / totalBlocks) : 0;

  // Show blocks with actual sold/available plots sorted by counts
  const recentSold  = [...list].filter((p) => p.soldPlots > 0).sort((a, b) => b.soldPlots - a.soldPlots).slice(0, 5);
  const recentAvail = [...list].filter((p) => p.activePlots > 0).sort((a, b) => b.activePlots - a.activePlots).slice(0, 5);

  const kpis = [
    { label: "Total Blocks",       value: totalBlocks,                          sub: `${totalPlots} total plots`,      icon: <Building2 size={18} />,       color: "text-slate-700",  bg: "bg-slate-100"  },
    { label: "Active Plots",       value: totalActivePlots,                     sub: "Available for sale",             icon: <CheckCircle2 size={18} />,     color: "text-emerald-600",bg: "bg-emerald-50" },
    { label: "Sold Plots",         value: totalSoldPlots,                       sub: "Successfully closed",            icon: <CircleDollarSign size={18} />, color: "text-rose-600",   bg: "bg-rose-50"    },
    { label: "Fully Sold Blocks",  value: counts.fullySold,                     sub: `${counts.partiallySold} partially sold`, icon: <Sparkles size={18} />, color: "text-purple-600", bg: "bg-purple-50"  },
    { label: "Total Area",         value: `${Math.round(totalArea).toLocaleString()} m²`, sub: "Across all plots",    icon: <Map size={18} />,              color: "text-amber-600",  bg: "bg-amber-50"   },
    { label: "Deeds Issued",       value: deedsIssued,                          sub: "Title deeds ready",              icon: <ShieldCheck size={18} />,      color: "text-indigo-600", bg: "bg-indigo-50"  },
    { label: "Deeds Not Issued",   value: deedsNotIssued,                       sub: "Title deeds missing",            icon: <ShieldAlert size={18} />,      color: "text-rose-600",   bg: "bg-rose-50"    },
    { label: "Deeds Pending",      value: deedsPending,                         sub: "In progress",                    icon: <Clock size={18} />,            color: "text-amber-600",  bg: "bg-amber-50"   },
  ];

  // Chart Data: Plot occupancy
  const statusData = [
    { name: "Available Plots", value: totalActivePlots, color: "#10b981" },
    { name: "Sold Plots", value: totalSoldPlots, color: "#f43f5e" }
  ].filter(d => d.value > 0);

  const zoneData = (["Zone I G+1", "Zone II G+0"] as const).map(zone => {
    const zoneProps = list.filter((p) => p.zone === zone);
    const sold = zoneProps.reduce((sum, p) => sum + (p.soldPlots || 0), 0);
    const avail = zoneProps.reduce((sum, p) => sum + (p.activePlots || 0), 0);
    return {
      name: `${zone}`,
      Available: avail,
      Sold: sold,
    };
  });

  // Zone-Level Plot Analysis chart data (from plotAnalytics API)
  const zonePlotChartData = useMemo(() => {
    if (!plotAnalytics?.zonePlots) {
      // Fallback: derive from block list
      return (["Zone I G+1", "Zone II G+0"] as const).map(zone => {
        const zoneProps = list.filter((p) => p.zone === zone);
        const total = zoneProps.reduce((sum, p) => sum + (p.noOfPlots || 0), 0);
        const sold = zoneProps.reduce((sum, p) => sum + (p.soldPlots || 0), 0);
        const avail = zoneProps.reduce((sum, p) => sum + (p.activePlots || 0), 0);
        return {
          name: zone === "Zone I G+1" ? "Zone I" : "Zone II",
          "Total Plots": total,
          "Sold": sold,
          "Available": avail,
          "Deeds Issued": 0,
        };
      });
    }
    return plotAnalytics.zonePlots.map((z: any) => ({
      name: z.zone === "Zone I G+1" ? "Zone I" : z.zone === "Zone II G+0" ? "Zone II" : z.zone,
      "Total Plots": z.totalPlots,
      "Sold": z.soldPlots,
      "Available": z.availablePlots,
      "Deeds Issued": z.deedsIssued,
    }));
  }, [plotAnalytics, list]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-foreground pb-20 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#0086D1]/5 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 py-10 relative z-10">

        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-widest flex w-max items-center gap-1.5">
              <Sparkles size={14} /> Analytics Hub
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600">
              Management Dashboard
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Real-time insights and portfolio performance for Aman Berki Properties.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`bg-white border border-border hover:border-primary/50 text-slate-700 hover:text-primary px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all duration-300 flex items-center gap-2 disabled:opacity-60 ${refreshing ? "cursor-wait" : ""}`}
            >
              <BarChart3 size={18} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing…" : "Refresh Stats"}
            </button>
            <button onClick={() => router.push("/properties")} className="bg-white border border-border hover:border-primary/50 text-slate-700 hover:text-primary px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all duration-300 flex items-center gap-2">
              View Properties <ArrowUpRight size={18} />
            </button>
            {canManage && (
              <button onClick={() => router.push("/properties")} className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all duration-300 flex items-center gap-2">
                Add Property
              </button>
            )}
          </div>
        </div>

        {/* Premium KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {kpis.map((item) => (
            <Card key={item.label} className="border border-slate-200/60 shadow-sm bg-white hover:border-slate-300 transition-colors duration-300 group rounded-2xl">
              <CardContent className="p-4 flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-500 text-[11px] tracking-wider uppercase mb-1">{item.label}</div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5">{item.value}</div>
                  <div className="text-[10px] text-slate-400 font-semibold leading-none">{item.sub}</div>
                </div>
                <div className={`p-2.5 rounded-xl ${item.bg} ${item.color} shrink-0`}>
                  {item.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Site Area Summary — fixed figures from DWG site plan */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Ruler size={15} className="text-slate-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Site Area Summary</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Total Net Area */}
            <Card className="border border-slate-200/60 shadow-sm bg-white hover:border-[#0086D1]/40 transition-colors duration-300 rounded-2xl">
              <CardContent className="p-4 flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-500 text-[11px] tracking-wider uppercase mb-1">Total Net Area</div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5">161,286 <span className="text-sm font-bold text-slate-400">m²</span></div>
                  <div className="text-[10px] text-slate-400 font-semibold leading-none">Total Net New Area</div>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <Map size={18} />
                </div>
              </CardContent>
            </Card>

            {/* Total Buffer Area */}
            <Card className="border border-slate-200/60 shadow-sm bg-white hover:border-amber-300/60 transition-colors duration-300 rounded-2xl">
              <CardContent className="p-4 flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-500 text-[11px] tracking-wider uppercase mb-1">Total Buffer Area</div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5">22,417 <span className="text-sm font-bold text-slate-400">m²</span></div>
                  <div className="text-[10px] text-slate-400 font-semibold leading-none">Total New Buffer Area</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                  <GitFork size={18} />
                </div>
              </CardContent>
            </Card>

            {/* Total Road Area */}
            <Card className="border border-slate-200/60 shadow-sm bg-white hover:border-emerald-300/60 transition-colors duration-300 rounded-2xl">
              <CardContent className="p-4 flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-500 text-[11px] tracking-wider uppercase mb-1">Total Road Area</div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5">35,032 <span className="text-sm font-bold text-slate-400">m²</span></div>
                  <div className="text-[10px] text-slate-400 font-semibold leading-none">Total Internal Road Area</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                  <Route size={18} />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Status breakdown Chart */}
          <Card className="border border-slate-200/60 shadow-sm bg-white hover:border-slate-300 transition-colors duration-300 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <PieChartIcon className="text-primary" size={20} /> Portfolio Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-8 h-64">
              <div className="w-full md:w-1/2 h-full min-h-[200px]">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 600 }}
                      itemStyle={{ color: '#0f172a' }}
                    />
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
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
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                {statusData.map((stat) => (
                  <div key={stat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: stat.color }} />
                      <span className="font-semibold text-slate-600">{stat.name}</span>
                    </div>
                    <div className="font-bold text-slate-900">
                      {stat.value} <span className="text-slate-400 font-normal text-xs ml-1">({totalPlots > 0 ? Math.round(stat.value / totalPlots * 100) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Zone Distribution Chart */}
          <Card className="border border-slate-200/60 shadow-sm bg-white hover:border-slate-300 transition-colors duration-300 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Map className="text-primary" size={20} /> Zone Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={zoneData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 600 }}
                  />
                  <Bar dataKey="Available" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Sold" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Zone-Level Plot Analysis */}
        <Card className="border border-slate-200/60 shadow-sm bg-white hover:border-slate-300 transition-colors duration-300 rounded-2xl">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <Layers className="text-indigo-600" size={20} /> Zone-Level Plot Analysis
            </CardTitle>
            <p className="text-sm text-slate-500 mt-0.5">Comparison of total, sold, available plots and title deeds issued by zone</p>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
            {zonePlotChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={zonePlotChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 600 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar name="Total Plots" dataKey="Total Plots" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar name="Sold" dataKey="Sold" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar name="Available" dataKey="Available" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar name="Deeds Issued" dataKey="Deeds Issued" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

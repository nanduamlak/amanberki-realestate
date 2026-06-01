"use client";
import { useEffect } from "react";
import { useRole } from "@/lib/RoleContext";
import { usePropertyStore } from "@/lib/usePropertyStore";
import { useRouter } from "next/navigation";
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
  PieChart as PieChartIcon
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
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
      // Slight delay so the Toaster is mounted and visible before firing
      setTimeout(() => toast.success(msg), 300);
    }
  }, []);

  const { list } = usePropertyStore();

  const totalBlocks = list.length;
  const totalPlots = list.reduce((sum, p) => sum + (p.noOfPlots || 0), 0);
  const totalSoldPlots = list.reduce((sum, p) => sum + (p.soldPlots || 0), 0);
  const totalActivePlots = list.reduce((sum, p) => sum + (p.activePlots || 0), 0);

  const counts = {
    available: list.filter((p) => p.status === "available").length,
    sold: list.filter((p) => p.status === "sold").length,
    reserved: list.filter((p) => p.status === "reserved").length,
    "under-construction": list.filter((p) => p.status === "under-construction").length,
  };

  const totalValue = list.filter((p) => p.status === "available").reduce((s, p) => s + (p.price || 0), 0);
  const soldValue = list.filter((p) => p.status === "sold").reduce((s, p) => s + (p.price || 0), 0);
  const avgPrice = totalBlocks > 0 ? Math.round(list.reduce((s, p) => s + (p.price || 0), 0) / totalBlocks) : 0;
  const totalArea = list.reduce((s, p) => s + (p.area || 0), 0);

  const recentSold = list.filter((p) => p.status === "sold").slice(0, 5);
  const recentAvail = list.filter((p) => p.status === "available").slice(0, 5);

  const kpis = [
    { label: "Total Blocks", value: totalBlocks, sub: `${totalPlots} total plots`, icon: <Building2 size={18} />, color: "text-slate-700", bg: "bg-slate-100" },
    { label: "Active Plots", value: totalActivePlots, sub: "Available for sale", icon: <CheckCircle2 size={18} />, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Sold Plots", value: totalSoldPlots, sub: "Successfully closed", icon: <CircleDollarSign size={18} />, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Construction", value: counts["under-construction"], sub: "Blocks in progress", icon: <HardHat size={18} />, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Area", value: `${totalArea.toLocaleString()} m²`, sub: "Across all blocks", icon: <Map size={18} />, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Avg. Block Price", value: `$${(avgPrice / 1000).toFixed(0)}K`, sub: "Average list price", icon: <BarChart3 size={18} />, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Available Value", value: `$${(totalValue / 1e6).toFixed(1)}M`, sub: "Market potential", icon: <TrendingUp size={18} />, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Realized Value", value: `$${(soldValue / 1e6).toFixed(1)}M`, sub: "Total sales", icon: <CircleDollarSign size={18} />, color: "text-teal-600", bg: "bg-teal-50" },
  ];

  // Chart Data
  const statusData = [
    { name: "Available", value: counts.available, color: "#10b981" },
    { name: "Sold", value: counts.sold, color: "#f43f5e" },
    { name: "Reserved", value: counts.reserved, color: "#f97316" },
    { name: "Construction", value: counts["under-construction"], color: "#a855f7" }
  ].filter(d => d.value > 0);

  const zoneData = (["Zone I G+1", "Zone II G+0"] as const).map(zone => {
    const zoneProps = list.filter((p) => p.zone === zone);
    return {
      name: `${zone}`,
      Available: zoneProps.filter(p => p.status === "available").length,
      Sold: zoneProps.filter(p => p.status === "sold").length,
      Other: zoneProps.filter(p => p.status === "reserved" || p.status === "under-construction").length,
    };
  });

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
              Real-time insights and portfolio performance for Aman Berki Estates.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
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

        {/* Charts Row */}
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
                      {stat.value} <span className="text-slate-400 font-normal text-xs ml-1">({totalBlocks > 0 ? Math.round(stat.value / totalBlocks * 100) : 0}%)</span>
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
                  <Bar dataKey="Other" stackId="a" fill="#cbd5e1" />
                  <Bar dataKey="Sold" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Available Highlight */}
          <Card className="border border-slate-200/60 shadow-sm bg-white hover:border-slate-300 transition-colors duration-300 rounded-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg text-green-600"><CheckCircle2 size={20} /></div>
                <span className="font-bold text-slate-900 text-lg">Available Blocks</span>
              </div>
              <button onClick={() => router.push("/properties")} className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">View all</button>
            </div>
            <div className="flex-1 p-2">
              {recentAvail.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center text-sm font-semibold">
                  <CheckCircle2 size={32} className="text-slate-200 mb-2" />
                  No available blocks found
                </div>
              ) : (
                recentAvail.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/property/${p.id}`)}
                    className="p-3 mx-2 my-1 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {p.blockNumber}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Block {p.blockNumber} ({p.noOfPlots} Plots)</div>
                        <div className="text-xs font-semibold text-slate-500 mt-0.5">{p.primaryPlots} · {p.zone} · {p.area}m²</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-slate-900">
                        {p.price > 0 ? `$${p.price.toLocaleString()}` : "Unlisted"}
                      </div>
                      <Badge variant="outline" className="border-green-200 text-green-600 bg-green-50 mt-1 uppercase text-[9px] tracking-widest px-2 py-0">Available</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Sold Highlight */}
          <Card className="border border-slate-200/60 shadow-sm bg-white hover:border-slate-300 transition-colors duration-300 rounded-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><CircleDollarSign size={20} /></div>
                <span className="font-bold text-slate-900 text-lg">Recently Sold Blocks</span>
              </div>
              <button onClick={() => router.push("/properties")} className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">View all</button>
            </div>
            <div className="flex-1 p-2">
              {recentSold.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center text-sm font-semibold">
                  <CircleDollarSign size={32} className="text-slate-200 mb-2" />
                  No recently sold blocks
                </div>
              ) : (
                recentSold.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/property/${p.id}`)}
                    className="p-3 mx-2 my-1 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                        {p.blockNumber}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Block {p.blockNumber} ({p.noOfPlots} Plots)</div>
                        <div className="text-xs font-semibold text-slate-500 mt-0.5">{p.primaryPlots} · {p.zone} · {p.area}m²</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-slate-900">
                        {p.price > 0 ? `$${p.price.toLocaleString()}` : "Unlisted"}
                      </div>
                      <Badge variant="outline" className="border-rose-200 text-rose-600 bg-rose-50 mt-1 uppercase text-[9px] tracking-widest px-2 py-0">Sold</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}

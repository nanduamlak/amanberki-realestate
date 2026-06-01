"use client";
import { useState, useMemo, useRef } from "react";
import { usePropertyStore } from "@/lib/usePropertyStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Download, Filter, FileSpreadsheet, BarChart as BarChartIcon, CheckCircle2, CircleDollarSign, Map, Printer, PieChart as PieChartIcon, TrendingUp, Layers
} from "lucide-react";
import { toast } from "@/lib/toast";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ComposedChart, Line, Area, AreaChart 
} from "recharts";

const COLORS = {
  available: "#10b981", // emerald-500
  sold: "#f43f5e",      // rose-500
  reserved: "#f59e0b",  // amber-500
  underConstruction: "#8b5cf6" // violet-500
};

export default function ReportsPage() {
  const { list, ready } = usePropertyStore();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");

  const filteredData = useMemo(() => {
    let data = [...list];
    if (statusFilter !== "all") data = data.filter((p) => p.status === statusFilter);
    if (zoneFilter !== "all") data = data.filter((p) => p.zone === zoneFilter);
    
    // Price Filter
    if (priceFilter === "unlisted") data = data.filter(p => p.price === 0);
    else if (priceFilter === "under500k") data = data.filter(p => p.price > 0 && p.price < 500000);
    else if (priceFilter === "500k-1m") data = data.filter(p => p.price >= 500000 && p.price <= 1000000);
    else if (priceFilter === "over1m") data = data.filter(p => p.price > 1000000);

    // Area Filter
    if (areaFilter === "small") data = data.filter(p => p.area < 2000);
    else if (areaFilter === "medium") data = data.filter(p => p.area >= 2000 && p.area <= 5000);
    else if (areaFilter === "large") data = data.filter(p => p.area > 5000);

    return data;
  }, [list, statusFilter, zoneFilter, priceFilter, areaFilter]);

  const summary = useMemo(() => {
    const totalBlocks = filteredData.length;
    const totalPlots = filteredData.reduce((sum, p) => sum + (p.noOfPlots || 0), 0);
    const totalArea = filteredData.reduce((sum, p) => sum + (p.area || 0), 0);
    const totalValue = filteredData.reduce((sum, p) => sum + (p.price || 0), 0);
    const soldValue = filteredData.filter(p => p.status === 'sold').reduce((sum, p) => sum + (p.price || 0), 0);
    
    return { totalBlocks, totalPlots, totalArea, totalValue, soldValue };
  }, [filteredData]);

  // Chart 1: Status Distribution (Pie)
  const statusData = useMemo(() => {
    const counts = { available: 0, sold: 0, reserved: 0, 'under-construction': 0 };
    filteredData.forEach(p => counts[p.status as keyof typeof counts]++);
    return [
      { name: "Available", value: counts.available, color: COLORS.available },
      { name: "Sold", value: counts.sold, color: COLORS.sold },
      { name: "Reserved", value: counts.reserved, color: COLORS.reserved },
      { name: "Construction", value: counts['under-construction'], color: COLORS.underConstruction }
    ].filter(d => d.value > 0);
  }, [filteredData]);

  // Chart 2: Zone vs Value (Bar)
  const zoneValueData = useMemo(() => {
    const zones = ["Zone I G+1", "Zone II G+0"];
    return zones.map(zone => {
      const zoneProps = filteredData.filter(p => p.zone === zone);
      return {
        name: zone,
        AvailableValue: zoneProps.filter(p => p.status === "available").reduce((s, p) => s + p.price, 0) / 1000, // in K
        SoldValue: zoneProps.filter(p => p.status === "sold").reduce((s, p) => s + p.price, 0) / 1000,
        OtherValue: zoneProps.filter(p => p.status === "reserved" || p.status === "under-construction").reduce((s, p) => s + p.price, 0) / 1000,
      };
    }).filter(d => d.AvailableValue > 0 || d.SoldValue > 0 || d.OtherValue > 0);
  }, [filteredData]);

  // Chart 3: Area vs Plots by Block (Area Chart)
  const blockTrendData = useMemo(() => {
    // Sort by block number for a pseudo-timeline/progression
    return [...filteredData]
      .sort((a, b) => a.blockNumber - b.blockNumber)
      .slice(0, 20) // Limit to 20 blocks for readability
      .map(p => ({
        name: `B-${p.blockNumber}`,
        Plots: p.noOfPlots,
        Area: p.area
      }));
  }, [filteredData]);


  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      toast.warning("No data to export based on current filters.");
      return;
    }

    try {
      const headers = [
        "Block Number", "Zone", "Status", "Total Plots", "Sold Plots", 
        "Active Plots", "Total Area (sqm)", "Price (USD)", "Description"
      ];

      const rows = filteredData.map(p => [
        `Block ${p.blockNumber}`, p.zone, p.status, p.noOfPlots, p.soldPlots, 
        p.activePlots, p.area, p.price, `"${(p.description || "").replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `estate_analytics_report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Comprehensive report exported successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export report.");
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
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500 font-semibold mr-4 shrink-0">
              <Filter size={18} /> Report Parameters:
            </div>
            <div className="flex flex-1 flex-wrap gap-4 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 min-w-[150px] sm:max-w-[200px] bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available Only</option>
                <option value="sold">Sold Only</option>
                <option value="reserved">Reserved Only</option>
                <option value="under-construction">Under Construction</option>
              </select>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="flex-1 min-w-[150px] sm:max-w-[200px] bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="all">All Zones</option>
                <option value="Zone I G+1">Zone I G+1</option>
                <option value="Zone II G+0">Zone II G+0</option>
              </select>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="flex-1 min-w-[150px] sm:max-w-[200px] bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="all">All Prices</option>
                <option value="under500k">Under $500k</option>
                <option value="500k-1m">$500k - $1M</option>
                <option value="over1m">Over $1M</option>
                <option value="unlisted">Unlisted Price</option>
              </select>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="flex-1 min-w-[150px] sm:max-w-[200px] bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="all">All Areas</option>
                <option value="small">Small (&lt;2000m²)</option>
                <option value="medium">Medium (2k - 5km²)</option>
                <option value="large">Large (&gt;5000m²)</option>
              </select>
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
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 print:border print:border-slate-200">
                <CheckCircle2 size={22} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Plots</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{summary.totalPlots}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/60 shadow-sm rounded-2xl print:shadow-none print:border-slate-300">
            <CardContent className="p-4 sm:p-5 flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 print:border print:border-slate-200">
                <Map size={22} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Area</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{summary.totalArea.toLocaleString()} <span className="text-sm font-semibold text-slate-400 ml-1">m²</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/60 shadow-sm rounded-2xl print:shadow-none print:border-slate-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none"><TrendingUp size={64} /></div>
            <CardContent className="p-4 sm:p-5 flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 print:border print:border-slate-200">
                <CircleDollarSign size={22} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Portfolio Value</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none">${(summary.totalValue / 1e6).toFixed(1)}M</div>
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
                      {stat.value} <span className="text-slate-400 font-medium text-[10px] ml-1">({Math.round((stat.value / summary.totalBlocks) * 100)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Value by Zone Bar Chart */}
          <Card className="border border-slate-200/60 shadow-sm bg-white rounded-2xl print:shadow-none print:break-inside-avoid">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <CircleDollarSign className="text-emerald-600" size={20} /> Valuation by Zone ($K)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[260px]">
              {zoneValueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={zoneValueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `$${val}k`} />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 600 }}
                      formatter={(value: any) => [`$${value.toLocaleString()}k`, "Value"]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar name="Sold Value" dataKey="SoldValue" stackId="a" fill={COLORS.sold} radius={[0, 0, 4, 4]} />
                    <Bar name="Other" dataKey="OtherValue" stackId="a" fill="#cbd5e1" />
                    <Bar name="Available Value" dataKey="AvailableValue" stackId="a" fill={COLORS.available} radius={[4, 4, 0, 0]} />
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

        {/* Detailed Data Table */}
        <Card className="border border-slate-200/60 shadow-sm bg-white rounded-2xl overflow-hidden print:shadow-none print:border-slate-300 print:break-before-page">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50/50 gap-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="text-indigo-600" size={18} /> Detailed Inventory Ledger
            </h3>
            <Badge variant="outline" className="bg-white">{filteredData.length} Records</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Block ID</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Zone</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Plots (Sold/Total)</th>
                  <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Area (m²)</th>
                  <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.slice(0, 15).map((property) => (
                  <tr key={property.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-900">Block {property.blockNumber}</td>
                    <td className="px-5 py-3 font-semibold text-slate-600">{property.zone}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        property.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                        property.status === 'sold' ? 'bg-rose-100 text-rose-700' :
                        property.status === 'reserved' ? 'bg-amber-100 text-amber-700' :
                        'bg-violet-100 text-violet-700'
                      }`}>
                        {property.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-bold text-slate-900">{property.soldPlots}</span>
                      <span className="text-slate-400 font-medium mx-1">/</span>
                      <span className="font-medium text-slate-600">{property.noOfPlots}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-700">{property.area.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">
                      {property.price > 0 ? `$${property.price.toLocaleString()}` : <span className="text-slate-400 font-medium">Unlisted</span>}
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-medium">
                      No blocks match the selected report parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredData.length > 15 && (
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
              <p className="text-sm font-medium text-slate-500">
                Displaying 15 of {filteredData.length} records. <button onClick={handleExportCSV} className="text-indigo-600 font-bold hover:underline">Export CSV</button> to view all.
              </p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}

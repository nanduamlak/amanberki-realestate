"use client";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Search, ShieldAlert, CheckCircle2, Info, AlertTriangle, Download, Clock } from "lucide-react";
import { toast } from "@/lib/toast";

// Mock data for system logs
const MOCK_LOGS = Array.from({ length: 50 }).map((_, i) => {
  const levels = ["info", "info", "info", "warn", "error"];
  const actions = [
    "User Login", "Failed Login Attempt", "Updated Property Block-001", 
    "Deleted Plot from Block-042", "Exported Analytics Report", 
    "Changed User Role", "System Backup Completed", "Database Connection Refused"
  ];
  
  const level = levels[Math.floor(Math.random() * levels.length)] as "info" | "warn" | "error";
  const action = actions[Math.floor(Math.random() * actions.length)];
  
  // Make errors match failed events
  const finalLevel = action.includes("Failed") || action.includes("Refused") ? "error" : level;

  const date = new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000) - i * 3600000);

  return {
    id: `log-${Date.now()}-${i}`,
    timestamp: date.toISOString(),
    level: finalLevel,
    action: action,
    user: Math.random() > 0.3 ? "admin@amanberki.com" : "system",
    ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
  };
}).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

export default function SystemLogsPage() {
  const [logs] = useState(MOCK_LOGS);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) || 
                            log.user.toLowerCase().includes(search.toLowerCase()) ||
                            log.ip.includes(search);
      const matchesLevel = levelFilter === "all" || log.level === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [logs, search, levelFilter]);

  const handleExport = () => {
    try {
      const headers = ["Timestamp", "Level", "Action", "User", "IP Address"];
      const rows = filteredLogs.map(l => [
        new Date(l.timestamp).toLocaleString(),
        l.level.toUpperCase(),
        `"${l.action}"`,
        l.user,
        l.ip
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `system_logs_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Logs exported successfully.");
    } catch (e) {
      toast.error("Failed to export logs.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-200/50 to-transparent pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-10 relative z-10">
        
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Activity size={14} /> Technical Operations
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-slate-900">
              System Logs
            </h1>
            <p className="text-muted-foreground text-base max-w-2xl">
              Monitor system activity, audit trails, and security events.
            </p>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={handleExport}
                className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all duration-300 flex items-center gap-2"
              >
                <Download size={18} /> Export Logs
              </button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border border-slate-200/60 shadow-sm bg-white mb-6 rounded-2xl">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search action, user, or IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 font-medium focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none transition-all"
              />
            </div>
            <div className="w-full sm:w-auto">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full sm:w-[180px] bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none transition-all"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Log Table */}
        <Card className="border border-slate-200/60 shadow-sm bg-white rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock className="text-slate-500" size={18} /> Event Timeline
            </h3>
            <Badge variant="outline" className="bg-white">{filteredLogs.length} Events</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Timestamp</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Level</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Action</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">User</th>
                  <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors font-mono text-xs sm:text-sm">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        log.level === 'info' ? 'bg-blue-100 text-blue-700' :
                        log.level === 'warn' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {log.level === 'info' && <Info size={10} />}
                        {log.level === 'warn' && <AlertTriangle size={10} />}
                        {log.level === 'error' && <ShieldAlert size={10} />}
                        {log.level}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{log.action}</td>
                    <td className="px-5 py-3 text-slate-600">{log.user}</td>
                    <td className="px-5 py-3 text-right text-slate-500">{log.ip}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400 font-medium font-sans">
                      No logs found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  );
}

"use client";
import React, { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { COMMERCIAL_ASSETS } from "@/lib/data/commercialAssets";
import { 
  ArrowLeft, MapPin, Download, Check, X, FileText, 
  History, Calendar, DollarSign, ExternalLink, ShieldCheck, Building2
} from "lucide-react";

export default function CommercialAssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  // Find the exact asset from static data
  const asset = COMMERCIAL_ASSETS.find(a => a.id === id);

  if (!asset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-md">
          <Building2 className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-800">Asset Not Found</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">The requested commercial property does not exist.</p>
          <Link href="/commercial-assets" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-xs">
            Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  // Monthly columns tracker helper for Bole Rwanda
  const MONTHS = [
    { key: "megabit", label: "Megabit" },
    { key: "miazia", label: "Miazia" },
    { key: "ginbot", label: "Ginbot" },
    { key: "sene", label: "Sene (ሰኔ)" },
    { key: "hamle", label: "Hamle (ሐምሌ)" },
    { key: "nehase", label: "Nehase (ነሐሴ)" }
  ] as const;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-foreground pb-20">
      {/* Header section with back button */}
      <div className="bg-white border-b border-slate-200/60 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/commercial-assets"
              className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition-all shrink-0"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
                  {asset.category}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <MapPin size={10} />
                  {asset.location}
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight mt-1">{asset.name}</h1>
            </div>
          </div>

          {/* Attachments & Files */}
          {asset.attachments && asset.attachments.length > 0 && (
            <div className="flex gap-2">
              {asset.attachments.map(att => (
                <a
                  key={att.name}
                  href={att.url}
                  download
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  <Download size={14} />
                  {att.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* TOP SECTION: 2-Column Grid (Image on left, Asset Overview on right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* Property Profile Photo Card — object-contain so image displays fully */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-4 shadow-sm overflow-hidden flex items-center justify-center">
            <div className="relative h-72 w-full rounded-2xl overflow-hidden bg-slate-50">
              <Image 
                src={asset.image} 
                alt={asset.name} 
                fill 
                className="object-contain" 
                sizes="(max-width: 768px) 100vw, 50vw"
                priority 
              />
            </div>
          </div>

          {/* Asset specifications & Overview Card */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2 mb-4">
                <ShieldCheck size={16} className="text-indigo-600" /> Asset Overview
              </h3>
              
              <div className="grid grid-cols-2 gap-6 text-xs mb-4">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Category</span>
                  <p className="font-bold text-slate-900 mt-0.5">{asset.category}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Location</span>
                  <p className="font-bold text-slate-900 mt-0.5">{asset.location}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Status</span>
                  <p className="font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" /> Active
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wide">Owner</span>
                  <p className="font-bold text-slate-900 mt-0.5">Aman Berki Group</p>
                </div>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-500 leading-relaxed border-t border-slate-100 mt-auto">
              {asset.description}
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: Full Width Area */}
        <div className="space-y-8">
          
          {/* Bole Rwanda Render (Room rent tracker) */}
          {asset.id === "bole-rwanda" && asset.rooms && (
            <>
              {/* Table Ledger */}
              <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <History className="text-indigo-600" size={18} /> Rent &amp; Payment tracker Ledger
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Prime One Real Estate payment matrix (E.C.)</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-[#92d050] text-slate-950 font-bold border-b border-slate-200">
                        <th className="px-3 py-2 text-center border border-slate-200">Room</th>
                        <th className="px-3 py-2 text-left border border-slate-200">Client Name (Agent)</th>
                        <th className="px-3 py-2 text-center border border-slate-200">Contract Term</th>
                        <th className="px-3 py-2 text-right border border-slate-200">Monthly Rent</th>
                        <th className="px-3 py-2 text-center border border-slate-200">Term Mode</th>
                        <th className="px-3 py-2 text-right border border-slate-200">Amount Paid</th>
                        {MONTHS.map(m => (
                          <th key={m.key} className="px-2 py-2 text-center border border-slate-200 text-[10px] font-bold">
                            {m.label}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-left border border-slate-200 min-w-[120px]">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asset.rooms.map((room, idx) => {
                        const isVacant = room.clientName === "-";
                        return (
                          <tr key={idx} className={`hover:bg-slate-50 border-b border-slate-100 last:border-0 ${isVacant ? "bg-slate-50/40 text-slate-400" : "text-slate-700"}`}>
                            <td className="px-3 py-2 text-center border border-slate-200 font-bold whitespace-nowrap">
                              {room.roomNo}
                            </td>
                            <td className={`px-3 py-2 border border-slate-200 font-bold ${isVacant ? "italic font-normal" : "text-slate-900"}`}>
                              {room.clientName}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-200 font-medium whitespace-nowrap">
                              {room.contractDate}
                            </td>
                            <td className="px-3 py-2 text-right border border-slate-200 font-bold">
                              {typeof room.monthlyRent === "number" ? room.monthlyRent.toLocaleString() : room.monthlyRent}
                            </td>
                            <td className="px-3 py-2 text-center border border-slate-200 whitespace-nowrap font-medium text-slate-500">
                              {room.firstPaymentFor}
                            </td>
                            <td className="px-3 py-2 text-right border border-slate-200 font-bold text-slate-800">
                              {typeof room.amountPaid === "number" ? room.amountPaid.toLocaleString() : room.amountPaid}
                            </td>
                            {MONTHS.map(m => {
                              const checked = room[m.key as keyof typeof room] as boolean;
                              return (
                                <td key={m.key} className="px-2 py-2 text-center border border-slate-200">
                                  {checked ? (
                                    <span className="inline-flex h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center font-bold text-xs shadow-sm">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="text-slate-200">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-3 py-2 border border-slate-200 text-[10px] break-words whitespace-pre-wrap">
                              {room.remark || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Floor Plan Image Viewer */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <FileText className="text-indigo-600" size={18} /> Floor Plan
                </h3>
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex items-center justify-center">
                  <img 
                    src="/floor_plan.png" 
                    className="w-full h-auto object-contain max-h-[800px] rounded-xl"
                    alt="Floor Plan"
                  />
                </div>
              </div>
            </>
          )}

          {/* CMC Render (Tenant timeline & history table) */}
          {asset.id === "cmc" && asset.tenantHistory && (
            <div className="space-y-8">
              
              {/* Visual timeline */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
                <h3 className="font-extrabold text-slate-900 text-base mb-6 flex items-center gap-2">
                  <History className="text-indigo-600" size={18} /> Visual Lease History Timeline
                </h3>
                
                <div className="relative border-l border-slate-200 ml-4 pl-8 space-y-8 py-2">
                  {asset.tenantHistory.map((item, idx) => {
                    const isTerminatedEarly = item.statusNotes.toLowerCase().includes("terminated early");
                    const isActive = item.terminationDate === "-";

                    return (
                      <div key={idx} className="relative">
                        <div className={`absolute -left-[41px] top-1.5 h-6 w-6 rounded-full border-4 bg-white flex items-center justify-center shadow-sm ${
                          isActive ? "border-emerald-500 animate-pulse" :
                          isTerminatedEarly ? "border-red-500" :
                          "border-indigo-500"
                        }`} />

                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            {item.contractStart} — {item.contractEnd}
                          </span>
                          <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                            {item.tenantName}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {item.statusNotes}
                          </p>

                          {/* Monthly Rent steps indicator */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-700">
                              Year 1: <strong className="text-slate-950 font-black">{item.yr1Rent.toLocaleString()} ETB</strong>
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-700">
                              Year 2: <strong className="text-slate-950 font-black">{item.yr2Rent.toLocaleString()} ETB</strong>
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-700">
                              Year 3: <strong className="text-slate-950 font-black">{item.yr3Rent.toLocaleString()} ETB</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tabular lease list */}
              <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-extrabold text-slate-900 text-base">Detailed Lease Records</h3>
                  <p className="text-xs text-slate-500 mt-1">Tenant contracts, rental increases, and termination states (E.C.)</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                        <th className="px-4 py-3 text-left border-b border-slate-200">Tenant Name</th>
                        <th className="px-4 py-3 text-center border-b border-slate-200">Contract Start</th>
                        <th className="px-4 py-3 text-center border-b border-slate-200">Contract End</th>
                        <th className="px-4 py-3 text-center border-b border-slate-200">Termination Date</th>
                        <th className="px-4 py-3 text-right border-b border-slate-200">Yr 1 Rent</th>
                        <th className="px-4 py-3 text-right border-b border-slate-200">Yr 2 Rent</th>
                        <th className="px-4 py-3 text-right border-b border-slate-200">Yr 3 Rent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asset.tenantHistory.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100 last:border-0 text-slate-700">
                          <td className="px-4 py-3 font-bold text-slate-900">{item.tenantName}</td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">{item.contractStart}</td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">{item.contractEnd}</td>
                          <td className="px-4 py-3 text-center whitespace-nowrap font-bold text-slate-800">{item.terminationDate}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">{item.yr1Rent.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">{item.yr2Rent.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">{item.yr3Rent.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

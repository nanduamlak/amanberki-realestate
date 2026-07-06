"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { COMMERCIAL_ASSETS } from "@/lib/data/commercialAssets";
import { Building2, MapPin, Layers, FileText, ArrowUpRight, ShieldCheck } from "lucide-react";

export default function CommercialAssetsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-foreground pb-20">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-indigo-50/40 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        
        {/* Header Section */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">
            <Building2 size={13} /> Commercial Portfolio
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Group Commercial Assets
          </h1>
          <p className="text-slate-500 text-base max-w-2xl leading-relaxed">
            Overview of the premium built-up commercial properties and rental complexes held under the Aman Berki properties portfolio.
          </p>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {COMMERCIAL_ASSETS.map((asset) => {
            // Compute stats depending on asset details
            const roomCount = asset.rooms?.length ?? asset.wajidRooms?.length ?? asset.piasaRooms?.length ?? 0;
            const historyCount = asset.tenantHistory?.length ?? 0;
            const docCount = asset.attachments?.length ?? 0;

            return (
              <div 
                key={asset.id}
                className="group bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-slate-300/80 transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Image container */}
                <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                  <Image 
                    src={asset.image} 
                    alt={asset.name}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-black uppercase tracking-wider text-slate-800 shadow-sm border border-white/20">
                      {asset.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      {asset.location}
                    </div>

                    {/* Name */}
                    <h2 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-3">
                      {asset.name}
                    </h2>

                    {/* Description */}
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-6">
                      {asset.description}
                    </p>
                  </div>

                  {/* Summary Metrics */}
                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                    <div className="flex gap-4">
                      {/* Metric 1 */}
                      {roomCount > 0 && (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Units</span>
                          <span className="text-sm font-black text-slate-900">{roomCount} Rooms</span>
                        </div>
                      )}
                      {historyCount > 0 && (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tenants</span>
                          <span className="text-sm font-black text-slate-900">{historyCount} Periods</span>
                        </div>
                      )}

                      {/* Documents count */}
                      {docCount > 0 && (
                        <div className="flex flex-col border-l border-slate-100 pl-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Docs</span>
                          <span className="text-sm font-black text-slate-900 flex items-center gap-1">
                            <FileText size={12} className="text-indigo-500" />
                            {docCount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details Link Button */}
                    <Link 
                      href={`/commercial-assets/${asset.id}`}
                      className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300"
                    >
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

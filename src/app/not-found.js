"use client";
import Link from "next/link";
import { Store, MoveLeft, Construction, AlertTriangle } from "lucide-react";

export default function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fffcf7] text-center px-6 relative overflow-hidden">
      
      {/* BACKGROUND DECO: Large Faded Stamp */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
         <h1 className="text-[30rem] font-black">VOID</h1>
      </div>

      {/* ICON TREATMENT: The Broken Shield */}
      <div className="relative mb-8">
        <div className="bg-[#2d241e] p-8 rounded-[32px] shadow-[12px_12px_0px_#ae2012] rotate-3 relative z-10">
          <Store size={80} className="text-[#e9c46a]" />
        </div>
        <div className="absolute -top-4 -right-4 bg-[#ae2012] p-3 rounded-full border-4 border-white animate-bounce z-20">
           <AlertTriangle size={24} className="text-white" />
        </div>
      </div>

      {/* BIG 404: Heritage Style */}
      <div className="relative">
        <h1 className="text-9xl font-black text-[#2d241e] tracking-tighter uppercase italic">
          404
        </h1>
        <div className="absolute -bottom-2 left-0 w-full h-3 bg-[#e9c46a] -z-10" />
      </div>

      {/* MESSAGE: Desi Context */}
      <div className="max-w-md mt-8 space-y-4">
        <h2 className="text-xl font-black text-[#ae2012] uppercase tracking-[0.2em]">
          Dukaan Band Hai!
        </h2>
        <p className="text-[14px] text-[#2d241e] font-bold uppercase leading-relaxed tracking-tight">
          Arrey! Ye raasta toh ledger mein nahi mil raha. 
          <br />
          <span className="opacity-60">The artifact or aisle you are looking for has been moved or de-registered.</span>
        </p>
      </div>

      {/* BUTTONS: Heritage Actions */}
      <div className="mt-12 flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="group relative px-8 py-4 bg-[#2d241e] transition-all hover:-translate-y-1 active:translate-y-0"
        >
          {/* Button Background Shadow */}
          <div className="absolute inset-0 bg-[#ae2012] translate-x-2 translate-y-2 -z-10 group-hover:translate-x-3 group-hover:translate-y-3 transition-all" />
          
          <div className="flex items-center gap-3 text-white font-black uppercase text-xs tracking-[0.3em]">
            <MoveLeft size={18} className="text-[#e9c46a]" />
            Wapas Main Market
          </div>
        </Link>

        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-4 border-2 border-[#2d241e] font-black uppercase text-xs tracking-[0.3em] text-[#2d241e] hover:bg-[#2d241e] hover:text-white transition-all"
        >
          Refresh Ledger
        </button>
      </div>

      {/* FOOTER LOG: Protocol Info */}
      <div className="mt-20">
        <div className="flex items-center justify-center gap-4 text-[9px] font-black text-[#7d6b5d] uppercase tracking-[0.4em] opacity-40">
          <div className="h-[1px] w-12 bg-[#7d6b5d]" />
          Error Code: NULL_ENTRY_STREET_404
          <div className="h-[1px] w-12 bg-[#7d6b5d]" />
        </div>
      </div>
    </div>
  );
}
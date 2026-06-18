"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NavSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form onSubmit={e => { e.preventDefault(); if (q.trim()) router.push(`/catalogo?q=${encodeURIComponent(q.trim())}`); }}
      className="relative w-full">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" value={q} onChange={e => setQ(e.target.value)}
        placeholder="Pesquisar sapatilhas..."
        className="w-full bg-[#F3F4F6] rounded-[10px] border-0 pl-9 pr-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] transition-all font-sans text-[#111827] placeholder-[#9CA3AF]" />
    </form>
  );
}

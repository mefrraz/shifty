"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar({ large = false }: { large?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form onSubmit={e => { e.preventDefault(); if (q.trim()) router.push(`/catalogo?q=${encodeURIComponent(q.trim())}`); }}
      className={`relative ${large ? "max-w-lg mx-auto" : "w-full"}`}>
      <svg className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#6B7280]" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" value={q} onChange={e => setQ(e.target.value)}
        placeholder="Pesquisa modelo, marca ou posição…"
        className={`w-full bg-white rounded-[14px] border-[1.5px] border-[#E5E7EB] pl-[46px] pr-4 outline-none transition-colors focus:border-[#F97316] font-sans text-[#111827] placeholder-[#9CA3AF] ${large ? "py-3.5 text-base" : "py-3 text-sm"}`} />
    </form>
  );
}

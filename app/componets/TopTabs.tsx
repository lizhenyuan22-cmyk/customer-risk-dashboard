"use client";

import Link from "next/link";

type Props = {
  active?: "home" | "credentials" | "bindings";
};

export default function TopTabs({ active = "home" }: Props) {
  const baseClass =
    "rounded-2xl border px-4 py-2 font-semibold transition";
  const activeClass =
    "border-cyan-400/50 bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20";
  const normalClass =
    "border-white/15 bg-white/5 text-white hover:bg-white/10";

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className={`${baseClass} ${active === "home" ? activeClass : normalClass}`}
        >
          风控首页
        </Link>

        <Link
          href="/credentials"
          className={`${baseClass} ${
            active === "credentials" ? activeClass : normalClass
          }`}
        >
          API 凭证管理
        </Link>

        <Link
          href="/company-bindings"
          className={`${baseClass} ${
            active === "bindings" ? activeClass : normalClass
          }`}
        >
          公司绑定管理
        </Link>
      </div>
    </div>
  );
}
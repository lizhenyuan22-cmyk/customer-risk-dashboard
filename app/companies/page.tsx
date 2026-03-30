"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Credential = {
  id: number;
  credential_name: string;
  company_label: string;
};

type Binding = {
  id: number;
  company_name: string;
  company_code: string;
  credential_id: number;
  credential_name: string;
  company_label: string;
  base_url: string;
  merchant_id: string;
  access_id: string;
  status: string;
  is_active: number;
};

const emptyForm = {
  id: 0,
  company_name: "",
  company_code: "",
  credential_id: "",
  is_active: true,
};

function TopNav() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 font-semibold text-white"
        >
          风控首页
        </Link>
        <Link
          href="/credentials"
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 font-semibold text-white"
        >
          API 凭证管理
        </Link>
        <Link
          href="/companies"
          className="rounded-2xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950"
        >
          公司绑定管理
        </Link>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const [bRes, cRes] = await Promise.all([
      fetch("/api/company-bindings", { cache: "no-store" }),
      fetch("/api/credentials", { cache: "no-store" }),
    ]);

    setBindings(await bRes.json());
    setCredentials(await cRes.json());
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleEdit(row: Binding) {
    setEditingId(row.id);
    setForm({
      id: row.id,
      company_name: row.company_name || "",
      company_code: row.company_code || "",
      credential_id: String(row.credential_id || ""),
      is_active: !!row.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    try {
      setLoading(true);

      const method = editingId ? "PUT" : "POST";

      const res = await fetch("/api/company-bindings", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          credential_id: Number(form.credential_id),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "保存失败");
        return;
      }

      resetForm();
      load();
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(row: Binding) {
    try {
      setLoading(true);

      const res = await fetch("/api/company-bindings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: row.id,
          company_name: row.company_name,
          company_code: row.company_code,
          credential_id: row.credential_id,
          is_active: !row.is_active,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "切换状态失败");
        return;
      }

      load();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <TopNav />

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">公司绑定管理</h1>
            {editingId && (
              <button
                onClick={resetForm}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm"
              >
                取消编辑
              </button>
            )}
          </div>
          <p className="mt-2 text-sm text-white/60">
            在这里绑定公司与 API 凭证，并控制启用或停用。
          </p >
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {editingId ? "编辑公司绑定" : "新增公司绑定"}
          </h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              className="rounded bg-white/10 p-3"
              placeholder="Company Name"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            />

            <input
              className="rounded bg-white/10 p-3"
              placeholder="Company Code"
              value={form.company_code}
              onChange={(e) => setForm({ ...form, company_code: e.target.value })}
            />

            <select
              className="rounded bg-white/10 p-3"
              value={form.credential_id}
              onChange={(e) => setForm({ ...form, credential_id: e.target.value })}
            >
              <option value="">选择 API 凭证</option>
              {credentials.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.credential_name}
                </option>
              ))}
            </select>

            <select
              className="rounded bg-white/10 p-3"
              value={form.is_active ? "1" : "0"}
              onChange={(e) => setForm({ ...form, is_active: e.target.value === "1" })}
            >
              <option value="1">启用</option>
              <option value="0">停用</option>
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 rounded bg-cyan-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
          >
            {loading ? "处理中..." : editingId ? "更新公司绑定" : "新增公司绑定"}
          </button>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/5 p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="py-2">公司名</th>
                <th>公司代码</th>
                <th>绑定凭证</th>
                <th>Base URL</th>
                <th>Merchant ID</th>
                <th>Access ID</th>
                <th>凭证状态</th>
                <th>绑定状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {bindings.map((row) => (
                <tr key={row.id} className="border-b border-white/5">
                  <td className="py-2">{row.company_name}</td>
                  <td>{row.company_code}</td>
                  <td>{row.credential_name}</td>
                  <td className="max-w-[240px] truncate">{row.base_url}</td>
                  <td>{row.merchant_id}</td>
                  <td>{row.access_id}</td>
                  <td>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        row.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-red-500/15 text-red-300"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        row.is_active
                          ? "bg-cyan-500/15 text-cyan-300"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      {row.is_active ? "启用" : "停用"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(row)}
                        className="rounded-lg bg-white/10 px-3 py-1"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleToggle(row)}
                        className="rounded-lg bg-white/10 px-3 py-1"
                      >
                        {row.is_active ? "停用" : "启用"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
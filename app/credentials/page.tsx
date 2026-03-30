"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Credential = {
  id: number;
  credential_name: string;
  company_label: string;
  company_code: string;
  base_url: string;
  merchant_id: string;
  access_id: string;
  api_token: string;
  webhook_secret: string | null;
  whitelist_ip: string | null;
  status: string;
};

const emptyForm = {
  id: 0,
  credential_name: "",
  company_label: "",
  company_code: "",
  base_url: "",
  merchant_id: "",
  access_id: "",
  api_token: "",
  webhook_secret: "",
  whitelist_ip: "",
  status: "ACTIVE",
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
          className="rounded-2xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950"
        >
          API 凭证管理
        </Link>
        <Link
          href="/companies"
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 font-semibold text-white"
        >
          公司绑定管理
        </Link>
      </div>
    </div>
  );
}

export default function CredentialsPage() {
  const [rows, setRows] = useState<Credential[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/credentials", { cache: "no-store" });
    const json = await res.json();
    setRows(json);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleEdit(row: Credential) {
    setEditingId(row.id);
    setForm({
      id: row.id,
      credential_name: row.credential_name || "",
      company_label: row.company_label || "",
      company_code: row.company_code || "",
      base_url: row.base_url || "",
      merchant_id: row.merchant_id || "",
      access_id: row.access_id || "",
      api_token: row.api_token || "",
      webhook_secret: row.webhook_secret || "",
      whitelist_ip: row.whitelist_ip || "",
      status: row.status || "ACTIVE",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    try {
      setLoading(true);

      const method = editingId ? "PUT" : "POST";

      const res = await fetch("/api/credentials", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
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

  async function handleToggleStatus(row: Credential) {
    try {
      setLoading(true);

      const res = await fetch("/api/credentials", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...row,
          status: row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "状态更新失败");
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
            <h1 className="text-2xl font-bold">API 凭证管理</h1>
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
            在这里新增、编辑、启用或停用正式 API 凭证。
          </p >
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {editingId ? "编辑 API 凭证" : "新增 API 凭证"}
          </h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="rounded bg-white/10 p-3"
              placeholder="Credential Name"
              value={form.credential_name}
              onChange={(e) => setForm({ ...form, credential_name: e.target.value })}
            />
            <input
              className="rounded bg-white/10 p-3"
              placeholder="Company Label"
              value={form.company_label}
              onChange={(e) => setForm({ ...form, company_label: e.target.value })}
            />
            <input
              className="rounded bg-white/10 p-3"
              placeholder="Company Code"
              value={form.company_code}
              onChange={(e) => setForm({ ...form, company_code: e.target.value })}
            />
            <input
              className="rounded bg-white/10 p-3"
              placeholder="Base URL"
              value={form.base_url}
              onChange={(e) => setForm({ ...form, base_url: e.target.value })}
            />
            <input
              className="rounded bg-white/10 p-3"
              placeholder="Merchant ID"
              value={form.merchant_id}
              onChange={(e) => setForm({ ...form, merchant_id: e.target.value })}
            />
            <input
              className="rounded bg-white/10 p-3"
              placeholder="Access ID"
              value={form.access_id}
              onChange={(e) => setForm({ ...form, access_id: e.target.value })}
            />
            <input
              className="rounded bg-white/10 p-3"
              placeholder="API Token"
              value={form.api_token}
              onChange={(e) => setForm({ ...form, api_token: e.target.value })}
            />
            <input
              className="rounded bg-white/10 p-3"
              placeholder="Webhook Secret"
              value={form.webhook_secret}
              onChange={(e) => setForm({ ...form, webhook_secret: e.target.value })}
            />
            <input
              className="rounded bg-white/10 p-3"
              placeholder="Whitelist IP"
              value={form.whitelist_ip}
              onChange={(e) => setForm({ ...form, whitelist_ip: e.target.value })}
            />
            <select
              className="rounded bg-white/10 p-3"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 rounded bg-cyan-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
          >
            {loading ? "处理中..." : editingId ? "更新 API 凭证" : "新增 API 凭证"}
          </button>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/5 p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="py-2">名称</th>
                <th>公司</th>
                <th>Code</th>
                <th>Base URL</th>
                <th>Merchant ID</th>
                <th>Access ID</th>
                <th>Status</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-white/5">
                  <td className="py-2">{row.credential_name}</td>
                  <td>{row.company_label}</td>
                  <td>{row.company_code}</td>
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(row)}
                        className="rounded-lg bg-white/10 px-3 py-1"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleToggleStatus(row)}
                        className="rounded-lg bg-white/10 px-3 py-1"
                      >
                        {row.status === "ACTIVE" ? "停用" : "启用"}
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
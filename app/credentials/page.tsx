"use client";

import { useEffect, useState } from "react";
import TopTabs from "@/app/components/TopTabs";

type Credential = {
  id: number;
  credentialName: string;
  companyLabel: string;
  companyCode: string;
  baseUrl: string;
  merchantId: string;
  accessId: string;
  apiToken: string;
  webhookSecret?: string | null;
  whitelistIp?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

type FormState = {
  credential_name: string;
  company_label: string;
  company_code: string;
  base_url: string;
  merchant_id: string;
  access_id: string;
  api_token: string;
  webhook_secret: string;
  whitelist_ip: string;
  status: string;
};

const emptyForm: FormState = {
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

export default function CredentialsPage() {
  const [rows, setRows] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [keyword, setKeyword] = useState("");
  const [searchText, setSearchText] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const isEditing = editingId !== null;

  async function loadData(targetPage = 1, targetKeyword = "") {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(pageSize),
        keyword: targetKeyword,
      });

      const res = await fetch(`/api/credentials?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setRows(Array.isArray(data.rows) ? data.rows : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
      setPage(typeof data.page === "number" ? data.page : 1);
      setTotalPages(typeof data.totalPages === "number" ? data.totalPages : 1);
    } catch (err: any) {
      console.error("load credentials failed:", err);
      setError(err?.message || "Failed to load credentials");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(1, "");
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function validateForm() {
    if (
      !form.credential_name.trim() ||
      !form.company_label.trim() ||
      !form.company_code.trim() ||
      !form.base_url.trim() ||
      !form.merchant_id.trim() ||
      !form.access_id.trim() ||
      !form.api_token.trim()
    ) {
      alert("请先填写必填栏位");
      return false;
    }
    return true;
  }

  async function handleCreate() {
    try {
      if (!validateForm()) return;

      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "新增失败");
      }

      resetForm();
      await loadData(1, keyword);
      alert("新增成功");
    } catch (err: any) {
      console.error("create credential failed:", err);
      alert(err?.message || "新增失败");
    }
  }

  function handleEdit(row: Credential) {
    setEditingId(row.id);
    setForm({
      credential_name: row.credentialName,
      company_label: row.companyLabel,
      company_code: row.companyCode,
      base_url: row.baseUrl,
      merchant_id: row.merchantId,
      access_id: row.accessId,
      api_token: row.apiToken,
      webhook_secret: row.webhookSecret || "",
      whitelist_ip: row.whitelistIp || "",
      status: row.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleUpdate() {
    try {
      if (!validateForm()) return;
      if (!editingId) return alert("没有选中要编辑的资料");

      const res = await fetch("/api/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          ...form,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "修改失败");
      }

      resetForm();
      await loadData(page, keyword);
      alert("修改成功");
    } catch (err: any) {
      console.error("update credential failed:", err);
      alert(err?.message || "修改失败");
    }
  }

  async function handleDelete(id: number) {
    const ok = window.confirm(`确定要删除 ID ${id} 吗？`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/credentials?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "删除失败");
      }

      if (editingId === id) resetForm();

      const nextPage = rows.length === 1 && page > 1 ? page - 1 : page;
      await loadData(nextPage, keyword);
      alert("删除成功");
    } catch (err: any) {
      console.error("delete credential failed:", err);
      alert(err?.message || "删除失败");
    }
  }

  function handleSearch() {
    const nextKeyword = searchText.trim();
    setKeyword(nextKeyword);
    loadData(1, nextKeyword);
  }

  function handleResetSearch() {
    setSearchText("");
    setKeyword("");
    loadData(1, "");
  }

  function handlePrevPage() {
    if (page > 1) loadData(page - 1, keyword);
  }

  function handleNextPage() {
    if (page < totalPages) loadData(page + 1, keyword);
  }

  return (
    <div style={pageBg}>
      <div style={containerStyle}>
        <TopTabs />

        <section style={panelStyle}>
          <div style={eyebrowStyle}>API CREDENTIALS</div>
          <h1 style={titleStyle}>API 凭证管理</h1>
          <p style={descStyle}>统一管理公司 API 凭证、搜索、新增、编辑、删除与分页。</p>
        </section>

        <section style={panelStyle}>
          <h2 style={sectionTitle}>搜索</h2>
          <div style={grid3}>
            <input
              placeholder="输入 Credential Name / Company Label / Company Code / Merchant ID / Access ID"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ ...inputStyle, gridColumn: "1 / span 1" }}
            />
            <button onClick={handleSearch} style={blueBtn}>搜索</button>
            <button onClick={handleResetSearch} style={grayBtn}>重置</button>
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={sectionTitle}>{isEditing ? `编辑 Credential #${editingId}` : "新增 Credential"}</h2>

          <div style={formGrid}>
            <input placeholder="Credential Name" value={form.credential_name} onChange={(e) => setForm({ ...form, credential_name: e.target.value })} style={inputStyle} />
            <input placeholder="Company Label" value={form.company_label} onChange={(e) => setForm({ ...form, company_label: e.target.value })} style={inputStyle} />
            <input placeholder="Company Code" value={form.company_code} onChange={(e) => setForm({ ...form, company_code: e.target.value })} style={inputStyle} />
            <input placeholder="Base URL" value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} style={inputStyle} />
            <input placeholder="Merchant ID" value={form.merchant_id} onChange={(e) => setForm({ ...form, merchant_id: e.target.value })} style={inputStyle} />
            <input placeholder="Access ID" value={form.access_id} onChange={(e) => setForm({ ...form, access_id: e.target.value })} style={inputStyle} />
            <input placeholder="API Token" value={form.api_token} onChange={(e) => setForm({ ...form, api_token: e.target.value })} style={inputStyle} />
            <input placeholder="Webhook Secret" value={form.webhook_secret} onChange={(e) => setForm({ ...form, webhook_secret: e.target.value })} style={inputStyle} />
            <input placeholder="Whitelist IP" value={form.whitelist_ip} onChange={(e) => setForm({ ...form, whitelist_ip: e.target.value })} style={inputStyle} />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            {!isEditing ? (
              <button onClick={handleCreate} style={blueBtn}>新增</button>
            ) : (
              <>
                <button onClick={handleUpdate} style={blueBtn}>保存修改</button>
                <button onClick={resetForm} style={grayBtn}>取消编辑</button>
              </>
            )}
          </div>
        </section>

        <section style={panelStyle}>
          {loading && <p>Loading...</p>}
          {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
          {!loading && !error && <div style={{ marginBottom: 12 }}>共 {total} 条，当前第 {page} / {totalPages} 页</div>}
          {!loading && !error && rows.length === 0 && <p>No credentials found.</p>}

          {!loading && !error && rows.length > 0 && (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      {["ID","Credential Name","Company Label","Company Code","Base URL","Merchant ID","Access ID","API Token","Webhook Secret","Whitelist IP","Status","Actions"].map((title) => (
                        <th key={title} style={thStyle}>{title}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td style={cellStyle}>{row.id}</td>
                        <td style={cellStyle}>{row.credentialName}</td>
                        <td style={cellStyle}>{row.companyLabel}</td>
                        <td style={cellStyle}>{row.companyCode}</td>
                        <td style={cellStyle}>{row.baseUrl}</td>
                        <td style={cellStyle}>{row.merchantId}</td>
                        <td style={cellStyle}>{row.accessId}</td>
                        <td style={cellStyle}>{row.apiToken}</td>
                        <td style={cellStyle}>{row.webhookSecret || "-"}</td>
                        <td style={cellStyle}>{row.whitelistIp || "-"}</td>
                        <td style={cellStyle}>{row.status}</td>
                        <td style={cellStyle}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => handleEdit(row)} style={orangeBtn}>编辑</button>
                            <button onClick={() => handleDelete(row.id)} style={redBtn}>删除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                <button onClick={handlePrevPage} disabled={page <= 1} style={{ ...blueBtn, opacity: page <= 1 ? 0.5 : 1 }}>上一页</button>
                <button onClick={handleNextPage} disabled={page >= totalPages} style={{ ...blueBtn, opacity: page >= totalPages ? 0.5 : 1 }}>下一页</button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

const pageBg: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg,#041230 0%,#081b49 40%,#041230 100%)",
  padding: "22px 0 40px",
};

const containerStyle: React.CSSProperties = {
  width: "min(1180px, calc(100% - 32px))",
  margin: "0 auto",
};

const panelStyle: React.CSSProperties = {
  background: "rgba(24,39,82,0.95)",
  border: "1px solid rgba(124,155,255,0.14)",
  borderRadius: 22,
  padding: 18,
  marginBottom: 18,
  boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#3ddcff",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.18em",
  marginBottom: 8,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 36,
  lineHeight: 1.15,
  fontWeight: 900,
};

const descStyle: React.CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  color: "rgba(255,255,255,0.72)",
};

const sectionTitle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 14,
  fontSize: 20,
};

const grid3: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto auto",
  gap: 12,
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "#09152f",
  color: "#fff",
  border: "1px solid rgba(124,155,255,0.18)",
  borderRadius: 14,
  outline: "none",
  boxSizing: "border-box",
};

const blueBtn: React.CSSProperties = {
  padding: "12px 18px",
  background: "linear-gradient(135deg,#18c3ff,#2563eb)",
  color: "#fff",
  border: "none",
  borderRadius: 14,
  cursor: "pointer",
  fontWeight: 800,
};

const grayBtn: React.CSSProperties = {
  padding: "12px 18px",
  background: "rgba(255,255,255,0.14)",
  color: "#fff",
  border: "none",
  borderRadius: 14,
  cursor: "pointer",
  fontWeight: 800,
};

const orangeBtn: React.CSSProperties = {
  padding: "8px 14px",
  background: "#f59e0b",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 800,
};

const redBtn: React.CSSProperties = {
  padding: "8px 14px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 800,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  background: "rgba(9,21,47,0.88)",
  borderRadius: 16,
  overflow: "hidden",
};

const thStyle: React.CSSProperties = {
  borderBottom: "1px solid rgba(124,155,255,0.16)",
  padding: "12px",
  textAlign: "left",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};

const cellStyle: React.CSSProperties = {
  borderBottom: "1px solid rgba(124,155,255,0.10)",
  padding: "12px",
  verticalAlign: "top",
};
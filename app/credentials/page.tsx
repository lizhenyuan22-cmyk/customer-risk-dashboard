"use client";

import { useEffect, useState } from "react";

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

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await res.json();

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      await res.json();
      resetForm();
      await loadData(1, keyword);
      alert("新增成功");
    } catch (err: any) {
      console.error("create credential failed:", err);
      alert(err?.message || "新增失败，请检查 API 或后端错误");
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
      if (!editingId) {
        alert("没有选中要编辑的资料");
        return;
      }

      const res = await fetch("/api/credentials", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          ...form,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      await res.json();
      resetForm();
      await loadData(page, keyword);
      alert("修改成功");
    } catch (err: any) {
      console.error("update credential failed:", err);
      alert(err?.message || "修改失败，请检查 API 或后端错误");
    }
  }

  async function handleDelete(id: number) {
    const ok = window.confirm(`确定要删除 ID ${id} 吗？`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/credentials?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      await res.json();

      if (editingId === id) {
        resetForm();
      }

      const nextPage = rows.length === 1 && page > 1 ? page - 1 : page;
      await loadData(nextPage, keyword);
      alert("删除成功");
    } catch (err: any) {
      console.error("delete credential failed:", err);
      alert(err?.message || "删除失败，请检查 API 或后端错误");
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
    if (page > 1) {
      loadData(page - 1, keyword);
    }
  }

  function handleNextPage() {
    if (page < totalPages) {
      loadData(page + 1, keyword);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#fff",
        padding: "24px",
      }}
    >
      <h1 style={{ marginBottom: 20 }}>Credentials</h1>

      <div
        style={{
          marginBottom: 16,
          padding: 16,
          border: "1px solid #333",
          background: "#1a1a1a",
          borderRadius: 8,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>搜索</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: 12,
          }}
        >
          <input
            placeholder="输入 Credential Name / Company Label / Company Code / Merchant ID / Access ID"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={inputStyle}
          />

          <button onClick={handleSearch} style={buttonStyle}>
            搜索
          </button>

          <button onClick={handleResetSearch} style={secondaryButtonStyle}>
            重置
          </button>
        </div>
      </div>

      <div
        style={{
          marginBottom: 24,
          padding: 16,
          border: "1px solid #333",
          background: "#1a1a1a",
          borderRadius: 8,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>
          {isEditing ? `编辑 Credential #${editingId}` : "新增 Credential"}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <input
            placeholder="Credential Name"
            value={form.credential_name}
            onChange={(e) =>
              setForm({ ...form, credential_name: e.target.value })
            }
            style={inputStyle}
          />

          <input
            placeholder="Company Label"
            value={form.company_label}
            onChange={(e) =>
              setForm({ ...form, company_label: e.target.value })
            }
            style={inputStyle}
          />

          <input
            placeholder="Company Code"
            value={form.company_code}
            onChange={(e) =>
              setForm({ ...form, company_code: e.target.value })
            }
            style={inputStyle}
          />

          <input
            placeholder="Base URL"
            value={form.base_url}
            onChange={(e) => setForm({ ...form, base_url: e.target.value })}
            style={inputStyle}
          />

          <input
            placeholder="Merchant ID"
            value={form.merchant_id}
            onChange={(e) =>
              setForm({ ...form, merchant_id: e.target.value })
            }
            style={inputStyle}
          />

          <input
            placeholder="Access ID"
            value={form.access_id}
            onChange={(e) => setForm({ ...form, access_id: e.target.value })}
            style={inputStyle}
          />

          <input
            placeholder="API Token"
            value={form.api_token}
            onChange={(e) => setForm({ ...form, api_token: e.target.value })}
            style={inputStyle}
          />

          <input
            placeholder="Webhook Secret"
            value={form.webhook_secret}
            onChange={(e) =>
              setForm({ ...form, webhook_secret: e.target.value })
            }
            style={inputStyle}
          />

          <input
            placeholder="Whitelist IP"
            value={form.whitelist_ip}
            onChange={(e) =>
              setForm({ ...form, whitelist_ip: e.target.value })
            }
            style={inputStyle}
          />

          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            style={inputStyle}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
          {!isEditing ? (
            <button onClick={handleCreate} style={buttonStyle}>
              新增
            </button>
          ) : (
            <>
              <button onClick={handleUpdate} style={buttonStyle}>
                保存修改
              </button>
              <button onClick={resetForm} style={secondaryButtonStyle}>
                取消编辑
              </button>
            </>
          )}
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ marginBottom: 12 }}>
          共 {total} 条，当前第 {page} / {totalPages} 页
        </div>
      )}

      {!loading && !error && rows.length === 0 && <p>No credentials found.</p>}

      {!loading && !error && rows.length > 0 && (
        <>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "#1a1a1a",
              }}
            >
              <thead>
                <tr>
                  {[
                    "ID",
                    "Credential Name",
                    "Company Label",
                    "Company Code",
                    "Base URL",
                    "Merchant ID",
                    "Access ID",
                    "API Token",
                    "Webhook Secret",
                    "Whitelist IP",
                    "Status",
                    "Actions",
                  ].map((title) => (
                    <th key={title} style={thStyle}>
                      {title}
                    </th>
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
                        <button
                          onClick={() => handleEdit(row)}
                          style={editButtonStyle}
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          style={deleteButtonStyle}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <button
              onClick={handlePrevPage}
              disabled={page <= 1}
              style={{
                ...buttonStyle,
                opacity: page <= 1 ? 0.5 : 1,
                cursor: page <= 1 ? "not-allowed" : "pointer",
              }}
            >
              上一页
            </button>

            <button
              onClick={handleNextPage}
              disabled={page >= totalPages}
              style={{
                ...buttonStyle,
                opacity: page >= totalPages ? 0.5 : 1,
                cursor: page >= totalPages ? "not-allowed" : "pointer",
              }}
            >
              下一页
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#111",
  color: "#fff",
  border: "1px solid #333",
  borderRadius: 6,
  outline: "none",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 18px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 18px",
  background: "#4b5563",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const editButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  background: "#d97706",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const deleteButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  background: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const thStyle: React.CSSProperties = {
  border: "1px solid #333",
  padding: "10px",
  textAlign: "left",
  verticalAlign: "top",
};

const cellStyle: React.CSSProperties = {
  border: "1px solid #333",
  padding: "10px",
  verticalAlign: "top",
};
"use client";

import { useEffect, useState } from "react";

type BindingRow = {
  id: number;
  companyCode: string;
  credentialId: number;
  credentialName: string;
  createdAt?: string;
  updatedAt?: string;
};

type CredentialOption = {
  id: number;
  credentialName: string;
  companyCode: string;
};

export default function CompanyBindingsPage() {
  const [rows, setRows] = useState<BindingRow[]>([]);
  const [credentials, setCredentials] = useState<CredentialOption[]>([]);
  const [companyCode, setCompanyCode] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBindings() {
    const res = await fetch("/api/company-bindings", { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Load company-bindings failed");
    }

    setRows(Array.isArray(data) ? data : []);
  }

  async function loadCredentials() {
    const res = await fetch("/api/credentials?page=1&pageSize=1000&keyword=", {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Load credentials failed");
    }

    setCredentials(Array.isArray(data.rows) ? data.rows : []);
  }

  async function loadAll() {
    try {
      setLoading(true);
      setError("");
      await Promise.all([loadBindings(), loadCredentials()]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAdd() {
    try {
      if (!companyCode.trim() || !credentialId) {
        alert("请填写 companyCode 并选择 credential");
        return;
      }

      const res = await fetch("/api/company-bindings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyCode: companyCode.trim(),
          credentialId: Number(credentialId),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Add failed");
      }

      setCompanyCode("");
      setCredentialId("");
      await loadBindings();
      alert("新增成功");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "新增失败");
    }
  }

  async function handleDelete(id: number) {
    const ok = window.confirm(`确定删除绑定 ID ${id} 吗？`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/company-bindings?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      await loadBindings();
      alert("删除成功");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "删除失败");
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
      <h1 style={{ marginBottom: 20 }}>Company Bindings</h1>

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
          新增绑定
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: 12,
          }}
        >
          <input
            placeholder="Company Code"
            value={companyCode}
            onChange={(e) => setCompanyCode(e.target.value)}
            style={inputStyle}
          />

          <select
            value={credentialId}
            onChange={(e) => setCredentialId(e.target.value)}
            style={inputStyle}
          >
            <option value="">请选择 Credential</option>
            {credentials.map((item) => (
              <option key={item.id} value={item.id}>
                {item.credentialName} ({item.companyCode})
              </option>
            ))}
          </select>

          <button onClick={handleAdd} style={buttonStyle}>
            新增
          </button>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      {!loading && !error && rows.length === 0 && <p>No bindings found.</p>}

      {!loading && !error && rows.length > 0 && (
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
                {["ID", "Company Code", "Credential ID", "Credential Name", "Actions"].map(
                  (title) => (
                    <th key={title} style={thStyle}>
                      {title}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={cellStyle}>{row.id}</td>
                  <td style={cellStyle}>{row.companyCode}</td>
                  <td style={cellStyle}>{row.credentialId}</td>
                  <td style={cellStyle}>{row.credentialName || "-"}</td>
                  <td style={cellStyle}>
                    <button
                      onClick={() => handleDelete(row.id)}
                      style={deleteButtonStyle}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
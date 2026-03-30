"use client";

import { useEffect, useState } from "react";
import TopTabs from "@/app/components/TopTabs";

type BindingRow = {
  id: number;
  companyCode: string;
  companyName: string;
  credentialId: number;
  credentialName: string;
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
  const [companyName, setCompanyName] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBindings() {
    const res = await fetch("/api/company-bindings", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Load company-bindings failed");
    setRows(Array.isArray(data) ? data : []);
  }

  async function loadCredentials() {
    const res = await fetch("/api/credentials?page=1&pageSize=1000&keyword=", {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Load credentials failed");
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
      if (!companyCode.trim() || !companyName.trim() || !credentialId) {
        alert("请填写 companyCode、companyName 并选择 credential");
        return;
      }

      const res = await fetch("/api/company-bindings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyCode: companyCode.trim(),
          companyName: companyName.trim(),
          credentialId: Number(credentialId),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Add failed");

      setCompanyCode("");
      setCompanyName("");
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
      if (!res.ok) throw new Error(data?.error || "Delete failed");

      await loadBindings();
      alert("删除成功");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "删除失败");
    }
  }

  return (
    <div style={pageBg}>
      <div style={containerStyle}>
        <TopTabs />

        <section style={panelStyle}>
          <div style={eyebrowStyle}>COMPANY BINDINGS</div>
          <h1 style={titleStyle}>公司绑定管理</h1>
          <p style={descStyle}>把公司和 API 凭证绑定起来，绑定后主页公司下拉就能读取到。</p>
        </section>

        <section style={panelStyle}>
          <h2 style={sectionTitle}>新增绑定</h2>

          <div style={formGrid}>
            <input
              placeholder="Company Code"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value)}
              style={inputStyle}
            />

            <input
              placeholder="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
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

            <button onClick={handleAdd} style={blueBtn}>
              新增
            </button>
          </div>
        </section>

        <section style={panelStyle}>
          {loading && <p>Loading...</p>}
          {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
          {!loading && !error && rows.length === 0 && <p>No bindings found.</p>}

          {!loading && !error && rows.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {["ID", "Company Code", "Company Name", "Credential ID", "Credential Name", "Actions"].map((title) => (
                      <th key={title} style={thStyle}>{title}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td style={cellStyle}>{row.id}</td>
                      <td style={cellStyle}>{row.companyCode}</td>
                      <td style={cellStyle}>{row.companyName}</td>
                      <td style={cellStyle}>{row.credentialId}</td>
                      <td style={cellStyle}>{row.credentialName || "-"}</td>
                      <td style={cellStyle}>
                        <button onClick={() => handleDelete(row.id)} style={redBtn}>
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr auto",
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
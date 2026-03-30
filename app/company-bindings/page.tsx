"use client";

import { useEffect, useState } from "react";

export default function CompanyBindingsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [companyCode, setCompanyCode] = useState("");
  const [credentialId, setCredentialId] = useState("");

  async function load() {
    const res = await fetch("/api/company-bindings");
    const data = await res.json();
    setRows(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    await fetch("/api/company-bindings", {
      method: "POST",
      body: JSON.stringify({ companyCode, credentialId }),
    });

    setCompanyCode("");
    setCredentialId("");
    load();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/company-bindings?id=${id}`, {
      method: "DELETE",
    });
    load();
  }

  return (
    <div style={{ padding: 24, color: "#fff", background: "#111", minHeight: "100vh" }}>
      <h1>Company Bindings</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Company Code"
          value={companyCode}
          onChange={(e) => setCompanyCode(e.target.value)}
          style={input}
        />

        <input
          placeholder="Credential ID"
          value={credentialId}
          onChange={(e) => setCredentialId(e.target.value)}
          style={input}
        />

        <button onClick={handleAdd} style={btn}>新增</button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Company Code</th>
            <th style={th}>Credential ID</th>
            <th style={th}>Credential Name</th>
            <th style={th}>操作</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={td}>{r.id}</td>
              <td style={td}>{r.companyCode}</td>
              <td style={td}>{r.credentialId}</td>
              <td style={td}>{r.credentialName}</td>
              <td style={td}>
                <button onClick={() => handleDelete(r.id)} style={del}>
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const input = {
  marginRight: 10,
  padding: 8,
  background: "#222",
  color: "#fff",
  border: "1px solid #333",
};

const btn = {
  padding: "8px 14px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
};

const del = {
  padding: "6px 10px",
  background: "red",
  color: "#fff",
  border: "none",
};

const th = { border: "1px solid #333", padding: 10 };
const td = { border: "1px solid #333", padding: 10 };
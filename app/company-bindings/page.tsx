"use client";

import { useEffect, useState } from "react";

export default function CompanyBindingsPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const res = await fetch("/api/company-bindings");
    const json = await res.json();
    setData(json.rows || []);
  }

  return (
    <div style={{ padding: 24, color: "#fff", background: "#111", minHeight: "100vh" }}>
      <h1>Company Bindings</h1>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Company Code</th>
            <th style={th}>Credential ID</th>
            <th style={th}>Credential Name</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td style={td}>{row.id}</td>
              <td style={td}>{row.companyCode}</td>
              <td style={td}>{row.credentialId}</td>
              <td style={td}>{row.credentialName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = {
  border: "1px solid #333",
  padding: "10px",
  textAlign: "left",
};

const td = {
  border: "1px solid #333",
  padding: "10px",
};
"use client";

import { useEffect, useState } from "react";

export default function CredentialsPage() {
  const [text, setText] = useState("Loading...");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/credentials", {
          cache: "no-store",
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg);
        }

        const data = await res.json();
        setText(JSON.stringify(data, null, 2));
      } catch (err: any) {
        console.error("credentials page error:", err);
        setError(err?.message || "Unknown error");
      }
    }

    loadData();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#fff",
        padding: "24px",
      }}
    >
      <h1>Credentials</h1>

      {error ? (
        <pre style={{ whiteSpace: "pre-wrap", color: "#ff6b6b" }}>
          {error}
        </pre>
      ) : (
        <pre style={{ whiteSpace: "pre-wrap" }}>{text}</pre>
      )}
    </div>
  );
}
"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        color: "#fff",
        padding: "30px",
        fontFamily: "sans-serif",
      }}
    >
      {/* 顶部按钮 */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <button
          onClick={() => router.push("/")}
          style={tabStyle}
        >
          风控首页
        </button>

        <button
          onClick={() => router.push("/credentials")}
          style={tabStyleActive}
        >
          API 凭证管理
        </button>

        <button
          onClick={() => router.push("/company-bindings")}
          style={tabStyle}
        >
          公司绑定管理
        </button>
      </div>

      {/* 标题 */}
      <h1 style={{ marginBottom: 10 }}>
        CUSTOMER RISK MONITOR
      </h1>

      <p style={{ color: "#9ca3af", marginBottom: 30 }}>
        全公司用户 / 所有 Referrer / 按时间查询风控总看板
      </p>

      {/* 按钮区 */}
      <div style={{ display: "flex", gap: "10px", marginBottom: 30 }}>
        <button style={btnBlue}>同步当前公司</button>
        <button style={btnYellow}>同步全部公司</button>
        <button style={btnGreen}>刷新数据</button>
      </div>

      {/* 数据卡片 */}
      <div style={{ display: "flex", gap: "20px", marginBottom: 30 }}>
        <div style={card}>当前用户数<br />0</div>
        <div style={card}>总充值<br />$0.00</div>
        <div style={card}>总提现<br />$0.00</div>
        <div style={card}>总奖金<br />$0.00</div>
        <div style={card}>ROI<br />0.00%</div>
      </div>

      {/* 表格占位 */}
      <div style={cardLarge}>
        所有用户数据（后续接 API）
      </div>
    </div>
  );
}

/* ================== 样式 ================== */

const tabStyle: React.CSSProperties = {
  padding: "8px 14px",
  background: "#1f2937",
  border: "none",
  borderRadius: "6px",
  color: "#fff",
  cursor: "pointer",
};

const tabStyleActive: React.CSSProperties = {
  ...tabStyle,
  background: "#2563eb",
};

const btnBlue: React.CSSProperties = {
  padding: "10px 14px",
  background: "#2563eb",
  border: "none",
  borderRadius: "6px",
  color: "#fff",
  cursor: "pointer",
};

const btnYellow: React.CSSProperties = {
  padding: "10px 14px",
  background: "#f59e0b",
  border: "none",
  borderRadius: "6px",
  color: "#000",
  cursor: "pointer",
};

const btnGreen: React.CSSProperties = {
  padding: "10px 14px",
  background: "#10b981",
  border: "none",
  borderRadius: "6px",
  color: "#fff",
  cursor: "pointer",
};

const card: React.CSSProperties = {
  background: "#1f2937",
  padding: "20px",
  borderRadius: "8px",
  minWidth: "120px",
};

const cardLarge: React.CSSProperties = {
  background: "#1f2937",
  padding: "30px",
  borderRadius: "8px",
};
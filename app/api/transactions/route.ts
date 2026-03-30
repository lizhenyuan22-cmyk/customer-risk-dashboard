import { NextResponse } from "next/server";

export async function GET() {
  try {
    const formData = new URLSearchParams();
    formData.append("sDate", "2026-03-01");
    formData.append("eDate", "2026-03-31");
    formData.append("period", "Daily");
    formData.append("type", "ALL");
    formData.append("module", "/reports/transactions");
    formData.append("merchantId", process.env.API_MERCHANT_ID || "");
    formData.append("accessId", process.env.API_ACCESS_ID || "");
    formData.append("accessToken", process.env.API_ACCESS_TOKEN || "");

    const res = await fetch(process.env.API_BASE_URL || "", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      cache: "no-store",
    });

    const json = await res.json();

    // 👉 转换数据结构（关键）
    const result = Object.entries(json.data || {}).map(
      ([date, value]: any) => ({
        date,
        depositAmount: value.DEPOSIT?.amount || 0,
        depositCount: value.DEPOSIT?.count || 0,
        withdrawAmount: value.WITHDRAW?.amount || 0,
        withdrawCount: value.WITHDRAW?.count || 0,
        net:
          (value.DEPOSIT?.amount || 0) -
          (value.WITHDRAW?.amount || 0),
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "transactions failed" },
      { status: 500 }
    );
  }
}
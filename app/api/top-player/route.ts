import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sDate = searchParams.get("sDate") || "2024-01-01";
    const eDate = searchParams.get("eDate") || "2030-12-31";
    const pageIndex = searchParams.get("pageIndex") || "0";
    const type = searchParams.get("type") || "DEPOSIT";

    const formData = new URLSearchParams();
    formData.append("type", type);
    formData.append("sDate", sDate);
    formData.append("eDate", eDate);
    formData.append("pageIndex", pageIndex);
    formData.append("module", "/reports/topPlayer");
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
    return NextResponse.json(json);
  } catch (error) {
    console.error("top-player failed:", error);
    return NextResponse.json({ error: "top-player failed" }, { status: 500 });
  }
}
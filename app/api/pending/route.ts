import { NextResponse } from "next/server";

export async function GET() {
  try {
    const formData = new URLSearchParams();
    formData.append("background", "1");
    formData.append("module", "/status/getPending");
    formData.append("merchantId", process.env.API_MERCHANT_ID || "");
    formData.append("accessId", process.env.API_ACCESS_ID || "");
    formData.append("accessToken", process.env.API_ACCESS_TOKEN || "");

    const res = await fetch(process.env.API_BASE_URL || "", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: formData.toString(),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Pending API failed:", error);
    return NextResponse.json(
      { error: "Pending API failed" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const pageIndex = searchParams.get("pageIndex") || "0";

    const formData = new URLSearchParams();
    formData.append("type", "PUBLIC");
    formData.append("name", "");
    formData.append("mobile", "");
    formData.append("agent", "");
    formData.append("bank", "");
    formData.append("status", "ACTIVE");
    formData.append("lastVisit", "");
    formData.append("activity", "");
    formData.append("sortBy", "register");
    formData.append("sortType", "DESC");
    formData.append("includeTXSummary", "1");
    formData.append("ip", "");
    formData.append("password", "");
    formData.append("pageIndex", pageIndex);
    formData.append("userTagList", "");
    formData.append("module", "/users/getAllUsers");
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
    console.error("all-users failed:", error);
    return NextResponse.json({ error: "all-users failed" }, { status: 500 });
  }
}
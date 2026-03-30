import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      company_code,
      user_id,
      pageIndex = 0,
      sDate,
      eDate,
    } = body;

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/company-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company_code,
        module: "/transactions/getBetHistory",
        extra: {
          userId: user_id,
          sDate,
          eDate,
          pageIndex,
        },
      }),
    });

    const json = await res.json();

    return NextResponse.json({
      success: true,
      data: json?.data || null,
      raw: json,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "读取交易明细失败",
      },
      { status: 500 }
    );
  }
}
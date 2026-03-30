import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      company_code,
      module,
      extra = {},
    }: {
      company_code: string;
      module: string;
      extra?: Record<string, string | number | boolean>;
    } = body;

    if (!company_code || !module) {
      return NextResponse.json(
        { error: "company_code and module are required" },
        { status: 400 }
      );
    }

    const [rows]: any = await db.query(
      `
      SELECT 
        cb.company_name,
        cb.company_code,
        cb.is_active,
        ac.base_url,
        ac.merchant_id,
        ac.access_id,
        ac.api_token,
        ac.status
      FROM company_bindings cb
      JOIN api_credentials ac
        ON cb.credential_id = ac.id
      WHERE cb.company_code = ?
      LIMIT 1
      `,
      [company_code]
    );

    const config = rows?.[0];

    if (!config) {
      return NextResponse.json(
        { error: "Company binding not found" },
        { status: 404 }
      );
    }

    if (!config.is_active) {
      return NextResponse.json(
        { error: "Company binding is inactive" },
        { status: 400 }
      );
    }

    if (config.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "API credential is inactive" },
        { status: 400 }
      );
    }

    const formData = new URLSearchParams();
    formData.append("module", module);
    formData.append("merchantId", String(config.merchant_id || ""));
    formData.append("accessId", String(config.access_id || ""));
    formData.append("accessToken", String(config.api_token || ""));

    Object.entries(extra).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const res = await fetch(config.base_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("company-proxy failed:", error);
    return NextResponse.json(
      { error: "company-proxy failed" },
      { status: 500 }
    );
  }
}
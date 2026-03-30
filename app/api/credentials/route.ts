import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [rows]: any = await db.query(
      "SELECT * FROM api_credentials ORDER BY id DESC"
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET credentials failed:", error);
    return NextResponse.json({ error: "GET credentials failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      credential_name,
      company_label,
      company_code,
      base_url,
      merchant_id,
      access_id,
      api_token,
      webhook_secret,
      whitelist_ip,
      status,
    } = body;

    await db.query(
      `
      INSERT INTO api_credentials
      (credential_name, company_label, company_code, base_url, merchant_id, access_id, api_token, webhook_secret, whitelist_ip, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        credential_name,
        company_label,
        company_code,
        base_url,
        merchant_id,
        access_id,
        api_token,
        webhook_secret || null,
        whitelist_ip || null,
        status || "ACTIVE",
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST credentials failed:", error);
    return NextResponse.json({ error: "POST credentials failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      id,
      credential_name,
      company_label,
      company_code,
      base_url,
      merchant_id,
      access_id,
      api_token,
      webhook_secret,
      whitelist_ip,
      status,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.query(
      `
      UPDATE api_credentials
      SET
        credential_name = ?,
        company_label = ?,
        company_code = ?,
        base_url = ?,
        merchant_id = ?,
        access_id = ?,
        api_token = ?,
        webhook_secret = ?,
        whitelist_ip = ?,
        status = ?
      WHERE id = ?
      `,
      [
        credential_name,
        company_label,
        company_code,
        base_url,
        merchant_id,
        access_id,
        api_token,
        webhook_secret || null,
        whitelist_ip || null,
        status || "ACTIVE",
        id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT credentials failed:", error);
    return NextResponse.json({ error: "PUT credentials failed" }, { status: 500 });
  }
}
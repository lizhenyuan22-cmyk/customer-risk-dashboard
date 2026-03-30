import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [rows]: any = await db.query(`
      SELECT
        cb.id,
        cb.company_name,
        cb.company_code,
        cb.credential_id,
        cb.is_active,
        ac.credential_name,
        ac.company_label,
        ac.base_url,
        ac.merchant_id,
        ac.access_id,
        ac.status
      FROM company_bindings cb
      JOIN api_credentials ac ON cb.credential_id = ac.id
      ORDER BY cb.id DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET company-bindings failed:", error);
    return NextResponse.json({ error: "GET company-bindings failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company_name, company_code, credential_id, is_active } = body;

    await db.query(
      `
      INSERT INTO company_bindings
      (company_name, company_code, credential_id, is_active)
      VALUES (?, ?, ?, ?)
      `,
      [company_name, company_code, credential_id, is_active ? 1 : 0]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST company-bindings failed:", error);
    return NextResponse.json({ error: "POST company-bindings failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, company_name, company_code, credential_id, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.query(
      `
      UPDATE company_bindings
      SET
        company_name = ?,
        company_code = ?,
        credential_id = ?,
        is_active = ?
      WHERE id = ?
      `,
      [company_name, company_code, credential_id, is_active ? 1 : 0, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT company-bindings failed:", error);
    return NextResponse.json({ error: "PUT company-bindings failed" }, { status: 500 });
  }
}
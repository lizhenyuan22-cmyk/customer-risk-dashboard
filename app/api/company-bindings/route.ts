import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [rows]: any = await db.query(`
      SELECT cb.id, cb.companyCode, cb.credentialId, c.credentialName
      FROM company_bindings cb
      LEFT JOIN api_credentials c ON cb.credentialId = c.id
      ORDER BY cb.id DESC
    `);

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "GET failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { companyCode, credentialId } = body;

    await db.query(
      `INSERT INTO company_bindings (companyCode, credentialId)
       VALUES (?, ?)`,
      [companyCode, credentialId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "POST failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id");

    await db.query(`DELETE FROM company_bindings WHERE id=?`, [id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "DELETE failed" }, { status: 500 });
  }
}
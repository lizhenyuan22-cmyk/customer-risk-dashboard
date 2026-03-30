import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const [rows]: any = await db.query(`
    SELECT 
      cb.company_name,
      cb.company_code,
      ac.base_url,
      ac.access_id,
      ac.api_token
    FROM company_bindings cb
    JOIN api_credentials ac 
      ON cb.credential_id = ac.id
    WHERE ac.status = 'ACTIVE'
  `);

  return NextResponse.json(rows);
}
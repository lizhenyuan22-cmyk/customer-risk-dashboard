import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.companyBinding.findMany({
      orderBy: { id: "desc" },
    });

    const credentialIds = rows.map((r) => r.credentialId);

    const credentials =
      credentialIds.length > 0
        ? await prisma.apiCredential.findMany({
            where: {
              id: { in: credentialIds },
            },
            select: {
              id: true,
              credentialName: true,
            },
          })
        : [];

    const credentialMap = new Map(
      credentials.map((c) => [c.id, c.credentialName])
    );

    const data = rows.map((row) => ({
      ...row,
      credentialName: credentialMap.get(row.credentialId) || "",
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET company-bindings failed:", error);
    return NextResponse.json(
      { error: "GET company-bindings failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const companyCode = String(body.companyCode || "").trim();
    const credentialId = Number(body.credentialId);

    if (!companyCode || !credentialId) {
      return NextResponse.json(
        { error: "companyCode and credentialId are required" },
        { status: 400 }
      );
    }

    const created = await prisma.companyBinding.create({
      data: {
        companyCode,
        credentialId,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("POST company-bindings failed:", error);
    return NextResponse.json(
      { error: "POST company-bindings failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = Number(new URL(req.url).searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.companyBinding.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE company-bindings failed:", error);
    return NextResponse.json(
      { error: "DELETE company-bindings failed" },
      { status: 500 }
    );
  }
}
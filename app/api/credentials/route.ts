import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const keyword = (searchParams.get("keyword") || "").trim();
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "10");

    const where = keyword
      ? {
          OR: [
            {
              credentialName: {
                contains: keyword,
                mode: "insensitive" as const,
              },
            },
            {
              companyLabel: {
                contains: keyword,
                mode: "insensitive" as const,
              },
            },
            {
              companyCode: {
                contains: keyword,
                mode: "insensitive" as const,
              },
            },
            {
              merchantId: {
                contains: keyword,
                mode: "insensitive" as const,
              },
            },
            {
              accessId: {
                contains: keyword,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      prisma.apiCredential.findMany({
        where,
        orderBy: { id: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.apiCredential.count({ where }),
    ]);

    return NextResponse.json({
      rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET credentials failed:", error);
    return NextResponse.json(
      { error: "GET credentials failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newCredential = await prisma.apiCredential.create({
      data: {
        credentialName: body.credential_name,
        companyLabel: body.company_label,
        companyCode: body.company_code,
        baseUrl: body.base_url,
        merchantId: body.merchant_id,
        accessId: body.access_id,
        apiToken: body.api_token,
        webhookSecret: body.webhook_secret ?? null,
        whitelistIp: body.whitelist_ip ?? null,
        status: body.status ?? "ACTIVE",
      },
    });

    return NextResponse.json(newCredential, { status: 201 });
  } catch (error) {
    console.error("POST credentials failed:", error);
    return NextResponse.json(
      { error: "POST credentials failed" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updatedCredential = await prisma.apiCredential.update({
      where: { id },
      data: {
        credentialName: body.credential_name,
        companyLabel: body.company_label,
        companyCode: body.company_code,
        baseUrl: body.base_url,
        merchantId: body.merchant_id,
        accessId: body.access_id,
        apiToken: body.api_token,
        webhookSecret: body.webhook_secret ?? null,
        whitelistIp: body.whitelist_ip ?? null,
        status: body.status ?? "ACTIVE",
      },
    });

    return NextResponse.json(updatedCredential);
  } catch (error) {
    console.error("PUT credentials failed:", error);
    return NextResponse.json(
      { error: "PUT credentials failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.apiCredential.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE credentials failed:", error);
    return NextResponse.json(
      { error: "DELETE credentials failed" },
      { status: 500 }
    );
  }
}
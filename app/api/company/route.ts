import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.companyBinding.findMany({
      orderBy: { id: "desc" },
      distinct: ["companyCode"],
      select: {
        companyCode: true,
        companyName: true,
      },
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET company failed:", error);
    return NextResponse.json({ error: "GET company failed" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.companyUser.findMany({
      orderBy: { id: "desc" },
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET company failed:", error);

    return NextResponse.json(
      { error: "GET company failed" },
      { status: 500 }
    );
  }
}
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { calculateRisk } from "@/lib/risk";

export async function POST(req: Request) {
  const body = await req.json();
  const users = body.users || [];
  const companyCode = String(body.company_code || "");
  const companyName = String(body.company_name || "");

  if (!companyCode) {
    return NextResponse.json(
      {
        success: false,
        message: "缺少 company_code",
      },
      { status: 400 }
    );
  }

  let count = 0;

  for (const u of users) {
    const { score, level } = calculateRisk(u);

    await prisma.companyUser.upsert({
      where: {
        companyCode_userId: {
          companyCode,
          userId: String(u.id),
        },
      },
      update: {
        companyName,
        username: u.username || "",
        name: u.name || "",
        mobile: u.mobile || null,
        referrerName: u.referrerName || null,
        createdDateTime: u.createdDateTime || null,
        visitedDateTime: u.visitedDateTime || null,
        lastDepositTime:
          u.lastDepositTime ||
          u.lastDepositDateTime ||
          u.lastDepTime ||
          u.lastDepDate ||
          null,
        depCount: Number(u.depCount || 0),
        depTotal: Number(u.depTotal || 0),
        wthCount: Number(u.wthCount || 0),
        wthTotal: Number(u.wthTotal || 0),
        bonusCount: Number(u.bonusCount || 0),
        bonusTotal: Number(u.bonusTotal || 0),
        winLoss: Number(u.winLoss || 0),
        riskScore: score,
        riskLevel: level,
      },
      create: {
        companyCode,
        companyName,
        userId: String(u.id),
        username: u.username || "",
        name: u.name || "",
        mobile: u.mobile || null,
        referrerName: u.referrerName || null,
        createdDateTime: u.createdDateTime || null,
        visitedDateTime: u.visitedDateTime || null,
        lastDepositTime:
          u.lastDepositTime ||
          u.lastDepositDateTime ||
          u.lastDepTime ||
          u.lastDepDate ||
          null,
        depCount: Number(u.depCount || 0),
        depTotal: Number(u.depTotal || 0),
        wthCount: Number(u.wthCount || 0),
        wthTotal: Number(u.wthTotal || 0),
        bonusCount: Number(u.bonusCount || 0),
        bonusTotal: Number(u.bonusTotal || 0),
        winLoss: Number(u.winLoss || 0),
        riskScore: score,
        riskLevel: level,
      },
    });

    count++;
  }

  return NextResponse.json({
    success: true,
    count,
  });
}
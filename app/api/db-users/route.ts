import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function getDateKey(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthKey(value?: string | null) {
  const dateKey = getDateKey(value);
  return dateKey ? dateKey.slice(0, 7) : "";
}

function getYearKey(value?: string | null) {
  const dateKey = getDateKey(value);
  return dateKey ? dateKey.slice(0, 4) : "";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const companyCode = searchParams.get("company_code") || "ALL";
  const period = searchParams.get("period") || "DAY";
  const dateField = searchParams.get("date_field") || "visitedDateTime";
  const dateValue = searchParams.get("date_value") || "";
  const keyword = (searchParams.get("keyword") || "").trim().toLowerCase();
  const riskLevel = searchParams.get("risk_level") || "all";

  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("page_size") || 20), 1), 100);

  const where =
    companyCode === "ALL"
      ? {}
      : {
          companyCode,
        };

  let users = await prisma.companyUser.findMany({
    where,
    orderBy: [{ riskScore: "desc" }, { depTotal: "desc" }],
  });

  if (dateValue) {
    users = users.filter((user) => {
      const fieldValue =
        dateField === "createdDateTime"
          ? user.createdDateTime
          : user.visitedDateTime;

      if (!fieldValue) return false;

      if (period === "DAY") return getDateKey(fieldValue) === dateValue;
      if (period === "MONTH") return getMonthKey(fieldValue) === dateValue.slice(0, 7);
      if (period === "YEAR") return getYearKey(fieldValue) === dateValue.slice(0, 4);
      return true;
    });
  }

  if (keyword) {
    users = users.filter((u) => {
      return (
        (u.name || "").toLowerCase().includes(keyword) ||
        (u.username || "").toLowerCase().includes(keyword) ||
        (u.mobile || "").toLowerCase().includes(keyword) ||
        (u.referrerName || "").toLowerCase().includes(keyword) ||
        (u.companyName || "").toLowerCase().includes(keyword) ||
        String(u.userId).toLowerCase().includes(keyword)
      );
    });
  }

  if (riskLevel !== "all") {
    users = users.filter((u) => u.riskLevel === riskLevel);
  }

  const total = users.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const start = (page - 1) * pageSize;
  const pagedUsers = users.slice(start, start + pageSize);

  return NextResponse.json({
    success: true,
    users: pagedUsers,
    pagination: {
      total,
      page,
      pageSize,
      totalPages,
    },
  });
}
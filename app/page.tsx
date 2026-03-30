"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CompanyItem = {
  company_name: string;
  company_code: string;
  base_url: string;
  access_id: string;
  api_token: string;
};

type DbUser = {
  id: number;
  companyCode: string;
  companyName: string;
  userId: string;
  username: string;
  name: string;
  mobile?: string | null;
  referrerName?: string | null;
  createdDateTime?: string | null;
  visitedDateTime?: string | null;
  lastDepositTime?: string | null;
  depCount?: number;
  depTotal?: number;
  wthCount?: number;
  wthTotal?: number;
  bonusCount?: number;
  bonusTotal?: number;
  winLoss?: number;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
};

type ReferrerSummary = {
  name: string;
  memberCount: number;
  highRiskCount: number;
  avgRiskScore: number;
  depositTotal: number;
  withdrawTotal: number;
  bonusTotal: number;
  profit: number;
};

type Pagination = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value) || 0;
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function riskBadgeClass(level: string) {
  if (level === "HIGH") {
    return "bg-red-500/15 text-red-300 border border-red-400/30";
  }
  if (level === "MEDIUM") {
    return "bg-amber-500/15 text-amber-300 border border-amber-400/30";
  }
  return "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30";
}

function getRiskReasons(user: DbUser) {
  const depTotal = toNumber(user.depTotal);
  const wthTotal = Math.abs(toNumber(user.wthTotal));
  const bonusTotal = toNumber(user.bonusTotal);
  const depCount = toNumber(user.depCount);
  const wthCount = toNumber(user.wthCount);

  const reasons: string[] = [];

  if (depTotal > 0 && wthTotal / depTotal >= 0.8) reasons.push("提现接近充值");
  if (bonusTotal >= 80) reasons.push("奖金金额偏大");
  else if (bonusTotal >= 30) reasons.push("奖金金额偏高");
  if (depTotal <= 10 && bonusTotal >= 50) reasons.push("低充值高奖金");
  if (depTotal <= 10 && wthTotal > 0) reasons.push("低充值出现提现");
  if (depCount <= 1 && wthCount >= 1) reasons.push("充值次数少但有提现");
  if (wthCount >= 3) reasons.push("提现次数偏高");
  else if (wthCount >= 1) reasons.push("存在提现行为");

  if (user.createdDateTime && user.visitedDateTime) {
    const created = new Date(user.createdDateTime).getTime();
    const visited = new Date(user.visitedDateTime).getTime();
    if (!Number.isNaN(created) && !Number.isNaN(visited)) {
      const diff = visited - created;
      if (diff > 0 && diff < 60 * 60 * 1000) reasons.push("短时间快进快出");
    }
  }

  if (reasons.length === 0) reasons.push("当前未发现明显异常");
  return reasons;
}

function csvEscape(value: unknown) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function TopNav() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="rounded-2xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950"
        >
          风控首页
        </Link>
        <Link
          href="/credentials"
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 font-semibold text-white"
        >
          API 凭证管理
        </Link>
        <Link
          href="/company-bindings"
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 font-semibold text-white"
        >
          公司绑定管理
        </Link>
      </div>
    </div>
  );
}

export default function Page() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [companyCode, setCompanyCode] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const [dbUsers, setDbUsers] = useState<DbUser[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const [keyword, setKeyword] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | "LOW" | "MEDIUM" | "HIGH">("all");

  const [period, setPeriod] = useState<"DAY" | "MONTH" | "YEAR">("DAY");
  const [dateField, setDateField] = useState<"createdDateTime" | "visitedDateTime">("visitedDateTime");
  const [dayValue, setDayValue] = useState("");
  const [monthValue, setMonthValue] = useState("");
  const [yearValue, setYearValue] = useState(String(new Date().getFullYear()));

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DbUser | null>(null);
  const [selectedReferrerName, setSelectedReferrerName] = useState("");

  const [txLoading, setTxLoading] = useState(false);
  const [txData, setTxData] = useState<any>(null);
  const [txPageIndex, setTxPageIndex] = useState(0);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/company", { cache: "no-store" });
        const rows = await res.json();
        setCompanies(rows || []);
      } catch (error) {
        console.error("loadCompanies failed:", error);
      }
    }

    loadCompanies();
  }, []);

  function getCurrentDateValue() {
    if (period === "DAY") return dayValue;
    if (period === "MONTH") return monthValue;
    return yearValue;
  }

  async function loadDbUsers() {
    try {
      const dateValue = getCurrentDateValue();
      const query = new URLSearchParams({
        company_code: companyCode,
        period,
        date_field: dateField,
        date_value: dateValue,
        keyword,
        risk_level: riskFilter,
        page: String(page),
        page_size: String(pageSize),
      });

      const res = await fetch(`/api/db-users?${query.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();

      setDbUsers(json?.users || []);
      setPagination(
        json?.pagination || {
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        }
      );

      setLastUpdated(new Date().toLocaleTimeString());
      setDebugInfo({
        selectedCompany: companyCode,
        dbUsersCount: json?.users?.length || 0,
        period,
        dateField,
        dateValue,
        keyword,
        riskFilter,
        pagination: json?.pagination || null,
      });
    } catch (e) {
      console.error("读取数据库用户失败:", e);
    }
  }

  async function syncOneCompanyFull(company: CompanyItem) {
    let pageIndex = 0;
    let totalSynced = 0;

    while (true) {
      const usersRes = await fetch("/api/company-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_code: company.company_code,
          module: "/users/getAllUsers",
          extra: {
            type: "PUBLIC",
            name: "",
            mobile: "",
            agent: "",
            bank: "",
            status: "ACTIVE",
            lastVisit: "",
            activity: "",
            sortBy: "register",
            sortType: "DESC",
            includeTXSummary: 1,
            ip: "",
            password: "",
            pageIndex,
            userTagList: "",
          },
        }),
      });

      const usersJson = await usersRes.json();
      const userRows = usersJson?.data?.users || [];

      if (!userRows.length) break;

      await fetch("/api/sync-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_code: company.company_code,
          company_name: company.company_name,
          users: userRows,
        }),
      });

      totalSynced += userRows.length;
      pageIndex += 1;
    }

    return totalSynced;
  }

  async function syncCurrentCompany() {
    if (companyCode === "ALL") {
      alert("请先选择具体公司后再同步当前公司");
      return;
    }

    const company = companies.find((c) => c.company_code === companyCode);
    if (!company) {
      alert("未找到公司配置");
      return;
    }

    try {
      setLoading(true);
      const totalSynced = await syncOneCompanyFull(company);
      setPage(1);
      await loadDbUsers();
      alert(`同步完成：${company.company_name}，共 ${totalSynced} 条用户数据`);
    } catch (e) {
      console.error(e);
      alert("同步当前公司失败");
    } finally {
      setLoading(false);
    }
  }

  async function syncAllCompanies() {
    try {
      setLoading(true);

      let grandTotal = 0;
      for (const company of companies) {
        const count = await syncOneCompanyFull(company);
        grandTotal += count;
      }

      setPage(1);
      await loadDbUsers();
      alert(`全部公司同步完成，共 ${grandTotal} 条用户数据`);
    } catch (e) {
      console.error(e);
      alert("同步全部公司失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDbUsers();
  }, [companyCode, period, dateField, dayValue, monthValue, yearValue, page, pageSize, keyword, riskFilter]);

  const summary = useMemo(() => {
    let totalDeposit = 0;
    let totalWithdraw = 0;
    let totalBonus = 0;

    dbUsers.forEach((u) => {
      totalDeposit += toNumber(u.depTotal);
      totalWithdraw += Math.abs(toNumber(u.wthTotal));
      totalBonus += toNumber(u.bonusTotal);
    });

    const profit = totalDeposit - totalWithdraw;
    const roi = totalDeposit > 0 ? (profit / totalDeposit) * 100 : 0;

    return {
      totalDeposit,
      totalWithdraw,
      totalBonus,
      profit,
      roi,
    };
  }, [dbUsers]);

  const highRiskCount = useMemo(() => dbUsers.filter((u) => u.riskLevel === "HIGH").length, [dbUsers]);
  const mediumRiskCount = useMemo(() => dbUsers.filter((u) => u.riskLevel === "MEDIUM").length, [dbUsers]);
  const lowRiskCount = useMemo(() => dbUsers.filter((u) => u.riskLevel === "LOW").length, [dbUsers]);

  const topRiskUsers = useMemo(
    () => [...dbUsers].sort((a, b) => b.riskScore - a.riskScore).slice(0, 10),
    [dbUsers]
  );

  const referrerSummaries = useMemo<ReferrerSummary[]>(() => {
    const map = new Map<string, ReferrerSummary>();

    dbUsers.forEach((user) => {
      const refName = (user.referrerName || "").trim() || "无来源";

      if (!map.has(refName)) {
        map.set(refName, {
          name: refName,
          memberCount: 0,
          highRiskCount: 0,
          avgRiskScore: 0,
          depositTotal: 0,
          withdrawTotal: 0,
          bonusTotal: 0,
          profit: 0,
        });
      }

      const item = map.get(refName)!;
      item.memberCount += 1;
      item.depositTotal += toNumber(user.depTotal);
      item.withdrawTotal += Math.abs(toNumber(user.wthTotal));
      item.bonusTotal += toNumber(user.bonusTotal);
      item.profit += toNumber(user.depTotal) - Math.abs(toNumber(user.wthTotal));
      item.avgRiskScore += toNumber(user.riskScore);
      if (user.riskLevel === "HIGH") item.highRiskCount += 1;
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        avgRiskScore: item.memberCount > 0 ? item.avgRiskScore / item.memberCount : 0,
      }))
      .sort((a, b) => b.avgRiskScore - a.avgRiskScore);
  }, [dbUsers]);

  const selectedReferrer =
    referrerSummaries.find((r) => r.name === selectedReferrerName) || referrerSummaries[0] || null;

  useEffect(() => {
    if (!selectedReferrerName && referrerSummaries.length > 0) {
      setSelectedReferrerName(referrerSummaries[0].name);
    } else if (
      selectedReferrerName &&
      !referrerSummaries.find((r) => r.name === selectedReferrerName) &&
      referrerSummaries.length > 0
    ) {
      setSelectedReferrerName(referrerSummaries[0].name);
    }
  }, [referrerSummaries, selectedReferrerName]);

  function normalizeRangeFromPeriod() {
    if (period === "DAY" && dayValue) {
      return { sDate: dayValue, eDate: dayValue };
    }
    if (period === "MONTH" && monthValue) {
      const [y, m] = monthValue.split("-");
      const lastDay = new Date(Number(y), Number(m), 0).getDate();
      return {
        sDate: `${monthValue}-01`,
        eDate: `${monthValue}-${String(lastDay).padStart(2, "0")}`,
      };
    }
    if (period === "YEAR" && yearValue) {
      return {
        sDate: `${yearValue}-01-01`,
        eDate: `${yearValue}-12-31`,
      };
    }
    return { sDate: "", eDate: "" };
  }

  async function loadUserTransactions(user: DbUser, nextPageIndex = 0) {
    try {
      setTxLoading(true);
      const { sDate, eDate } = normalizeRangeFromPeriod();

      const res = await fetch("/api/user-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_code: user.companyCode,
          user_id: user.userId,
          pageIndex: nextPageIndex,
          sDate,
          eDate,
        }),
      });

      const json = await res.json();
      setTxData(json?.data || null);
      setTxPageIndex(nextPageIndex);
    } catch (e) {
      console.error("读取交易明细失败:", e);
    } finally {
      setTxLoading(false);
    }
  }

  function exportUsersCsv() {
    const headers = [
      "companyCode",
      "companyName",
      "userId",
      "username",
      "name",
      "mobile",
      "referrerName",
      "lastDepositTime",
      "visitedDateTime",
      "depCount",
      "depTotal",
      "wthCount",
      "wthTotal",
      "bonusCount",
      "bonusTotal",
      "winLoss",
      "riskScore",
      "riskLevel",
      "createdDateTime",
    ];

    const rows = dbUsers.map((u) => [
      u.companyCode,
      u.companyName,
      u.userId,
      u.username,
      u.name,
      u.mobile || "",
      u.referrerName || "",
      u.lastDepositTime || "",
      u.visitedDateTime || "",
      toNumber(u.depCount),
      toNumber(u.depTotal),
      toNumber(u.wthCount),
      toNumber(u.wthTotal),
      toNumber(u.bonusCount),
      toNumber(u.bonusTotal),
      toNumber(u.winLoss),
      u.riskScore,
      u.riskLevel,
      u.createdDateTime || "",
    ]);

    const csvContent = [
      headers.map(csvEscape).join(","),
      ...rows.map((row) => row.map(csvEscape).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const fileName = `${companyCode || "ALL"}_${period}_risk_users.csv`;

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function openUserDrawer(user: DbUser) {
    setSelectedUser(user);
    setDrawerOpen(true);
    await loadUserTransactions(user, 0);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#0f2147_0%,#08132d_45%,#030712_100%)] p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <TopNav />

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">
                Customer Risk Monitor
              </div>
              <h1 className="mt-2 text-3xl font-bold">
                全公司用户 / 所有 Referrer / 按时间查询风控总看板
              </h1>
              <p className="mt-2 text-sm text-white/60">
                支持单日、单月、全年查询；支持按注册时间或最后上线时间筛选
              </p>
              <p className="mt-2 text-xs text-white/40">
                最后更新：{lastUpdated || "载入中..."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <select
                value={companyCode}
                onChange={(e) => {
                  setCompanyCode(e.target.value);
                  setPage(1);
                }}
                className="rounded-2xl border border-white/15 bg-slate-900 px-4 py-3 text-white outline-none"
              >
                <option value="ALL">全部公司</option>
                {companies.map((company) => (
                  <option key={company.company_code} value={company.company_code}>
                    {company.company_name}
                  </option>
                ))}
              </select>

              <button
                onClick={syncCurrentCompany}
                className="rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950"
              >
                {loading ? "同步中..." : "同步当前公司"}
              </button>

              <button
                onClick={syncAllCompanies}
                className="rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-slate-950"
              >
                {loading ? "同步中..." : "同步全部公司"}
              </button>

              <button
                onClick={loadDbUsers}
                className="rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950"
              >
                刷新数据库视图
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl">
          <div className="mb-4 text-xl font-bold">时间查询</div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-6">
            <select
              value={dateField}
              onChange={(e) => {
                setDateField(e.target.value as "createdDateTime" | "visitedDateTime");
                setPage(1);
              }}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              <option value="visitedDateTime">按最后上线时间</option>
              <option value="createdDateTime">按注册时间</option>
            </select>

            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value as "DAY" | "MONTH" | "YEAR");
                setPage(1);
              }}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              <option value="DAY">单日</option>
              <option value="MONTH">单月</option>
              <option value="YEAR">全年</option>
            </select>

            {period === "DAY" && (
              <input
                type="date"
                value={dayValue}
                onChange={(e) => {
                  setDayValue(e.target.value);
                  setPage(1);
                }}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              />
            )}

            {period === "MONTH" && (
              <input
                type="month"
                value={monthValue}
                onChange={(e) => {
                  setMonthValue(e.target.value);
                  setPage(1);
                }}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              />
            )}

            {period === "YEAR" && (
              <input
                type="number"
                value={yearValue}
                onChange={(e) => {
                  setYearValue(e.target.value);
                  setPage(1);
                }}
                placeholder="例如 2026"
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              />
            )}

            <button
              onClick={() => {
                setPage(1);
                loadDbUsers();
              }}
              className="rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950"
            >
              按时间查询
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
            <div className="text-sm text-white/60">当前页用户数</div>
            <div className="mt-2 text-2xl font-bold">{dbUsers.length}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
            <div className="text-sm text-white/60">总充值</div>
            <div className="mt-2 text-2xl font-bold text-emerald-300">
              ${formatMoney(summary.totalDeposit)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
            <div className="text-sm text-white/60">总提现</div>
            <div className="mt-2 text-2xl font-bold text-red-300">
              ${formatMoney(summary.totalWithdraw)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
            <div className="text-sm text-white/60">总奖金</div>
            <div className="mt-2 text-2xl font-bold text-amber-300">
              ${formatMoney(summary.totalBonus)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
            <div className="text-sm text-white/60">高 / 中 / 低风险</div>
            <div className="mt-2 text-2xl font-bold">
              <span className="text-red-300">{highRiskCount}</span>
              <span className="text-white/40"> / </span>
              <span className="text-amber-300">{mediumRiskCount}</span>
              <span className="text-white/40"> / </span>
              <span className="text-emerald-300">{lowRiskCount}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
            <div className="text-sm text-white/60">ROI</div>
            <div
              className={`mt-2 text-2xl font-bold ${
                summary.roi >= 0 ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {summary.roi.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">🔥 风险排行榜 Top 10</h2>
            <div className="text-sm text-white/50">按 riskScore 排序</div>
          </div>

          <div className="space-y-3">
            {topRiskUsers.map((user) => (
              <div
                key={`${user.companyCode}-${user.userId}`}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-4"
              >
                <div>
                  <div className="font-semibold text-white">
                    {user.name || "-"}{" "}
                    <span className="ml-2 text-xs text-cyan-300">[{user.companyName}]</span>
                  </div>
                  <div className="mt-1 text-sm text-white/45">
                    {user.username} · {user.referrerName || "-"} · {user.mobile || "-"}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {getRiskReasons(user)
                      .slice(0, 3)
                      .map((reason) => (
                        <span
                          key={reason}
                          className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[11px] text-white/80"
                        >
                          {reason}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-red-300">{user.riskScore}</div>
                  <div
                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${riskBadgeClass(
                      user.riskLevel
                    )}`}
                  >
                    {user.riskLevel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">所有 Referrer 风险排行</h2>
              <div className="text-sm text-white/50">按平均风险分排序</div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10">
              <div className="grid grid-cols-[1.7fr_0.8fr_0.8fr_1fr_1fr_1fr] bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/55">
                <div>Referrer</div>
                <div>人数</div>
                <div>高风险</div>
                <div>均分</div>
                <div>总充值</div>
                <div>总盈亏</div>
              </div>

              <div className="divide-y divide-white/10 bg-black/10 max-h-[500px] overflow-y-auto">
                {referrerSummaries.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setSelectedReferrerName(item.name)}
                    className={`grid w-full grid-cols-[1.7fr_0.8fr_0.8fr_1fr_1fr_1fr] px-4 py-4 text-left transition hover:bg-white/5 ${
                      selectedReferrerName === item.name ? "bg-cyan-500/10" : ""
                    }`}
                  >
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-white/80">{item.memberCount}</div>
                    <div className="text-red-300">{item.highRiskCount}</div>
                    <div className="text-amber-300">{item.avgRiskScore.toFixed(2)}</div>
                    <div className="text-emerald-300">${formatMoney(item.depositTotal)}</div>
                    <div className={item.profit >= 0 ? "text-cyan-300" : "text-red-300"}>
                      ${formatMoney(item.profit)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">Referrer 详情</h2>

            {!selectedReferrer ? (
              <div className="rounded-3xl border border-white/10 bg-black/10 p-6 text-white/60">
                暂无来源数据
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
                  <div className="text-2xl font-bold">{selectedReferrer.name}</div>
                  <div className="mt-1 text-sm text-white/45">
                    人数 {selectedReferrer.memberCount} · 高风险 {selectedReferrer.highRiskCount}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <div className="rounded-2xl bg-white/5 p-3">
                      <div className="text-white/45">平均风险分</div>
                      <div className="mt-1 font-bold text-amber-300">
                        {selectedReferrer.avgRiskScore.toFixed(2)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-3">
                      <div className="text-white/45">总充值</div>
                      <div className="mt-1 font-bold text-emerald-300">
                        ${formatMoney(selectedReferrer.depositTotal)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-3">
                      <div className="text-white/45">总提现</div>
                      <div className="mt-1 font-bold text-red-300">
                        ${formatMoney(selectedReferrer.withdrawTotal)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-3">
                      <div className="text-white/45">总奖金</div>
                      <div className="mt-1 font-bold text-amber-300">
                        ${formatMoney(selectedReferrer.bonusTotal)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/10 p-4">
                  <div className="mb-3 text-sm font-semibold text-white/75">该 Referrer 用户列表</div>
                  <div className="space-y-2 max-h-[360px] overflow-y-auto">
                    {dbUsers
                      .filter((u) => ((u.referrerName || "").trim() || "无来源") === selectedReferrer.name)
                      .sort((a, b) => b.riskScore - a.riskScore)
                      .map((u) => (
                        <div
                          key={`${u.companyCode}-${u.userId}`}
                          className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2"
                        >
                          <div className="text-sm">
                            <div className="font-medium text-white">
                              {u.name} <span className="text-xs text-cyan-300">[{u.companyName}]</span>
                            </div>
                            <div className="text-xs text-white/45">{u.username}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-300">{u.riskScore}</div>
                            <div
                              className={`text-xs ${
                                u.riskLevel === "HIGH"
                                  ? "text-red-300"
                                  : u.riskLevel === "MEDIUM"
                                  ? "text-amber-300"
                                  : "text-emerald-300"
                              }`}
                            >
                              {u.riskLevel}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold">所有用户数据</h2>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                placeholder="搜公司 / 用户名 / 姓名 / 来源 / 手机号 / userId"
                className="min-w-[280px] rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none placeholder:text-white/35"
              />

              <select
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value as "all" | "LOW" | "MEDIUM" | "HIGH");
                  setPage(1);
                }}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-white outline-none"
              >
                <option value="all">全部风险</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>

              <button
                onClick={exportUsersCsv}
                className="rounded-2xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950"
              >
                导出 CSV
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10">
            <div className="grid grid-cols-[2.2fr_0.8fr_0.8fr_0.8fr_1.2fr_1.4fr_0.7fr] bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/55">
              <div>用户</div>
              <div>充值</div>
              <div>提现</div>
              <div>奖金</div>
              <div>最后存款 / 最后上线</div>
              <div>风险</div>
              <div>详情</div>
            </div>

            <div className="divide-y divide-white/10 bg-black/10 max-h-[700px] overflow-y-auto">
              {dbUsers.map((user) => (
                <div
                  key={`${user.companyCode}-${user.userId}`}
                  className="grid grid-cols-[2.2fr_0.8fr_0.8fr_0.8fr_1.2fr_1.4fr_0.7fr] items-center px-4 py-4"
                >
                  <div>
                    <div className="font-semibold text-white">
                      {user.name || "-"} <span className="text-xs text-cyan-300">[{user.companyName}]</span>
                    </div>
                    <div className="mt-1 text-xs text-white/45">
                      {user.userId} · {user.referrerName || "-"} · {user.mobile || "-"}
                    </div>
                  </div>

                  <div className="text-sm text-emerald-300">
                    ${formatMoney(toNumber(user.depTotal))}
                  </div>

                  <div className="text-sm text-red-300">
                    ${formatMoney(Math.abs(toNumber(user.wthTotal)))}
                  </div>

                  <div className="text-sm text-amber-300">
                    ${formatMoney(toNumber(user.bonusTotal))}
                  </div>

                  <div className="text-xs text-white/70">
                    <div>存款：{user.lastDepositTime || "-"}</div>
                    <div className="mt-1 text-white/45">上线：{user.visitedDateTime || "-"}</div>
                  </div>

                  <div>
                    <div className="font-bold text-red-300">{user.riskScore}</div>
                    <div
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${riskBadgeClass(
                        user.riskLevel
                      )}`}
                    >
                      {user.riskLevel}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {getRiskReasons(user)
                        .slice(0, 2)
                        .map((reason) => (
                          <span
                            key={reason}
                            className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] text-white/80"
                          >
                            {reason}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => openUserDrawer(user)}
                      className="rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950"
                    >
                      查看
                    </button>
                  </div>
                </div>
              ))}

              {dbUsers.length === 0 && (
                <div className="px-4 py-6 text-sm text-white/60">没有符合条件的数据</div>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-white/60">
              共 {pagination.total} 条，第 {pagination.page} / {pagination.totalPages} 页
            </div>

            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
              >
                <option value={10}>10 / 页</option>
                <option value={20}>20 / 页</option>
                <option value={50}>50 / 页</option>
                <option value={100}>100 / 页</option>
              </select>

              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 disabled:opacity-40"
              >
                上一页
              </button>

              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl">
          <div className="mb-3 text-lg font-semibold">调试信息</div>
          <pre className="overflow-auto rounded-2xl bg-slate-900 p-4 text-sm text-white/90">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 transition ${
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setDrawerOpen(false)}
        />

        <div
          className={`absolute right-0 top-0 h-full w-full max-w-2xl transform border-l border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <div className="text-sm text-white/45">用户详情抽屉</div>
                <div className="text-xl font-bold">{selectedUser?.name || "未选择用户"}</div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm"
              >
                关闭
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {!selectedUser ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
                  请选择用户
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-2xl font-bold">
                          {selectedUser.name || "-"}{" "}
                          <span className="text-sm text-cyan-300">[{selectedUser.companyName}]</span>
                        </div>
                        <div className="mt-1 text-sm text-white/45">
                          {selectedUser.userId} · {selectedUser.mobile || "-"} · {selectedUser.referrerName || "-"}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${riskBadgeClass(
                            selectedUser.riskLevel
                          )}`}
                        >
                          {selectedUser.riskLevel}
                        </span>
                        <div className="mt-2 text-sm font-bold text-red-200">
                          风险评分：{selectedUser.riskScore}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-black/20 p-3">
                        <div className="text-white/45">充值</div>
                        <div className="mt-1 font-bold text-emerald-300">
                          ${formatMoney(toNumber(selectedUser.depTotal))}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-black/20 p-3">
                        <div className="text-white/45">提现</div>
                        <div className="mt-1 font-bold text-red-300">
                          ${formatMoney(Math.abs(toNumber(selectedUser.wthTotal)))}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-black/20 p-3">
                        <div className="text-white/45">奖金</div>
                        <div className="mt-1 font-bold text-amber-300">
                          ${formatMoney(toNumber(selectedUser.bonusTotal))}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-black/20 p-3">
                        <div className="text-white/45">输赢</div>
                        <div className="mt-1 font-bold text-cyan-300">
                          ${formatMoney(toNumber(selectedUser.winLoss))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 text-sm font-semibold text-white/75">风险解释</div>
                    <div className="flex flex-wrap gap-2">
                      {getRiskReasons(selectedUser).map((reason) => (
                        <span
                          key={reason}
                          className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/85"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="rounded-2xl bg-black/20 p-4">
                      <div className="text-sm text-white/45">公司</div>
                      <div className="mt-2 font-bold text-white">{selectedUser.companyName || "-"}</div>
                    </div>

                    <div className="rounded-2xl bg-black/20 p-4">
                      <div className="text-sm text-white/45">用户名</div>
                      <div className="mt-2 font-bold text-white">{selectedUser.username || "-"}</div>
                    </div>

                    <div className="rounded-2xl bg-black/20 p-4">
                      <div className="text-sm text-white/45">手机号</div>
                      <div className="mt-2 font-bold text-white">{selectedUser.mobile || "-"}</div>
                    </div>

                    <div className="rounded-2xl bg-black/20 p-4">
                      <div className="text-sm text-white/45">来源</div>
                      <div className="mt-2 font-bold text-white">{selectedUser.referrerName || "-"}</div>
                    </div>

                    <div className="rounded-2xl bg-black/20 p-4">
                      <div className="text-sm text-white/45">注册时间</div>
                      <div className="mt-2 font-bold text-white">{selectedUser.createdDateTime || "-"}</div>
                    </div>

                    <div className="rounded-2xl bg-black/20 p-4">
                      <div className="text-sm text-white/45">最后上线时间</div>
                      <div className="mt-2 font-bold text-white">{selectedUser.visitedDateTime || "-"}</div>
                    </div>

                    <div className="rounded-2xl bg-black/20 p-4">
                      <div className="text-sm text-white/45">最后存款时间</div>
                      <div className="mt-2 font-bold text-white">{selectedUser.lastDepositTime || "-"}</div>
                    </div>

                    <div className="rounded-2xl bg-black/20 p-4">
                      <div className="text-sm text-white/45">充值次数 / 提现次数</div>
                      <div className="mt-2 font-bold text-white">
                        {toNumber(selectedUser.depCount)} / {toNumber(selectedUser.wthCount)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-semibold text-white/75">交易明细（按当前时间条件联动）</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            selectedUser && loadUserTransactions(selectedUser, Math.max(0, txPageIndex - 1))
                          }
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                        >
                          上一页
                        </button>
                        <button
                          onClick={() =>
                            selectedUser && loadUserTransactions(selectedUser, txPageIndex + 1)
                          }
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                        >
                          下一页
                        </button>
                      </div>
                    </div>

                    {txLoading ? (
                      <div className="text-sm text-white/60">加载中...</div>
                    ) : (
                      <div className="space-y-2">
                        {(txData?.history || []).length === 0 && (
                          <div className="text-sm text-white/60">当前时间范围内没有交易明细</div>
                        )}

                        {(txData?.history || []).map((row: any, index: number) => (
                          <div
                            key={index}
                            className="rounded-2xl bg-black/20 px-3 py-3 text-sm"
                          >
                            <div className="font-medium text-white">
                              {row.gameName || row.game || row.providerGameName || "-"}
                            </div>
                            <div className="mt-1 text-xs text-white/45">
                              {row.createdDateTime || row.betTime || row.datetime || "-"}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-3 text-xs">
                              <span className="text-amber-300">
                                下注：{toNumber(row.amount || row.betAmount || row.turnover || row.stake)}
                              </span>
                              <span className="text-cyan-300">
                                结果：{toNumber(row.result || row.winLoss || row.payout || row.netResult)}
                              </span>
                              <span className="text-white/60">
                                单号：{row.billNo || row.txId || row.roundId || row.betId || row.id || "-"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
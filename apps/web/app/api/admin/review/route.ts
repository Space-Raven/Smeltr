import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSessionWallet } from "../../../../lib/session";
import { isAdminWallet } from "../../../../lib/admin";
import { isReviewStatus, reviewWindow } from "../../../../lib/reviewQueue";

/**
 * GET /api/admin/review
 *
 * The weekly mint stream for curation. Admin-only (SIWS session wallet must be
 * in the platform admin allowlist).
 *
 * Query params:
 *   status   pending | approved | rejected | featured | hidden | all   (default pending)
 *   weeksAgo integer, 0 = this week, 1 = last week, ...                 (default 0)
 *   all      "1" to ignore the week window (whole history for a status)
 *   format   "csv" for a spreadsheet export, else JSON
 */
export async function GET(req: Request) {
  const wallet = await getSessionWallet();
  if (!wallet) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!isAdminWallet(wallet)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "pending";
  const format = url.searchParams.get("format");
  const ignoreWindow = url.searchParams.get("all") === "1";
  const weeksAgo = Number(url.searchParams.get("weeksAgo") ?? "0");

  const where: Record<string, unknown> = {};
  if (status !== "all") {
    if (!isReviewStatus(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    where.reviewStatus = status;
  }
  if (!ignoreWindow) {
    const { gte, lt } = reviewWindow({ weeksAgo });
    where.createdAt = { gte, lt };
  }

  const deployments = await prisma.deployment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  if (format === "csv") {
    const header = "mintAddress,walletAddress,name,symbol,uri,createdAt,reviewStatus,reviewNote";
    const rows = deployments.map((d) =>
      [
        d.mintAddress,
        d.walletAddress,
        JSON.stringify(d.name ?? ""),
        JSON.stringify(d.symbol ?? ""),
        JSON.stringify(d.uri ?? ""),
        d.createdAt.toISOString(),
        d.reviewStatus,
        JSON.stringify(d.reviewNote ?? ""),
      ].join(",")
    );
    return new NextResponse([header, ...rows].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="smeltr-mints-${status}-w${weeksAgo}.csv"`,
      },
    });
  }

  return NextResponse.json({ count: deployments.length, deployments });
}

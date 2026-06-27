import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Health check endpoint — always returns 200 regardless of NEXT_PUBLIC_MODE.
 * Used by ALB target group health checks and uptime monitors.
 */
export async function GET() {
  return NextResponse.json({ status: "ok", ts: Date.now() }, { status: 200 });
}

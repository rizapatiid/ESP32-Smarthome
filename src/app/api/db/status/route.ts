import { NextResponse } from "next/server";
import { testDatabaseConnection } from "@/lib/database/mysql";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await testDatabaseConnection();

  return NextResponse.json({
    status: result.ok ? "ONLINE" : "OFFLINE",
    host: result.host,
    port: result.port,
    database: process.env.DB_NAME || "u500072377_smarthome",
    user: process.env.DB_USER || "u500072377_smarthome",
    latencyMs: result.latencyMs,
    error: result.error,
    checkedAt: new Date().toISOString(),
  });
}

import { NextResponse } from "next/server";
import { getSensorHistory } from "@/lib/database/mysql";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const deviceId = searchParams.get("deviceId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const isSimulatedParam = searchParams.get("isSimulated");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    let isSimulated: boolean | undefined = undefined;
    if (isSimulatedParam === "true") isSimulated = true;
    else if (isSimulatedParam === "false") isSimulated = false;

    const result = await getSensorHistory({
      deviceId,
      startDate,
      endDate,
      isSimulated,
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(5, limit)),
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

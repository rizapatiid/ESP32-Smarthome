import { NextResponse } from "next/server";
import { getControlLogs, getSystemSetting } from "@/lib/database/mysql";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = await getSystemSetting("iot_mode", process.env.IOT_MODE || "simulation");

    const deviceId = searchParams.get("deviceId") || undefined;
    const isSimulatedParam = searchParams.get("isSimulated");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    let isSimulated: boolean | undefined = undefined;
    if (isSimulatedParam === "true") isSimulated = true;
    else if (isSimulatedParam === "false") isSimulated = false;
    else if (mode === "real") isSimulated = false;
    else if (mode === "simulation") isSimulated = true;

    const result = await getControlLogs({
      deviceId,
      isSimulated,
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(5, limit)),
    });

    return NextResponse.json({
      success: true,
      mode,
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

import { NextResponse } from "next/server";
import { processPendingFeedbackSchedules } from "@/server/feedback/service";

export async function GET(request: Request) {
  try {
    await processPendingFeedbackSchedules();

    return NextResponse.json({ success: true, message: "Schedules processed successfully" });
  } catch (error) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ error: "Failed to process schedules" }, { status: 500 });
  }
}

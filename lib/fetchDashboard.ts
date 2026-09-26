import type { DashboardPayload } from "./types";

export interface DashboardResult {
  data: DashboardPayload | null;
  error: string | null;
}

export async function fetchDashboard(): Promise<DashboardResult> {
  const url = process.env.DASHBOARD_API_URL;
  const key = process.env.DASHBOARD_API_KEY;

  if (!url || !key) {
    return {
      data: null,
      error:
        "DASHBOARD_API_URL and DASHBOARD_API_KEY are not set. Add them in your Vercel project's Environment Variables (see .env.example).",
    };
  }

  try {
    const res = await fetch(url, {
      headers: { "x-dashboard-key": key },
      cache: "no-store",
    });

    if (!res.ok) {
      return { data: null, error: `Dashboard API responded with HTTP ${res.status}.` };
    }

    const data = (await res.json()) as DashboardPayload;
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { data: null, error: `Could not reach the dashboard API: ${message}` };
  }
}

import { kv } from "@vercel/kv";
import { NextRequest } from "next/server";

const URL = process.env.LEADERBOARD_URL;
const SESSION = process.env.LEADERBOARD_SESSION;
const TIMEOUT = Number(process.env.LEADERBOARD_TIMEOUT ?? 900) * 1000; // 900 seconds

interface Data {
  fetchedAt: number;
  data: any;
}

export const dynamic = "force-dynamic"; // defaults to force-static
export async function GET(request: NextRequest) {
  if (URL == null || SESSION == null) {
    return Response.json({ error: "Missing configuration variables" }, { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams;
  const fresh = searchParams.get("fresh");

  const now = new Date().getTime();
  let data = await kv.get<Data>("data");

  if ((data?.data == null || fresh != null) && (data?.fetchedAt == null || now - data.fetchedAt > TIMEOUT)) {
    console.log(`Requesting fresh data for ${URL}`);
    const res = await fetch(URL, {
      headers: {
        "user-agent": "AoC Leaderboard",
        cookie: `session=${SESSION}`,
      },
    });
    const resData = await res.json();
    if (resData) {
      data = { data: resData, fetchedAt: new Date().getTime() };
      await kv.set<Data>("data", data);
    }
  } else {
    console.log(`Using cached data`);
  }

  return Response.json({ ok: true, ...data });
}

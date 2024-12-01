import { createClient } from "redis";
import { NextRequest } from "next/server";

const URL = process.env.LEADERBOARD_URL;
const SESSION = process.env.LEADERBOARD_SESSION;
const TIMEOUT = Number(process.env.LEADERBOARD_TIMEOUT ?? 900) * 1000; // 900 seconds
const REDIS_URL = process.env.REDIS_URL;

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
  const client = await createClient({ url: REDIS_URL })
    .on("error", (err: any) => console.log("Redis Client Error", err))
    .connect();

  const dataStr = await client.get("data");
  let data: Data | null = dataStr ? JSON.parse(dataStr) : null;

  if (data?.data == null || fresh != null || data?.fetchedAt == null || now - data.fetchedAt > TIMEOUT) {
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
      await client.set("data", JSON.stringify(data));
    }
  } else {
    console.log(`Using cached data`);
  }

  return Response.json({ ok: true, ...data });
}

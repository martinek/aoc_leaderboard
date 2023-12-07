import { useCallback, useEffect, useMemo, useState } from "react";

interface RawLeaderboardDayStats {
  star_index: number;
  get_star_ts: number;
}

interface RawLeaderboardMember {
  global_score: number;
  id: number;
  last_start_ts?: number;
  local_score: number;
  name: string;
  stars: number;
  completion_day_level: Record<string, { "1": RawLeaderboardDayStats; "2"?: RawLeaderboardDayStats }>;
}

interface RawLeaderboardData {
  event: string;
  owner_id: number;
  members: Record<string, RawLeaderboardMember>;
}

export interface LeaderboardDayPartStats {
  starIndex: number;
  getStartTs: Date;
}

export interface LeaderboardDayStats {
  "1": LeaderboardDayPartStats;
  "2"?: LeaderboardDayPartStats;
}

export interface LeaderboardMember {
  globalScore: number;
  id: number;
  lastStarTs?: Date;
  localScore: number;
  name: string;
  stars: number;
  completionDayLevel: Record<string, LeaderboardDayStats>;
}

export interface LeaderboardData {
  event: string;
  ownerId: number;
  members: LeaderboardMember[];
  fetchedAt: number;
}

interface ApiResponse {
  data: RawLeaderboardData;
  fetchedAt: number;
}

export interface UseDataResult {
  data: LeaderboardData | undefined;
  error: Error | undefined;
  loading: boolean;
  refetch: (fresh?: boolean) => void;
}

const useData = (): UseDataResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [raw, setRaw] = useState<ApiResponse | undefined>(undefined);

  const fetchData = useCallback(async (fresh?: boolean) => {
    setLoading(true);
    setError(undefined);

    try {
      const res = await fetch(`/api${fresh ? "?fresh=1" : ""}`);
      const data = await res.json();
      setRaw(data);
    } catch (error) {
      setError(new Error(`Error fetching data: ${error}`));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const data: LeaderboardData | undefined = useMemo(() => {
    if (raw == null) {
      return undefined;
    }

    const rawData = raw.data;

    return {
      fetchedAt: raw.fetchedAt,
      event: rawData.event,
      ownerId: rawData.owner_id,
      members: Object.values(rawData.members).map((rawMember) => ({
        globalScore: rawMember.global_score,
        id: rawMember.id,
        lastStarTs: rawMember.last_start_ts ? new Date(rawMember.last_start_ts * 1000) : undefined,
        localScore: rawMember.local_score,
        name: rawMember.name,
        stars: rawMember.stars,
        completionDayLevel: Object.entries(rawMember.completion_day_level).reduce<
          LeaderboardMember["completionDayLevel"]
        >((acc, [id, stats]) => {
          const s: LeaderboardDayStats = {
            "1": {
              starIndex: stats["1"].star_index,
              getStartTs: new Date(stats["1"].get_star_ts * 1000),
            },
          };
          if (stats["2"] != null) {
            s["2"] = {
              starIndex: stats["2"].star_index,
              getStartTs: new Date(stats["2"].get_star_ts * 1000),
            };
          }
          acc[id] = s;
          return acc;
        }, {}),
      })),
    };
  }, [raw]);

  return { data, error, loading, refetch: fetchData };
};

export default useData;

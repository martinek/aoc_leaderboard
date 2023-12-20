import dynamic from "next/dynamic";

const DynamicLeaderboard = dynamic(() => import("@/components/Leaderboard"), {
  ssr: false,
});

export default function Home() {
  return <DynamicLeaderboard />;
}

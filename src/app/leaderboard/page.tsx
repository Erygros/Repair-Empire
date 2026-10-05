import { redirect } from "next/navigation";
import { GameShell } from "@/components/game-shell";
import { requireSession } from "@/lib/session";
export const metadata = { title: "Rangliste | Repair Empire", robots: { index: false, follow: false } };
export default async function LeaderboardPage() {
  const session = await requireSession();
  if (!session.user.characterCreated) redirect("/create-character");
  return <GameShell initialView="leaderboard"/>;
}

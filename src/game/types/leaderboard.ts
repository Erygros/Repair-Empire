export type RankingSort = "level" | "reputation" | "capital" | "customers";
export type RankingRow = { rank: number; ceoName: string; own: boolean; companyLevel: number; companyXp: number; reputation: number; capital: number; customersServed: number; successfulRepairs: number; updatedAt: string };
export type LeaderboardResult = { sort: RankingSort; page: number; top: RankingRow[]; rows: RankingRow[]; own: RankingRow | null; hasNext: boolean; season: null };

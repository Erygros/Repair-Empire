import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import type { LeaderboardResult, RankingRow, RankingSort } from "@/game/types/leaderboard";
export const rankingOrders: Record<RankingSort, string> = {
  level: "e.company_level desc, e.company_xp desc, e.reputation desc, e.company_id asc",
  reputation: "e.reputation desc, e.company_level desc, e.successful_repairs desc, e.company_id asc",
  capital: "e.capital desc, e.company_id asc",
  customers: "e.customers_served desc, e.successful_repairs desc, e.company_id asc",
};
const columns: Record<RankingSort, string[]> = {
  level: ["company_level", "company_xp", "reputation"], reputation: ["reputation", "company_level", "successful_repairs"],
  capital: ["capital"], customers: ["customers_served", "successful_repairs"],
};
export async function readLeaderboard(accountId: string, sort: RankingSort, page: number): Promise<LeaderboardResult> {
  const first = (page - 1) * 50 + 1;
  const keys = columns[sort];
  const ahead = [...keys.map((key, index) => `${keys.slice(0, index).map(previous => `b.${previous} = e.${previous}`).concat(`b.${key} > e.${key}`).join(" and ")}`), `${keys.map(key => `b.${key} = e.${key}`).concat("b.company_id < e.company_id").join(" and ")}`].map(condition => `(${condition})`).join(" or ");
  // One MVCC snapshot; only the selected display rows leave PostgreSQL.
  const rows = await getDb().execute(sql`
    with eligible as not materialized (
      select e.*, c.account_id = ${accountId} as own, ch.ceo_name
      from leaderboard_entry e join company c on c.id = e.company_id
      join "user" u on u.id = c.account_id join character ch on ch.id = c.character_id and ch.account_id = u.id
      where u.account_status = 'ACTIVE' and u.character_created = true
        and e.company_level >= 1 and e.company_xp >= 0 and e.reputation >= 0
        and e.capital >= 0 and e.customers_served >= 0 and e.successful_repairs >= 0
    ), page_rows as (
      select e.*, row_number() over (order by ${sql.raw(rankingOrders[sort])}) + ${first - 1} as rank
      from (select * from eligible e order by ${sql.raw(rankingOrders[sort])} limit 51 offset ${first - 1}) e
    ), top_rows as (
      select e.*, row_number() over (order by ${sql.raw(rankingOrders[sort])}) as rank
      from (select * from eligible e order by ${sql.raw(rankingOrders[sort])} limit 3) e
    ), own_row as (
      select e.*, (select count(*) + 1 from eligible b where ${sql.raw(ahead)}) as rank from eligible e where own
    ), selected as (select * from page_rows union select * from top_rows union select * from own_row)
    select rank, own, ceo_name as "ceoName", company_level as "companyLevel", company_xp as "companyXp", reputation, capital,
      customers_served as "customersServed", successful_repairs as "successfulRepairs", updated_at as "updatedAt" from selected order by rank
  `);
  const display = (row: Record<string, unknown>): RankingRow => ({
    rank: Number(row.rank), ceoName: String(row.ceoName), own: row.own === true,
    companyLevel: Number(row.companyLevel), companyXp: Number(row.companyXp), reputation: Number(row.reputation), capital: Number(row.capital),
    customersServed: Number(row.customersServed), successfulRepairs: Number(row.successfulRepairs), updatedAt: new Date(String(row.updatedAt)).toISOString()
  });
  const safe = rows.map(display);
  return { sort, page, top: safe.filter(row => row.rank <= 3), rows: safe.filter(row => row.rank >= first && row.rank < first + 50), own: safe.find(row => row.own) ?? null, hasNext: safe.some(row => row.rank === first + 50), season: null };
}

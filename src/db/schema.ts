import { sql } from "drizzle-orm";
import { bigint, boolean, index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull(), emailVerified: boolean("email_verified").default(false).notNull(), image: text("image"), createdAt: timestamp("created_at").defaultNow().notNull(), updatedAt: timestamp("updated_at").defaultNow().notNull(),
  username: text("username").notNull(), displayUsername: text("display_username").notNull(), normalizedUsername: text("normalized_username").notNull(), normalizedEmail: text("normalized_email").notNull(), ceoName: text("ceo_name").notNull(), accountStatus: text("account_status").default("ACTIVE").notNull(), characterCreated: boolean("character_created").default(false).notNull(),
}, (table) => [uniqueIndex("user_email_unique").on(table.email), uniqueIndex("user_normalized_email_unique").on(table.normalizedEmail), uniqueIndex("user_username_unique").on(table.username), uniqueIndex("user_normalized_username_unique").on(table.normalizedUsername), uniqueIndex("user_email_case_insensitive_unique").on(sql`lower(trim(${table.email}))`), uniqueIndex("user_username_case_insensitive_unique").on(sql`lower(trim(${table.username}))`)]);
export const rateLimit = pgTable("rate_limit", { id: text("id").primaryKey(), key: text("key").notNull().unique(), count: integer("count").notNull(), lastRequest: bigint("last_request", { mode: "number" }).notNull() });
export const sessions = pgTable("session", { id: text("id").primaryKey(), expiresAt: timestamp("expires_at").notNull(), token: text("token").notNull().unique(), createdAt: timestamp("created_at").defaultNow().notNull(), updatedAt: timestamp("updated_at").defaultNow().notNull(), ipAddress: text("ip_address"), userAgent: text("user_agent"), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }) }, (table) => [index("session_user_idx").on(table.userId)]);
export const accounts = pgTable("account", { id: text("id").primaryKey(), accountId: text("account_id").notNull(), providerId: text("provider_id").notNull(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), accessToken: text("access_token"), refreshToken: text("refresh_token"), idToken: text("id_token"), accessTokenExpiresAt: timestamp("access_token_expires_at"), refreshTokenExpiresAt: timestamp("refresh_token_expires_at"), scope: text("scope"), password: text("password"), createdAt: timestamp("created_at").defaultNow().notNull(), updatedAt: timestamp("updated_at").defaultNow().notNull() }, (table) => [index("account_user_idx").on(table.userId)]);
export const verifications = pgTable("verification", { id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(), expiresAt: timestamp("expires_at").notNull(), createdAt: timestamp("created_at").defaultNow(), updatedAt: timestamp("updated_at").defaultNow() }, (table) => [index("verification_identifier_idx").on(table.identifier)]);
export const characters = pgTable("character", { id: text("id").primaryKey(), accountId: text("account_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(), ceoName: text("ceo_name").notNull(), characterModelId: text("character_model_id").notNull().default("founder_female_01"), presentation: text("presentation").notNull(), appearance: jsonb("appearance").notNull(), founderSkill: text("founder_skill").notNull(), createdAt: timestamp("created_at").defaultNow().notNull(), updatedAt: timestamp("updated_at").defaultNow().notNull() });
export const companies = pgTable("company", { id: text("id").primaryKey(), accountId: text("account_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(), characterId: text("character_id").notNull().references(() => characters.id), gameState: jsonb("game_state").notNull(), createdAt: timestamp("created_at").defaultNow().notNull(), updatedAt: timestamp("updated_at").defaultNow().notNull() });

// A projection of the existing company state, never a client-uploaded score.
export const leaderboardEntries = pgTable("leaderboard_entry", {
  companyId: text("company_id").primaryKey().references(() => companies.id, { onDelete: "cascade" }),
  revision: integer("revision").default(0).notNull(),
  companyLevel: numeric("company_level", { mode: "number" }).notNull(),
  companyXp: numeric("company_xp", { mode: "number" }).notNull(),
  reputation: numeric("reputation", { mode: "number" }).notNull(),
  capital: numeric("capital", { mode: "number" }).notNull(),
  customersServed: numeric("customers_served", { mode: "number" }).notNull(),
  successfulRepairs: numeric("successful_repairs", { mode: "number" }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, table => [
  index("leaderboard_level_idx").on(table.companyLevel.desc(), table.companyXp.desc(), table.reputation.desc(), table.companyId),
  index("leaderboard_reputation_idx").on(table.reputation.desc(), table.companyLevel.desc(), table.successfulRepairs.desc(), table.companyId),
  index("leaderboard_capital_idx").on(table.capital.desc(), table.companyId),
  index("leaderboard_customers_idx").on(table.customersServed.desc(), table.successfulRepairs.desc(), table.companyId),
]);

// Reserved for a future season engine; never populated from permanent progress.
export const seasonProgress = pgTable("season_progress", {
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  seasonKey: text("season_key").notNull(),
  seasonLevel: numeric("season_level", { mode: "number" }).notNull(),
  seasonPoints: numeric("season_points", { mode: "number" }).notNull(),
}, table => [uniqueIndex("season_company_unique").on(table.seasonKey, table.companyId)]);

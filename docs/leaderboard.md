# Global Leaderboard (Prompt 12)

## Deploy

Apply `npm run db:migrate` against the intended Neon database before deploying
this commit to Vercel. Migration `0002_mysterious_husk.sql` only adds tables,
foreign keys and indexes. It does not alter existing account or company saves.
Only the local test database has been migrated during development. Never copy
database secrets into Git. Rotate credentials previously shared in chat.

## Authority and legacy saves

Before this feature, `company.game_state` contained only an initial server state;
progression, offline rewards and imports ran in LocalStorage. Those historical
values cannot be authenticated retrospectively. No legacy score is backfilled.

An eligible player explicitly activates a verified starting save from the
leaderboard. This uses the existing company row, initial economy, immutable
server-stored founder skill and saved character. The original local save key
is retained without replacement. Activation never resets an already verified
save. There is no ranking reset or reward endpoint.

The verified economic save is advanced by the SAME pure game functions and
shared action reducer used by local gameplay. This is not a second progression
engine. Private local gameplay, cosmetics, animation, audio and settings remain
client-side. Only explicit activation switches the economic command path;
accounts that have not activated retain their local gameplay and are unranked.
The preserved legacy save is not merged with the verified save and there is not
yet an in-game switch back to that legacy save after activation.

`/api/game/verified` accepts only strict command IDs and a revision, or explicit
activation. It accepts no scores, uploaded saves, costs, rewards, customer lists
or timestamps. State, command result and ranking projection are committed in
one database transaction under a company row lock. A stale revision returns 409
with the latest private own save, without executing the requested action.
Clients serialize requests and never automatically replay conflicting commands.

The server controls order generation, eligibility, costs, rewards, repair
deadlines, level/XP, research, upgrades, staff, challenges and contracts through
the existing rules. Offline settlement uses the persisted server timestamp and
existing offline cap. The customer identity ledger survives recent-customer
cleanup. Multi-device completion and contract bonuses do not count extra people.
Economic imports and dev grants are disabled in verified mode.

## Queries and privacy

Authenticated GET `/api/leaderboard?sort=level&page=1` supports `level`,
`reputation`, `capital`, `customers`, `season`. `/leaderboard` requires an active
account and character. URL UI state uses `type`, `sort`, `page`.

Sort keys (descending except the final internal ascending company ID):

- Level: level, current-level XP, reputation, company ID.
- Reputation: reputation, level, successful repairs, company ID.
- Capital: available money, company ID.
- Customers: lifetime unique served customers, successful repairs, company ID.

One parameterized SQL statement joins eligibility and character display name,
selects top three, an index-ordered 51-row page and a COUNT of entries ahead of
the requesting player. Ranking numbers are assigned in PostgreSQL. The extra
page row only signals the next page; 50 rows are returned. No N+1 or complete
account list is transmitted. The final whitelist includes only rank, CEO name,
ingame metrics, own-row marker and update time. Login username/email/internal
identity never leave this ranking query. Default local companyName is not a
real named company system, so no fabricated company names are displayed.

Four composite B-tree indexes match the permanent sort keys. The projection
is derived from `company.game_state`; it is not independently writable through
an API. Numeric DB columns support level 100000 and large money. The game still
uses JavaScript numbers; values outside safe integer precision are rejected,
not silently ranked. No arbitrary-precision economy has been introduced.

Active status and character ownership are checked in SQL for every read. The
endpoint has per-account DB rate limiting (60 reads/minute), private no-store
responses and a 30-second UI refresh. Game commands have separate 120/minute
limiting, strict same-origin POSTs and authentication. No global public cache
contains the requesting player's identity or position.

## Season and assets

`season_progress` reserves company + season key, season level and points;
it is empty until a future season engine supplies its own verified data.
The Season tab says "Derzeit keine aktive Season." There is no derivation from
permanent level, fake score, reset, shop, inventory or world-map addition.

Existing Founder, Company Level, Reputation, Capital, Customers and Seasons
raster assets are used. A dedicated Leaderboard asset is missing: the existing
Company Level graph is a disclosed temporary navigation icon, NOT an
Achievement/Trophy reused under a misleading name. Recommended final master:
1024x1024 transparent PNG, industrial ranked bars with wrench, normal/active.

## Remaining limitations

- This is not a claim of cheat-proof gameplay. Automated clients can issue valid
  commands; bot detection and multi-account abuse controls are not implemented.
- Offline progress is settled lazily on the player's next sync; abandoned
  companies are not continuously simulated by a scheduler. Rankings reflect
  the last confirmed snapshot, not predicted offline earnings.
- Exact own-rank counting and deep OFFSET pages cost progressively more at very
  large scale. The indexes avoid whole-table window sorting; a production
  million-account benchmark and cursor snapshot pagination are not included.
- Concurrent score changes can move players across page boundaries between
  separate page reads; each response itself has one consistent MVCC snapshot.
- The served-customer ledger currently resides in existing JSONB game state.
  Very long histories increase save size and offline CPU; a normalized durable
  ledger may be needed at larger scale, without inventing legacy history.
- Gameplay animation uses the client clock, but completion never trusts it.
  There may be a 10-second server synchronization delay for autonomous jobs.
- The legacy game's Number arithmetic is limited to safe integers. No Infinity,
  NaN or unsafe ranking value is accepted; unlimited level means no game-imposed
  cap, not infinite numeric precision.

## Verification

`node --test tests/leaderboard-game.test.mjs tests/leaderboard.integration.mjs`
requires the local isolated PostgreSQL database and local running Next server
for integration. Fixtures are created only on localhost `repair_empire`, and
removed in finally blocks. They are never production seeds.

Coverage includes all sort modes and exact ties, level 100000, safe-integer-large
money, rank 63 outside top 50, deterministic pages, banned/characterless account
exclusion, privacy, auth, origin, strict payloads, early completion, concurrent
devices, replay, repeat activation, offline/automatic progress, customer cleanup,
multi-device and contract completion. Browser checks cover 1600x1080, 1024x768,
360x800, preserved local save, stable navigation, loaded assets and Season URL
state after refresh. All existing auth and visual-logic tests are also run.

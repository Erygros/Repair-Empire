import test from "node:test";
import assert from "node:assert/strict";
import { loadGameModule } from "./helpers/game-loader.mjs";
const game = loadGameModule("src/game/logic/game.ts");
const { recordCustomerRepair } = loadGameModule("src/game/logic/customers.ts");
const { applyGameAction } = loadGameModule("src/game/logic/actions.ts");
const { verifiedRequestSchema } = loadGameModule("src/game/logic/action-validation.ts");
test("strict commands reject scores, rewards, clocks and arbitrary identifiers", () => {
  for (const payload of [{ level: 999999, money: 9e12 }, { activate: true, state: {} }, { revision: 0, action: { type: "completeRepair", workstationId: "WS-01", now: 99999999999 } }, { revision: 0, action: { type: "purchaseTool", toolId: "unknown" } }, { revision: -1 }, { revision: 0, capital: 9e12 }]) assert.equal(verifiedRequestSchema.safeParse(payload).success, false);
  assert.equal(verifiedRequestSchema.safeParse({ revision: 0, action: { type: "refreshCandidates" } }).success, true);
});
test("shared reducer uses supplied clock and repair settlement is idempotent", () => {
  const state = game.createInitialState(); const now = state.lastActiveAt;
  const started = applyGameAction(state, { type: "assignOrder", orderId: state.availableOrders[0].id, workstationId: state.workstations[0].id }, now);
  const repair = started.state.workstations[0].activeRepair;
  assert.equal(repair.startedAt, now);
  assert.equal(applyGameAction(started.state, { type: "completeRepair", workstationId: state.workstations[0].id }, now).state.money, started.state.money);
  const settled = applyGameAction(started.state, { type: "completeRepair", workstationId: state.workstations[0].id }, repair.endsAt);
  const replay = applyGameAction(settled.state, { type: "completeRepair", workstationId: state.workstations[0].id }, repair.endsAt + 1);
  assert.equal(settled.state.lifetimeStats.repairsCompleted, 1); assert.equal(settled.state.lifetimeStats.customersServed, 1);
  assert.equal(replay.state.money, settled.state.money); assert.equal(replay.state.lifetimeXp, settled.state.lifetimeXp);
});
test("served customers stay unique after cleanup and across multi-device repairs", () => {
  let state = game.createInitialState(); const order = state.availableOrders[0];
  state = recordCustomerRepair(state, order, Date.now());
  state = { ...state, recentCustomers: [], persistentCustomers: [] };
  state = recordCustomerRepair(state, { ...order, id: "next-device", multiDeviceOrderId: "MD-1" }, Date.now());
  assert.equal(state.lifetimeStats.customersServed, 1);
  state = recordCustomerRepair(state, { ...order, id: "other", customerId: "CU-99999" }, Date.now());
  assert.equal(state.lifetimeStats.customersServed, 2);
});
test("offline and automated settlement share customer and reward deduplication", () => {
  let state = game.createInitialState(); const now = state.lastActiveAt;
  const station = state.workstations[1], candidate = state.candidates[0];
  state = { ...state, money: 50000, employees: [{ ...candidate, skill: 100, speed: 2, level: 1, xp: 0, assignedWorkstationId: station.id, repairsCompleted: 0, revenueGenerated: 0 }], workstations: state.workstations.map(item => item.id === station.id ? { ...item, status: "available", assignedEmployeeId: candidate.id, automationEnabled: true } : item) };
  const offline = game.processOfflineProgress(state, now + 300000);
  assert.ok(offline.state.lifetimeStats.repairsCompleted > 1);
  assert.equal(offline.state.lifetimeStats.customersServed, Object.keys(offline.state.servedCustomerIds).length);
  assert.ok(offline.state.nextCustomerNumber > Math.max(...Object.keys(offline.state.servedCustomerIds).map(id => Number(id.slice(3)))));
  const replay = game.processOfflineProgress(offline.state, now + 300000);
  assert.equal(replay.state.money, offline.state.money); assert.equal(replay.state.lifetimeStats.repairsCompleted, offline.state.lifetimeStats.repairsCompleted);
  const auto = game.processOfflineProgress(replay.state, now + 330000, "automated");
  assert.ok(auto.state.lifetimeStats.automatedRepairs > 0);
  assert.equal(auto.state.lifetimeStats.customersServed, Object.keys(auto.state.servedCustomerIds).length);
});
test("multi-device completion and contract bonus never add an extra served customer", () => {
  const { generateCustomer } = loadGameModule("src/game/logic/customers.ts");
  const { generateContract, acceptContract, claimContract } = loadGameModule("src/game/logic/contracts.ts");
  let state = game.createInitialState(), now = state.lastActiveAt;
  const customer = { ...generateCustomer(777, game.getProgressionContext(state), now), customerType: "SMALL_BUSINESS", isPersistent: true };
  state = { ...state, persistentCustomers: [customer] };
  const multi = game.createMultiDeviceOrder(state, customer.id, now); state = multi.state;
  const group = state.multiDeviceOrders[0];
  const contract = { ...generateContract(state, customer, now), target: group.totalItems, requiresUrgent: false, targetCategory: null };
  state = acceptContract({ ...state, contractOffers: [contract] }, contract.id, now).state;
  for (const id of group.items) {
    state = game.startRepairAtWorkstation(state, id, state.workstations[0].id, now).state;
    now = state.workstations[0].activeRepair.endsAt;
    state = game.settleWorkstation(state, state.workstations[0].id, now).state;
  }
  assert.equal(state.lifetimeStats.customersServed, 1); assert.equal(state.lifetimeStats.multiDeviceOrdersCompleted, 1); assert.equal(state.lifetimeStats.contractsCompleted, 1);
  const claimed = claimContract(state, contract.id, now).state;
  assert.equal(claimed.lifetimeStats.customersServed, 1);
  assert.equal(claimContract(claimed, contract.id, now + 1).state.money, claimed.money);
});

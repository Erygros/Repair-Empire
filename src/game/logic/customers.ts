import { BUSINESS_PREFIXES, BUSINESS_SUFFIXES, CUSTOMER_TYPE_CONFIG, PRIVATE_FIRST_NAMES, PRIVATE_LAST_NAMES, RECENT_CUSTOMER_LIMIT, RELATIONSHIP_THRESHOLDS } from "@/game/data/customers";
import type { Customer, CustomerType, GameState, ProgressionContext, RepairCategory, RepairOrder } from "@/game/types";

function seededUnit(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function pick<T>(items: T[], seed: number) { return items[Math.floor(seededUnit(seed) * items.length) % items.length]; }

export function getRelationshipState(loyalty: number) {
  return RELATIONSHIP_THRESHOLDS.find((entry) => loyalty >= entry.loyalty)!.state;
}

export function getEligibleCustomerTypes(context: ProgressionContext) {
  return (Object.keys(CUSTOMER_TYPE_CONFIG) as CustomerType[]).filter((type) => {
    const config = CUSTOMER_TYPE_CONFIG[type];
    return context.companyLevel >= config.minLevel && context.reputation >= config.minReputation;
  });
}

export function generateCustomer(number: number, context: ProgressionContext, now: number): Customer {
  const eligible = getEligibleCustomerTypes(context);
  const roll = seededUnit(number * 17);
  let customerType = pick(eligible, number * 19);
  if (roll < 0.48) customerType = "PRIVATE";
  else if (roll < 0.7 && eligible.includes("GAMER")) customerType = "GAMER";
  const business = ["SMALL_BUSINESS", "RETAILER", "CORPORATE"].includes(customerType);
  const displayName = business
    ? `${pick(BUSINESS_PREFIXES, number * 23)} ${pick(BUSINESS_SUFFIXES, number * 29)}`
    : `${pick(PRIVATE_FIRST_NAMES, number * 23)} ${pick(PRIVATE_LAST_NAMES, number * 29)}`;
  return {
    id: `CU-${String(number).padStart(5, "0")}`,
    displayName,
    customerType,
    preferredDeviceCategories: CUSTOMER_TYPE_CONFIG[customerType].preferences,
    loyalty: 0,
    relationshipState: "NEW",
    totalJobs: 0,
    successfulJobs: 0,
    totalRevenueGenerated: 0,
    firstSeenAt: now,
    lastSeenAt: now,
    isPersistent: false,
    activeContractId: null,
    recentRepairs: [],
  };
}

export function chooseCustomer(state: GameState, orderNumber: number, now: number) {
  const pool = [...state.persistentCustomers, ...state.recentCustomers];
  const returnChance = Math.min(0.52, 0.1 + state.upgrades["customer-network"] * 0.05 + pool.reduce((sum, customer) => sum + customer.loyalty, 0) / Math.max(1, pool.length) / 500);
  if (pool.length > 0 && seededUnit(orderNumber * 31) < returnChance) {
    return { customer: pick(pool, orderNumber * 37), returning: true };
  }
  return { customer: generateCustomer(state.nextCustomerNumber, { ownedTools: state.ownedTools, reputation: state.reputation, upgrades: state.upgrades, companyLevel: state.companyLevel, researchedNodes: state.researchedNodes }, now), returning: false };
}

export function preferredTemplates<T extends { category: RepairCategory }>(templates: T[], customer: Customer) {
  const preferred = templates.filter((template) => customer.preferredDeviceCategories.includes(template.category));
  return preferred.length > 0 ? preferred : templates;
}

export function recordCustomerRepair(state: GameState, order: RepairOrder, now: number) {
  const existing = [...state.persistentCustomers, ...state.recentCustomers].find((customer) => customer.id === order.customerId);
  const base: Customer = existing ?? {
    id: order.customerId, displayName: order.customer, customerType: order.customerType,
    preferredDeviceCategories: CUSTOMER_TYPE_CONFIG[order.customerType].preferences, loyalty: 0,
    relationshipState: "NEW", totalJobs: 0, successfulJobs: 0, totalRevenueGenerated: 0,
    firstSeenAt: order.createdAt, lastSeenAt: order.createdAt, isPersistent: false, activeContractId: null, recentRepairs: [],
  };
  const loyaltyGain = order.variant === "premium" ? 8 : order.variant === "urgent" ? 7 : 5;
  const loyalty = Math.min(100, base.loyalty + loyaltyGain);
  const successfulJobs = base.successfulJobs + 1;
  const business = ["SMALL_BUSINESS", "RETAILER", "CORPORATE"].includes(base.customerType);
  const isPersistent = base.isPersistent || successfulJobs >= 2 || loyalty >= 15 || (business && successfulJobs >= 1);
  const updated: Customer = {
    ...base, loyalty, relationshipState: getRelationshipState(loyalty), totalJobs: base.totalJobs + 1,
    successfulJobs, totalRevenueGenerated: base.totalRevenueGenerated + order.reward, lastSeenAt: now, isPersistent,
    recentRepairs: [{ device: order.device, completedAt: now }, ...base.recentRepairs].slice(0, 6),
  };
  const persistentCustomers = isPersistent
    ? [...state.persistentCustomers.filter((customer) => customer.id !== updated.id), updated]
    : state.persistentCustomers;
  const recentCustomers = isPersistent
    ? state.recentCustomers.filter((customer) => customer.id !== updated.id)
    : [updated, ...state.recentCustomers.filter((customer) => customer.id !== updated.id)].slice(0, RECENT_CUSTOMER_LIMIT);
  return {
    ...state,
    persistentCustomers,
    recentCustomers,
    lifetimeStats: {
      ...state.lifetimeStats,
      customersServed: state.lifetimeStats.customersServed + (base.successfulJobs === 0 ? 1 : 0),
      returningCustomers: state.lifetimeStats.returningCustomers + (order.returningCustomer ? 1 : 0),
    },
  };
}

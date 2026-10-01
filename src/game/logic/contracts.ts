import { BASE_ACTIVE_CONTRACT_LIMIT, CUSTOMER_TYPE_CONFIG } from "@/game/data/customers";
import { awardCompanyXp } from "@/game/logic/progression";
import { applyTransaction } from "@/game/logic/economy";
import { getRelationshipState } from "@/game/logic/customers";
import type { Contract, ContractType, Customer, GameState, RepairOrder } from "@/game/types";
import { getBuildingFeatureValue } from "@/game/data/buildings";

export function getActiveContractLimit(state: GameState) {
  const officeCapacity = getBuildingFeatureValue(state, "BUSINESS_OFFICE", "contract-capacity");
  return Math.max(BASE_ACTIVE_CONTRACT_LIMIT, officeCapacity) + (state.researchedNodes.includes("contract-management") ? 1 : 0);
}

export function canOfferContract(state: GameState, customer: Customer) {
  const config = CUSTOMER_TYPE_CONFIG[customer.customerType];
  const capacity = state.workstations.filter((station) => station.status !== "locked").length;
  return config.contractEligible && customer.loyalty >= 5 && state.companyLevel >= config.minLevel && state.reputation >= config.minReputation && capacity >= (customer.customerType === "CORPORATE" ? 3 : 1);
}

export function generateContract(state: GameState, customer: Customer, now: number): Contract {
  const types: ContractType[] = customer.customerType === "PREMIUM"
    ? ["PRIORITY_SERVICE", "SPECIALIZED_SERVICE"]
    : customer.customerType === "RETAILER" || customer.customerType === "CORPORATE"
      ? ["BULK_REPAIR", "SPECIALIZED_SERVICE", "SERVICE"]
      : ["SERVICE", "SPECIALIZED_SERVICE"];
  const type = types[state.nextContractNumber % types.length];
  const capacity = state.workstations.filter((station) => station.status !== "locked").length;
  const target = Math.max(2, Math.min(12, 2 + Math.floor(state.companyLevel / 40) + capacity + (type === "BULK_REPAIR" ? 2 : 0)));
  const category = type === "SPECIALIZED_SERVICE" ? customer.preferredDeviceCategories[state.nextContractNumber % customer.preferredDeviceCategories.length] : null;
  const money = Math.round(target * (65 + state.companyLevel * 1.2) * (type === "PRIORITY_SERVICE" ? 1.25 : 1));
  const labels: Record<ContractType, string> = { SERVICE: "Servicevertrag", BULK_REPAIR: "Serienreparatur", SPECIALIZED_SERVICE: "Fachservice", PRIORITY_SERVICE: "Prioritätsservice" };
  return {
    id: `CT-${String(state.nextContractNumber).padStart(4, "0")}`, customerId: customer.id, customerName: customer.displayName,
    type, title: labels[type], description: category ? `${target} Reparaturen in ${category}` : type === "PRIORITY_SERVICE" ? `${target} Express-Reparaturen` : `${target} geeignete Reparaturen`,
    target, progress: 0, targetCategory: category, requiresUrgent: type === "PRIORITY_SERVICE",
    reward: { money, xp: target * 16, reputation: Math.max(2, Math.floor(target / 2)), researchPoints: target >= 7 ? 1 : 0, loyalty: Math.min(15, 5 + Math.floor(target / 2)) },
    status: "offered", createdAt: now, acceptedAt: null, expiresAt: type === "PRIORITY_SERVICE" ? now + Math.max(15, target * 4) * 60_000 : now + 24 * 60 * 60 * 1000,
    completedAt: null, rewardedAt: null,
  };
}

export function maybeCreateContractOffer(state: GameState, customerId: string, now: number) {
  const customer = state.persistentCustomers.find((item) => item.id === customerId);
  if (!customer || !canOfferContract(state, customer)) return state;
  if ([...state.contractOffers, ...state.contracts].some((contract) => contract.customerId === customerId && ["offered", "active", "completed"].includes(contract.status))) return state;
  if ((customer.successfulJobs + state.nextContractNumber) % 2 !== 0) return state;
  return { ...state, contractOffers: [...state.contractOffers, generateContract(state, customer, now)].slice(-6), nextContractNumber: state.nextContractNumber + 1 };
}

export function acceptContract(state: GameState, contractId: string, now: number) {
  const offer = state.contractOffers.find((contract) => contract.id === contractId);
  const active = state.contracts.filter((contract) => contract.status === "active").length;
  if (!offer) return { state, error: "Vertragsangebot nicht gefunden" };
  if (active >= getActiveContractLimit(state)) return { state, error: "Aktives Vertragslimit erreicht" };
  const contract = { ...offer, status: "active" as const, acceptedAt: now };
  return { state: { ...state, contractOffers: state.contractOffers.filter((item) => item.id !== contractId), contracts: [contract, ...state.contracts], lifetimeStats: { ...state.lifetimeStats, contractsAccepted: state.lifetimeStats.contractsAccepted + 1 }, persistentCustomers: state.persistentCustomers.map((customer) => customer.id === contract.customerId ? { ...customer, activeContractId: contract.id } : customer) }, error: null };
}

function matches(contract: Contract, order: RepairOrder) {
  return contract.customerId === order.customerId && (!contract.targetCategory || contract.targetCategory === order.category) && (!contract.requiresUrgent || order.variant === "urgent");
}

export function recordContractProgress(state: GameState, order: RepairOrder, now: number) {
  let completed = 0;
  const contracts = state.contracts.map((contract) => {
    if (contract.status !== "active" || !matches(contract, order)) return contract;
    const progress = Math.min(contract.target, contract.progress + 1);
    if (progress >= contract.target) completed += 1;
    return { ...contract, progress, status: progress >= contract.target ? "completed" as const : contract.status, completedAt: progress >= contract.target ? now : contract.completedAt };
  });
  return completed === 0 ? { ...state, contracts } : { ...state, contracts, lifetimeStats: { ...state.lifetimeStats, contractsCompleted: state.lifetimeStats.contractsCompleted + completed } };
}

export function expireContracts(state: GameState, now: number) {
  const failedIds = new Set(state.contracts.filter((contract) => contract.status === "active" && contract.expiresAt && contract.expiresAt <= now).map((contract) => contract.id));
  if (failedIds.size === 0) return state;
  return {
    ...state,
    contracts: state.contracts.map((contract) => failedIds.has(contract.id) ? { ...contract, status: "failed" as const } : contract),
    persistentCustomers: state.persistentCustomers.map((customer) => {
      if (!failedIds.has(customer.activeContractId ?? "")) return customer;
      const loyalty = Math.max(0, customer.loyalty - 3);
      return { ...customer, activeContractId: null, loyalty, relationshipState: getRelationshipState(loyalty) };
    }),
    lifetimeStats: { ...state.lifetimeStats, contractsFailed: state.lifetimeStats.contractsFailed + failedIds.size },
  };
}

export function claimContract(state: GameState, contractId: string, now: number) {
  const contract = state.contracts.find((item) => item.id === contractId);
  if (!contract || contract.status !== "completed" || contract.rewardedAt) return { state, error: "Vertragsbonus nicht verfügbar" };
  let rewarded = applyTransaction(state, "CONTRACT_REWARD", contract.reward.money, contract.id, now);
  rewarded = awardCompanyXp({ ...rewarded, reputation: rewarded.reputation + contract.reward.reputation, researchPoints: rewarded.researchPoints + contract.reward.researchPoints }, contract.reward.xp, now).state;
  rewarded = {
    ...rewarded,
    contracts: rewarded.contracts.map((item) => item.id === contractId ? { ...item, status: "claimed" as const, rewardedAt: now } : item),
    persistentCustomers: rewarded.persistentCustomers.map((customer) => {
      if (customer.id !== contract.customerId) return customer;
      const loyalty = Math.min(100, customer.loyalty + contract.reward.loyalty);
      return { ...customer, activeContractId: null, loyalty, relationshipState: getRelationshipState(loyalty) };
    }),
    lifetimeStats: { ...rewarded.lifetimeStats, contractRevenue: rewarded.lifetimeStats.contractRevenue + contract.reward.money, highestContractBonus: Math.max(rewarded.lifetimeStats.highestContractBonus, contract.reward.money) },
  };
  return { state: rewarded, error: null };
}

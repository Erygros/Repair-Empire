import { z } from "zod";
import { RESEARCH_NODES } from "@/game/data/progression";
const id = z.string().min(1).max(100);
const command = <T extends string, S extends z.ZodRawShape>(type: T, shape: S) => z.object({ type: z.literal(type), ...shape }).strict();
export const gameActionSchema = z.discriminatedUnion("type", [
  command("assignOrder", { orderId: id, workstationId: id }),
  command("completeRepair", { workstationId: id }),
  command("purchaseWorkstation", { workstationId: id }),
  command("hireCandidate", { candidateId: id }),
  command("refreshCandidates", {}),
  command("assignEmployee", { workstationId: id, employeeId: id.nullable() }),
  command("toggleAutomation", { workstationId: id }),
  command("setAutomationPriority", { workstationId: id, priority: z.enum(["highest-profit", "fastest-jobs", "reputation", "specialization"]) }),
  command("purchaseTool", { toolId: z.enum(["basic-kit", "multimeter", "soldering-station", "hot-air-station", "microscope"]) }),
  command("purchaseUpgrade", { upgradeId: z.enum(["efficient-workflow", "better-diagnostics", "customer-network", "workshop-organization", "job-board-expansion"]) }),
  command("purchaseResearch", { researchId: z.enum(RESEARCH_NODES.map(node => node.id)) }),
  command("claimMilestone", { milestoneId: id }),
  command("claimChallenge", { challengeId: id }),
  command("startMultiDeviceOrder", { customerId: id }),
  command("takeContract", { contractId: id }),
  command("collectContractReward", { contractId: id }),
  command("purchaseBuildingUpgrade", { buildingId: z.enum(["WORKSHOP", "PERSONNEL", "FINANCE", "TOOL_WAREHOUSE", "RESEARCH", "BUSINESS_OFFICE"]) }),
]);
export const verifiedRequestSchema = z.union([
  z.object({ activate: z.literal(true) }).strict(),
  z.object({ revision: z.number().int().nonnegative().max(2147483646), action: gameActionSchema }).strict(),
  z.object({ revision: z.number().int().nonnegative().max(2147483646) }).strict(),
]);

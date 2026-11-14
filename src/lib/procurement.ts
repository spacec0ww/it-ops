// Procurement business rules. Pure functions (no I/O) so they are easy to unit-test.

export const PO_STAGES = ["requested", "approved", "ordered", "delivered", "closed"] as const;
export type PoStage = (typeof PO_STAGES)[number];

export const PO_DOC_KINDS = [
  "quote_1",
  "quote_2",
  "quote_3",
  "invoice",
  "delivery_note",
  "approval",
] as const;
export type PoDocKind = (typeof PO_DOC_KINDS)[number];

export const STAGE_LABEL: Record<PoStage, string> = {
  requested: "Requested",
  approved: "Approved",
  ordered: "Ordered",
  delivered: "Delivered",
  closed: "Closed",
};

/** Status dot colour per stage. */
export const STAGE_TONE: Record<PoStage, "grey" | "blue" | "amber" | "green"> = {
  requested: "grey",
  approved: "blue",
  ordered: "amber",
  delivered: "green",
  closed: "grey",
};

/**
 * Closing requires the 3 quotes, approval, and invoice (delivery note is optional).
 */
export const CLOSE_REQUIRES: readonly PoDocKind[] = [
  "quote_1",
  "quote_2",
  "quote_3",
  "approval",
  "invoice",
];

/** The documents still missing before this purchase can be closed (empty when it can). */
export function missingToClose(attachedKinds: Iterable<string>): PoDocKind[] {
  const have = new Set(attachedKinds);
  return CLOSE_REQUIRES.filter((k) => !have.has(k));
}

export function docList(kinds: readonly PoDocKind[]): string {
  const names = kinds.map((k) => DOC_LABEL[k].toLowerCase());
  if (names.length <= 1) return `the ${names[0] ?? ""}`;
  return `the ${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

export const DOC_LABEL: Record<PoDocKind, string> = {
  quote_1: "Quote 1",
  quote_2: "Quote 2",
  quote_3: "Quote 3",
  invoice: "Invoice",
  delivery_note: "Delivery note",
  approval: "Approval",
};

export const DOC_SHORT: Record<PoDocKind, string> = {
  quote_1: "Q1",
  quote_2: "Q2",
  quote_3: "Q3",
  invoice: "INV",
  delivery_note: "DN",
  approval: "APR",
};

/** The stage from which each document is required. */
export const DOC_REQUIRED_FROM: Record<PoDocKind, PoStage> = {
  quote_1: "requested",
  quote_2: "requested",
  quote_3: "requested",
  approval: "requested",
  invoice: "ordered",
  delivery_note: "closed",
};

export const stageIndex = (stage: PoStage) => PO_STAGES.indexOf(stage);

export type DocState = "ok" | "miss" | "na";

export function docState(stage: PoStage, kind: PoDocKind, attached: boolean): DocState {
  if (attached) return "ok";
  return stageIndex(stage) >= stageIndex(DOC_REQUIRED_FROM[kind]) ? "miss" : "na";
}

export function docStates(stage: PoStage, attachedKinds: Iterable<string>) {
  const attached = new Set(attachedKinds);
  return PO_DOC_KINDS.map((kind) => ({ kind, state: docState(stage, kind, attached.has(kind)) }));
}

export function missingDocKinds(stage: PoStage, attachedKinds: Iterable<string>): PoDocKind[] {
  return docStates(stage, attachedKinds)
    .filter((d) => d.state === "miss")
    .map((d) => d.kind);
}

export function stageAfterAttaching(stage: PoStage, kind: string): PoStage | null {
  return stage === "requested" && kind === "approval" ? "approved" : null;
}

export function nextManualStage(stage: PoStage): PoStage | null {
  switch (stage) {
    case "approved":
      return "ordered";
    case "ordered":
      return "delivered";
    case "delivered":
      return "closed";
    default:
      return null;
  }
}

export const ADVANCE_LABEL: Partial<Record<PoStage, string>> = {
  ordered: "Mark as ordered",
  delivered: "Mark as delivered",
  closed: "Close purchase",
};

export const lineTotal = (line: { qty: number; unitPriceAed: number }) =>
  Math.round(line.qty * line.unitPriceAed * 100) / 100;

export const VAT_RATE = 0.05;

export type PoTotal = {
  subtotal: number;
  discount: number;
  net: number;
  vat: number;
  total: number;
};

export function poTotal(input: {
  subtotal: number;
  discount?: number | null;
  vat?: boolean;
}): PoTotal {
  const subtotalC = Math.round(input.subtotal * 100);
  const discountC = Math.max(0, Math.round((input.discount ?? 0) * 100));
  const netC = Math.max(0, subtotalC - discountC);
  const vatC = input.vat ? Math.floor((netC * 5 + 50) / 100) : 0;
  return {
    subtotal: subtotalC / 100,
    discount: Math.min(discountC, subtotalC) / 100,
    net: netC / 100,
    vat: vatC / 100,
    total: (netC + vatC) / 100,
  };
}

export function lineSummary(lines: { qty: number; description: string }[]): string {
  return lines.map((l) => `${l.qty}× ${l.description.split(",")[0]!.trim()}`).join(", ");
}
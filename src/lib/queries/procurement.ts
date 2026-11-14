import { and, desc, eq } from "drizzle-orm";
import type { Tx } from "@/db/actor";
import { getDb } from "@/db";
import { documents, poLines, purchaseOrders, vendors } from "@/db/schema";
import { poTotals } from "@/db/schema";
import { poTotal, type PoStage, type PoTotal, type PoDocKind } from "@/lib/procurement";

export type PoListRow = {
  id: string;
  poNumber: string;
  vendor: string;
  summary: string;
  totalAed: number;
  status: PoStage;
  requestedOn: string;
  project: string | null;
  invoiceNumber: string | null;
  money: PoTotal;
  docs: { kind: string; state: "ok" | "miss" | "na" }[];
  missing: PoDocKind[];
};

export type PoDetail = {
  id: string;
  poNumber: string;
  vendor: string;
  status: PoStage;
  requestedOn: string;
  notes: string | null;
  invoiceNumber: string | null;
  lpoNumber: string | null;
  project: string | null;
  vatApplied: boolean;
  discountAed: number;
  invoiceDate: string | null;
  totalAed: number;
  money: PoTotal;
  lines: {
    id: string;
    description: string;
    qty: number;
    unitPriceAed: number;
  }[];
  documents: Record<
    string,
    { id: string; fileName: string; originalName: string | null; sizeBytes: number }
  >;
};

/** Lists all purchase orders with their sums and document states. */
export async function listPurchaseOrders(transaction?: Tx): Promise<PoListRow[]> {
  const executor = transaction ?? getDb();
  const [pos, lines, docs, totals] = await Promise.all([
    executor
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        vendor: vendors.name,
        status: purchaseOrders.status,
        requestedOn: purchaseOrders.requestedOn,
        project: purchaseOrders.project,
        invoiceNumber: purchaseOrders.invoiceNumber,
        vatApplied: purchaseOrders.vatApplied,
        discountAed: purchaseOrders.discountAed,
      })
      .from(purchaseOrders)
      .innerJoin(vendors, eq(vendors.id, purchaseOrders.vendorId))
      .orderBy(desc(purchaseOrders.poNumber)),
    executor
      .select({
        poId: poLines.poId,
        description: poLines.description,
        qty: poLines.qty,
        unitPriceAed: poLines.unitPriceAed,
      })
      .from(poLines),
    executor
      .select({
        ownerId: documents.ownerId,
        kind: documents.kind,
      })
      .from(documents)
      .where(eq(documents.ownerType, "purchase_order")),
    executor.select().from(poTotals),
  ]);

  const linesMap = new Map<string, { qty: number; description: string; unitPriceAed: number }[]>();
  for (const l of lines) {
    const list = linesMap.get(l.poId) ?? [];
    list.push(l);
    linesMap.set(l.poId, list);
  }

  const docsMap = new Map<string, Set<string>>();
  for (const d of docs) {
    const set = docsMap.get(d.ownerId) ?? new Set();
    set.add(d.kind);
    docsMap.set(d.ownerId, set);
  }

  const totalsMap = new Map(totals.map((t) => [t.poId, t.totalAed]));

  return pos.map((p) => {
    const poLinesList = linesMap.get(p.id) ?? [];
    const attachedKinds = docsMap.get(p.id) ?? new Set();

    const subtotal = poLinesList.reduce((sum, l) => sum + l.qty * Number(l.unitPriceAed), 0);
    const money = poTotal({
      subtotal,
      discount: Number(p.discountAed),
      vat: p.vatApplied,
    });

    const totalAed = totalsMap.get(p.id) ?? money.total;

    const summary = poLinesList
      .map((l) => `${l.qty}× ${l.description.split(",")[0]!.trim()}`)
      .join(", ");

    const docsState = ["quote_1", "quote_2", "quote_3", "approval", "invoice", "delivery_note"].map(
      (kind) => {
        const attached = attachedKinds.has(kind);
        let state: "ok" | "miss" | "na" = "ok";
        if (attached) {
          state = "ok";
        } else if (kind === "delivery_note") {
          state = "na";
        } else if (p.status === "requested" && ["quote_1", "quote_2", "quote_3", "approval"].includes(kind)) {
          state = "miss";
        } else if (p.status !== "requested" && kind === "invoice") {
          state = "miss";
        } else {
          state = "na";
        }
        return { kind, state };
      },
    );

    const missing = docsState.filter((d) => d.state === "miss").map((d) => d.kind as PoDocKind);

    return {
      id: p.id,
      poNumber: p.poNumber,
      vendor: p.vendor,
      summary,
      totalAed,
      status: p.status,
      requestedOn: p.requestedOn,
      project: p.project,
      invoiceNumber: p.invoiceNumber,
      money,
      docs: docsState,
      missing,
    };
  });
}

/** Fetches full details of a single purchase order by its PO number. */
export async function getPurchaseOrder(poNumber: string, transaction?: Tx): Promise<PoDetail | null> {
  const executor = transaction ?? getDb();
  const [po] = await executor
    .select({
      id: purchaseOrders.id,
      poNumber: purchaseOrders.poNumber,
      vendor: vendors.name,
      status: purchaseOrders.status,
      requestedOn: purchaseOrders.requestedOn,
      notes: purchaseOrders.notes,
      invoiceNumber: purchaseOrders.invoiceNumber,
      lpoNumber: purchaseOrders.lpoNumber,
      project: purchaseOrders.project,
      vatApplied: purchaseOrders.vatApplied,
      discountAed: purchaseOrders.discountAed,
      invoiceDate: purchaseOrders.invoiceDate,
    })
    .from(purchaseOrders)
    .innerJoin(vendors, eq(vendors.id, purchaseOrders.vendorId))
    .where(eq(purchaseOrders.poNumber, poNumber));

  if (!po) return null;

  const [lines, docs, totalRow] = await Promise.all([
    executor
      .select({
        id: poLines.id,
        description: poLines.description,
        qty: poLines.qty,
        unitPriceAed: poLines.unitPriceAed,
      })
      .from(poLines)
      .where(eq(poLines.poId, po.id)),
    executor
      .select({
        id: documents.id,
        kind: documents.kind,
        fileName: documents.fileName,
        originalName: documents.originalName,
        sizeBytes: documents.sizeBytes,
      })
      .from(documents)
      .where(and(eq(documents.ownerType, "purchase_order"), eq(documents.ownerId, po.id))),
    executor
      .select({ totalAed: poTotals.totalAed })
      .from(poTotals)
      .where(eq(poTotals.poId, po.id)),
  ]);

  const subtotal = lines.reduce((sum, l) => sum + l.qty * Number(l.unitPriceAed), 0);
  const money = poTotal({
    subtotal,
    discount: Number(po.discountAed),
    vat: po.vatApplied,
  });

  const documentsMap: Record<string, { id: string; fileName: string; originalName: string | null; sizeBytes: number }> = {};
  for (const d of docs) {
    documentsMap[d.kind] = {
      id: d.id,
      fileName: d.fileName,
      originalName: d.originalName,
      sizeBytes: d.sizeBytes,
    };
  }

  return {
    id: po.id,
    poNumber: po.poNumber,
    vendor: po.vendor,
    status: po.status,
    requestedOn: po.requestedOn,
    notes: po.notes,
    invoiceNumber: po.invoiceNumber,
    lpoNumber: po.lpoNumber,
    project: po.project,
    vatApplied: po.vatApplied,
    discountAed: Number(po.discountAed),
    invoiceDate: po.invoiceDate,
    totalAed: totalRow[0]?.totalAed ?? money.total,
    money,
    lines: lines.map((l) => ({
      id: l.id,
      description: l.description,
      qty: l.qty,
      unitPriceAed: Number(l.unitPriceAed),
    })),
    documents: documentsMap,
  };
}

/** Lists all distinct vendors. */
export async function listVendors(transaction?: Tx) {
  const executor = transaction ?? getDb();
  return executor.select({ name: vendors.name }).from(vendors).orderBy(vendors.name);
}

/** Computes procurement totals for a given quarter. */
export async function getProcurementTotals(quarter: { year: number; quarter: number }, transaction?: Tx) {
  const executor = transaction ?? getDb();
  const rows = await executor
    .select({ totalAed: poTotals.totalAed, status: purchaseOrders.status })
    .from(purchaseOrders)
    .innerJoin(poTotals, eq(purchaseOrders.id, poTotals.poId));

  let openValue = 0;
  let spentQuarter = 0;

  for (const r of rows) {
    if (r.status !== "closed" && r.status !== "delivered") {
      openValue += Number(r.totalAed);
    }
    if (r.status === "closed" || r.status === "delivered" || r.status === "ordered") {
      spentQuarter += Number(r.totalAed);
    }
  }

  return { openValue, spentQuarter };
}
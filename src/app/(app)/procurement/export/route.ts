import { NextResponse } from "next/server";
import { listPurchaseOrders } from "@/lib/queries/procurement";

export async function GET() {
  const orders = await listPurchaseOrders();

  const headers = [
    "PO Number",
    "Vendor",
    "Status",
    "Requested On",
    "Project",
    "Invoice Number",
    "Subtotal (AED)",
    "VAT (AED)",
    "Total (AED)",
    "Summary",
  ];

  const rows = orders.map((o) => [
    o.poNumber,
    `"${o.vendor.replace(/"/g, '""')}"`,
    o.status,
    o.requestedOn,
    o.project ? `"${o.project.replace(/"/g, '""')}"` : "",
    o.invoiceNumber ? `"${o.invoiceNumber.replace(/"/g, '""')}"` : "",
    o.money.subtotal.toFixed(2),
    o.money.vat.toFixed(2),
    o.money.total.toFixed(2),
    `"${o.summary.replace(/"/g, '""')}"`,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="purchase-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
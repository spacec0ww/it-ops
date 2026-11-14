"use client";

import React from "react";
import { type PoDocKind } from "@/lib/procurement";
import type { PoListRow } from "@/lib/queries/procurement";

const DOC_LABEL: Record<PoDocKind, string> = {
  quote_1: "Q1",
  quote_2: "Q2",
  quote_3: "Q3",
  approval: "Appr",
  delivery_note: "DN",
  invoice: "Inv",
};

export type PoTableProps = {
  orders?: PoListRow[];
  rows?: PoListRow[]; // Added to match procurement-view usage
  selected?: string | null;
  query?: string;
  dates?: Record<string, string>;
  sort?: any;
  filtered?: boolean;
  hasAny?: boolean;
  onSelectPo?: (poNumber: string) => void;
};

export function PoTable({ orders, rows, onSelectPo }: PoTableProps) {
  const data = orders || rows || [];

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 border-b text-muted-foreground">
          <tr>
            <th className="p-3 font-medium">PO Number</th>
            <th className="p-3 font-medium">Vendor</th>
            <th className="p-3 font-medium">Project</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium text-right">Total (AED)</th>
            <th className="p-3 font-medium">Documents</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((order) => (
            <tr
              key={order.id}
              className="hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => onSelectPo?.(order.poNumber)}
            >
              <td className="p-3 font-medium">{order.poNumber}</td>
              <td className="p-3">{order.vendor}</td>
              <td className="p-3 text-muted-foreground">{order.project || "—"}</td>
              <td className="p-3">
                <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground capitalize">
                  {order.status}
                </span>
              </td>
              <td className="p-3 text-right font-mono">
                {order.money.total.toFixed(2)}
              </td>
              <td className="p-3">
                <div className="flex space-x-1">
                  {order.docs.map((doc) => {
                    const kindKey = doc.kind as PoDocKind;
                    const label = DOC_LABEL[kindKey] ?? doc.kind;
                    const isOk = doc.state === "ok";
                    const isMiss = doc.state === "miss";

                    return (
                      <span
                        key={doc.kind}
                        title={`${label}: ${doc.state}`}
                        className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${
                          isOk
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : isMiss
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground opacity-40"
                        }`}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="p-6 text-center text-muted-foreground">
                No purchase orders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
import React from "react";
import { type PoDocKind } from "@/lib/procurement";

export type DocSlotProps = {
  kind: PoDocKind;
  poId?: string;
  poNumber?: string;
  invoiceDate?: string | null;
  today?: string;
  status?: "ok" | "miss" | "na";
  state?: "ok" | "miss" | "na"; // Added to support state prop from po-panel
  doc?: { id: string; fileName: string; originalName: string | null; sizeBytes: number };
  notNeededUntil?: string;
  fileName?: string | null;
  originalName?: string | null;
  sizeBytes?: number;
  onUpload?: (file: File) => void;
  onRemove?: () => void;
  onDownload?: () => void;
};

const DOC_LABELS: Record<PoDocKind, string> = {
  quote_1: "Quote 1",
  quote_2: "Quote 2",
  quote_3: "Quote 3",
  approval: "Approval",
  delivery_note: "Delivery Note",
  invoice: "Invoice",
};

export function DocSlot({
  kind,
  doc,
  fileName,
  originalName,
  sizeBytes,
  status = "ok",
  state = "ok",
  onUpload,
  onRemove,
  onDownload,
}: DocSlotProps) {
  const activeFileName = fileName || doc?.fileName;
  const activeOriginalName = originalName || doc?.originalName;
  const activeSizeBytes = sizeBytes || doc?.sizeBytes;
  const activeStatus = status || state;
  const label = DOC_LABELS[kind] ?? kind;

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1">
        <span className="font-medium text-sm">{label}</span>
        {activeFileName ? (
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {activeOriginalName || activeFileName} ({activeSizeBytes ? `${Math.round(activeSizeBytes / 1024)} KB` : ""})
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">No file attached ({activeStatus})</span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {activeFileName ? (
          <>
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="text-xs px-2.5 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
              >
                Download
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-xs px-2.5 py-1 bg-destructive/10 text-destructive rounded hover:bg-destructive/20"
              >
                Remove
              </button>
            )}
          </>
        ) : (
          onUpload && (
            <label className="cursor-pointer text-xs px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              Upload
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(file);
                }}
              />
            </label>
          )
        )}
      </div>
    </div>
  );
}
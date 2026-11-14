import React from "react";
import { type PoDocKind } from "@/lib/procurement";

export type DocSlotProps = {
  kind: PoDocKind;
  fileName?: string | null;
  originalName?: string | null;
  sizeBytes?: number;
  status?: "ok" | "miss" | "na";
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
  fileName,
  originalName,
  sizeBytes,
  status = "ok",
  onUpload,
  onRemove,
  onDownload,
}: DocSlotProps) {
  const label = DOC_LABELS[kind] ?? kind;

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1">
        <span className="font-medium text-sm">{label}</span>
        {fileName ? (
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {originalName || fileName} ({sizeBytes ? `${Math.round(sizeBytes / 1024)} KB` : ""})
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">No file attached</span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {fileName ? (
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
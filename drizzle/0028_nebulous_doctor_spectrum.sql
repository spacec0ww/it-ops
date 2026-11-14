ALTER TABLE "documents" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."doc_kind";--> statement-breakpoint
CREATE TYPE "public"."doc_kind" AS ENUM('quote_1', 'quote_2', 'quote_3', 'invoice', 'delivery_note', 'approval', 'other');--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "kind" SET DATA TYPE "public"."doc_kind" USING "kind"::"public"."doc_kind";
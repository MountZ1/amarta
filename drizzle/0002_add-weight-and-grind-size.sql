ALTER TABLE "order_items" ADD COLUMN "weight" integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "grind_size" text DEFAULT 'biji' NOT NULL;
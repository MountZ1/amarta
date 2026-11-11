CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"province_id" integer NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cities_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"city_id" integer NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "districts_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "provinces" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "provinces_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "district_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "province_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "city_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "district_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "courier" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "courier_service" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "etd" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_cost" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "subtotal" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cities_name_idx" ON "cities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "cities_province_id_idx" ON "cities" USING btree ("province_id");--> statement-breakpoint
CREATE INDEX "districts_name_idx" ON "districts" USING btree ("name");--> statement-breakpoint
CREATE INDEX "districts_city_id_idx" ON "districts" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "provinces_name_idx" ON "provinces" USING btree ("name");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_invoice_unique" UNIQUE("invoice");
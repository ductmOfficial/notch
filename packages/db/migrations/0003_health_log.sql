CREATE TABLE "health_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"started_on" date NOT NULL,
	"ended_on" date,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "health_entry_kind_check" CHECK ("health_entry"."kind" in ('illness', 'medication', 'visit')),
	CONSTRAINT "health_entry_dates_check" CHECK ("health_entry"."ended_on" >= "health_entry"."started_on")
);
--> statement-breakpoint
CREATE TABLE "temperature" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"measured_at" timestamp with time zone NOT NULL,
	"tenths_c" integer NOT NULL,
	"health_entry_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "temperature_range_check" CHECK ("temperature"."tenths_c" between 340 and 430)
);
--> statement-breakpoint
ALTER TABLE "health_entry" ADD CONSTRAINT "health_entry_child_id_child_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temperature" ADD CONSTRAINT "temperature_child_id_child_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temperature" ADD CONSTRAINT "temperature_health_entry_id_health_entry_id_fk" FOREIGN KEY ("health_entry_id") REFERENCES "public"."health_entry"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "health_entry_child_started_idx" ON "health_entry" USING btree ("child_id","started_on");--> statement-breakpoint
CREATE INDEX "temperature_child_measured_idx" ON "temperature" USING btree ("child_id","measured_at");--> statement-breakpoint
CREATE INDEX "temperature_health_entry_idx" ON "temperature" USING btree ("health_entry_id");
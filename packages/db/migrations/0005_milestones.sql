CREATE TABLE "milestone" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"happened_on" date NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "milestone_kind_check" CHECK ("milestone"."kind" in ('motor', 'language', 'teeth', 'social', 'other'))
);
--> statement-breakpoint
ALTER TABLE "milestone" ADD CONSTRAINT "milestone_child_id_child_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "milestone_child_happened_idx" ON "milestone" USING btree ("child_id","happened_on");
CREATE TABLE "family_invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "family_invite_email_unique" UNIQUE("email"),
	CONSTRAINT "family_invite_role_check" CHECK ("family_invite"."role" in ('editor', 'viewer'))
);
--> statement-breakpoint
ALTER TABLE "family_member" ADD COLUMN "role" text DEFAULT 'owner' NOT NULL;--> statement-breakpoint
ALTER TABLE "family_invite" ADD CONSTRAINT "family_invite_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_member" ADD CONSTRAINT "family_member_role_check" CHECK ("family_member"."role" in ('owner', 'editor', 'viewer'));
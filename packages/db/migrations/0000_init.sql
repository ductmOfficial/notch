CREATE TABLE "appointment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"product_code" text NOT NULL,
	"dose_no" integer NOT NULL,
	"due_on" date,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointment_child_dose" UNIQUE("child_id","product_code","dose_no"),
	CONSTRAINT "appointment_dose_positive" CHECK ("appointment"."dose_no" > 0)
);
--> statement-breakpoint
CREATE TABLE "child" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sex" text NOT NULL,
	"birth_date" date NOT NULL,
	"birth_time" time,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "child_sex_check" CHECK ("child"."sex" in ('male', 'female'))
);
--> statement-breakpoint
CREATE TABLE "disease" (
	"code" text PRIMARY KEY NOT NULL,
	"name_vi" text NOT NULL,
	"name_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "measurement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"measured_on" date NOT NULL,
	"weight_g" integer,
	"length_mm" integer,
	"head_mm" integer,
	"position" text,
	"weight_estimated" boolean DEFAULT false NOT NULL,
	"length_estimated" boolean DEFAULT false NOT NULL,
	"head_estimated" boolean DEFAULT false NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "measurement_has_value" CHECK ("measurement"."weight_g" is not null or "measurement"."length_mm" is not null or "measurement"."head_mm" is not null),
	CONSTRAINT "measurement_weight_positive" CHECK ("measurement"."weight_g" > 0),
	CONSTRAINT "measurement_length_positive" CHECK ("measurement"."length_mm" > 0),
	CONSTRAINT "measurement_head_positive" CHECK ("measurement"."head_mm" > 0),
	CONSTRAINT "measurement_position_check" CHECK ("measurement"."position" in ('lying', 'standing'))
);
--> statement-breakpoint
CREATE TABLE "product_disease" (
	"product_code" text NOT NULL,
	"disease_code" text NOT NULL,
	CONSTRAINT "product_disease_product_code_disease_code_pk" PRIMARY KEY("product_code","disease_code")
);
--> statement-breakpoint
CREATE TABLE "vaccination" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"product_code" text NOT NULL,
	"dose_no" integer NOT NULL,
	"given_on" date NOT NULL,
	"place" text,
	"lot" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vaccination_child_dose" UNIQUE("child_id","product_code","dose_no"),
	CONSTRAINT "vaccination_dose_positive" CHECK ("vaccination"."dose_no" > 0)
);
--> statement-breakpoint
CREATE TABLE "vaccine_product" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_child_id_child_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_product_code_vaccine_product_code_fk" FOREIGN KEY ("product_code") REFERENCES "public"."vaccine_product"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child" ADD CONSTRAINT "child_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurement" ADD CONSTRAINT "measurement_child_id_child_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_disease" ADD CONSTRAINT "product_disease_product_code_vaccine_product_code_fk" FOREIGN KEY ("product_code") REFERENCES "public"."vaccine_product"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_disease" ADD CONSTRAINT "product_disease_disease_code_disease_code_fk" FOREIGN KEY ("disease_code") REFERENCES "public"."disease"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaccination" ADD CONSTRAINT "vaccination_child_id_child_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaccination" ADD CONSTRAINT "vaccination_product_code_vaccine_product_code_fk" FOREIGN KEY ("product_code") REFERENCES "public"."vaccine_product"("code") ON DELETE no action ON UPDATE no action;
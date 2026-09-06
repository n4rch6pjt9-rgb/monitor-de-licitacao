CREATE TABLE "crm_deals" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" integer,
	"edital_id" text NOT NULL,
	"stage_id" text NOT NULL,
	"title" text NOT NULL,
	"value" numeric,
	"notes" text,
	"assigned_agent" text,
	"status" text DEFAULT 'OPEN',
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"deal_id" text NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"details" jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "editais" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"source_id" text NOT NULL,
	"process_number" text NOT NULL,
	"title" text NOT NULL,
	"source_name" text NOT NULL,
	"source_category" text NOT NULL,
	"ncm_code" text NOT NULL,
	"object_description" text,
	"url" text,
	"raw_url" text NOT NULL,
	"s3_storage_key" text,
	"sha256_hash" text,
	"file_size_bytes" integer,
	"human_review_status" text DEFAULT 'PENDING',
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"published_internally" boolean DEFAULT false,
	"ocr_status" text,
	"ocr_pages" jsonb,
	"findings" jsonb,
	"url_validation" jsonb,
	"published_at" timestamp NOT NULL,
	"bidding_date" timestamp NOT NULL,
	"status" text NOT NULL,
	"agency" text,
	"estimated_value" numeric,
	"ploomes_deal_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mural_processes" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"codigo" text NOT NULL,
	"numero_processo" text NOT NULL,
	"unidade_compradora" text,
	"objeto" text,
	"modalidade" text,
	"status_normalizado" jsonb,
	"link_canonico" text,
	"fonte" text,
	"resumo" jsonb,
	"itens" jsonb,
	"anexos" jsonb,
	"historico" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'Prefeitura',
	"type" text NOT NULL,
	"uf" text,
	"city" text,
	"endpoint_or_url" text NOT NULL,
	"selector_or_params" text,
	"auth_type" text DEFAULT 'NONE',
	"status" text NOT NULL,
	"last_checked_at" timestamp,
	"latency_ms" integer,
	"success_rate" integer,
	"total_collected" integer DEFAULT 0,
	"format" text DEFAULT 'HTML',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "status_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer DEFAULT 1 NOT NULL,
	"family" text NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"search_keywords" jsonb,
	"ploomes_config" jsonb,
	"pncp_config" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant_ncms" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"code" text NOT NULL,
	"description" text NOT NULL,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"logo_url" text,
	"primary_color" text DEFAULT '#000000',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_edital_id_editais_id_fk" FOREIGN KEY ("edital_id") REFERENCES "public"."editais"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_stage_id_crm_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."crm_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_logs" ADD CONSTRAINT "crm_logs_deal_id_crm_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editais" ADD CONSTRAINT "editais_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editais" ADD CONSTRAINT "editais_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mural_processes" ADD CONSTRAINT "mural_processes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_catalog" ADD CONSTRAINT "status_catalog_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_configs" ADD CONSTRAINT "tenant_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_ncms" ADD CONSTRAINT "tenant_ncms_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
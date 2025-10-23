CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"icon" text,
	"points_required" integer NOT NULL,
	"badge_image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_students" (
	"id" serial PRIMARY KEY NOT NULL,
	"coach_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"coach_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"notification_date" text NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"tasks_completed" integer DEFAULT 0 NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mood_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"mood_type" varchar NOT NULL,
	"intensity" integer NOT NULL,
	"note" text,
	"date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"subject" text,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"filename" text NOT NULL,
	"file_data" text NOT NULL,
	"thumbnail_data" text,
	"mime_type" text NOT NULL,
	"subject" text,
	"user_id" integer NOT NULL,
	"task_id" integer,
	"note_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"task_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"subject" text,
	"score" text,
	"source_id" integer,
	"task_id" integer,
	"featured" boolean DEFAULT false NOT NULL,
	"file_path" text,
	"link" text,
	"proof_files" text[],
	"proof_text" text,
	"proof_link" text,
	"attachments" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"user_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"photo_id" integer,
	"note_id" integer,
	"attachment_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"subject" text,
	"resource_link" text,
	"category" text DEFAULT 'brain' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"due_date" text,
	"due_time" text,
	"user_id" integer NOT NULL,
	"assigned_by_coach_id" integer,
	"is_coach_task" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"proof_url" text,
	"proof_files" text[],
	"proof_text" text,
	"proof_link" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"achievement_id" integer NOT NULL,
	"achieved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"date_of_birth" date NOT NULL,
	"replit_id" varchar,
	"profile_image_url" varchar,
	"name" text,
	"avatar" text,
	"reset_token" text,
	"reset_token_expiry" timestamp,
	"points" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"last_active_date" timestamp,
	"user_type" text DEFAULT 'student' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_replit_id_unique" UNIQUE("replit_id")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");
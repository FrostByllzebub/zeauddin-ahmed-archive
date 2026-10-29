CREATE TABLE `audit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`actor_id` text,
	`details` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`body` text NOT NULL,
	`consent_to_contact` integer DEFAULT false NOT NULL,
	`moderation_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memories` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`relationship_to_zea` text NOT NULL,
	`story` text NOT NULL,
	`photo_key` text,
	`photo_size_bytes` integer,
	`photo_caption` text,
	`consent_to_publish` integer DEFAULT false NOT NULL,
	`consent_to_contact` integer DEFAULT false NOT NULL,
	`moderation_status` text DEFAULT 'pending' NOT NULL,
	`moderation_note` text,
	`moderated_at` text,
	`moderated_by` text,
	`updated_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `publication_occurrences` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`publication` text NOT NULL,
	`edition` text,
	`publication_date` text,
	`original_url` text,
	`original_url_status` text DEFAULT 'unchecked' NOT NULL,
	`page_number` text,
	`source_key` text,
	`snapshot_key` text,
	`snapshot_captured_at` text,
	`snapshot_sha256` text,
	`verification_status` text DEFAULT 'pending' NOT NULL,
	`date_confidence` text,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text,
	`kind` text NOT NULL,
	`location` text,
	`discovery_method` text,
	`evidence_notes` text,
	`rights_notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `works` (
	`id` text PRIMARY KEY NOT NULL,
	`canonical_title` text NOT NULL,
	`original_bengali_title` text NOT NULL,
	`full_text` text,
	`approved_excerpt` text,
	`summary` text,
	`article_type` text,
	`series` text,
	`topics` text DEFAULT '[]' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`author` text NOT NULL,
	`language` text DEFAULT 'bn' NOT NULL,
	`rights_status` text NOT NULL,
	`publication_status` text DEFAULT 'draft' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memory_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`memory_id` text NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`details` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memory_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memory_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`memory_id` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memory_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`public_name` text NOT NULL,
	`anonymous` integer DEFAULT 0 NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`relationship` text NOT NULL,
	`title` text NOT NULL,
	`story` text NOT NULL,
	`photo_key` text,
	`photo_type` text,
	`photo_bytes` integer DEFAULT 0 NOT NULL,
	`photo_caption` text,
	`photo_date` text,
	`consent_story` integer NOT NULL,
	`consent_photo` integer DEFAULT 0 NOT NULL,
	`consent_contact` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`token_hash` text NOT NULL,
	`submission_key` text NOT NULL,
	`note` text,
	`published_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memory_submissions_submission_key_unique` ON `memory_submissions` (`submission_key`);
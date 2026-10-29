CREATE TABLE `editorial_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_key` text NOT NULL,
	`category` text NOT NULL,
	`article_url` text NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`resolved_by` text,
	`resolved_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `editorial_requests_submission_key_unique` ON `editorial_requests` (`submission_key`);
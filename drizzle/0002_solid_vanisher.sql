CREATE TABLE `content_library` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`contentType` enum('image','video','text') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`url` varchar(500) NOT NULL,
	`thumbnail` varchar(500),
	`fileSize` bigint,
	`duration` int,
	`format` varchar(50),
	`status` enum('draft','approved','published','archived') NOT NULL DEFAULT 'draft',
	`performance` json,
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_library_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metrics_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`date` timestamp NOT NULL,
	`platform` varchar(50) NOT NULL,
	`impressions` bigint DEFAULT 0,
	`clicks` bigint DEFAULT 0,
	`conversions` int DEFAULT 0,
	`spend` decimal(12,2) DEFAULT '0',
	`revenue` decimal(12,2) DEFAULT '0',
	`ctr` decimal(8,4),
	`cpc` decimal(10,2),
	`cpa` decimal(10,2),
	`roas` decimal(8,4),
	`conversionRate` decimal(8,4),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `metrics_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orchestration_state` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`activeAgents` json,
	`taskQueue` json,
	`decisions` json,
	`state` enum('idle','running','paused','error') NOT NULL DEFAULT 'idle',
	`lastUpdate` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orchestration_state_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('campaign','content','analysis','optimization','report') NOT NULL,
	`cronExpression` varchar(100) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastRun` timestamp,
	`nextRun` timestamp,
	`config` json,
	`campaignId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_generation_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`prompt` text NOT NULL,
	`style` varchar(100),
	`duration` int DEFAULT 15,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`videoUrl` varchar(500),
	`thumbnailUrl` varchar(500),
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `video_generation_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` varchar(500) NOT NULL,
	`event` varchar(100) NOT NULL,
	`secret` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`retries` int DEFAULT 3,
	`timeout` int DEFAULT 30,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhooks_id` PRIMARY KEY(`id`)
);

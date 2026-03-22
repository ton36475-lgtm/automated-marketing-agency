CREATE TABLE `board_meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`topic` varchar(255) NOT NULL,
	`triggerType` enum('scheduled','event','manual','emergency') NOT NULL,
	`triggerReason` text,
	`participants` json,
	`agenda` json,
	`discussion` json,
	`decisions` json,
	`actionItems` json,
	`status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `board_meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ceo_decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gemId` int NOT NULL,
	`decisionType` enum('budget_allocation','campaign_launch','campaign_pause','campaign_scale','content_approval','audience_shift','bid_adjustment','emergency_stop','resource_reallocation','strategy_pivot','team_directive') NOT NULL,
	`title` varchar(255) NOT NULL,
	`reasoning` text,
	`context` json,
	`action` json,
	`impact` json,
	`confidence` decimal(5,2),
	`status` enum('pending','approved','executed','rejected','reverted') NOT NULL DEFAULT 'pending',
	`executedAt` timestamp,
	`result` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ceo_decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `executive_gems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gemName` varchar(100) NOT NULL,
	`gemRole` enum('ceo','cmo','cto','cfo','coo','strategy','creative','media','optimization','analytics') NOT NULL,
	`systemPrompt` text,
	`personality` text,
	`goals` json,
	`kpis` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastAction` timestamp,
	`totalDecisions` int DEFAULT 0,
	`successRate` decimal(5,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `executive_gems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`snapshotDate` timestamp NOT NULL,
	`totalSpend` decimal(14,2) DEFAULT '0',
	`totalRevenue` decimal(14,2) DEFAULT '0',
	`totalLeads` int DEFAULT 0,
	`totalConversions` int DEFAULT 0,
	`avgRoas` decimal(8,4),
	`avgCpa` decimal(10,2),
	`activeCampaigns` int DEFAULT 0,
	`activeAgents` int DEFAULT 0,
	`systemHealth` decimal(5,2),
	`aiDecisionsMade` int DEFAULT 0,
	`aiDecisionsSuccess` int DEFAULT 0,
	`insights` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performance_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_directives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fromGemId` int NOT NULL,
	`toGemRole` varchar(50) NOT NULL,
	`directive` text NOT NULL,
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('pending','acknowledged','in_progress','completed','failed') NOT NULL DEFAULT 'pending',
	`response` text,
	`deadline` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `system_directives_id` PRIMARY KEY(`id`)
);

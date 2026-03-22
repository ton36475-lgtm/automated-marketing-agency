CREATE TABLE `ad_creatives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int,
	`userId` int NOT NULL,
	`agentTaskId` int,
	`type` enum('image','copy','headline','cta','video_script','carousel') NOT NULL,
	`platform` enum('meta','google','tiktok','line','general') NOT NULL DEFAULT 'general',
	`title` varchar(255),
	`content` text,
	`imageUrl` text,
	`imagePrompt` text,
	`status` enum('draft','approved','rejected','active','archived') NOT NULL DEFAULT 'draft',
	`performance` json,
	`metaAdId` varchar(100),
	`isWinner` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ad_creatives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentType` enum('strategy','copywriting','visual','media_buying','optimization','orchestrator') NOT NULL,
	`action` varchar(255) NOT NULL,
	`details` text,
	`level` enum('info','success','warning','error') NOT NULL DEFAULT 'info',
	`campaignId` int,
	`taskId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int,
	`userId` int NOT NULL,
	`agentType` enum('strategy','copywriting','visual','media_buying','optimization','orchestrator') NOT NULL,
	`taskType` varchar(100) NOT NULL,
	`status` enum('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`inputData` json,
	`outputData` json,
	`errorMessage` text,
	`tokensUsed` int DEFAULT 0,
	`executionTimeMs` int,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL,
	`platform` varchar(50) DEFAULT 'meta',
	`spend` decimal(12,2) DEFAULT '0',
	`impressions` bigint DEFAULT 0,
	`clicks` bigint DEFAULT 0,
	`conversions` int DEFAULT 0,
	`revenue` decimal(12,2) DEFAULT '0',
	`roas` decimal(8,4),
	`cpa` decimal(10,2),
	`ctr` decimal(8,4),
	`cpm` decimal(10,2),
	`frequency` decimal(6,2),
	`reach` bigint DEFAULT 0,
	`rawData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`objective` varchar(100),
	`status` enum('draft','active','paused','completed','archived') NOT NULL DEFAULT 'draft',
	`budget` decimal(12,2),
	`budgetSpent` decimal(12,2) DEFAULT '0',
	`targetAudience` text,
	`kpiGoals` json,
	`strategyBrief` text,
	`startDate` timestamp,
	`endDate` timestamp,
	`metaCampaignId` varchar(100),
	`roas` decimal(8,4),
	`cpa` decimal(10,2),
	`impressions` bigint DEFAULT 0,
	`clicks` bigint DEFAULT 0,
	`conversions` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitor_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`competitorName` varchar(255) NOT NULL,
	`website` varchar(500),
	`industry` varchar(100),
	`strengths` json,
	`weaknesses` json,
	`adStrategies` json,
	`keywords` json,
	`estimatedBudget` varchar(100),
	`socialFollowers` json,
	`insights` text,
	`rawData` json,
	`analyzedAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competitor_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`hubspotApiKey` varchar(500),
	`hubspotPortalId` varchar(100),
	`metaAccessToken` varchar(500),
	`metaAdAccountId` varchar(100),
	`metaPixelId` varchar(100),
	`googleAdsCustomerId` varchar(100),
	`isHubspotConnected` boolean DEFAULT false,
	`isMetaConnected` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integration_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`firstName` varchar(100),
	`lastName` varchar(100),
	`email` varchar(320),
	`phone` varchar(50),
	`company` varchar(255),
	`jobTitle` varchar(100),
	`source` varchar(100),
	`status` enum('new','attempting','connected','qualified','hot','warm','cold','converted','lost') NOT NULL DEFAULT 'new',
	`score` int DEFAULT 0,
	`scoreReason` text,
	`hubspotId` varchar(100),
	`metaLeadId` varchar(100),
	`notes` text,
	`enrichedData` json,
	`lastContactedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `optimization_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int,
	`userId` int NOT NULL,
	`ruleName` varchar(100) NOT NULL,
	`ruleType` enum('stop_loss','scale_winners','aggressive_scaling','fight_fatigue','custom') NOT NULL,
	`conditions` json NOT NULL,
	`actions` json NOT NULL,
	`isActive` boolean DEFAULT true,
	`lastTriggeredAt` timestamp,
	`triggerCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `optimization_rules_id` PRIMARY KEY(`id`)
);

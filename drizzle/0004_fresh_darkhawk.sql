CREATE TABLE `cross_system_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`analysisType` enum('cross_system_review','synergy_analysis','risk_assessment','resource_optimization','unified_report') NOT NULL,
	`marketingData` json,
	`seoData` json,
	`tradingData` json,
	`insights` json,
	`recommendations` json,
	`synergies` json,
	`risks` json,
	`overallHealthScore` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cross_system_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seo_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`domain` varchar(255),
	`totalKeywords` int DEFAULT 0,
	`rankedKeywords` int DEFAULT 0,
	`avgPosition` decimal(6,2),
	`totalBacklinks` int DEFAULT 0,
	`domainAuthority` decimal(5,2),
	`organicTraffic` bigint DEFAULT 0,
	`organicRevenue` decimal(14,2) DEFAULT '0',
	`topPages` json,
	`topKeywords` json,
	`backlinkProfile` json,
	`contentDistribution` json,
	`technicalHealth` decimal(5,2),
	`crawlErrors` int DEFAULT 0,
	`indexedPages` int DEFAULT 0,
	`siteSpeed` decimal(6,2),
	`mobileScore` decimal(5,2),
	`snapshotDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `seo_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`moduleName` varchar(100) NOT NULL,
	`moduleType` enum('marketing','seo','trading') NOT NULL,
	`status` enum('online','degraded','offline','maintenance') NOT NULL DEFAULT 'offline',
	`healthScore` decimal(5,2) DEFAULT '0',
	`config` json,
	`lastSyncAt` timestamp,
	`metrics` json,
	`isConnected` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trading_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalPositions` int DEFAULT 0,
	`openPositions` int DEFAULT 0,
	`totalInvested` decimal(14,2) DEFAULT '0',
	`totalPnl` decimal(14,2) DEFAULT '0',
	`realizedPnl` decimal(14,2) DEFAULT '0',
	`unrealizedPnl` decimal(14,2) DEFAULT '0',
	`winRate` decimal(5,2),
	`avgReturn` decimal(8,4),
	`activeMarkets` json,
	`topPositions` json,
	`recentTrades` json,
	`signals` json,
	`riskScore` decimal(5,2),
	`portfolioValue` decimal(14,2) DEFAULT '0',
	`dailyVolume` decimal(14,2) DEFAULT '0',
	`snapshotDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_data_id` PRIMARY KEY(`id`)
);

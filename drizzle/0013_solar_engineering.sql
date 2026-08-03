-- Solar Engineering Module Tables

-- Solar Clients
CREATE TABLE IF NOT EXISTS `solar_clients` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(320),
  `phone` varchar(20),
  `address` text,
  `city` varchar(100),
  `state` varchar(100),
  `zipCode` varchar(20),
  `country` varchar(100),
  `companyName` varchar(255),
  `annualElectricityCost` decimal(10, 2),
  `roofAge` int,
  `roofCondition` enum('excellent', 'good', 'fair', 'poor'),
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Solar Sites
CREATE TABLE IF NOT EXISTS `solar_sites` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `clientId` int NOT NULL,
  `salesEngineerId` int,
  `name` varchar(255),
  `address` text,
  `city` varchar(100),
  `state` varchar(100),
  `zipCode` varchar(20),
  `latitude` decimal(10, 8),
  `longitude` decimal(11, 8),
  `areaSqft` decimal(10, 2),
  `roofType` enum('asphalt', 'metal', 'tile', 'flat', 'ground_mount'),
  `roofTiltAngle` decimal(5, 2),
  `roofAzimuth` decimal(6, 2),
  `shadingFactor` decimal(3, 2),
  `polygonCoordinates` json,
  `satelliteImageUrl` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`clientId`) REFERENCES `solar_clients`(`id`)
);

-- Solar Calculations
CREATE TABLE IF NOT EXISTS `solar_calculations` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `siteId` int NOT NULL,
  `systemCapacityKw` decimal(10, 2),
  `moduleType` enum('monocrystalline', 'polycrystalline', 'thin_film'),
  `moduleEfficiency` decimal(5, 2),
  `inverterEfficiency` decimal(5, 2),
  `systemLossesPercent` decimal(5, 2),
  `annualProductionKwh` decimal(12, 2),
  `monthlyProduction` json,
  `performanceRatio` decimal(5, 2),
  `capacityFactor` decimal(5, 2),
  `pvwattsResponse` json,
  `calculationTimestamp` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`siteId`) REFERENCES `solar_sites`(`id`)
);

-- Solar Offers (Quotes/Proposals)
CREATE TABLE IF NOT EXISTS `solar_offers` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `siteId` int NOT NULL,
  `clientId` int NOT NULL,
  `salesEngineerId` int,
  `systemCapacityKw` decimal(10, 2),
  `systemCost` decimal(12, 2),
  `equipmentCost` decimal(12, 2),
  `installationCost` decimal(12, 2),
  `permittingCost` decimal(12, 2),
  `totalCost` decimal(12, 2),
  `federalTaxCredit` decimal(12, 2),
  `stateIncentives` decimal(12, 2),
  `netCost` decimal(12, 2),
  `monthlyPayment` decimal(10, 2),
  `financingTermMonths` int,
  `estimatedAnnualSavings` decimal(12, 2),
  `paybackPeriodYears` decimal(5, 2),
  `roiPercent` decimal(5, 2),
  `status` enum('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired') DEFAULT 'draft',
  `expiryDate` timestamp,
  `pdfUrl` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`siteId`) REFERENCES `solar_sites`(`id`),
  FOREIGN KEY (`clientId`) REFERENCES `solar_clients`(`id`)
);

-- Solar Performance Data
CREATE TABLE IF NOT EXISTS `solar_performance_data` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `siteId` int NOT NULL,
  `date` timestamp NOT NULL,
  `productionKwh` decimal(10, 2),
  `expectedProductionKwh` decimal(10, 2),
  `efficiencyPercent` decimal(5, 2),
  `weatherCondition` varchar(100),
  `temperatureCelsius` decimal(5, 2),
  `irradianceWm2` decimal(10, 2),
  `alerts` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`siteId`) REFERENCES `solar_sites`(`id`),
  INDEX `idx_site_date` (`siteId`, `date`)
);

-- Solar Sales Pipeline
CREATE TABLE IF NOT EXISTS `solar_sales_pipeline` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `clientId` int NOT NULL,
  `siteId` int,
  `salesEngineerId` int,
  `stage` enum('lead', 'qualified', 'site_survey', 'design', 'proposal', 'negotiation', 'closed_won', 'closed_lost') DEFAULT 'lead',
  `dealValue` decimal(12, 2),
  `probabilityPercent` int,
  `expectedCloseDate` timestamp,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`clientId`) REFERENCES `solar_clients`(`id`),
  FOREIGN KEY (`siteId`) REFERENCES `solar_sites`(`id`)
);

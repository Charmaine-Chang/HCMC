-- HCMC MVP database bootstrap for MySQL 8+
-- Run as a MySQL user allowed to create databases, or remove the first two statements
-- and select an existing database before running the rest.
CREATE DATABASE IF NOT EXISTS `hcmc_demo`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hcmc_demo`;
-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'PASTOR', 'VOLUNTEER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `churchStatus` ENUM('NEWCOMER', 'SEEKER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `receptionAccess` BOOLEAN NOT NULL DEFAULT false,
    `ministryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_ministryId_idx`(`ministryId`),
    INDEX `User_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ministry` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Ministry_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Newcomer` (
    `id` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `preferredName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `preferredLanguage` ENUM('CHINESE', 'ENGLISH', 'BILINGUAL') NOT NULL,
    `interestedFellowships` JSON NULL,
    `consentContact` BOOLEAN NOT NULL,
    `subscribeUpdates` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('PENDING_FOLLOWUP', 'CONTACTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING_FOLLOWUP',
    `assignedVolunteerId` VARCHAR(191) NULL,
    `isPotentialDuplicate` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Activity` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `ministryId` VARCHAR(191) NOT NULL,
    `visibility` ENUM('PUBLIC', 'INTERNAL') NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `coordinatorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Activity_ministryId_idx`(`ministryId`),
    INDEX `Activity_coordinatorId_idx`(`coordinatorId`),
    INDEX `Activity_startTime_status_visibility_idx`(`startTime`, `status`, `visibility`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Duty` (
    `id` VARCHAR(191) NOT NULL,
    `activityId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `requiredCount` INTEGER NOT NULL DEFAULT 1,

    INDEX `Duty_activityId_idx`(`activityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VolunteerAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `dutyId` VARCHAR(191) NOT NULL,
    `volunteerId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
    `declineReason` VARCHAR(191) NULL,
    `confirmedAt` DATETIME(3) NULL,
    `tokenHash` VARCHAR(191) NULL,
    `tokenExpiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `VolunteerAssignment_tokenHash_key`(`tokenHash`),
    INDEX `VolunteerAssignment_volunteerId_idx`(`volunteerId`),
    UNIQUE INDEX `VolunteerAssignment_dutyId_volunteerId_key`(`dutyId`, `volunteerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailTask` (
    `id` VARCHAR(191) NOT NULL,
    `recipientEmail` VARCHAR(191) NOT NULL,
    `template` ENUM('WELCOME_EMAIL', 'ROSTER_ASSIGNMENT', 'REMINDER_48H', 'CHANGE_NOTICE') NOT NULL,
    `payload` JSON NOT NULL,
    `dedupeKey` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `scheduledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sentAt` DATETIME(3) NULL,
    `lastError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `EmailTask_dedupeKey_key`(`dedupeKey`),
    INDEX `EmailTask_status_scheduledAt_idx`(`status`, `scheduledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_actorId_createdAt_idx`(`actorId`, `createdAt`),
    INDEX `AuditLog_entity_entityId_idx`(`entity`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScriptureVerse` (
    `id` VARCHAR(191) NOT NULL,
    `bookCode` VARCHAR(191) NOT NULL,
    `bookName` VARCHAR(191) NOT NULL,
    `chapter` INTEGER NOT NULL,
    `verse` INTEGER NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `testament` VARCHAR(191) NOT NULL,

    INDEX `ScriptureVerse_bookCode_chapter_idx`(`bookCode`, `chapter`),
    INDEX `ScriptureVerse_version_testament_idx`(`version`, `testament`),
    UNIQUE INDEX `ScriptureVerse_bookCode_chapter_verse_version_key`(`bookCode`, `chapter`, `verse`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_ministryId_fkey` FOREIGN KEY (`ministryId`) REFERENCES `Ministry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Newcomer` ADD CONSTRAINT `Newcomer_assignedVolunteerId_fkey` FOREIGN KEY (`assignedVolunteerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Activity` ADD CONSTRAINT `Activity_ministryId_fkey` FOREIGN KEY (`ministryId`) REFERENCES `Ministry`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Activity` ADD CONSTRAINT `Activity_coordinatorId_fkey` FOREIGN KEY (`coordinatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Duty` ADD CONSTRAINT `Duty_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `Activity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VolunteerAssignment` ADD CONSTRAINT `VolunteerAssignment_dutyId_fkey` FOREIGN KEY (`dutyId`) REFERENCES `Duty`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VolunteerAssignment` ADD CONSTRAINT `VolunteerAssignment_volunteerId_fkey` FOREIGN KEY (`volunteerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- Fictional portfolio/demo data only. Never replace these rows with real people.
START TRANSACTION;

INSERT INTO `Ministry` (`id`, `name`) VALUES
  ('min_demo_worship', 'Demo Worship Ministry'),
  ('min_demo_welcome', 'Demo Welcome Ministry')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Demo password for both accounts: HcmcDemo2026!
-- Change it immediately outside a disposable local demo environment.
INSERT INTO `User`
  (`id`, `email`, `passwordHash`, `fullName`, `role`, `churchStatus`, `receptionAccess`, `ministryId`, `createdAt`)
VALUES
  ('usr_demo_admin', 'admin@example.com', '$2a$12$fSkOYAOAz7BDCAXHZRO7UO999eoBWems4Pa/N0wqsjy7TV/ZTIAIa', 'Demo Admin', 'ADMIN', 'MEMBER', TRUE, 'min_demo_welcome', CURRENT_TIMESTAMP(3)),
  ('usr_demo_volunteer', 'volunteer@example.com', '$2a$12$fSkOYAOAz7BDCAXHZRO7UO999eoBWems4Pa/N0wqsjy7TV/ZTIAIa', 'Demo Volunteer', 'VOLUNTEER', 'MEMBER', FALSE, 'min_demo_worship', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `fullName` = VALUES(`fullName`),
  `role` = VALUES(`role`),
  `receptionAccess` = VALUES(`receptionAccess`),
  `ministryId` = VALUES(`ministryId`);

INSERT INTO `Activity`
  (`id`, `title`, `description`, `startTime`, `endTime`, `location`, `ministryId`, `visibility`, `status`, `coordinatorId`, `createdAt`, `updatedAt`)
VALUES
  ('act_demo_worship', '示例主日聚会', '用于作品集演示的虚构活动。', '2026-10-04 21:00:00.000', '2026-10-04 22:30:00.000', 'Demo Hall, Hamilton', 'min_demo_worship', 'PUBLIC', 'PUBLISHED', 'usr_demo_admin', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('act_demo_team', '示例同工预备会', '仅供内部演示。', '2026-10-03 07:00:00.000', '2026-10-03 08:00:00.000', 'Demo Meeting Room', 'min_demo_welcome', 'INTERNAL', 'PUBLISHED', 'usr_demo_admin', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`), `description` = VALUES(`description`),
  `startTime` = VALUES(`startTime`), `endTime` = VALUES(`endTime`),
  `location` = VALUES(`location`), `visibility` = VALUES(`visibility`),
  `status` = VALUES(`status`), `updatedAt` = CURRENT_TIMESTAMP(3);

INSERT INTO `Duty` (`id`, `activityId`, `name`, `requiredCount`) VALUES
  ('duty_demo_welcome', 'act_demo_worship', '接待', 2),
  ('duty_demo_audio', 'act_demo_worship', '音响', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `requiredCount` = VALUES(`requiredCount`);

COMMIT;

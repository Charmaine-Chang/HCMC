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


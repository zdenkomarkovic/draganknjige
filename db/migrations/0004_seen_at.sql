ALTER TABLE `inquiries` ADD `seen_at` datetime;--> statement-breakpoint
ALTER TABLE `orders` ADD `seen_at` datetime;--> statement-breakpoint
UPDATE `orders` SET `seen_at` = `created_at` WHERE `status` <> 'nova';--> statement-breakpoint
UPDATE `inquiries` SET `seen_at` = `created_at` WHERE `status` <> 'nova';

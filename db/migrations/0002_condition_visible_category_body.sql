DROP INDEX `products_sub_created_idx` ON `products`;--> statement-breakpoint
DROP INDEX `products_cat_created_idx` ON `products`;--> statement-breakpoint
DROP INDEX `products_sub_price_idx` ON `products`;--> statement-breakpoint
DROP INDEX `products_created_idx` ON `products`;--> statement-breakpoint
DROP INDEX `products_featured_idx` ON `products`;--> statement-breakpoint
ALTER TABLE `categories` ADD `body` mediumtext;--> statement-breakpoint
ALTER TABLE `categories` ADD `page_seo_title` varchar(255);--> statement-breakpoint
ALTER TABLE `categories` ADD `page_seo_description` text;--> statement-breakpoint
ALTER TABLE `categories` ADD `visible` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `condition` varchar(60);--> statement-breakpoint
ALTER TABLE `products` ADD `visible` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `subcategories` ADD `visible` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `products_sub_created_idx` ON `products` (`subcategory_id`,`visible`,`created_at`);--> statement-breakpoint
CREATE INDEX `products_cat_created_idx` ON `products` (`category_id`,`visible`,`created_at`);--> statement-breakpoint
CREATE INDEX `products_sub_price_idx` ON `products` (`subcategory_id`,`visible`,`price`);--> statement-breakpoint
CREATE INDEX `products_created_idx` ON `products` (`visible`,`created_at`);--> statement-breakpoint
CREATE INDEX `products_featured_idx` ON `products` (`featured`,`visible`);
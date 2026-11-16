CREATE TABLE `inquiries` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`status` enum('nova','odgovoreno') NOT NULL DEFAULT 'nova',
	`product_id` int unsigned,
	`product_name` varchar(255) NOT NULL,
	`product_slug` varchar(300),
	`ime` varchar(100) NOT NULL,
	`telefon` varchar(50) NOT NULL,
	`email` varchar(255),
	`poruka` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `inquiries_status_created_idx` ON `inquiries` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `inquiries_product_idx` ON `inquiries` (`product_id`);
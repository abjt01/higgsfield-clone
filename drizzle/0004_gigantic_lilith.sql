DROP INDEX "generations_user_created_idx";--> statement-breakpoint
DROP INDEX "generations_feed_idx";--> statement-breakpoint
CREATE INDEX "generations_user_created_idx" ON "generations" USING btree ("user_id","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "generations_feed_idx" ON "generations" USING btree ("created_at" DESC NULLS FIRST) WHERE "generations"."visibility" = 'public' and "generations"."image_url" is not null;
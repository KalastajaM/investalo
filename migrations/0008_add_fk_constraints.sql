-- Add foreign key constraints from projects/properties/settings to users.
--
-- DEV_MODE note: rows with user_id = 'dev-user' will not have a matching row
-- in the users table. We delete those orphaned rows first so the FK can be
-- applied cleanly. DEV_MODE data is ephemeral and re-created on each session.
--
-- ON DELETE CASCADE: deleting a user automatically removes all their data.

DELETE FROM projects   WHERE user_id NOT IN (SELECT id FROM users);--> statement-breakpoint
DELETE FROM properties WHERE user_id NOT IN (SELECT id FROM users);--> statement-breakpoint
DELETE FROM settings   WHERE user_id NOT IN (SELECT id FROM users);--> statement-breakpoint

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "projects"
  ADD CONSTRAINT "projects_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint

ALTER TABLE "properties" DROP CONSTRAINT IF EXISTS "properties_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "properties"
  ADD CONSTRAINT "properties_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint

ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "settings"
  ADD CONSTRAINT "settings_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

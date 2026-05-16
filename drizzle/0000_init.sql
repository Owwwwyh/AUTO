CREATE TABLE IF NOT EXISTS "submissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "merchant" text NOT NULL,
  "date" text NOT NULL,
  "total" numeric(12, 2) NOT NULL,
  "currency" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

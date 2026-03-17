-- =============================================
-- Row Level Security Policies for Supabase
-- =============================================
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- These policies apply when accessing via supabase-js (anon key).
-- Prisma Client uses the postgres role which bypasses RLS.

-- Enable RLS on sensitive tables
ALTER TABLE "intake_form" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;

-- =============================================
-- INTAKE_FORM: patients can only see their own forms
-- =============================================

CREATE POLICY "Users can view own intake forms"
  ON "intake_form"
  FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own intake forms"
  ON "intake_form"
  FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- =============================================
-- PAYMENT: patients can only see their own payments
-- =============================================

CREATE POLICY "Users can view own payments"
  ON "payment"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "appointment"
      WHERE "appointment"."id" = "payment"."appointmentId"
      AND "appointment"."userId" = auth.uid()::text
    )
  );

-- =============================================
-- APPOINTMENT: patients can only see their own appointments
-- =============================================

CREATE POLICY "Users can view own appointments"
  ON "appointment"
  FOR SELECT
  USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can insert own appointments"
  ON "appointment"
  FOR INSERT
  WITH CHECK ("userId" = auth.uid()::text);

-- =============================================
-- SESSION and ACCOUNT: only own user
-- =============================================

CREATE POLICY "Users can view own sessions"
  ON "session"
  FOR SELECT
  USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can view own accounts"
  ON "account"
  FOR SELECT
  USING ("userId" = auth.uid()::text);

-- =============================================
-- Service role: full access (for Server Actions / API routes)
-- =============================================

CREATE POLICY "Service role has full access to intake_form"
  ON "intake_form" FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to payment"
  ON "payment" FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to appointment"
  ON "appointment" FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to session"
  ON "session" FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to account"
  ON "account" FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- Storage Buckets
-- =============================================

-- Create buckets (can also be done from Dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('psychologist-photos', 'psychologist-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- psychologist-photos: public read, service_role write
CREATE POLICY "Public read access for psychologist photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'psychologist-photos');

CREATE POLICY "Service role can manage psychologist photos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'psychologist-photos' AND auth.role() = 'service_role');

-- documents: service_role only (PDFs generated server-side)
CREATE POLICY "Service role can manage documents"
  ON storage.objects FOR ALL
  USING (bucket_id = 'documents' AND auth.role() = 'service_role');

-- =============================================
-- USER: users can only see their own profile
-- =============================================
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON "user"
  FOR SELECT
  USING ("id" = auth.uid()::text);

CREATE POLICY "Service role has full access to user"
  ON "user" FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- VERIFICATION: no anon access (tokens are server-only)
-- =============================================
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to verification"
  ON "verification" FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- COUPON: public read for validation, admin write
-- =============================================
ALTER TABLE "coupon" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for coupons"
  ON "coupon"
  FOR SELECT
  USING (true);

CREATE POLICY "Service role has full access to coupon"
  ON "coupon" FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- PSYCHOLOGIST: public read, admin write
-- =============================================
ALTER TABLE "psychologist" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for psychologists"
  ON "psychologist"
  FOR SELECT
  USING (true);

CREATE POLICY "Service role has full access to psychologist"
  ON "psychologist" FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- SCHEDULE: public read, admin write
-- =============================================
ALTER TABLE "schedule" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for schedules"
  ON "schedule"
  FOR SELECT
  USING (true);

CREATE POLICY "Service role has full access to schedule"
  ON "schedule" FOR ALL
  USING (auth.role() = 'service_role');

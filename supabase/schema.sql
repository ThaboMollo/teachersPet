-- Teacher's PET — Supabase Schema
-- Run this in the Supabase SQL editor to initialise the database.

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE schools (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  address     TEXT,
  emis_number TEXT UNIQUE,
  logo_url    TEXT,
  join_code   TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Extends auth.users — one row per registered user
CREATE TABLE profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id           UUID REFERENCES schools(id),
  role                TEXT NOT NULL CHECK (role IN ('teacher','dh','dp','principal')) DEFAULT 'teacher',
  name                TEXT NOT NULL DEFAULT '',
  surname             TEXT NOT NULL DEFAULT '',
  id_number           TEXT,
  phone               TEXT,
  address             TEXT,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE classes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id  UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  grade      INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 12),
  name       TEXT NOT NULL,
  year       INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subjects (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id  UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  code       TEXT,
  grade      INTEGER CHECK (grade BETWEEN 1 AND 12),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Which teacher teaches which subject to which class
CREATE TABLE class_teachers (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id   UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  UNIQUE (class_id, teacher_id, subject_id)
);

CREATE TABLE learners (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id      UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id       UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  surname        TEXT NOT NULL,
  id_number      TEXT,
  date_of_birth  DATE,
  parent_contact TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE timetable_slots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id  UUID REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
  period      INTEGER NOT NULL CHECK (period BETWEEN 1 AND 8),
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL
);

CREATE TABLE attendance (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  learner_id  UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  status      TEXT NOT NULL CHECK (status IN ('present','absent','late')),
  notes       TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (class_id, learner_id, date)
);

CREATE TABLE announcements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id    UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by   UUID NOT NULL REFERENCES profiles(id),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('general','meeting','word_of_day','urgent')) DEFAULT 'general',
  target_roles TEXT[] DEFAULT ARRAY['teacher','dh','dp','principal'],
  is_published BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lesson_plans (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id  UUID REFERENCES subjects(id) ON DELETE SET NULL,
  date        DATE NOT NULL,
  topic       TEXT NOT NULL,
  objectives  TEXT,
  activities  TEXT,
  resources   TEXT,
  memo_url    TEXT,
  status      TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES profiles(id),
  class_id    UUID REFERENCES classes(id),
  subject_id  UUID REFERENCES subjects(id),
  category    TEXT NOT NULL CHECK (category IN ('lesson_plan','assessment','memo','admin','other')),
  title       TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  file_size   INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id    UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id     UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id   UUID NOT NULL REFERENCES profiles(id),
  subject_id   UUID REFERENCES subjects(id) ON DELETE SET NULL,
  type         TEXT NOT NULL CHECK (type IN ('informal_task','test','exam','assignment')),
  title        TEXT NOT NULL,
  date         DATE NOT NULL,
  total_marks  INTEGER NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessment_results (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id  UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  learner_id     UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  marks_obtained NUMERIC NOT NULL,
  recorded_by    UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (assessment_id, learner_id)
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create a profile row when a new auth user signs up.
-- SET search_path is required for SECURITY DEFINER functions in Supabase
-- so the function can resolve public.profiles without ambiguity.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HELPER FUNCTIONS (used by RLS policies)
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_school_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_leadership()
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT role IN ('dh','dp','principal') FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE schools           ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_teachers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE learners          ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance        ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

-- SCHOOLS
-- auth.uid() IS NOT NULL is the correct Supabase pattern — Supabase routes all
-- requests through the anon role; the JWT distinguishes logged-in users.
CREATE POLICY "schools_read_member"    ON schools FOR SELECT USING (id = get_my_school_id());
CREATE POLICY "schools_insert_authenticated" ON schools FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "schools_update_admin"   ON schools FOR UPDATE USING (id = get_my_school_id() AND get_my_role() IN ('principal','dp'));

-- PROFILES
CREATE POLICY "profiles_read_own"      ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_read_school"   ON profiles FOR SELECT USING (school_id = get_my_school_id() AND is_leadership());
CREATE POLICY "profiles_insert_own"    ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own"    ON profiles FOR UPDATE USING (id = auth.uid());

-- CLASSES
CREATE POLICY "classes_read_school"    ON classes FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "classes_manage"         ON classes FOR ALL   USING (school_id = get_my_school_id() AND is_leadership());
CREATE POLICY "classes_insert"         ON classes FOR INSERT WITH CHECK (school_id = get_my_school_id() AND is_leadership());

-- SUBJECTS
CREATE POLICY "subjects_read_school"   ON subjects FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "subjects_manage"        ON subjects FOR ALL   USING (school_id = get_my_school_id() AND is_leadership());
CREATE POLICY "subjects_insert"        ON subjects FOR INSERT WITH CHECK (school_id = get_my_school_id() AND is_leadership());

-- CLASS TEACHERS
CREATE POLICY "ct_read_school" ON class_teachers FOR SELECT USING (
  class_id IN (SELECT id FROM classes WHERE school_id = get_my_school_id())
);
CREATE POLICY "ct_manage" ON class_teachers FOR ALL USING (
  class_id IN (SELECT id FROM classes WHERE school_id = get_my_school_id()) AND is_leadership()
);
CREATE POLICY "ct_insert" ON class_teachers FOR INSERT WITH CHECK (
  class_id IN (SELECT id FROM classes WHERE school_id = get_my_school_id()) AND is_leadership()
);

-- LEARNERS
CREATE POLICY "learners_read_school"   ON learners FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "learners_manage"        ON learners FOR ALL   USING (school_id = get_my_school_id());
CREATE POLICY "learners_insert"        ON learners FOR INSERT WITH CHECK (school_id = get_my_school_id());

-- TIMETABLE SLOTS
CREATE POLICY "tt_read_school"         ON timetable_slots FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "tt_manage"              ON timetable_slots FOR ALL   USING (school_id = get_my_school_id() AND is_leadership());
CREATE POLICY "tt_insert"              ON timetable_slots FOR INSERT WITH CHECK (school_id = get_my_school_id() AND is_leadership());

-- ATTENDANCE
CREATE POLICY "att_read_school"        ON attendance FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "att_insert"             ON attendance FOR INSERT WITH CHECK (school_id = get_my_school_id());
CREATE POLICY "att_update"             ON attendance FOR UPDATE USING (school_id = get_my_school_id());

-- ANNOUNCEMENTS
CREATE POLICY "ann_read_school"        ON announcements FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "ann_manage"             ON announcements FOR ALL   USING (school_id = get_my_school_id() AND get_my_role() IN ('dh','dp','principal'));
CREATE POLICY "ann_insert"             ON announcements FOR INSERT WITH CHECK (school_id = get_my_school_id() AND get_my_role() IN ('dh','dp','principal'));

-- LESSON PLANS
CREATE POLICY "lp_read_own"            ON lesson_plans FOR SELECT USING (teacher_id = auth.uid() OR (school_id = get_my_school_id() AND is_leadership()));
CREATE POLICY "lp_manage_own"          ON lesson_plans FOR ALL   USING (teacher_id = auth.uid());
CREATE POLICY "lp_insert_own"          ON lesson_plans FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- DOCUMENTS
CREATE POLICY "docs_read_school"       ON documents FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "docs_insert"            ON documents FOR INSERT WITH CHECK (school_id = get_my_school_id());
CREATE POLICY "docs_delete"            ON documents FOR DELETE USING (uploader_id = auth.uid() OR (school_id = get_my_school_id() AND is_leadership()));

-- ASSESSMENTS
CREATE POLICY "ass_read_school"        ON assessments FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "ass_manage"             ON assessments FOR ALL   USING (teacher_id = auth.uid() OR (school_id = get_my_school_id() AND is_leadership()));
CREATE POLICY "ass_insert"             ON assessments FOR INSERT WITH CHECK (school_id = get_my_school_id());

-- ASSESSMENT RESULTS
CREATE POLICY "results_read" ON assessment_results FOR SELECT USING (
  assessment_id IN (SELECT id FROM assessments WHERE school_id = get_my_school_id())
);
CREATE POLICY "results_insert" ON assessment_results FOR INSERT WITH CHECK (
  assessment_id IN (SELECT id FROM assessments WHERE school_id = get_my_school_id())
);
CREATE POLICY "results_update" ON assessment_results FOR UPDATE USING (
  assessment_id IN (SELECT id FROM assessments WHERE school_id = get_my_school_id())
);

-- ============================================================
-- GRANTS
-- Required when tables are created via raw SQL (not the Supabase dashboard).
-- The dashboard grants these automatically; raw SQL does not.
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================
-- STORAGE BUCKETS (run separately in dashboard or via API)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-memos', 'lesson-memos', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-memos', 'lesson-memos', false);

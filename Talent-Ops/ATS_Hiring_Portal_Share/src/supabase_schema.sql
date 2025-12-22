-- Create tables for ATS

-- Jobs Table
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  experience TEXT,
  skills TEXT[] DEFAULT '{}',
  description TEXT,
  status TEXT DEFAULT 'draft',
  applicants INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID
);

-- Candidates Table
CREATE TABLE candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  job_id UUID REFERENCES jobs(id),
  job_title TEXT,
  stage TEXT DEFAULT 'applied',
  resume_url TEXT,
  resume_name TEXT,
  resume_size INTEGER,
  resume_uploaded_at TIMESTAMP WITH TIME ZONE,
  skills TEXT[] DEFAULT '{}',
  experience TEXT,
  notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- STORAGE: Create a bucket named 'resumes' in the Supabase Dashboard -> Storage section.
-- Policy for Storage (if creating via SQL):
-- insert into storage.buckets (id, name) values ('resumes', 'resumes');
-- create policy "Public Access" on storage.objects for select using ( bucket_id = 'resumes' );
-- create policy "Auth Upload" on storage.objects for insert with check ( bucket_id = 'resumes' );

-- Interviews Table
CREATE TABLE interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id),
  candidate_name TEXT,
  job_id UUID REFERENCES jobs(id),
  job_title TEXT,
  panel_type TEXT,
  interviewers TEXT[] DEFAULT '{}',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  mode TEXT,
  meeting_link TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Feedback Table
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id),
  interview_id UUID REFERENCES interviews(id),
  interviewer_id TEXT,
  interviewer_name TEXT,
  ratings JSONB DEFAULT '{}',
  comments JSONB DEFAULT '{}',
  recommendation TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Offers Table
CREATE TABLE offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id) UNIQUE,
  candidate_name TEXT,
  job_id UUID REFERENCES jobs(id),
  job_title TEXT,
  position TEXT,
  department TEXT,
  location TEXT,
  start_date DATE,
  salary NUMERIC,
  equity TEXT,
  benefits TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Audit Log Table
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  user_id TEXT,
  details TEXT,
  changes JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- create policies (public access for demo purposes, restrict in production)
CREATE POLICY "Public access for all tables" ON jobs FOR ALL USING (true);
CREATE POLICY "Public access for all tables" ON candidates FOR ALL USING (true);
CREATE POLICY "Public access for all tables" ON interviews FOR ALL USING (true);
CREATE POLICY "Public access for all tables" ON feedback FOR ALL USING (true);
CREATE POLICY "Public access for all tables" ON offers FOR ALL USING (true);
CREATE POLICY "Public access for all tables" ON audit_log FOR ALL USING (true);

-- Users Table (for demo app structure)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'interviewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE POLICY "Public access for all tables" ON users FOR ALL USING (true);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

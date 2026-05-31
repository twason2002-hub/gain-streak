-- badge_tiers: config table for badge definitions
CREATE TABLE IF NOT EXISTS public.badge_tiers (
  id SERIAL PRIMARY KEY,
  weeks INTEGER NOT NULL UNIQUE,
  label TEXT NOT NULL,
  title TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'T',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.badge_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS badge_tiers_select ON public.badge_tiers;
CREATE POLICY badge_tiers_select ON public.badge_tiers FOR SELECT USING (true);

-- exercise_types: reference for compound lifts, icons, sort order
CREATE TABLE IF NOT EXISTS public.exercise_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT 'XX',
  is_compound BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 999,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.exercise_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exercise_types_select ON public.exercise_types;
CREATE POLICY exercise_types_select ON public.exercise_types FOR SELECT USING (true);

-- motivation_messages: streak milestones + random gym quotes
CREATE TABLE IF NOT EXISTS public.motivation_messages (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('streak', 'quote')),
  text TEXT NOT NULL,
  min_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.motivation_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS motivation_messages_select ON public.motivation_messages;
CREATE POLICY motivation_messages_select ON public.motivation_messages FOR SELECT USING (true);

-- Seed badge_tiers
INSERT INTO public.badge_tiers (weeks, label, title, color, icon) VALUES
  (12, 'Gold Tick', '3 Months', '#EAB308', 'G'),
  (24, 'Purple Tick', '6 Months', '#A855F7', 'P'),
  (52, 'Teal Tick', '1 Year', '#14B8A6', 'T'),
  (104, 'Red Tick', '2 Years', '#EF4444', 'X')
ON CONFLICT (weeks) DO NOTHING;

-- Seed exercise_types
INSERT INTO public.exercise_types (name, icon, is_compound, sort_order) VALUES
  ('Deadlift', 'DL', true, 1),
  ('Squat', 'SQ', true, 2),
  ('Bench Press', 'BP', true, 3),
  ('Overhead Press', 'OH', true, 4),
  ('Barbell Row', 'BR', true, 5),
  ('Pull Ups', 'PU', true, 6),
  ('Push Ups', 'PS', false, 7),
  ('Bicep Curl', 'BC', false, 8),
  ('Tricep Extension', 'TE', false, 9),
  ('Lat Pulldown', 'LP', false, 10),
  ('Leg Press', 'LP', false, 11),
  ('Cable Row', 'CR', true, 12)
ON CONFLICT (name) DO NOTHING;

-- Seed motivation_messages (streak milestones)
INSERT INTO public.motivation_messages (type, text, min_streak) VALUES
  ('streak', 'Every champion was once a beginner. Start today.', 0),
  ('streak', 'One week down. The body keeps score.', 1),
  ('streak', 'Two weeks of showing up. Momentum is building.', 2),
  ('streak', 'Three weeks strong. This is becoming who you are.', 3),
  ('streak', 'One month of consistency. Respect.', 4),
  ('streak', 'Five weeks. Your past self would be proud.', 5),
  ('streak', 'Six weeks. You are not starting over, you are continuing.', 6),
  ('streak', 'Two months. Discipline is your superpower.', 8),
  ('streak', 'Three months. You have built a lifestyle.', 12),
  ('streak', 'Four months. Most people quit by now. You are not most people.', 16),
  ('streak', 'Five months. Iron sharpens iron.', 20),
  ('streak', 'Six months. Half a year of showing up. Legendary.', 24),
  ('streak', 'Nine months. Consistency is your identity.', 36),
  ('streak', 'One full year. A whole year of discipline. You are unstoppable.', 52),
  ('streak', 'One year and a half. You inspire others.', 78),
  ('streak', 'Two years. Absolute beast mode. Nothing can stop you.', 104)
ON CONFLICT DO NOTHING;

-- Seed motivation_messages (gym quotes)
INSERT INTO public.motivation_messages (type, text, min_streak) VALUES
  ('quote', 'New PRs are proof that you are still growing.', 0),
  ('quote', 'Strength is not given. It is earned, rep by rep.', 0),
  ('quote', 'The only easy day was yesterday.', 0),
  ('quote', 'Your only competition is the person you were yesterday.', 0),
  ('quote', 'Be stronger than your strongest excuse.', 0),
  ('quote', 'The gym is the only place where you can be selfish and it is a good thing.', 0),
  ('quote', 'It does not get easier. You get stronger.', 0),
  ('quote', 'The pain you feel today is the strength you feel tomorrow.', 0),
  ('quote', 'Progress, not perfection.', 0),
  ('quote', 'You did not come this far to only come this far.', 0),
  ('quote', 'Your only competition is the person you were yesterday.', 0),
  ('quote', 'The best project you will ever work on is you.', 0)
ON CONFLICT DO NOTHING;

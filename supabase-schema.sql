CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  is_guest BOOLEAN DEFAULT false,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  exercise_name TEXT NOT NULL,
  reps INTEGER NOT NULL DEFAULT 0,
  weight DECIMAL(6,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_workouts_user_date ON workouts(user_id, date);
CREATE INDEX idx_workouts_user_id ON workouts(user_id);

-- Workout sessions table (groups all exercises in one workout day)
CREATE TABLE workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'auto_completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workout sets table (individual sets within a session)
CREATE TABLE workout_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  exercise_name TEXT NOT NULL,
  reps INTEGER NOT NULL DEFAULT 0,
  weight DECIMAL(6,2) NOT NULL DEFAULT 0,
  set_number INTEGER NOT NULL DEFAULT 1,
  rest_timer_seconds INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for workout_sessions
CREATE INDEX idx_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_sessions_user_date ON workout_sessions(user_id, started_at);
CREATE INDEX idx_sessions_status ON workout_sessions(status);

-- Indexes for workout_sets
CREATE INDEX idx_sets_session_id ON workout_sets(session_id);
CREATE INDEX idx_sets_user_exercise ON workout_sets(user_id, exercise_name);
CREATE INDEX idx_sets_user_date ON workout_sets(user_id, created_at);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own workouts"
  ON workouts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts"
  ON workouts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own workout sessions"
  ON workout_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions"
  ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions"
  ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions"
  ON workout_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own workout sets"
  ON workout_sets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sets"
  ON workout_sets FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sets"
  ON workout_sets FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sets"
  ON workout_sets FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

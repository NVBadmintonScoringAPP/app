import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://ddkhdbgjswgynzfpeytc.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRka2hkYmdqc3dneW56ZnBleXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTc1MTUsImV4cCI6MjA4NjU3MzUxNX0.WJX-7xPYp5qz6ClfRacuPUqPxi1F7_mDaDbxIpneWVE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

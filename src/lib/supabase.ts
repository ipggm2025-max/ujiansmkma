import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wycsvsaktfmjewihtscz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5Y3N2c2FrdGZtamV3aWh0c2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMjcwMjUsImV4cCI6MjA5MTgwMzAyNX0.Q57A3AyXbo6ovTgIeK69Uz1qzgS2re3AVu8nJpnSQhU';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your secrets.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

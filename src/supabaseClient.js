import { createClient } from '@supabase/supabase-js';

// Main Partner Portal Database
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

// Waitlist Database (Main Website)
const waitlistUrl = import.meta.env.VITE_WAITLIST_SUPABASE_URL;
const waitlistKey = import.meta.env.VITE_WAITLIST_SUPABASE_PUBLISHABLE_KEY;
export const waitlistSupabase = createClient(waitlistUrl, waitlistKey);

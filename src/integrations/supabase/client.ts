import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uzimddhgsfkjzdzexpjr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aW1kZGhnc2ZranpkemV4cGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDA3MTAsImV4cCI6MjA3OTIxNjcxMH0.ZZCgokNBDWjt0UeoaFAl-sc9kuLQVveSgyl_meDVJuQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

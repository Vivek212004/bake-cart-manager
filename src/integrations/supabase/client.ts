import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://dogevqugqskkeizpbroq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZ2V2cXVncXNra2VpenBicm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0OTIzNDgsImV4cCI6MjA3ODA2ODM0OH0.AHhUowuNoZTpZx0JJ2uTGSoCgo7bUGpb6Kd-YNawMQw";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

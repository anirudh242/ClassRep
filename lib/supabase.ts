// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Replace with your actual Supabase project URL and anonymous key
const supabaseUrl = 'https://wruntsvfnmrgopjqrskx.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydW50c3Zmbm1yZ29wanFyc2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNzYzNTAsImV4cCI6MjA3MTk1MjM1MH0.Y4dY0yno7sYXDELxhCNiBv3rYNxqR0X5OhuOALcg6sw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

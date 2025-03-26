// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ptaszbnzvjjjgndsbrhw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0YXN6Ym56dmpqamduZHNicmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5ODE5MTAsImV4cCI6MjA1ODU1NzkxMH0.Km_BSRhTzKIfXNQ1Pd0GfdVmBSVk58ZAXuE20LvRSs4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
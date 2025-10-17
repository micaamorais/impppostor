import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mubegqdmcxtxsrciolnn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11YmVncWRtY3h0eHNyY2lvbG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NjQ0OTksImV4cCI6MjA3NjI0MDQ5OX0.p_JfOrJaq3RYR6_cWRAI68uecKJ_YX2QpejWHTJrMik';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

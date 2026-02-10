import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

/**
 * Supabase client setup for RPC calls
 */
export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey || config.supabaseAnonKey,
);

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// هذا السطر ليخبرنا في المتصفح هل تم قراءة الرابط بنجاح
console.log("Supabase URL is:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
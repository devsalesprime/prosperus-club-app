import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    const { data, error } = await supabase.from('profiles').select('email, name, benefit_status, rejection_reason').not('exclusive_benefit', 'is', 'null');
    console.log("DATA:");
    console.log(JSON.stringify(data, null, 2));
    if (error) console.error("ERROR:", error);
}
test();

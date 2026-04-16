import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Read JSON and Strip BOM
const rawData = fs.readFileSync('emails_to_sync.json', 'utf8')
                .replace(/^\uFEFF/, '')
                .replace(/Initialising login role...\r?\n/, '');
const data = JSON.parse(rawData);

const rows = data.rows;
console.log(`Found ${rows.length} contacts to sync.`);
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function syncAll() {
    for (const user of rows) {
        console.log(`Syncing ${user.email} (${user.birth_date})...`);
        try {
            const res = await fetch('https://ptvsctwwonvirdwprugv.supabase.co/functions/v1/update-hubspot-contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    email: user.email,
                    birth_date: user.birth_date
                })
            });
            const text = await res.text();
            console.log(`  Response: ${res.status} - ${text}`);
            await delay(500); // safety threshold for not spamming hubspot api rate limits via proxy
        } catch (e) {
            console.error(`  Error: ${e.message}`);
        }
    }
}
syncAll();

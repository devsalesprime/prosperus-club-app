// Utility to clear Supabase cache and session
// Run this in browser console if you experience loading issues

console.log('🧹 Clearing Supabase cache and session...');

// 1. Clear localStorage
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('prosperus'))) {
        keysToRemove.push(key);
    }
}

keysToRemove.forEach(key => {
    console.log('Removing:', key);
    localStorage.removeItem(key);
});

// 2. Clear sessionStorage
sessionStorage.clear();

// 3. Clear IndexedDB (if exists)
if (window.indexedDB) {
    indexedDB.databases().then(dbs => {
        dbs.forEach(db => {
            if (db.name && db.name.includes('supabase')) {
                console.log('Deleting IndexedDB:', db.name);
                indexedDB.deleteDatabase(db.name);
            }
        });
    });
}

console.log('✅ Cache cleared! Please refresh the page (F5)');

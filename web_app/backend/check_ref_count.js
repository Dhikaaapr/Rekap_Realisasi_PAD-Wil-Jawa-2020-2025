const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

async function checkRefCount() {
  const { count } = await supabase.from('ref_kategori_pad').select('*', { count: 'exact', head: true });
  fs.writeFileSync('ref_count.txt', "Total: " + count, 'utf8');
}
checkRefCount().catch(console.error);

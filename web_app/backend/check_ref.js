const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

async function checkRef() {
  const codes = ['PAD-PAJAK', 'PAJ-KABKO', 'PAJ-KK-PBBP2', 'PBJT-MAKMIN'];
  const { data } = await supabase.from('ref_kategori_pad').select('kode, parent_kode, tingkat_pemerintahan').in('kode', codes);
  fs.writeFileSync('out_ref.txt', JSON.stringify(data, null, 2), 'utf8');
  console.log("Done");
}
checkRef().catch(console.error);

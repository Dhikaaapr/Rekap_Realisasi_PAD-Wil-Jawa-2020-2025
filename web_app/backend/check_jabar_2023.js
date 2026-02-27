const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

async function checkJabar2023() {
  const { data } = await supabase.from('detail_pad_data')
    .select('kategori_kode, anggaran, realisasi')
    .eq('daerah', 'Prov. Jawa Barat')
    .eq('tahun', 2023);
  
  const out = "Jawa Barat 2023:\n" + JSON.stringify(data, null, 2) + "\n";
  fs.writeFileSync('out_jabar_2023.txt', out, 'utf8');
  console.log("Jabar 2023 rows:", data ? data.length : 0);
}
checkJabar2023().catch(console.error);

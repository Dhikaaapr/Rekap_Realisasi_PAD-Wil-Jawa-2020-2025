const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

async function checkData() {
  const { data: q1 } = await supabase.from('detail_pad_data')
    .select('daerah, tahun, kategori_kode, anggaran, realisasi')
    .eq('daerah', 'Prov. Jawa Barat')
    .eq('tahun', 2024);
  
  const out1 = "Jawa Barat 2024:\n" + JSON.stringify(q1, null, 2) + "\n";

  fs.writeFileSync('out_jabar.txt', out1, 'utf8');
  console.log("Done");
}
checkData().catch(console.error);

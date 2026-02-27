const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

async function checkSidoarjo() {
  const { data } = await supabase.from('detail_pad_data')
    .select('kategori_kode, anggaran, realisasi')
    .eq('daerah', 'Kab. Sidoarjo')
    .eq('tahun', 2024);
  
  const out = "Kab. Sidoarjo 2024:\n" + JSON.stringify(data, null, 2) + "\n";
  fs.writeFileSync('out_sidoarjo.txt', out, 'utf8');
  console.log("Done checking Sidoarjo. Total rows found:", data ? data.length : 0);
}
checkSidoarjo().catch(console.error);

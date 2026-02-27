
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

async function checkDKI2024() {
  const { data, error } = await supabase
    .from('detail_pad_data')
    .select('kategori_kode, realisasi, anggaran, daerah')
    .eq('tahun', 2024)
    .ilike('daerah', 'Prov. DKI Jakarta');

  if (error) {
    fs.writeFileSync('result_dki.txt', 'ERROR: ' + error.message);
    return;
  }

  let output = `COUNT: ${data.length}\n`;
  data.forEach(row => {
    output += `CODE: ${row.kategori_kode} | REAL: ${row.realisasi} | ANG: ${row.anggaran}\n`;
  });
  
  fs.writeFileSync('result_dki.txt', output);
}

checkDKI2024();

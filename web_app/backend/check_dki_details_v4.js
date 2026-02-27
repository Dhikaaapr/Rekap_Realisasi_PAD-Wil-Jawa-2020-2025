
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

async function checkDKI2024() {
  const { data, error } = await supabase
    .from('detail_pad_data')
    .select('kategori_kode, realisasi, anggaran, daerah')
    .eq('tahun', 2024)
    .ilike('daerah', 'Prov. DKI Jakarta');

  if (error) {
    console.log('ERROR:', error.message);
    return;
  }

  console.log('COUNT:', data.length);
  data.forEach(row => {
    console.log(`CODE: ${row.kategori_kode} | REAL: ${row.realisasi} | ANG: ${row.anggaran}`);
  });
}

checkDKI2024();

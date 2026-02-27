
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

async function checkDKI2024() {
  const { data, error } = await supabase
    .from('detail_pad_data')
    .select('kategori_kode, realisasi, anggaran, daerah')
    .eq('tahun', 2024)
    .ilike('daerah', '%Jakarta%');

  if (error) {
    console.log('ERROR:', error.message);
    return;
  }

  console.log('COUNT:', data.length);
  if (data.length > 0) {
    console.log('DISTINCT DAERAH FOUND:', [...new Set(data.map(d => d.daerah))]);
  }
}

checkDKI2024();

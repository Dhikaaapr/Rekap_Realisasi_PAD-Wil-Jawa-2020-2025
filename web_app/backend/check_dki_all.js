
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

async function checkDKIAllYears() {
  const { data, error } = await supabase
    .from('detail_pad_data')
    .select('tahun, kategori_kode, realisasi')
    .ilike('daerah', '%Jakarta%');

  if (error) {
    fs.writeFileSync('dki_all_years.txt', 'ERROR: ' + error.message);
    return;
  }

  const yearlyCounts = data.reduce((acc, row) => {
    acc[row.tahun] = (acc[row.tahun] || 0) + 1;
    return acc;
  }, {});

  fs.writeFileSync('dki_all_years.txt', JSON.stringify(yearlyCounts, null, 2));
}

checkDKIAllYears();

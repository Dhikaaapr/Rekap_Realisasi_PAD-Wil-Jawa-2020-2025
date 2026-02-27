
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

async function checkDKI2024() {
  console.log('--- Checking DKI Jakarta 2024 Details ---');
  
  // 1. Check direct matches for daerah and year
  const { data, error } = await supabase
    .from('detail_pad_data')
    .select('kategori_kode, realisasi, anggaran, daerah')
    .eq('tahun', 2024)
    .ilike('daerah', '%Jakarta%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} rows for DKI Jakarta in 2024.`);
  
  if (data.length > 0) {
    console.log('Sample rows:');
    console.log(data.slice(0, 10));
    
    const totals = data.reduce((acc, row) => ({
      real: acc.real + (Number(row.realisasi) || 0),
      ang: acc.ang + (Number(row.anggaran) || 0)
    }), { real: 0, ang: 0 });
    
    console.log('Total from detail table:', totals);
  } else {
    console.log('No data found in detail_pad_data for DKI Jakarta in 2024.');
    
    // Check if there's ANY data for 2024 to see if the table is populated at all
    const { count, error: countErr } = await supabase
      .from('detail_pad_data')
      .select('*', { count: 'exact', head: true })
      .eq('tahun', 2024);
      
    if (!countErr) {
      console.log(`Total rows in table for year 2024 across ALL regions: ${count}`);
    }
  }
}

checkDKI2024();

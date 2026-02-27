const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

async function checkJabarDetails() {
  const { data } = await supabase.from('detail_pad_data')
    .select('kategori_kode, anggaran, realisasi')
    .eq('daerah', 'Prov. Jawa Barat')
    .eq('tahun', 2024)
    .like('kategori_kode', 'PAJ-PROV%');
  
  console.log("Jabar PAJ-PROV rows:", data ? data.length : 0);
  if (data && data.length > 0) console.log(data);
}
checkJabarDetails().catch(console.error);

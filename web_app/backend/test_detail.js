const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

async function checkData() {
  const { data: q1 } = await supabase.from('detail_pad_data').select('daerah, tahun, kategori_kode, anggaran, realisasi').eq('daerah', 'Prov. Jawa Barat').limit(5);
  const out1 = "Jawa Barat limited:\n" + JSON.stringify(q1, null, 2) + "\n";

  const { data: q2 } = await supabase.from('detail_pad_data').select('daerah, tahun, kategori_kode, anggaran, realisasi').limit(5);
  const out2 = "Any data limited:\n" + JSON.stringify(q2, null, 2) + "\n";
  
  const { count } = await supabase.from('detail_pad_data').select('*', { count: 'exact', head: true });
  const out3 = "Total count: " + count + "\n";

  fs.writeFileSync('out.txt', out1 + out2 + out3, 'utf8');
  console.log("Done");
}
checkData().catch(console.error);

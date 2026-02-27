const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://xerkytrweahuniqrnabi.supabase.co', 'sb_publishable_IhhX55NqvJ7bUIoXG_xxCw_BM66VfG7');

async function check2024() {
  const provList = ['DKI Jakarta', 'Prov. Banten', 'Prov. Jawa Barat', 'Prov. Jawa Tengah', 'Prov. DI Yogyakarta', 'Prov. Jawa Timur'];
  const { data, error } = await sb.from('pad_data').select('daerah, realisasi, anggaran').eq('tahun', 2024).in('daerah', provList);
  
  if (error) {
    console.error(error);
    return;
  }
  
  let totalReal = 0;
  let totalAngg = 0;
  
  data.forEach(d => {
    totalReal += d.realisasi || 0;
    totalAngg += d.anggaran || 0;
    console.log(`${d.daerah}: Realisasi=${d.realisasi}, Anggaran=${d.anggaran}, %=${((d.realisasi/d.anggaran)*100).toFixed(2)}%`);
  });
  
  console.log(`\nTOTAL: Realisasi=${totalReal}, Anggaran=${totalAngg}, %=${((totalReal/totalAngg)*100).toFixed(2)}%`);
}

check2024();

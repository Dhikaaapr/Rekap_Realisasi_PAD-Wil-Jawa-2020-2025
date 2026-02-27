
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

async function checkAll2024() {
  const { data, error } = await supabase
    .from('detail_pad_data')
    .select('daerah')
    .eq('tahun', 2024);

  if (error) {
    fs.writeFileSync('all_2024.txt', 'ERROR: ' + error.message);
    return;
  }

  const distinct = [...new Set(data.map(d => d.daerah))];
  fs.writeFileSync('all_2024.txt', distinct.join('\n'));
}

checkAll2024();

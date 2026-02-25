import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const content = fs.readFileSync(path.join(__dirname, 'src/lib/supabase.js'), 'utf8');
const urlMatch = content.match(/const supabaseUrl = '(.*)'/);
const keyMatch = content.match(/const supabaseAnonKey = '(.*)'/);

if (urlMatch && keyMatch) {
  const url = urlMatch[1];
  const key = keyMatch[1];
  console.log('Connecting to:', url);
  const supabase = createClient(url, key);
  const { data, error } = await supabase.from('ref_kategori_pad').select('nama, kode, kategori_utama');
  if (error) {
    console.error('Supabase Error:', error);
  } else {
    fs.writeFileSync('all_cats.json', JSON.stringify(data, null, 2));
    console.log('Data saved to all_cats.json. Count:', data?.length);
  }
} else {
  console.log('Credentials not found');
}

/**
 * One-time cleanup script for detail_pad_data table.
 * 1. Removes all rows where anggaran=0 AND realisasi=0 (garbage)
 * 2. Aggregates remaining duplicates (same daerah+tahun+kategori_kode)
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://xerkytrweahuniqrnabi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseKey) {
  console.error('ERROR: Set SUPABASE_SERVICE_KEY in .env (needs delete/insert permissions)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchAll(table, selectCols, filters = {}) {
  let allData = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    let q = supabase.from(table).select(selectCols).order('id').range(from, from + pageSize - 1);
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return allData;
}

async function main() {
  console.log('=== DETAIL_PAD_DATA CLEANUP ===');
  console.log('Fetching all rows...');
  
  const allRows = await fetchAll('detail_pad_data', 'id, daerah, tahun, kategori_kode, anggaran, realisasi');
  console.log('Total rows before cleanup:', allRows.length);
  
  // Step 1: Identify zero-value rows
  const zeroRows = allRows.filter(r => (r.anggaran || 0) === 0 && (r.realisasi || 0) === 0);
  const nonZeroRows = allRows.filter(r => (r.anggaran || 0) !== 0 || (r.realisasi || 0) !== 0);
  console.log('Zero-value rows (to delete):', zeroRows.length);
  console.log('Non-zero rows:', nonZeroRows.length);
  
  // Step 2: Find duplicates among non-zero rows
  const grouped = {};
  nonZeroRows.forEach(r => {
    const key = r.daerah + '|' + r.tahun + '|' + r.kategori_kode;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });
  
  const duplicateGroups = Object.entries(grouped).filter(([, entries]) => entries.length > 1);
  console.log('Duplicate groups among non-zero rows:', duplicateGroups.length);
  
  // Show some examples
  duplicateGroups.slice(0, 5).forEach(([key, entries]) => {
    console.log('  DUP:', key);
    entries.forEach(e => console.log('    id:', e.id, 'ang:', e.anggaran, 'real:', e.realisasi));
  });
  
  // Step 3: For duplicates, keep one row with aggregated values, delete the rest
  const idsToDelete = [];
  const rowsToUpdate = [];
  
  duplicateGroups.forEach(([, entries]) => {
    // Sort by realisasi descending - keep the first one as the "winner"
    entries.sort((a, b) => (b.realisasi || 0) - (a.realisasi || 0));
    const keeper = entries[0];
    
    // Sum all values
    let totalAng = 0, totalReal = 0;
    const seen = new Set();
    entries.forEach(e => {
      // Avoid double-counting exact duplicates (same ang AND same real)
      const valKey = e.anggaran + '|' + e.realisasi;
      if (!seen.has(valKey)) {
        totalAng += Number(e.anggaran || 0);
        totalReal += Number(e.realisasi || 0);
        seen.add(valKey);
      }
    });
    
    // Update the keeper with correct totals
    rowsToUpdate.push({ id: keeper.id, anggaran: totalAng, realisasi: totalReal });
    
    // Delete all others
    entries.slice(1).forEach(e => idsToDelete.push(e.id));
  });
  
  // Add zero-value row IDs to delete list
  zeroRows.forEach(r => idsToDelete.push(r.id));
  
  console.log('\n=== CLEANUP PLAN ===');
  console.log('Rows to DELETE:', idsToDelete.length);
  console.log('Rows to UPDATE (aggregate):', rowsToUpdate.length);
  console.log('Expected final row count:', allRows.length - idsToDelete.length);
  
  // Execute cleanup
  if (process.argv.includes('--dry-run')) {
    console.log('\n[DRY RUN] No changes made. Run without --dry-run to execute.');
    return;
  }
  
  console.log('\nExecuting cleanup...');
  
  // Delete in batches of 100
  for (let i = 0; i < idsToDelete.length; i += 100) {
    const batch = idsToDelete.slice(i, i + 100);
    const { error } = await supabase.from('detail_pad_data').delete().in('id', batch);
    if (error) {
      console.error('Delete error at batch', i, ':', error);
      return;
    }
    if ((i + 100) % 1000 === 0 || i + 100 >= idsToDelete.length) {
      console.log('  Deleted', Math.min(i + 100, idsToDelete.length), '/', idsToDelete.length);
    }
  }
  
  // Update aggregated rows
  for (const row of rowsToUpdate) {
    const { error } = await supabase.from('detail_pad_data')
      .update({ anggaran: row.anggaran, realisasi: row.realisasi })
      .eq('id', row.id);
    if (error) {
      console.error('Update error for', row.id, ':', error);
    }
  }
  
  console.log('\n=== CLEANUP COMPLETE ===');
  
  // Verify
  const { count } = await supabase.from('detail_pad_data').select('*', { count: 'exact', head: true });
  console.log('Final row count:', count);
}

main().catch(e => console.error(e));

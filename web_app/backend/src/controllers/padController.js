const supabase = require('../config/supabase');

exports.getAllPAD = async (req, res) => {
  try {
    const { year, region_id } = req.query;
    let query = supabase.from('pad_data').select('*');

    if (year) query = query.eq('tahun', year);
    if (region_id) query = query.eq('daerah', region_id); // Assuming daerah stores region name/id

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDetailedPAD = async (req, res) => {
  try {
    const { year, region } = req.query;
    let query = supabase.from('detail_pad_data')
      .select('*, ref_kategori_pad(nama, kategori_utama, sub_kategori)');

    if (year) query = query.eq('tahun', year);
    if (region) query = query.eq('daerah', region);

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Summary stats
exports.getSummaryStats = async (req, res) => {
  try {
    const { year } = req.query;
    let query = supabase.from('pad_data').select('pajak_realisasi, retribusi_realisasi, lain_pad_realisasi, pengelolaan_realisasi');
    
    if (year) query = query.eq('tahun', year);

    const { data, error } = await query;
    if (error) throw error;

    const total = data.reduce((acc, curr) => {
      return acc + (curr.pajak_realisasi || 0) + (curr.retribusi_realisasi || 0) + (curr.lain_pad_realisasi || 0) + (curr.pengelolaan_realisasi || 0);
    }, 0);

    res.json({ total_realisasi: total, count: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Batch import (Upsert-like behavior)
exports.batchImport = async (req, res) => {
  try {
    const { records } = req.body;
    
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'records array is required' });
    }

    console.log(`[Backend] Processing batch of ${records.length} records`);

    const results = [];
    for (const record of records) {
      // Check if exists
      const { data: existing } = await supabase
        .from('pad_data')
        .select('id')
        .eq('tahun', record.tahun)
        .eq('daerah', record.daerah)
        .maybeSingle();

      if (existing) {
        const { data: updated, error } = await supabase
          .from('pad_data')
          .update(record)
          .eq('id', existing.id)
          .select();
        if (error) throw error;
        results.push(updated[0]);
      } else {
        const { data: inserted, error } = await supabase
          .from('pad_data')
          .insert(record)
          .select();
        if (error) throw error;
        results.push(inserted[0]);
      }
    }
    
    res.json({ 
      success: true, 
      count: results.length,
      message: `Successfully processed ${results.length} records` 
    });
  } catch (error) {
    console.error('[Backend] Batch import error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Batch import for detailed data
exports.batchImportDetail = async (req, res) => {
  try {
    const { records } = req.body;
    
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'records array is required' });
    }

    console.log(`[Backend] Received detail batch of ${records.length} records`);

    // 1. Resolve pad_data_id for each unique (daerah, tahun)
    const uniquePairs = Array.from(new Set(records.map(r => `${r.daerah}|${r.tahun}`)));
    const idMap = {};

    for (const pair of uniquePairs) {
      const [daerah, tahun] = pair.split('|');
      const { data } = await supabase
        .from('pad_data')
        .select('id')
        .eq('daerah', daerah)
        .eq('tahun', parseInt(tahun))
        .single();
      
      if (data) idMap[pair] = data.id;
    }

    // 2. Prepare records
    const recordsWithId = records.map(r => ({
      ...r,
      pad_data_id: idMap[`${r.daerah}|${r.tahun}`] || r.pad_data_id,
      anggaran: isFinite(r.anggaran) ? r.anggaran : 0,
      realisasi: isFinite(r.realisasi) ? r.realisasi : 0
    })).filter(r => r.pad_data_id); // Only insert if we have a parent

    console.log(`[Backend] Resolved IDs. Ready to insert ${recordsWithId.length} records`);

    if (recordsWithId.length === 0) {
      return res.status(400).json({ error: 'No valid pad_data_id found for these regions/years' });
    }

    const { data, error } = await supabase
      .from('detail_pad_data')
      .insert(recordsWithId)
      .select();

    if (error) throw error;
    
    res.json({ 
      success: true, 
      count: data.length,
      message: `Successfully imported ${data.length} detail records` 
    });
  } catch (error) {
    console.error('[Backend] Batch import detail error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Clear details for a specific region/year
exports.clearDetails = async (req, res) => {
  try {
    const { daerah, tahun } = req.body;
    if (!daerah || !tahun) return res.status(400).json({ error: 'daerah and tahun required' });

    console.log(`[Backend] Clearing details for ${daerah} (${tahun})`);
    
    // Find pad_id
    const { data: pad } = await supabase.from('pad_data').select('id').eq('daerah', daerah).eq('tahun', tahun).maybeSingle();
    
    if (pad) {
      const { error } = await supabase.from('detail_pad_data').delete().eq('pad_data_id', pad.id);
      if (error) throw error;
    }

    res.json({ success: true, message: `Cleared details for ${daerah} (${tahun})` });
  } catch (error) {
    console.error('[Backend] Clear details error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

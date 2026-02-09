import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:excel/excel.dart' as excel_pkg;
import 'package:path/path.dart' as p;

/// Screen untuk import/update data PAD ke Firebase secara dynamic
/// Mendukung Format CSV Clean (Header Lengkap) maupun Format Excel Export (Header Merged)
class ImportDataScreen extends StatefulWidget {
  const ImportDataScreen({super.key});

  @override
  State<ImportDataScreen> createState() => _ImportDataScreenState();
}

class _ImportDataScreenState extends State<ImportDataScreen> {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  static const String _collection = 'pad_data';

  bool _isLoading = false;
  bool _isAnalyzing = false;
  String? _selectedFileName;
  int _targetYear = 2025; // Default year
  
  // Parsed data grouped by year: { 2024: [record1, record2], 2025: [...] }
  Map<int, List<Map<String, dynamic>>> _parsedData = {};
  
  // Progress tracking
  List<String> _logs = [];
  int _progress = 0;
  int _total = 0;

  void _log(String message) {
    if (!mounted) return;
    setState(() {
      _logs.add(message);
    });
    debugPrint(message);
  }

  void _resetState() {
    setState(() {
      _parsedData = {};
      _logs = [];
      _progress = 0;
      _total = 0;
      _isAnalyzing = false;
    });
  }

  /// 1. Pick and Analyze CSV File
  Future<void> _pickAndAnalyzeFile() async {
    _resetState();
    
    try {
      // Pick file
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['csv', 'xlsx', 'xls'],
      );

      if (result != null && result.files.single.path != null) {
        final path = result.files.single.path!;
        final file = File(path);
        final ext = p.extension(path).toLowerCase();
        
        setState(() {
          _selectedFileName = result.files.single.name;
          _isAnalyzing = true;
        });

        _log('📂 File dipilih: $_selectedFileName');
        _log('🎯 Target Tahun: $_targetYear');
        _log('🔍 Menganalisis isi file...');
        
        if (ext == '.csv') {
          await _analyzeCSV(file);
        } else {
          await _analyzeExcel(file);
        }
        
        setState(() => _isAnalyzing = false);
      } else {
        _log('⚠️ Pemilihan file dibatalkan.');
      }
    } catch (e) {
      _log('❌ ERROR saat memilih file: $e');
      setState(() => _isAnalyzing = false);
    }
  }

  /// 2. Parse CSV content
  Future<void> _analyzeCSV(File file) async {
    try {
      final lines = await file.readAsLines();
      _log('Total baris di file: ${lines.length}');
      
      if (lines.isEmpty) {
        _log('❌ File kosong!');
        return;
      }

      // --- SMART HEADER DETECTION ---
      int headerRowIndex = -1;
      String delimiter = ',';
      
      final keywords = ['daerah', 'kabupaten', 'kota', 'nama', 'pajak', 'no.'];
      
      for (int i = 0; i < lines.length; i++) {
        final lineLower = lines[i].toLowerCase();
        int matches = 0;
        for (var k in keywords) {
          if (lineLower.contains(k)) matches++;
        }
        
        if (matches >= 1) {
          headerRowIndex = i;
          if (lines[i].split(';').length > lines[i].split(',').length) {
            delimiter = ';';
          }
          break;
        }
      }

      headerRowIndex = headerRowIndex == -1 ? 0 : headerRowIndex;
      final headers = _parseCSVLine(lines[headerRowIndex], delimiter)
          .map((e) => e.trim().toUpperCase())
          .toList();
      
      Map<String, int> colMap = _mapHeaders(headers);
      _processRows(lines.sublist(headerRowIndex + 1), colMap, delimiter: delimiter);
    } catch (e) {
      _log('❌ ERROR saat analisis CSV: $e');
    }
  }

  /// 2b. Parse Excel content
  Future<void> _analyzeExcel(File file) async {
    try {
      var bytes = file.readAsBytesSync();
      var excel = excel_pkg.Excel.decodeBytes(bytes);
      
      // Use first sheet
      var sheetName = excel.tables.keys.first;
      var sheet = excel.tables[sheetName]!;
      _log('Sheet: $sheetName, Baris: ${sheet.maxRows}');

      // Find header row
      int headerRowIndex = -1;
      final keywords = ['daerah', 'kabupaten', 'kota', 'nama', 'pajak'];
      
      for (int i = 0; i < 10 && i < sheet.maxRows; i++) {
        final row = sheet.rows[i];
        int matches = 0;
        for (var cell in row) {
          final val = cell?.value?.toString().toLowerCase() ?? '';
          if (keywords.any((k) => val.contains(k))) matches++;
        }
        if (matches >= 1) {
          headerRowIndex = i;
          break;
        }
      }

      headerRowIndex = headerRowIndex == -1 ? 0 : headerRowIndex;
      final headerRow = sheet.rows[headerRowIndex];
      final headers = headerRow.map((cell) => cell?.value?.toString().trim().toUpperCase() ?? '').toList();
      
      Map<String, int> colMap = _mapHeaders(headers);
      
      List<List<String>> listRows = [];
      for (int i = headerRowIndex + 1; i < sheet.maxRows; i++) {
        listRows.add(sheet.rows[i].map((c) => c?.value?.toString() ?? '').toList());
      }
      
      _processRows(listRows, colMap);
    } catch (e) {
      _log('❌ ERROR saat analisis Excel: $e');
    }
  }

  Map<String, int> _mapHeaders(List<String> headers) {
    Map<String, int> colMap = {};
    
    void mapCol(String key, List<String> possibilities) {
      for (int i = 0; i < headers.length; i++) {
        if (possibilities.any((p) => headers[i].contains(p))) {
          if (!colMap.containsKey(key)) colMap[key] = i;
        }
      }
    }

    mapCol('DAERAH', ['DAERAH', 'NAMA PEMDA', 'KABUPATEN/KOTA']);
    mapCol('NO', ['NOMOR_URUT', 'NO.', 'NO']);
    mapCol('P_ANGG', ['PAJAK_ANGGARAN', 'PAJAK DAERAH_ANGGARAN', 'PENDAPATAN PAJAK_ANGGARAN']);
    mapCol('P_REAL', ['PAJAK_REALISASI', 'PAJAK DAERAH_REALISASI', 'PENDAPATAN PAJAK_REALISASI']);
    mapCol('R_ANGG', ['RETRIBUSI_ANGGARAN', 'RETRIBUSI DAERAH_ANGGARAN']);
    mapCol('R_REAL', ['RETRIBUSI_REALISASI', 'RETRIBUSI DAERAH_REALISASI']);
    mapCol('K_ANGG', ['KEKAYAAN_ANGGARAN', 'PENGELOLAAN_ANGGARAN', 'HASIL PENGELOLAAN_ANGGARAN']);
    mapCol('K_REAL', ['KEKAYAAN_REALISASI', 'PENGELOLAAN_REALISASI', 'HASIL PENGELOLAAN_REALISASI']);
    mapCol('L_ANGG', ['LAIN_ANGGARAN', 'LAIN-LAIN_ANGGARAN', 'LAIN PAD_ANGGARAN']);
    mapCol('L_REAL', ['LAIN_REALISASI', 'LAIN-LAIN_REALISASI', 'LAIN PAD_REALISASI']);

    // Fallback if not mapping found
    if (!colMap.containsKey('DAERAH')) {
      int dIdx = headers.indexWhere((h) => h.contains('DAERAH'));
      colMap['DAERAH'] = dIdx != -1 ? dIdx : 1;
    }
    
    return colMap;
  }

  void _processRows(List<dynamic> rows, Map<String, int> colMap, {String? delimiter}) {
    Map<int, List<Map<String, dynamic>>> groupedData = {};
    int totalRecords = 0;

    for (var rawRow in rows) {
      List<String> values = [];
      if (rawRow is String) {
        values = _parseCSVLine(rawRow, delimiter ?? ',');
      } else if (rawRow is List<String>) {
        values = rawRow;
      }

      if (values.isEmpty) continue;
      
      // Filter out empty rows or summary rows
      String daerahRaw = values[colMap['DAERAH'] ?? 0].trim();
      if (daerahRaw.isEmpty || daerahRaw.toLowerCase().contains('jumlah') || daerahRaw.toLowerCase().contains('total')) {
        continue;
      }

      double getVal(String key, {int? offset}) {
        int? idx = colMap[key];
        if (idx == null && offset != null) idx = (colMap['DAERAH'] ?? 0) + offset;
        if (idx != null && idx < values.length) {
          return _parseNumber(values[idx]);
        }
        return 0.0;
      }

      final record = {
        'tahun': _targetYear,
        'nomorUrut': colMap['NO'] != null && colMap['NO']! < values.length ? values[colMap['NO']!].trim() : '',
        'daerah': daerahRaw,
        'namaClean': _cleanName(daerahRaw),
        'tipe': _determineType(daerahRaw),
        
        // Base index is the region name column
        // Standard report format: Name, P_Angg, P_Real, P_%, R_Angg, R_Real, R_%, ...
        'pajakAnggaran': getVal('P_ANGG', offset: 1),
        'pajakRealisasi': getVal('P_REAL', offset: 2),
        
        'retribusiAnggaran': getVal('R_ANGG', offset: 4),
        'retribusiRealisasi': getVal('R_REAL', offset: 5),
        
        'pengelolaanAnggaran': getVal('K_ANGG', offset: 7),
        'pengelolaanRealisasi': getVal('K_REAL', offset: 8),
        
        'lainPadAnggaran': getVal('L_ANGG', offset: 10),
        'lainPadRealisasi': getVal('L_REAL', offset: 11),
        
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      };

      if (!groupedData.containsKey(_targetYear)) groupedData[_targetYear] = [];
      groupedData[_targetYear]!.add(record);
      totalRecords++;
    }

    setState(() {
      _parsedData = groupedData;
      _total = totalRecords;
    });
    
    if (totalRecords > 0) {
      _log('✅ Berhasil membersihkan $totalRecords data.');
    } else {
      _log('⚠️ Tidak ada data valid yang bisa diambil.');
    }
  }

  /// 3. Upload Data (Delete existing -> Upload new)
  Future<void> _uploadData() async {
    if (_parsedData.isEmpty) return;
    
    // Safety check
    if (!_parsedData.containsKey(_targetYear)) {
       // Should not happen with new logic, but safe guard
       _log('❌ Error: Data tidak sesuai target tahun.');
       return;
    }

    setState(() => _isLoading = true);
    
    try {
      _log('\n🚀 MEMULAI UPLOAD UNTUK TAHUN $_targetYear...');
      
      int totalUploaded = 0;
      final year = _targetYear;
      final records = _parsedData[year]!;
        
      // Step A: Delete existing data for this year
      _log('   🗑️ Menghapus data LAMA tahun $year di database...');
      
      final existingDocs = await _db
          .collection(_collection)
          .where('tahun', isEqualTo: year)
          .get();
      
      if (existingDocs.docs.isNotEmpty) {
        final batchDelete = _db.batch();
        int deleteCount = 0;
        for (var doc in existingDocs.docs) {
          batchDelete.delete(doc.reference);
          deleteCount++;
          if (deleteCount % 450 == 0) { // Safety buffer below 500
             await batchDelete.commit();
          }
        }
        await batchDelete.commit(); 
        _log('   ✅ Terhapus: $deleteCount data lama.');
      } else {
        _log('   ℹ️ Tidak ada data lama untuk tahun $year.');
      }

      // Step B: Upload new data in batches
      _log('   🔥 Mengupload data BARU...');
      const batchSize = 400; // Safe limit
      
      for (int i = 0; i < records.length; i += batchSize) {
        final batch = _db.batch();
        final end = (i + batchSize < records.length) ? i + batchSize : records.length;
        
        for (int j = i; j < end; j++) {
          final docRef = _db.collection(_collection).doc();
          batch.set(docRef, records[j]);
        }
        
        await batch.commit();
        
        totalUploaded += (end - i);
        setState(() => _progress = totalUploaded);
        
        if (totalUploaded % 100 == 0 || totalUploaded == _total) {
           _log('   ⏳ Progress: $totalUploaded / $_total');
        }
      }

      _log('\n🎉 SUKSES! Target Tercapai.');
      _log('Data Tahun $year telah diperbarui ($totalUploaded data).');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('✅ Berhasil update data $_targetYear!'), backgroundColor: Colors.green),
        );
      }

    } catch (e) {
      _log('❌ ERROR saat upload: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  /// Helper: Parse CSV line with quote handling
  List<String> _parseCSVLine(String line, String delimiter) {
    List<String> result = [];
    bool inQuotes = false;
    StringBuffer current = StringBuffer();

    for (int i = 0; i < line.length; i++) {
      final char = line[i];
      if (char == '"') {
        inQuotes = !inQuotes;
      } else if (char == delimiter && !inQuotes) {
        result.add(current.toString());
        current.clear();
      } else {
        current.write(char);
      }
    }
    result.add(current.toString());
    return result;
  }

  double _parseNumber(String? value) {
    if (value == null || value.isEmpty) return 0.0;
    try {
      String clean = value.replaceAll(RegExp(r'[Rp\s]'), '');
      
      // Auto-detect format Indo (dot thousand) vs US (comma thousand)
      if (clean.contains('.') && clean.contains(',')) {
         clean = clean.replaceAll('.', '').replaceAll(',', '.');
      } else if (clean.contains('.') && !clean.contains(',')) {
         if (clean.indexOf('.') != clean.lastIndexOf('.')) {
            // Multiple dots => thousand separator
            clean = clean.replaceAll('.', '');
         }
      } else if (clean.contains(',') && !clean.contains('.')) {
         // Comma likely thousand separator in US format
         clean = clean.replaceAll(',', '');
      }

      return double.tryParse(clean) ?? 
             double.parse(value.replaceAll(RegExp(r'[^0-9\.-]'), ''));
             
    } catch (e) {
      return 0.0;
    }
  }

  String _determineType(String daerah) {
    final lower = daerah.toLowerCase();
    if (lower.contains('prov.') || lower.contains('provinsi')) return 'Provinsi';
    if (lower.startsWith('kota ')) return 'Kota';
    return 'Kabupaten';
  }

  String _cleanName(String daerah) {
    String name = daerah.trim();
    // Prefix cleaning (handle both Lower and Upper Case)
    final prefixes = [
      'Prov. ', 'PROV. ', 
      'Kab. ', 'KAB. ', 
      'Kota ', 'KOTA ', 
      'DI ', 'DKI ', 
      'KABUPATEN ', 'PROVINSI '
    ];
    
    for (var prefix in prefixes) {
      if (name.toUpperCase().startsWith(prefix.toUpperCase())) {
        name = name.substring(prefix.length).trim();
        break;
      }
    }
    return name;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Import Data (Excel/CSV)'),
        backgroundColor: const Color(0xFF1A237E),
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Control Card
            Card(
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '1. Pilih Tahun Data',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<int>(
                          value: _targetYear,
                          isExpanded: true,
                          items: [2021, 2022, 2023, 2024, 2025, 2026].map((year) {
                            return DropdownMenuItem<int>(
                              value: year,
                              child: Text('Tahun $year'),
                            );
                          }).toList(),
                          onChanged: (val) {
                             setState(() {
                               _targetYear = val!;
                               _parsedData = {}; // Reset data if year changes
                               _logs = [];
                             });
                          },
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 16),
                    const Text(
                      '2. Pilih File (Excel/CSV)',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
                    ),
                    const SizedBox(height: 4),
                     const Text(
                      'Mendukung format .xlsx, .xls, dan .csv',
                      style: TextStyle(fontSize: 12, color: Colors.grey, fontStyle: FontStyle.italic),
                    ),
                    const SizedBox(height: 8),

                    if (_selectedFileName != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.blue.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: Colors.blue),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.insert_drive_file, color: Colors.blue, size: 20),
                            const SizedBox(width: 8),
                            Flexible(child: Text(_selectedFileName!, style: const TextStyle(fontWeight: FontWeight.bold))),
                          ],
                        ),
                      ),
                    
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _isLoading || _isAnalyzing ? null : _pickAndAnalyzeFile,
                            icon: _isAnalyzing 
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) 
                                : const Icon(Icons.folder_open),
                            label: Text(_isAnalyzing ? 'Analyzing...' : 'Pilih File'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 16),
                     const Text(
                      '3. Konfirmasi & Upload',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
                    ),
                    const SizedBox(height: 8),
                    
                    if (_parsedData.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text(
                        '🔍 Preview Data (Hanya 3 pertama):',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey[700]),
                      ),
                      const SizedBox(height: 8),
                      _buildPreviewTable(),
                      const SizedBox(height: 16),
                      Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.orange.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: Colors.orange),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.warning_amber, color: Colors.orange),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Siap MENGGANTI data tahun $_targetYear?\n(${_parsedData[_targetYear]?.length} data akan dikirim)',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.deepOrange, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: (_parsedData.isEmpty || _isLoading) ? null : _uploadData,
                        icon: _isLoading 
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) 
                          : const Icon(Icons.cloud_upload),
                        label: Text(_isLoading ? 'Sedang Mengupload...' : 'KIRIM DATA SEKARANG'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green[700],
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),

                    if (_isLoading && _total > 0) ...[
                      const SizedBox(height: 16),
                      LinearProgressIndicator(
                        value: _progress / _total,
                        backgroundColor: Colors.grey[300],
                        valueColor: const AlwaysStoppedAnimation<Color>(Colors.green),
                      ),
                      const SizedBox(height: 4),
                      Text('Progress: $_progress / $_total', textAlign: TextAlign.center),
                    ],
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            const Text('Log Output:', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            // Logs
            Expanded(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: SingleChildScrollView(
                  reverse: true,
                  child: Text(
                    _logs.join('\n'),
                    style: const TextStyle(
                      color: Colors.greenAccent,
                      fontFamily: 'monospace',
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 100), // Space for floating nav bar
          ],
        ),
      ),
    );
  }

  Widget _buildPreviewTable() {
    final yearData = _parsedData[_targetYear] ?? [];
    if (yearData.isEmpty) return const SizedBox.shrink();
    
    final previewData = yearData.take(3).toList();
    
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowHeight: 30,
          dataRowMinHeight: 30,
          dataRowMaxHeight: 40,
          columnSpacing: 16,
          columns: const [
            DataColumn(label: Text('Daerah', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold))),
            DataColumn(label: Text('Pajak Angg', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold))),
            DataColumn(label: Text('Retribusi Angg', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold))),
          ],
          rows: previewData.map((d) {
            return DataRow(cells: [
              DataCell(Text(d['namaClean'].toString(), style: const TextStyle(fontSize: 10))),
              DataCell(Text(_formatShort(d['pajakAnggaran']), style: const TextStyle(fontSize: 10))),
              DataCell(Text(_formatShort(d['retribusiAnggaran']), style: const TextStyle(fontSize: 10))),
            ]);
          }).toList(),
        ),
      ),
    );
  }

  String _formatShort(dynamic val) {
    if (val == null) return '0';
    double d = val is double ? val : (double.tryParse(val.toString()) ?? 0.0);
    if (d >= 1000000000000) return '${(d / 1000000000000).toStringAsFixed(1)}T';
    if (d >= 1000000000) return '${(d / 1000000000).toStringAsFixed(1)}M';
    if (d >= 1000000) return '${(d / 1000000).toStringAsFixed(0)}Jt';
    return d.toStringAsFixed(0);
  }
}

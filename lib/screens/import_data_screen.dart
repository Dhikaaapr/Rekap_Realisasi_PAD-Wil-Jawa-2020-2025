import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:cloud_firestore/cloud_firestore.dart';

/// Screen untuk import/update data 2025 ke Firebase
/// Akses dari dashboard atau langsung navigate ke screen ini
class ImportDataScreen extends StatefulWidget {
  const ImportDataScreen({super.key});

  @override
  State<ImportDataScreen> createState() => _ImportDataScreenState();
}

class _ImportDataScreenState extends State<ImportDataScreen> {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  static const String _collection = 'pad_data';

  bool _isLoading = false;
  final List<String> _logs = [];
  int _progress = 0;
  int _total = 0;

  void _log(String message) {
    setState(() {
      _logs.add(message);
    });
    debugPrint(message);
  }

  Future<void> _update2025Data() async {
    setState(() {
      _isLoading = true;
      _logs.clear();
      _progress = 0;
      _total = 0;
    });

    try {
      _log('📖 Membaca file CSV...');
      
      // Read CSV from assets
      final csvContent = await rootBundle.loadString('assets/datarekap_clean.csv');
      final lines = csvContent.split('\n');
      
      _log('Total baris di CSV: ${lines.length}');

      // Parse header
      final headers = lines[0].split(',');
      _log('Headers: ${headers.join(', ')}');

      // Filter data 2025 only
      List<Map<String, dynamic>> data2025 = [];

      for (int i = 1; i < lines.length; i++) {
        if (lines[i].trim().isEmpty) continue;
        
        final values = _parseCSVLine(lines[i]);
        if (values.length < 11) continue;

        final tahun = int.tryParse(values[0]) ?? 0;
        if (tahun != 2025) continue;

        final daerah = values[2].trim();
        
        data2025.add({
          'tahun': 2025,
          'daerah': daerah,
          'namaClean': _cleanName(daerah),
          'tipe': _determineType(daerah),
          'pajak': {
            'anggaran': _parseNumber(values[3]),
            'realisasi': _parseNumber(values[4]),
          },
          'retribusi': {
            'anggaran': _parseNumber(values[5]),
            'realisasi': _parseNumber(values[6]),
          },
          'kekayaan': {
            'anggaran': _parseNumber(values[7]),
            'realisasi': _parseNumber(values[8]),
          },
          'lainLain': {
            'anggaran': _parseNumber(values[9]),
            'realisasi': _parseNumber(values[10]),
          },
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }

      setState(() => _total = data2025.length);
      _log('\n📊 Data 2025 yang akan diupload: ${data2025.length} records');

      // Count by type
      int provinsi = data2025.where((d) => d['tipe'] == 'Provinsi').length;
      int kabupaten = data2025.where((d) => d['tipe'] == 'Kabupaten').length;
      int kota = data2025.where((d) => d['tipe'] == 'Kota').length;
      _log('   Provinsi: $provinsi');
      _log('   Kabupaten: $kabupaten');
      _log('   Kota: $kota');

      // Step 1: Delete existing 2025 data
      _log('\n🗑️  Menghapus data 2025 yang lama...');
      final existingDocs = await _db
          .collection(_collection)
          .where('tahun', isEqualTo: 2025)
          .get();

      int deleted = 0;
      for (var doc in existingDocs.docs) {
        await doc.reference.delete();
        deleted++;
      }
      _log('   ✅ Dihapus: $deleted records lama');

      // Step 2: Upload new 2025 data
      _log('\n🔥 Mengupload data 2025 terbaru...');
      
      // Batch upload (max 500 per batch)
      const batchSize = 500;
      int uploaded = 0;

      for (int i = 0; i < data2025.length; i += batchSize) {
        final batch = _db.batch();
        final end = (i + batchSize < data2025.length) ? i + batchSize : data2025.length;

        for (int j = i; j < end; j++) {
          final docRef = _db.collection(_collection).doc();
          batch.set(docRef, data2025[j]);
        }

        await batch.commit();
        uploaded += (end - i);
        setState(() => _progress = uploaded);
        _log('   Progress: $uploaded / ${data2025.length}');
      }

      _log('\n✅ SELESAI!');
      _log('Data 2025 berhasil diupdate: $uploaded records');
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Berhasil update $uploaded data 2025!'),
            backgroundColor: Colors.green,
          ),
        );
      }

    } catch (e) {
      _log('❌ ERROR: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  /// Parse CSV line handling quoted values
  List<String> _parseCSVLine(String line) {
    List<String> result = [];
    bool inQuotes = false;
    StringBuffer current = StringBuffer();

    for (int i = 0; i < line.length; i++) {
      final char = line[i];
      if (char == '"') {
        inQuotes = !inQuotes;
      } else if (char == ',' && !inQuotes) {
        result.add(current.toString());
        current.clear();
      } else {
        current.write(char);
      }
    }
    result.add(current.toString());

    return result;
  }

  /// Parse number from string
  double _parseNumber(String? value) {
    if (value == null || value.isEmpty) return 0.0;
    try {
      return double.parse(value.replaceAll(',', '').trim());
    } catch (e) {
      return 0.0;
    }
  }

  /// Determine type (Provinsi/Kota/Kabupaten)
  String _determineType(String daerah) {
    final lower = daerah.toLowerCase();
    if (lower.contains('prov.') || lower.contains('provinsi')) {
      return 'Provinsi';
    } else if (lower.startsWith('kota ')) {
      return 'Kota';
    }
    return 'Kabupaten';
  }

  /// Clean name without prefix
  String _cleanName(String daerah) {
    String name = daerah;
    const prefixes = ['Prov. ', 'Kab. ', 'Kota ', 'DI ', 'DKI '];
    for (var prefix in prefixes) {
      if (name.startsWith(prefix)) {
        name = name.substring(prefix.length);
        break;
      }
    }
    return name;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Import Data 2025'),
        backgroundColor: const Color(0xFF1A237E),
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.warning_amber, color: Colors.orange, size: 28),
                        SizedBox(width: 12),
                        Text(
                          'Update Data Realisasi 2025',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Proses ini akan:\n'
                      '1. MENGHAPUS semua data 2025 yang ada di Firebase\n'
                      '2. Mengupload data 2025 terbaru dari file CSV\n\n'
                      'Pastikan file datarekap_clean.csv sudah diupdate dengan data terbaru.',
                      style: TextStyle(height: 1.5),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _isLoading ? null : _update2025Data,
                        icon: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.cloud_upload),
                        label: Text(_isLoading ? 'Memproses...' : 'Update Data 2025'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1A237E),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Progress indicator
            if (_isLoading && _total > 0) ...[
              LinearProgressIndicator(
                value: _progress / _total,
                backgroundColor: Colors.grey[300],
                valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF1A237E)),
              ),
              const SizedBox(height: 8),
              Text(
                'Progress: $_progress / $_total',
                style: TextStyle(color: Colors.grey[600]),
              ),
              const SizedBox(height: 16),
            ],
            
            // Log output
            const Text(
              'Log Output:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[900],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: SingleChildScrollView(
                  child: Text(
                    _logs.isEmpty ? 'Belum ada log...' : _logs.join('\n'),
                    style: const TextStyle(
                      color: Colors.greenAccent,
                      fontFamily: 'monospace',
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

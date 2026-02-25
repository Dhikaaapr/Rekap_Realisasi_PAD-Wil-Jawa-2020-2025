// ignore_for_file: avoid_print

import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

/// Script untuk update data realisasi 2025 di Firebase
/// Jalankan dengan: dart run scripts/update_2025_data.dart

void main() async {
  print('=' * 60);
  print('UPDATE DATA REALISASI 2025 KE FIREBASE');
  print('=' * 60);

  // Initialize Firebase
  await Firebase.initializeApp();
  final db = FirebaseFirestore.instance;
  const collection = 'pad_data';

  // Read CSV file
  final csvFile = File('assets/datarekap_2025_clean.csv');
  if (!csvFile.existsSync()) {
    print('❌ ERROR: File assets/datarekap_2025_clean.csv tidak ditemukan!');
    exit(1);
  }

  final lines = csvFile.readAsLinesSync();
  print('📖 Total baris di CSV: ${lines.length}');

  // Filter data 2025
  List<Map<String, dynamic>> data2025 = [];

  for (int i = 1; i < lines.length; i++) {
    final values = _parseCSVLine(lines[i]);
    if (values.length < 10) continue;

    final daerah = values[2].trim();
    
    data2025.add({
      'tahun': 2025,
      'nomorUrut': values[1].trim(),
      'daerah': daerah,
      'namaClean': _cleanName(daerah),
      'tipe': _determineType(daerah),
      'pajakAnggaran': _parseNumber(values[3]),
      'pajakRealisasi': _parseNumber(values[4]),
      'retribusiAnggaran': _parseNumber(values[5]),
      'retribusiRealisasi': _parseNumber(values[6]),
      'pengelolaanAnggaran': _parseNumber(values[7]),
      'pengelolaanRealisasi': _parseNumber(values[8]),
      'lainPadAnggaran': _parseNumber(values[9]),
      'lainPadRealisasi': _parseNumber(values[10]),
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  print('\n📊 Data 2025 yang akan diupload: ${data2025.length} records');

  // Count by type
  int provinsi = data2025.where((d) => d['tipe'] == 'Provinsi').length;
  int kabupaten = data2025.where((d) => d['tipe'] == 'Kabupaten').length;
  int kota = data2025.where((d) => d['tipe'] == 'Kota').length;
  print('   - Provinsi: $provinsi');
  print('   - Kabupaten: $kabupaten');
  print('   - Kota: $kota');

  // Step 1: Delete existing 2025 data
  print('\n🗑️  Menghapus data 2025 yang lama...');
  final existingDocs = await db
      .collection(collection)
      .where('tahun', isEqualTo: 2025)
      .get();

  int deleted = 0;
  for (var doc in existingDocs.docs) {
    await doc.reference.delete();
    deleted++;
  }
  print('   ✅ Dihapus: $deleted records lama');

  // Step 2: Upload new 2025 data
  print('\n🔥 Mengupload data 2025 terbaru...');
  
  // Batch upload (max 500 per batch)
  const batchSize = 500;
  int uploaded = 0;

  for (int i = 0; i < data2025.length; i += batchSize) {
    final batch = db.batch();
    final end = (i + batchSize < data2025.length) ? i + batchSize : data2025.length;

    for (int j = i; j < end; j++) {
      final docRef = db.collection(collection).doc();
      batch.set(docRef, data2025[j]);
    }

    await batch.commit();
    uploaded += (end - i);
    print('   Progress: $uploaded / ${data2025.length}');
  }

  print('\n✅ SELESAI!');
  print('   Data 2025 berhasil diupdate: $uploaded records');
  
  exit(0);
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

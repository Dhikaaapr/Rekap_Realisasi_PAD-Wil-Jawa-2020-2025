import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/pad_model.dart';

class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final String _collection = 'pad_data';

  /// Stream all PAD data with real-time updates
  Stream<List<PADData>> streamAllData({int? tahun, String? daerah}) {
    Query query = _firestore.collection(_collection);

    // Apply filters
    if (tahun != null) {
      query = query.where('tahun', isEqualTo: tahun);
    }
    if (daerah != null && daerah.isNotEmpty) {
      query = query.where('daerah', isEqualTo: daerah);
    }

    // Note: Removed server-side properties ordering to avoid "Composite Index" requirements errors.
    // We will sort client-side instead.

    return query.snapshots().map((snapshot) {
      var list = snapshot.docs.map((doc) {
        return PADData.fromFirestore(doc.data() as Map<String, dynamic>, doc.id);
      }).toList();

      // Client-side sorting
      list.sort((a, b) {
        int yearComp = b.tahun.compareTo(a.tahun); // Descending year
        if (yearComp != 0) return yearComp;
        return a.daerah.compareTo(b.daerah); // Ascending daerah
      });

      return list;
    });
  }

  /// Get grouped data by daerah
  Future<List<DaerahDataGroup>> getGroupedData() async {
    try {
      debugPrint('[FirestoreService] Loading grouped data...');
      
      final snapshot = await _firestore
          .collection(_collection)
          .orderBy('tahun')
          .get();

      // Group by daerah
      Map<String, List<PADData>> grouped = {};
      for (var doc in snapshot.docs) {
        final data = PADData.fromFirestore(
          doc.data() as Map<String, dynamic>,
          doc.id,
        );
        
        if (!grouped.containsKey(data.daerah)) {
          grouped[data.daerah] = [];
        }
        grouped[data.daerah]!.add(data);
      }

      // Convert to DaerahDataGroup
      List<DaerahDataGroup> result = [];
      for (var entry in grouped.entries) {
        final first = entry.value.first;
        result.add(DaerahDataGroup(
          daerah: entry.key,
          namaClean: first.namaClean,
          tipe: first.tipe,
          dataPerTahun: entry.value,
        ));
      }

      // Sort
      result.sort((a, b) {
        if (a.tipe == 'Provinsi' && b.tipe != 'Provinsi') return -1;
        if (a.tipe != 'Provinsi' && b.tipe == 'Provinsi') return 1;
        return a.namaClean.compareTo(b.namaClean);
      });

      debugPrint('[FirestoreService] ✅ Loaded ${result.length} regions');
      return result;
      
    } catch (e) {
      debugPrint('[FirestoreService] ❌ Error: $e');
      rethrow;
    }
  }

  /// Stream grouped data with real-time updates
  Stream<List<DaerahDataGroup>> streamGroupedData() {
    return _firestore
        .collection(_collection)
        .orderBy('tahun')
        .snapshots()
        .map((snapshot) {
      // Group by daerah
      Map<String, List<PADData>> grouped = {};
      for (var doc in snapshot.docs) {
        final data = PADData.fromFirestore(
          doc.data() as Map<String, dynamic>,
          doc.id,
        );
        
        if (!grouped.containsKey(data.daerah)) {
          grouped[data.daerah] = [];
        }
        grouped[data.daerah]!.add(data);
      }

      // Convert to DaerahDataGroup
      List<DaerahDataGroup> result = [];
      for (var entry in grouped.entries) {
        final first = entry.value.first;
        result.add(DaerahDataGroup(
          daerah: entry.key,
          namaClean: first.namaClean,
          tipe: first.tipe,
          dataPerTahun: entry.value,
        ));
      }

      // Sort
      result.sort((a, b) {
        if (a.tipe == 'Provinsi' && b.tipe != 'Provinsi') return -1;
        if (a.tipe != 'Provinsi' && b.tipe == 'Provinsi') return 1;
        return a.namaClean.compareTo(b.namaClean);
      });

      return result;
    });
  }

  /// Create new PAD data
  Future<void> createData(PADData data) async {
    try {
      debugPrint('[FirestoreService] Creating new data for ${data.daerah} ${data.tahun}');
      
      await _firestore.collection(_collection).add(data.toFirestore());
      
      debugPrint('[FirestoreService] ✅ Data created successfully');
    } catch (e) {
      debugPrint('[FirestoreService] ❌ Create error: $e');
      rethrow;
    }
  }

  /// Update existing PAD data
  Future<void> updateData(String docId, PADData data) async {
    try {
      debugPrint('[FirestoreService] Updating data: $docId');
      
      await _firestore
          .collection(_collection)
          .doc(docId)
          .update(data.toFirestore());
      
      debugPrint('[FirestoreService] ✅ Data updated successfully');
    } catch (e) {
      debugPrint('[FirestoreService] ❌ Update error: $e');
      rethrow;
    }
  }

  /// Delete PAD data
  Future<void> deleteData(String docId) async {
    try {
      debugPrint('[FirestoreService] Deleting data: $docId');
      
      await _firestore.collection(_collection).doc(docId).delete();
      
      debugPrint('[FirestoreService] ✅ Data deleted successfully');
    } catch (e) {
      debugPrint('[FirestoreService] ❌ Delete error: $e');
      rethrow;
    }
  }

  /// Get single PAD data by ID
  Future<PADData?> getDataById(String docId) async {
    try {
      final doc = await _firestore.collection(_collection).doc(docId).get();
      
      if (doc.exists) {
        return PADData.fromFirestore(
          doc.data() as Map<String, dynamic>,
          doc.id,
        );
      }
      return null;
    } catch (e) {
      debugPrint('[FirestoreService] ❌ Get error: $e');
      return null;
    }
  }

  /// Get available years
  Future<List<int>> getAvailableYears() async {
    try {
      final snapshot = await _firestore.collection(_collection).get();
      final years = snapshot.docs
          .map((doc) => (doc.data()['tahun'] as num).toInt())
          .toSet()
          .toList()
        ..sort();
      return years;
    } catch (e) {
      debugPrint('[FirestoreService] ❌ Get years error: $e');
      return [];
    }
  }

  /// Get list of daerah
  Future<List<String>> getDaerahList() async {
    try {
      final snapshot = await _firestore.collection(_collection).get();
      final daerah = snapshot.docs
          .map((doc) => doc.data()['daerah'] as String)
          .toSet()
          .toList()
        ..sort();
      return daerah;
    } catch (e) {
      debugPrint('[FirestoreService] ❌ Get daerah error: $e');
      return [];
    }
  }

  /// Batch import data (untuk initial setup)
  Future<void> batchImportData(List<PADData> dataList) async {
    try {
      debugPrint('[FirestoreService] Starting batch import: ${dataList.length} records');
      
      // Firestore batch limit is 500
      final batchSize = 500;
      int imported = 0;
      
      for (int i = 0; i < dataList.length; i += batchSize) {
        final end = (i + batchSize < dataList.length) ? i + batchSize : dataList.length;
        final batch = _firestore.batch();
        
        for (int j = i; j < end; j++) {
          final docRef = _firestore.collection(_collection).doc();
          batch.set(docRef, dataList[j].toFirestore());
        }
        
        await batch.commit();
        imported += (end - i);
        debugPrint('[FirestoreService] Imported $imported / ${dataList.length}');
      }
      
      debugPrint('[FirestoreService] ✅ Batch import complete!');
    } catch (e) {
      debugPrint('[FirestoreService] ❌ Batch import error: $e');
      rethrow;
    }
  }

  /// Clear all data (untuk testing, gunakan hati-hati!)
  Future<void> clearAllData() async {
    try {
      debugPrint('[FirestoreService] ⚠️ CLEARING ALL DATA...');
      
      final snapshot = await _firestore.collection(_collection).get();
      
      for (var doc in snapshot.docs) {
        await doc.reference.delete();
      }
      
      debugPrint('[FirestoreService] ✅ All data cleared');
    } catch (e) {
      debugPrint('[FirestoreService] ❌ Clear error: $e');
      rethrow;
    }
  }

  /// Get statistics
  Future<Map<String, dynamic>> getStatistics({int? tahun}) async {
    try {
      Query query = _firestore.collection(_collection);
      
      if (tahun != null) {
        query = query.where('tahun', isEqualTo: tahun);
      }
      
      final snapshot = await query.get();
      final allData = snapshot.docs.map((doc) {
        return PADData.fromFirestore(
          doc.data() as Map<String, dynamic>,
          doc.id,
        );
      }).toList();

      double totalAnggaran = 0;
      double totalRealisasi = 0;
      
      for (var data in allData) {
        totalAnggaran += data.totalAnggaran;
        totalRealisasi += data.totalRealisasi;
      }

      return {
        'total_records': allData.length,
        'total_anggaran': totalAnggaran,
        'total_realisasi': totalRealisasi,
        'rata_rata_persentase': totalAnggaran > 0 
            ? (totalRealisasi / totalAnggaran) * 100 
            : 0,
      };
    } catch (e) {
      debugPrint('[FirestoreService] ❌ Statistics error: $e');
      return {
        'total_records': 0,
        'total_anggaran': 0,
        'total_realisasi': 0,
        'rata_rata_persentase': 0,
      };
    }
  }
}

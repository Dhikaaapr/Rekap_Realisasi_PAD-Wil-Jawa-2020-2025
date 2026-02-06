import 'package:flutter/foundation.dart';
import '../models/pad_model.dart';

// Service ini sudah digantikan oleh ExcelServiceV2 dan FirestoreService
// Disimpan hanya sebagai referensi legacy code
class ExcelService {
  Future<List<PADData>> loadAssetExcel() async {
    debugPrint("Legacy ExcelService called. Returning empty list.");
    return [];
  }

  Future<List<DaerahDataGroup>> loadGroupedData() async {
    debugPrint("Legacy ExcelService called. Returning empty list.");
    return [];
  }
}

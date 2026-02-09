import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/pad_model.dart';
import '../services/firestore_service.dart';

class InputDataScreen extends StatefulWidget {
  final PADData? data; // If null = Add Mode, if exists = Edit Mode
  final String? initialDaerah; // Pre-fill region name
  final String? initialNomorUrut; // Pre-fill sequence number

  const InputDataScreen({super.key, this.data, this.initialDaerah, this.initialNomorUrut});

  @override
  State<InputDataScreen> createState() => _InputDataScreenState();
}

class _InputDataScreenState extends State<InputDataScreen> {
  final _formKey = GlobalKey<FormState>();
  final FirestoreService _firestoreService = FirestoreService();
  bool _isLoading = false;
  List<String> _existingRegions = [];

  // Controllers
  late TextEditingController _tahunController;
  late TextEditingController _daerahController;
  late TextEditingController _pajakAngController;
  late TextEditingController _pajakRealController;
  late TextEditingController _retribusiAngController;
  late TextEditingController _retribusiRealController;
  late TextEditingController _kekayaanAngController;
  late TextEditingController _kekayaanRealController;
  late TextEditingController _lainAngController;
  late TextEditingController _lainRealController;

  @override
  void initState() {
    super.initState();
    final d = widget.data;
    _tahunController = TextEditingController(text: d?.tahun.toString() ?? DateTime.now().year.toString());
    _daerahController = TextEditingController(text: d?.daerah ?? widget.initialDaerah ?? '');
    
    // Helper to format double to string without .0
    String fmt(double? val) => val == null || val == 0 ? '' : val.toStringAsFixed(0);

    _pajakAngController = TextEditingController(text: fmt(d?.pajakAnggaran));
    _pajakRealController = TextEditingController(text: fmt(d?.pajakRealisasi));
    _retribusiAngController = TextEditingController(text: fmt(d?.retribusiAnggaran));
    _retribusiRealController = TextEditingController(text: fmt(d?.retribusiRealisasi));
    _kekayaanAngController = TextEditingController(text: fmt(d?.pengelolaanAnggaran));
    _kekayaanRealController = TextEditingController(text: fmt(d?.pengelolaanRealisasi));
    _lainAngController = TextEditingController(text: fmt(d?.lainPadAnggaran));
    _lainRealController = TextEditingController(text: fmt(d?.lainPadRealisasi));
    
    _fetchRegions();
  }

  Future<void> _fetchRegions() async {
    try {
      final regions = await _firestoreService.getDaerahList();
      if (mounted) {
        setState(() {
          _existingRegions = regions;
        });
      }
    } catch (e) {
      debugPrint('Error fetching regions: $e');
    }
  }

  @override
  void dispose() {
    _tahunController.dispose();
    _daerahController.dispose();
    _pajakAngController.dispose();
    _pajakRealController.dispose();
    _retribusiAngController.dispose();
    _retribusiRealController.dispose();
    _kekayaanAngController.dispose();
    _kekayaanRealController.dispose();
    _lainAngController.dispose();
    _lainRealController.dispose();
    super.dispose();
  }

  Future<void> _saveData() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final newData = PADData(
        daerah: _daerahController.text.trim(),
        tahun: int.parse(_tahunController.text),
        nomorUrut: widget.data?.nomorUrut ?? widget.initialNomorUrut ?? '1',
        pajakAnggaran: _parseDouble(_pajakAngController.text),
        pajakRealisasi: _parseDouble(_pajakRealController.text),
        retribusiAnggaran: _parseDouble(_retribusiAngController.text),
        retribusiRealisasi: _parseDouble(_retribusiRealController.text),
        pengelolaanAnggaran: _parseDouble(_kekayaanAngController.text),
        pengelolaanRealisasi: _parseDouble(_kekayaanRealController.text),
        lainPadAnggaran: _parseDouble(_lainAngController.text),
        lainPadRealisasi: _parseDouble(_lainRealController.text),
      );

      if (widget.data != null && widget.data!.docId != null) {
        // Update
        await _firestoreService.updateData(widget.data!.docId!, newData);
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Data berhasil diupdate!')));
      } else {
        // Create
        await _firestoreService.createData(newData);
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Data berhasil disimpan!')));
      }

      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  double _parseDouble(String val) {
    if (val.isEmpty) return 0.0;
    return double.tryParse(val.replaceAll(RegExp(r'[^\d.]'), '')) ?? 0.0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.data == null ? 'Tambah Data PAD' : 'Edit Data PAD'),
        backgroundColor: const Color(0xFF1A237E),
        foregroundColor: Colors.white,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildHeader('Informasi Umum'),
                Row(
                  children: [
                    Expanded(
                      flex: 1,
                      child: _buildTextField(_tahunController, 'Tahun', isNumber: true),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      flex: 2,
                      child: _buildDaerahField(),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                _buildHeader('1. Pajak Daerah'),
                _buildRowInput(_pajakAngController, _pajakRealController),
                
                const SizedBox(height: 16),
                _buildHeader('2. Retribusi Daerah'),
                _buildRowInput(_retribusiAngController, _retribusiRealController),

                const SizedBox(height: 16),
                _buildHeader('3. Pengelolaan Kekayaan'),
                _buildRowInput(_kekayaanAngController, _kekayaanRealController),

                const SizedBox(height: 16),
                _buildHeader('4. Lain-lain PAD'),
                _buildRowInput(_lainAngController, _lainRealController),

                const SizedBox(height: 32),
                SizedBox(
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: _saveData,
                    icon: const Icon(Icons.save),
                    label: const Text('SIMPAN DATA', style: TextStyle(fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1A237E),
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
                if (widget.data != null) ...[
                  const SizedBox(height: 16),
                  TextButton.icon(
                    onPressed: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Hapus Data?'),
                          content: const Text('Data yang dihapus tidak bisa dikembalikan.'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
                            TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Hapus', style: TextStyle(color: Colors.red))),
                          ],
                        ),
                      );

                      if (confirm == true && widget.data!.docId != null) {
                        await _firestoreService.deleteData(widget.data!.docId!);
                        if (context.mounted) Navigator.pop(context);
                      }
                    },
                    icon: const Icon(Icons.delete, color: Colors.red),
                    label: const Text('Hapus Data Ini', style: TextStyle(color: Colors.red)),
                  )
                ]
              ],
            ),
          ),
    );
  }

  Widget _buildHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1A237E))),
    );
  }

  Widget _buildRowInput(TextEditingController angCtrl, TextEditingController realCtrl) {
    return Row(
      children: [
        Expanded(child: _buildTextField(angCtrl, 'Anggaran', isNumber: true)),
        const SizedBox(width: 12),
        Expanded(child: _buildTextField(realCtrl, 'Realisasi', isNumber: true)),
      ],
    );
  }

  Widget _buildTextField(TextEditingController ctrl, String label, {bool isNumber = false}) {
    return TextFormField(
      controller: ctrl,
      keyboardType: isNumber ? TextInputType.number : TextInputType.text,
      inputFormatters: isNumber ? [FilteringTextInputFormatter.digitsOnly] : [],
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        isDense: true,
      ),
      validator: (val) {
        if (val == null || val.isEmpty) return 'Wajib diisi';
        return null;
      },
    );
  }

  Widget _buildDaerahField() {
    return Autocomplete<String>(
      optionsBuilder: (TextEditingValue textEditingValue) {
        if (textEditingValue.text == '') {
          return const Iterable<String>.empty();
        }
        return _existingRegions.where((String option) {
          return option.toLowerCase().contains(textEditingValue.text.toLowerCase());
        });
      },
      initialValue: TextEditingValue(text: _daerahController.text),
      onSelected: (String selection) {
        _daerahController.text = selection;
      },
      fieldViewBuilder: (context, textEditingController, focusNode, onFieldSubmitted) {
        // Sync our controller with autocomplete's controller
        textEditingController.addListener(() {
          _daerahController.text = textEditingController.text;
        });
        
        // Handle pre-fill
        if (textEditingController.text.isEmpty && _daerahController.text.isNotEmpty) {
          textEditingController.text = _daerahController.text;
        }

        return TextFormField(
          controller: textEditingController,
          focusNode: focusNode,
          decoration: const InputDecoration(
            labelText: 'Nama Daerah (Prov/Kab/Kota)',
            border: OutlineInputBorder(),
            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            isDense: true,
            suffixIcon: Icon(Icons.search, size: 20),
          ),
          validator: (val) {
            if (val == null || val.isEmpty) return 'Wajib diisi';
            return null;
          },
        );
      },
    );
  }
}

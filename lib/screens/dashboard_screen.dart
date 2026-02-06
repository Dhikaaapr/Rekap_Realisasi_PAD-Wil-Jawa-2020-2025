import 'package:flutter/material.dart';
import '../models/pad_model.dart';
import '../services/firestore_service.dart';
import '../services/auth_service.dart';
import 'detail_screen.dart';
import 'input_data_screen.dart';
import 'import_data_screen.dart';
import 'login_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final FirestoreService _firestoreService = FirestoreService();
  final AuthService _authService = AuthService();

  int? _selectedYear;
  List<int> _availableYears = [];
  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadAvailableYears();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.toLowerCase();
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadAvailableYears() async {
    final years = await _firestoreService.getAvailableYears();
    setState(() {
      _availableYears = years;
      if (years.isNotEmpty) {
        _selectedYear = years.last; // Default to latest year
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                style: const TextStyle(color: Colors.white),
                autofocus: true,
                decoration: const InputDecoration(
                  hintText: 'Cari Daerah...',
                  hintStyle: TextStyle(color: Colors.white70),
                  border: InputBorder.none,
                ),
              )
            : const Text(
                'Rekap PAD Jawa',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
        backgroundColor: const Color(0xFF1A237E),
        foregroundColor: Colors.white,
        actions: [
          // Search Toggle
          IconButton(
            onPressed: () {
              setState(() {
                _isSearching = !_isSearching;
                if (!_isSearching) {
                  _searchController.clear();
                  _searchQuery = '';
                }
              });
            },
            icon: Icon(_isSearching ? Icons.close : Icons.search),
          ),

          // Year filter dropdown (only show if not searching)
          if (!_isSearching && _availableYears.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: DropdownButton<int?>(
                value: _selectedYear,
                dropdownColor: const Color(0xFF1A237E),
                style: const TextStyle(color: Colors.white),
                underline: Container(),
                icon: const Icon(Icons.filter_list, color: Colors.white),
                items: [
                  const DropdownMenuItem<int?>(
                    value: null,
                    child: Text(
                      'Semua Tahun',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                  ..._availableYears.map((year) {
                    return DropdownMenuItem<int?>(
                      value: year,
                      child: Text(
                        '$year',
                        style: const TextStyle(color: Colors.white),
                      ),
                    );
                  }),
                ],
                onChanged: (value) {
                  setState(() {
                    _selectedYear = value;
                  });
                },
              ),
            ),
          
          // User Profile Menu
          PopupMenuButton<String>(
            icon: CircleAvatar(
              radius: 16,
              backgroundColor: Colors.white24,
              backgroundImage: _authService.photoURL != null
                  ? NetworkImage(_authService.photoURL!)
                  : null,
              child: _authService.photoURL == null
                  ? Icon(
                      _authService.isLoggedIn ? Icons.person : Icons.person_outline,
                      color: Colors.white,
                      size: 20,
                    )
                  : null,
            ),
            onSelected: (value) async {
              if (value == 'logout') {
                await _authService.signOut();
                if (context.mounted) {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                    (route) => false,
                  );
                }
              } else if (value == 'import_data') {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ImportDataScreen()),
                );
              }
            },
            itemBuilder: (context) => [
              if (_authService.isLoggedIn) ...[
                PopupMenuItem<String>(
                  enabled: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _authService.displayName ?? 'User',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      Text(
                        _authService.email ?? '',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                const PopupMenuItem<String>(
                  value: 'import_data',
                  child: Row(
                    children: [
                      Icon(Icons.cloud_upload, color: Color(0xFF1A237E)),
                      SizedBox(width: 8),
                      Text('Import Data 2025'),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                const PopupMenuItem<String>(
                  value: 'logout',
                  child: Row(
                    children: [
                      Icon(Icons.logout, color: Colors.red),
                      SizedBox(width: 8),
                      Text('Logout', style: TextStyle(color: Colors.red)),
                    ],
                  ),
                ),
              ] else ...[
                PopupMenuItem<String>(
                  enabled: false,
                  child: Text(
                    'Mode Tamu',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
      body: StreamBuilder<List<PADData>>(
        stream: _firestoreService.streamAllData(),
        builder: (context, snapshot) {
          // Loading state
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Memuat data dari cloud...'),
                ],
              ),
            );
          }

          // Error state
          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text('Error: ${snapshot.error}'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {}); // Retry
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          // No data
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.inbox_outlined,
                    size: 64,
                    color: Colors.grey,
                  ),
                  const SizedBox(height: 16),
                  const Text('Belum ada data'),
                  const SizedBox(height: 8),
                  Text(
                    'Import data awal atau tambahkan manual',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            );
          }

          // Filter by selected year if needed
          List<PADData> filteredData = snapshot.data!;

          // 1. Filter by Year
          if (_selectedYear != null) {
            filteredData = filteredData.where((d) => d.tahun == _selectedYear).toList();
          }

          // 2. Filter by Search Query
          if (_searchQuery.isNotEmpty) {
            filteredData = filteredData.where((item) {
              return item.daerah.toLowerCase().contains(_searchQuery) ||
                  item.namaClean.toLowerCase().contains(_searchQuery);
            }).toList();
          }

          // Data loaded successfully
          return Column(
            children: [
              // Stats summary card
              _buildStatsCard(filteredData),

              // Data list
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filteredData.length,
                  itemBuilder: (context, index) {
                    final item = filteredData[index];

                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: InkWell(
                        onTap: () {
                          // Construct a basic group to pass to DetailScreen
                          // DetailScreen will fetch the full stream for this region
                          final group = DaerahDataGroup(
                            daerah: item.daerah,
                            namaClean: item.namaClean,
                            tipe: item.tipe,
                            dataPerTahun: [item], 
                          );
                          
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => DetailScreen(
                                daerahGroup: group,
                                selectedYear: _selectedYear, // Pass strict filter
                              ),
                            ),
                          );
                        },
                        borderRadius: BorderRadius.circular(12),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              // Icon/Avatar
                              CircleAvatar(
                                backgroundColor: _getTipeColor(item.tipe),
                                child: Text(
                                  item.namaClean.isNotEmpty ? item.namaClean.substring(0, 1) : '?',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),

                              // Content
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            item.daerah,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 16,
                                            ),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF1A237E).withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            '${item.tahun}',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF1A237E),
                                              fontSize: 12,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'PAD Realisasi: ${_formatMoney(item.totalRealisasi)}',
                                      style: const TextStyle(
                                        color: Colors.green,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    Text(
                                      'Target: ${_formatMoney(item.totalAnggaran)} • ${item.totalPersentase.toStringAsFixed(1)}%',
                                      style: TextStyle(
                                        color: Colors.grey[600],
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // Arrow
                              const Icon(
                                Icons.arrow_forward_ios,
                                size: 16,
                                color: Colors.grey,
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const InputDataScreen()),
          );
        },
        backgroundColor: const Color(0xFF1A237E),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Tambah Data'),
      ),
    );
  }

  Widget _buildStatsCard(List<PADData> data) {
    double totalAnggaran = 0;
    double totalRealisasi = 0;
    int totalRecords = data.length;

    for (var item in data) {
      totalAnggaran += item.totalAnggaran;
      totalRealisasi += item.totalRealisasi;
    }

    double persentase = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;

    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A237E), Color(0xFF3949AB)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStatItem(
                'Total Baris',
                '$totalRecords',
                Icons.description,
              ),
              // Unique regions count
              _buildStatItem('Daerah', '${data.map((e) => e.daerah).toSet().length}', Icons.location_on),
            ],
          ),
          const Divider(color: Colors.white30, height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStatItem(
                'Anggaran',
                _formatMoney(totalAnggaran),
                Icons.account_balance_wallet,
              ),
              _buildStatItem(
                'Realisasi',
                _formatMoney(totalRealisasi),
                Icons.trending_up,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.percent, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Capaian: ${persentase.toStringAsFixed(2)}%',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: Colors.white70, size: 20),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Color _getTipeColor(String tipe) {
    switch (tipe) {
      case 'Provinsi':
        return const Color(0xFF1A237E);
      case 'Kota':
        return const Color(0xFF0D47A1);
      case 'Kabupaten':
        return const Color(0xFF1565C0);
      default:
        return Colors.grey;
    }
  }

  String _formatMoney(double val) {
    if (val >= 1000000000000) {
      return 'Rp ${(val / 1000000000000).toStringAsFixed(1)} T';
    }
    if (val >= 1000000000) {
      return 'Rp ${(val / 1000000000).toStringAsFixed(1)} M';
    }
    return 'Rp ${(val / 1000000).toStringAsFixed(1)} Jt';
  }
}

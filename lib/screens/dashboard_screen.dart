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

  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
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
                'Rekap PAD Jawa 2021-2025',
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
                      Text('Import Data CSV'),
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
      body: StreamBuilder<List<DaerahDataGroup>>(
        stream: _firestoreService.streamGroupedData(),
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

          // Filter by Search Query
          List<DaerahDataGroup> filteredData = snapshot.data!;
          
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

              // Data list (grouped by daerah)
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 100),
                  itemCount: filteredData.length,
                  itemBuilder: (context, index) {
                    final group = filteredData[index];

                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => DetailScreen(
                                daerahGroup: group,
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
                                backgroundColor: _getTipeColor(group.tipe),
                                child: Text(
                                  group.namaClean.isNotEmpty ? group.namaClean.substring(0, 1) : '?',
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
                                            group.daerah,
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
                                            '${group.tahunList.length} Thn',
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
                                      'Rata-rata PAD: ${_formatMoney(group.rataRataPAD)}',
                                      style: const TextStyle(
                                        color: Colors.green,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    Text(
                                      'Data: ${_getYearRange(group.tahunList)} • ${group.tipe}',
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
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 80),
        child: FloatingActionButton.extended(
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
      ),
    );
  }

  Widget _buildStatsCard(List<DaerahDataGroup> data) {
    // Calculate totals from all years across all regions
    double totalAnggaran = 0;
    double totalRealisasi = 0;
    int totalDaerah = data.length;
    Set<int> allYears = {};

    for (var group in data) {
      for (var padData in group.dataPerTahun) {
        totalAnggaran += padData.totalAnggaran;
        totalRealisasi += padData.totalRealisasi;
        allYears.add(padData.tahun);
      }
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
          // Title
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'Rekap PAD Wilayah Jawa ${_getYearRangeFromSet(allYears)}',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStatItem(
                'Total Daerah',
                '$totalDaerah',
                Icons.location_on,
              ),
              _buildStatItem(
                'Periode',
                '${allYears.length} Tahun',
                Icons.calendar_month,
              ),
            ],
          ),
          const Divider(color: Colors.white30, height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStatItem(
                'Total Anggaran',
                _formatMoney(totalAnggaran),
                Icons.account_balance_wallet,
              ),
              _buildStatItem(
                'Total Realisasi',
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
                  'Rata-rata Capaian: ${persentase.toStringAsFixed(2)}%',
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

  String _getYearRange(List<int> years) {
    if (years.isEmpty) return '-';
    if (years.length == 1) return years.first.toString();
    final sorted = years.toList()..sort();
    return '${sorted.first}-${sorted.last}';
  }

  String _getYearRangeFromSet(Set<int> years) {
    if (years.isEmpty) return '';
    final sorted = years.toList()..sort();
    return '${sorted.first}-${sorted.last}';
  }
}

# Scripts Directory

Folder ini berisi utility scripts untuk membantu proses development.

## 📄 Files

### 1. `clean_excel.py`
Script Python untuk membersihkan dan mengekstrak data dari Excel file yang complex.

**Fungsi:**
- Extract data dari multiple sheets (2021-2025)
- Handle merged cells dan formulas
- Generate clean Excel file
- Generate CSV export
- Generate SQL INSERT statements

**Usage:**
```bash
# Install dependencies
pip install -r requirements.txt

# Run script
python clean_excel.py
```

**Output:**
- `assets/datarekap_clean.xlsx` - Clean Excel file
- `assets/datarekap_clean.csv` - CSV export
- `scripts/insert_pad_data.sql` - SQL statements untuk import ke database

### 2. `requirements.txt`
Python dependencies untuk scripts.

**Install:**
```bash
pip install -r requirements.txt
```

### 3. `insert_pad_data.sql` (Generated)
SQL INSERT statements yang di-generate oleh `clean_excel.py`.

**Usage:**
```bash
# Import to MySQL
mysql -u root rekap_pad < insert_pad_data.sql

# Atau via HeidiSQL
# 1. Buka HeidiSQL
# 2. Select database "rekap_pad"
# 3. File → Load SQL file → select insert_pad_data.sql
# 4. Execute
```

---

## 🔧 Troubleshooting

### Error: "ModuleNotFoundError: No module named 'openpyxl'"
```bash
pip install openpyxl pandas
```

### Error: "File not found: assets/datarekap.xlsx"
Pastikan file `datarekap.xlsx` ada di folder `assets/`.

### Script jalan tapi data kosong
Cek log output dari script. Kemungkinan:
- Sheet name tidak sesuai (hari 2021, 2022, dll)
- Data start row tidak terdeteksi
- Format Excel terlalu complex

Edit script dan sesuaikan line:
```python
# Line ~40: Sesuaikan detection logic
data_start_row = None
for row_idx in range(1, 20):  # Increase range if needed
    ...
```

---

## 📝 Notes

- Script ini designed untuk structure Excel yang ada di `datarekap.xlsx`
- Jika structure Excel lo beda, sesuaikan column mapping di script
- Review output file sebelum dipake production

import openpyxl
import os

# Path to the file
path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'

print(f"Opening {path}...")
wb = openpyxl.load_workbook(path, read_only=True)
sheet_name = wb.sheetnames[-1] # Month sheet
ws = wb[sheet_name]
print(f"Sheet: {sheet_name}")

# Print first 10 rows to identify headers
for i, row in enumerate(ws.iter_rows(min_row=1, max_row=12, values_only=True), 1):
    # Only print non-none values to reduce noise
    cells = {j: str(v).strip().replace('\n', ' ') for j, v in enumerate(row) if v is not None}
    print(f"Row {i}: {cells}")

wb.close()

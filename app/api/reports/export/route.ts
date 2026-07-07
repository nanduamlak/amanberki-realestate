import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // body is Array of filtered plots

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Sheet2", {
      views: [{ showGridLines: true }]
    });

    // 1. Column dimensions and keys
    ws.columns = [
      { key: "block",       width: 12 },
      { key: "plot",        width: 10 },
      { key: "size",        width: 16 },
      { key: "builtArea",   width: 14 },
      { key: "purchaser",   width: 28 },
      { key: "deed",        width: 20 },
      { key: "contractor",  width: 18 },
      { key: "constStatus", width: 24 },
      { key: "remark",      width: 45 }
    ];

    const thinBorder: Partial<ExcelJS.Borders> = {
      top:    { style: "thin", color: { argb: "FFA6A6A6" } },
      left:   { style: "thin", color: { argb: "FFA6A6A6" } },
      bottom: { style: "thin", color: { argb: "FFA6A6A6" } },
      right:  { style: "thin", color: { argb: "FFA6A6A6" } }
    };

    // 2. Header Row
    const headerRow = ws.addRow([
      "Block No.", 
      "Plot No. ", 
      "Plot Size (Sq.M)", 
      "Built-up Area", 
      " Purchaser Name ", 
      "Title Deeds Status", 
      "Contractor", 
      "Construction Status", 
      "Remark\\Comments"
    ]);
    headerRow.height = 25;

    headerRow.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF000000" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF92D050" } // Lime green
      };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = thinBorder;
    });

    // 3. Group plots by block
    const blockGroups: Record<number, any[]> = {};
    for (const p of body) {
      const b = p.blockNumber ?? 0;
      if (!blockGroups[b]) {
        blockGroups[b] = [];
      }
      blockGroups[b].push(p);
    }

    const sortedBlocks = Object.keys(blockGroups)
      .map(Number)
      .sort((a, b) => a - b);

    let currentRow = 2;

    for (let blockIdx = 0; blockIdx < sortedBlocks.length; blockIdx++) {
      const blockNum = sortedBlocks[blockIdx];

      // Add divider row between blocks
      if (blockIdx > 0) {
        ws.mergeCells(currentRow, 1, currentRow, 9);
        const divRow = ws.getRow(currentRow);
        divRow.height = 12;
        
        for (let col = 1; col <= 9; col++) {
          const cell = divRow.getCell(col);
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF7F7F7F" } // Grey divider
          };
          cell.border = thinBorder;
        }
        currentRow++;
      }

      // Sort plots: numeric primarily
      const getPlotKey = (x: any) => {
        const pn = String(x.plotNumber ?? "");
        const num = parseInt(pn, 10);
        return isNaN(num) ? { type: 1, val: pn } : { type: 0, val: num };
      };

      const blockPlots = [...blockGroups[blockNum]].sort((a, b) => {
        const ka = getPlotKey(a);
        const kb = getPlotKey(b);
        if (ka.type !== kb.type) return ka.type - kb.type;
        if (ka.type === 0) return (ka.val as number) - (kb.val as number);
        return String(ka.val).localeCompare(String(kb.val));
      });

      const startRow = currentRow;

      for (let plotIdx = 0; plotIdx < blockPlots.length; plotIdx++) {
        const p = blockPlots[plotIdx];

        // Only write block label on the first row of block group (merging will cover it)
        const valBlock = plotIdx === 0 ? (p.blockLabel || String(p.blockNumber ?? "")) : "";

        const rowData = [
          valBlock,
          p.plotNumber ?? "",
          p.plotSize ?? "",
          p.builtArea ?? "",
          p.purchaserName ?? "",
          p.titleDeedsStatus ?? "",
          p.contractorName ?? "",
          p.constructionStatus ?? "",
          p.remark ?? ""
        ];

        const row = ws.getRow(currentRow);
        row.values = rowData;

        // Dynamically calculate row height based on Remark length
        const remarkText = String(p.remark ?? "");
        const lines = Math.max(1, Math.floor((remarkText.length + 40) / 45));
        row.height = Math.max(20, lines * 15);

        for (let colIdx = 1; colIdx <= 9; colIdx++) {
          const cell = row.getCell(colIdx);
          cell.font = { name: "Calibri", size: 10 };
          cell.border = thinBorder;

          // Alignment rules
          if (colIdx === 9) {
            cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
          } else if ([1, 2, 3, 6].includes(colIdx)) {
            cell.alignment = { horizontal: "center", vertical: "middle" };
          } else {
            cell.alignment = { horizontal: "left", vertical: "middle" };
          }

          // Format plot size as a number if possible
          if (colIdx === 3 && p.plotSize !== undefined && p.plotSize !== "") {
            const sizeVal = Number(p.plotSize);
            if (!isNaN(sizeVal)) {
              cell.value = sizeVal;
              cell.numFmt = "#,##0";
            }
          }
        }

        currentRow++;
      }

      const endRow = currentRow - 1;

      // Merge Block No. cells
      if (endRow > startRow) {
        ws.mergeCells(startRow, 1, endRow, 1);
        ws.getCell(startRow, 1).alignment = { horizontal: "center", vertical: "middle" };
      }
    }

    // Write workbook directly to memory buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=Tulu_Dimtu_Inventory_Ledger.xlsx",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (err: any) {
    console.error("[Excel Export API] Error:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}

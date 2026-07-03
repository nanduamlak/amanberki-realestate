/**
 * parse-and-seed.js
 * Reads Tulu Dimtu Inventory.xlsx and upserts all properties + plot details
 * into the PostgreSQL database.
 *
 * Run with:  node scripts/parse-and-seed.js
 */

require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");
const xlsx = require("xlsx");
const path = require("path");

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is not set in .env.local");
  process.exit(1);
}

// ─── Excel Parsing ────────────────────────────────────────────────────────────
const filePath = path.join(__dirname, "..", "Tulu Dimtu Inventory.xlsx");
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets["Sheet2"];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

/**
 * Determine status from purchaser name and construction status
 */
function deriveStatus(purchaserName, constructionStatus) {
  const owner = (purchaserName || "").toLowerCase();
  const isTuluDimtu = owner.includes("tulu dimtu real estate") && !owner.includes("(b*)") && owner !== "tulu dimtu real estate (b*)";
  const isBufferPlot = owner.includes("tulu dimtu real estate (b*)");
  const constructLower = (constructionStatus || "").toLowerCase();

  if (isBufferPlot) return "available";
  if (isTuluDimtu) return "available";

  // Has a named purchaser → sold/reserved
  if (constructLower.includes("completed") || constructLower.includes("occupied") || constructLower.includes("plastering") || constructLower.includes("finishing")) {
    return "sold";
  }
  if (constructLower.includes("bare land") || !constructionStatus) {
    return "reserved";
  }
  return "under-construction";
}

/**
 * Parse all blocks and plots from Sheet2.
 * Columns: [Block No., Plot No., Plot Size, Built-up Area, Purchaser Name, 
 *           Title Deeds Status, Contractor, Construction Status, Remark]
 */
function parseInventory() {
  const blocks = new Map();
  let currentBlockId = null;

  // Find the header row (row index 10)
  const HEADER_ROW = 10;

  for (let i = HEADER_ROW + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const hasContent = row.some(cell => cell !== null && cell !== undefined && cell !== "");
    if (!hasContent) continue;

    const col0 = row[0]; // Block No.
    const col1 = row[1]; // Plot No.
    const col2 = row[2]; // Plot Size
    const col3 = row[3]; // Built-up Area
    const col4 = row[4]; // Purchaser Name
    const col5 = row[5]; // Title Deeds Status
    const col6 = row[6]; // Contractor
    const col7 = row[7]; // Construction Status
    const col8 = row[8]; // Remark

    // Skip divider rows
    if (typeof col0 === "string" && col0.includes("*****")) continue;
    if (typeof col0 === "string" && col0.includes("Zone II")) continue;
    if (typeof col0 === "string" && col0.toLowerCase().includes("block no")) continue;

    // Determine block number
    let blockId = null;
    let isNewBlock = false;
    
    if (col0 !== null && col0 !== undefined && col0 !== "") {
      const blockStr = String(col0).trim();
      // Handle special cases like "46A", "46B"
      if (!isNaN(Number(blockStr))) {
        blockId = `BLOCK-${String(Math.floor(Number(blockStr))).padStart(3, "0")}`;
      } else if (blockStr === "46A") {
        blockId = "BLOCK-046A"; // will use blockNumber 461
      } else if (blockStr === "46B") {
        blockId = "BLOCK-046B"; // will use blockNumber 462
      } else if (typeof blockStr === "string" && blockStr.match(/^\d+[A-Z]$/)) {
        const num = blockStr.replace(/[A-Z]+$/, "");
        const letter = blockStr.replace(/^\d+/, "");
        blockId = `BLOCK-${String(num).padStart(3, "0")}${letter}`;
      } else {
        blockId = null; // Skip unknown block identifiers
      }
      
      if (blockId && blockId !== currentBlockId) {
        currentBlockId = blockId;
        isNewBlock = true;
      }
    }

    if (!currentBlockId) continue;
    if (col1 === null && col2 === null && col4 === null) continue;

    // Initialize block if new
    if (isNewBlock && !blocks.has(currentBlockId)) {
      // Determine zone: blocks 1-18 + 46A + 46B = Zone I G+1, rest = Zone II G+0
      // blockNumber: 46A → 461, 46B → 462 (to avoid UNIQUE constraint violation)
      let blockNum;
      if (currentBlockId === "BLOCK-046A") blockNum = 461;
      else if (currentBlockId === "BLOCK-046B") blockNum = 462;
      else blockNum = parseInt(currentBlockId.replace(/[^0-9]/g, ""), 10) || 0;

      const isZone1 = (blockNum >= 1 && blockNum <= 18) || blockNum === 461 || blockNum === 462 || blockNum === 46 || blockNum === 47;
      const zone = isZone1 ? "Zone I G+1" : "Zone II G+0";
      blocks.set(currentBlockId, {
        id: currentBlockId,
        blockNumber: blockNum,
        zone,
        plots: [],
      });
    }

    // Add plot detail
    if (col1 !== null && col1 !== undefined) {
      const plotNum = String(col1).trim();
      const plotSize = typeof col2 === "number" ? col2 : (parseFloat(col2) || 0);
      const purchaserName = col4 ? String(col4).trim() : "";
      const titleDeedsStatus = col5 ? String(col5).trim() : "";
      const contractor = col6 ? String(col6).trim() : "";
      const constructionStatus = col7 ? String(col7).trim() : "";
      const remark = col8 ? String(col8).trim() : "";
      const builtArea = col3 ? String(col3).trim() : "";

      const block = blocks.get(currentBlockId);
      if (block) {
        block.plots.push({
          plotNumber: plotNum,
          plotSize,
          builtArea,
          purchaserName,
          titleDeedsStatus,
          contractorName: contractor,
          constructionStatus,
          remark,
        });
      }
    }
  }

  return blocks;
}

/**
 * Compute derived block-level fields from its plots
 */
function computeBlockFields(blockId, plots) {
  const isTuluDimtu = (name) => {
    const n = (name || "").toLowerCase();
    return n.includes("tulu dimtu");
  };

  const noOfPlots = plots.length;
  const totalArea = plots.reduce((sum, p) => sum + (p.plotSize || 0), 0);

  const bufferPlots = plots.filter(p => (p.purchaserName || "").toLowerCase().includes("(b*)"));
  const primaryPlots = plots.filter(p => !(p.purchaserName || "").toLowerCase().includes("(b*)"));
  const noOfBufferPlots = bufferPlots.length;
  const noOfPrimaryPlots = primaryPlots.length;

  // Count sold: plots with a named purchaser who is NOT Tulu Dimtu RE
  const soldPlots = plots.filter(p => {
    const name = (p.purchaserName || "").toLowerCase();
    return name && !name.includes("tulu dimtu") && !name.includes("under review") && !name.includes("???") && name !== "community center";
  }).length;

  const availablePlots = noOfPlots - soldPlots;

  // Block status
  let status = "available";
  if (soldPlots === noOfPlots) status = "sold";
  else if (soldPlots > 0) status = "reserved";

  // Check if any under construction
  const hasUnderConstruction = plots.some(p => {
    const cs = (p.constructionStatus || "").toLowerCase();
    return cs && !cs.includes("bare land") && !cs.includes("completed") && !cs.includes("occupied") && !isTuluDimtu(p.purchaserName);
  });
  if (hasUnderConstruction && status !== "available") status = "under-construction";

  // Plot sizes
  const plotSizes = [...new Set(plots.map(p => p.plotSize).filter(s => s > 0))];
  const plotSizeStr = plotSizes.length === 1 
    ? String(plotSizes[0]) 
    : (plotSizes.length > 0 ? `${Math.min(...plotSizes)}-${Math.max(...plotSizes)}` : "TBD");

  // Primary plot range
  const primaryNums = primaryPlots.map(p => p.plotNumber).filter(n => !isNaN(n));
  const primaryRange = primaryNums.length > 0 
    ? `P 1-${primaryNums.length}` 
    : `P 1-${noOfPrimaryPlots}`;

  const bufferRange = bufferPlots.length > 0 
    ? `P ${primaryNums.length + 1}-${primaryNums.length + bufferPlots.length}` 
    : "0";

  return {
    primaryPlots: primaryRange,
    noOfPlots: plots.length,
    area: Math.round(totalArea),
    plotSize: plotSizeStr,
    bufferPlots: bufferRange,
    noOfBufferPlots,
    soldPlots,
    activePlots: availablePlots,
    status,
    remark: "",
    description: "",
    price: 0,
  };
}

// ─── Database Functions ───────────────────────────────────────────────────────
async function clearExistingData(client) {
  console.log("[Seed] Clearing existing property data...");
  await client.query("DELETE FROM payment_records");
  await client.query("DELETE FROM ownership_history");
  await client.query("DELETE FROM plot_details");
  await client.query("DELETE FROM properties");
  console.log("[Seed] ✅ Cleared existing data.");
}

async function upsertProperty(client, blockId, blockData, fields) {
  await client.query(
    `INSERT INTO properties
       (id, block_number, zone, status, price, primary_plots, no_of_plots,
        area, plot_size, buffer_plots, no_of_buffer_plots, sold_plots,
        active_plots, remark, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     ON CONFLICT (id) DO UPDATE SET
       block_number       = EXCLUDED.block_number,
       zone               = EXCLUDED.zone,
       status             = EXCLUDED.status,
       price              = EXCLUDED.price,
       primary_plots      = EXCLUDED.primary_plots,
       no_of_plots        = EXCLUDED.no_of_plots,
       area               = EXCLUDED.area,
       plot_size          = EXCLUDED.plot_size,
       buffer_plots       = EXCLUDED.buffer_plots,
       no_of_buffer_plots = EXCLUDED.no_of_buffer_plots,
       sold_plots         = EXCLUDED.sold_plots,
       active_plots       = EXCLUDED.active_plots,
       remark             = EXCLUDED.remark,
       description        = EXCLUDED.description,
       updated_at         = NOW()`,
    [
      blockId,
      blockData.blockNumber,
      blockData.zone,
      fields.status,
      fields.price,
      fields.primaryPlots,
      fields.noOfPlots,
      fields.area,
      fields.plotSize,
      fields.bufferPlots,
      fields.noOfBufferPlots,
      fields.soldPlots,
      fields.activePlots,
      fields.remark,
      fields.description,
    ]
  );
}

async function insertPlots(client, blockId, plots) {
  for (const plot of plots) {
    await client.query(
      `INSERT INTO plot_details
         (block_id, plot_number, plot_size, built_area, purchaser_name,
          title_deeds_status, construction_status, remark, contractor_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (block_id, plot_number) DO UPDATE SET
         plot_size          = EXCLUDED.plot_size,
         built_area         = EXCLUDED.built_area,
         purchaser_name     = EXCLUDED.purchaser_name,
         title_deeds_status = EXCLUDED.title_deeds_status,
         construction_status= EXCLUDED.construction_status,
         remark             = EXCLUDED.remark,
         contractor_name    = EXCLUDED.contractor_name,
         updated_at         = NOW()`,
      [
        blockId,
        plot.plotNumber,
        plot.plotSize || 0,
        plot.builtArea || "",
        plot.purchaserName || "",
        plot.titleDeedsStatus || "",
        plot.constructionStatus || "",
        plot.remark || "",
        plot.contractorName || null,
      ]
    );
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("[Seed] Connected to database.\n");

  // Parse Excel
  console.log("[Seed] Parsing Tulu Dimtu Inventory.xlsx...");
  const blocks = parseInventory();
  console.log(`[Seed] Found ${blocks.size} blocks.\n`);

  // Clear existing data
  await clearExistingData(client);

  let blockCount = 0;
  let plotCount = 0;

  for (const [blockId, blockData] of blocks) {
    const { plots } = blockData;
    const fields = computeBlockFields(blockId, plots);

    process.stdout.write(`[Seed] ${blockId} (${blockData.zone}) — ${plots.length} plots ... `);

    await upsertProperty(client, blockId, blockData, fields);
    await insertPlots(client, blockId, plots);

    blockCount++;
    plotCount += plots.length;
    process.stdout.write(`✅\n`);
  }

  await client.end();

  console.log(`\n[Seed] 🎉 Done!`);
  console.log(`[Seed]   Blocks : ${blockCount}`);
  console.log(`[Seed]   Plots  : ${plotCount}`);
}

seed().catch((err) => {
  console.error("[Seed] ❌ Fatal:", err.message);
  console.error(err.stack);
  process.exit(1);
});

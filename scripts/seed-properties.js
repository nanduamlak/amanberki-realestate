/**
 * seed-properties.js
 * Inserts all mock property/plot/ownership/payment data into PostgreSQL.
 * Run AFTER migrate-properties.js:
 *   node scripts/migrate-properties.js
 *   node scripts/seed-properties.js
 *
 * Safe to re-run — uses INSERT ... ON CONFLICT DO NOTHING for properties,
 * and clears + re-inserts child rows so you get a clean, consistent state.
 */

require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is not set in .env.local");
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// Helpers (mirrors lib/data/properties.ts logic)
// ─────────────────────────────────────────────────────────────
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateProperty(blockNum) {
  const r = (offset = 0) => seededRandom(blockNum * 31 + offset);
  const isZone1 =
    (blockNum >= 1 && blockNum <= 18) ||
    blockNum === 461 ||
    blockNum === 46 ||
    blockNum === 47;
  const zone = isZone1 ? "Zone I G+1" : "Zone II G+0";

  const descriptions = [
    "A stunning modern property with premium finishes and breathtaking views of the surrounding landscape.",
    "Elegant living spaces designed for comfort and style, nestled in a vibrant community.",
    "Spacious and well-lit units with high-end fittings, perfect for families seeking quality.",
    "Premium residence offering luxury amenities and easy access to major city attractions.",
    "Contemporary design meets functional living in this beautifully crafted property.",
  ];

  const noOfPlots  = 4 + Math.floor(r(3) * 12);
  const soldPlots  = Math.floor(r(4) * (noOfPlots + 1));
  const activePlots = noOfPlots - soldPlots;
  const status     = activePlots === 0 ? "sold" : soldPlots === 0 ? "available" : "reserved";
  const plotSize   = 200 + Math.floor(r(5) * 4) * 100;
  const area       = noOfPlots * plotSize;
  const price      = area * 500;

  return {
    id: `BLOCK-${blockNum.toString().padStart(3, "0")}`,
    blockNumber: blockNum,
    zone,
    status,
    price,
    primaryPlots: `P 1-${noOfPlots}`,
    noOfPlots,
    area,
    plotSize: plotSize.toString(),
    bufferPlots: "0",
    noOfBufferPlots: 0,
    soldPlots,
    activePlots,
    remark: "",
    description: descriptions[Math.floor(r(11) * descriptions.length)],
    plotsDetail: [],
  };
}

// ─────────────────────────────────────────────────────────────
// Full hand-crafted mock data (mirrors lib/data/properties.ts)
// ─────────────────────────────────────────────────────────────
const HAND_CRAFTED = {
  "BLOCK-001": {
    id: "BLOCK-001", blockNumber: 1, zone: "Zone I G+1", status: "available", price: 0,
    primaryPlots: "P 1,2,3,4", noOfPlots: 4, area: 1600, plotSize: "400",
    bufferPlots: "0", noOfBufferPlots: 0, soldPlots: 0, activePlots: 4,
    remark: "Tulu Dimtu Real Estate",
    description: "Bare Land. Its located at the boarder edge of the site, adjacent to the main road.",
    plotsDetail: [
      {
        plotNumber:"1", plotSize:400, builtArea:"320 m²", purchaserName:"Tulu Dimtu Real Estate",
        titleDeedsStatus:"", constructionStatus:"", remark:"",
        houseType:"Villa", floors:2, bedrooms:4, bathrooms:3,
        livingRooms:1, kitchen:1, dining:1, garage:2,
        balcony:true, garden:true, rooftop:false,
        orientation:"North-East Facing", yearBuilt:2024,
        ownershipHistory:[
          { ownerName:"Tulu Dimtu Real Estate", transferDate:"2024-05-12", status:"Current", notes:"Developer registration" },
          { ownerName:"Ministry of Land", transferDate:"2023-11-04", status:"Previous", notes:"Initial allocation" }
        ]
      },
      { plotNumber:"2", plotSize:400, builtArea:"", purchaserName:"Tulu Dimtu Real Estate", titleDeedsStatus:"", constructionStatus:"", remark:"Bare Land. Its located at the border edge of the site, adjacent to the main road.", houseType:"Townhouse", floors:2, bedrooms:3, bathrooms:2, livingRooms:1, kitchen:1, dining:1, garage:1, balcony:true, garden:false, rooftop:false, orientation:"South Facing" },
      { plotNumber:"3", plotSize:400, builtArea:"", purchaserName:"Tulu Dimtu Real Estate", titleDeedsStatus:"", constructionStatus:"", remark:"", houseType:"Villa", floors:1, bedrooms:3, bathrooms:2, livingRooms:1, kitchen:1, dining:1, garage:1, balcony:false, garden:true, rooftop:true, orientation:"West Facing" },
      { plotNumber:"4", plotSize:400, builtArea:"", purchaserName:"Tulu Dimtu Real Estate", titleDeedsStatus:"", constructionStatus:"", remark:"", houseType:"Duplex", floors:2, bedrooms:5, bathrooms:4, livingRooms:2, kitchen:1, dining:1, garage:2, balcony:true, garden:true, rooftop:true, orientation:"East Facing", yearBuilt:2025 },
    ]
  },
  "BLOCK-002": {
    id:"BLOCK-002", blockNumber:2, zone:"Zone I G+1", status:"reserved", price:0,
    primaryPlots:"P 1-14", noOfPlots:14, area:7000, plotSize:"500",
    bufferPlots:"0", noOfBufferPlots:0, soldPlots:13, activePlots:1,
    remark:"P8 - In House Sale", description:"",
    plotsDetail:[
      { plotNumber:"1",  plotSize:500, builtArea:"", purchaserName:"Nuru",                  titleDeedsStatus:"", constructionStatus:"", remark:"" },
      { plotNumber:"2",  plotSize:500, builtArea:"", purchaserName:"Nuru",                  titleDeedsStatus:"", constructionStatus:"", remark:"Sold without written agreement" },
      { plotNumber:"3",  plotSize:500, builtArea:"", purchaserName:"Yahya Aliye",            titleDeedsStatus:"", constructionStatus:"", remark:"" },
      { plotNumber:"4",  plotSize:500, builtArea:"", purchaserName:"Abduljebar",             titleDeedsStatus:"", constructionStatus:"", remark:"" },
      { plotNumber:"5",  plotSize:500, builtArea:"", purchaserName:"Mickey",                 titleDeedsStatus:"", constructionStatus:"", remark:"" },
      { plotNumber:"6",  plotSize:500, builtArea:"", purchaserName:"Nejat",                  titleDeedsStatus:"", constructionStatus:"", remark:"Jemal's Wife" },
      { plotNumber:"7",  plotSize:500, builtArea:"", purchaserName:"Asefa",                  titleDeedsStatus:"", constructionStatus:"", remark:"" },
      { plotNumber:"8",  plotSize:500, builtArea:"", purchaserName:"Idris Jibrel",           titleDeedsStatus:"", constructionStatus:"", remark:"In House Sale ??" },
      { plotNumber:"9",  plotSize:500, builtArea:"", purchaserName:"Ahmed Tusa",             titleDeedsStatus:"Issued", constructionStatus:"", remark:"" },
      { plotNumber:"10", plotSize:500, builtArea:"", purchaserName:"Yahya Aliye",            titleDeedsStatus:"Issued", constructionStatus:"", remark:"" },
      { plotNumber:"11", plotSize:500, builtArea:"", purchaserName:"Rahma Hussein",          titleDeedsStatus:"Issued", constructionStatus:"", remark:"Initially it was an In House Sale,then Rahma sold it to third party." },
      { plotNumber:"12", plotSize:500, builtArea:"", purchaserName:"Rahma Hussein",          titleDeedsStatus:"Issued", constructionStatus:"", remark:"Currently title is under a different buyer." },
      { plotNumber:"13", plotSize:500, builtArea:"", purchaserName:"......................", titleDeedsStatus:"", constructionStatus:"", remark:"Sold Via Amabassador Aman (1/5)" },
      { plotNumber:"14", plotSize:500, builtArea:"", purchaserName:"......................", titleDeedsStatus:"", constructionStatus:"", remark:"Sold Via Amabassador Aman (2/5)" },
    ]
  },
  "BLOCK-003": {
    id:"BLOCK-003", blockNumber:3, zone:"Zone I G+1", status:"reserved", price:0,
    primaryPlots:"P 1-6", noOfPlots:6, area:3100, plotSize:"500-600",
    bufferPlots:"0", noOfBufferPlots:0, soldPlots:5, activePlots:1,
    remark:"P3 - In House Sale", description:"",
    plotsDetail:[
      { plotNumber:"1", plotSize:600, builtArea:"", purchaserName:"Mustefa Usman",    titleDeedsStatus:"", constructionStatus:"", remark:"100 Sq.M addition to the standard Plot Size." },
      { plotNumber:"2", plotSize:500, builtArea:"", purchaserName:"Nesanet",           titleDeedsStatus:"", constructionStatus:"", remark:"" },
      { plotNumber:"3", plotSize:500, builtArea:"", purchaserName:"Gibril Kadi",       titleDeedsStatus:"", constructionStatus:"", remark:"In House Sale ??" },
      { plotNumber:"4", plotSize:500, builtArea:"", purchaserName:"Sileshi Gezahegn",  titleDeedsStatus:"", constructionStatus:"", remark:"" },
      { plotNumber:"5", plotSize:500, builtArea:"", purchaserName:"Gezahegn",          titleDeedsStatus:"", constructionStatus:"", remark:"Sileshi's Father" },
      { plotNumber:"6", plotSize:500, builtArea:"", purchaserName:"Shemelis",          titleDeedsStatus:"", constructionStatus:"", remark:"" },
    ]
  },
  "BLOCK-004": {
    id:"BLOCK-004", blockNumber:4, zone:"Zone I G+1", status:"sold", price:0,
    primaryPlots:"P 1-10", noOfPlots:10, area:2000, plotSize:"200",
    bufferPlots:"0", noOfBufferPlots:0, soldPlots:10, activePlots:0, remark:"", description:"",
    plotsDetail:[
      { plotNumber:"1",  plotSize:200, builtArea:"", purchaserName:"Alemayehu Dagne",           titleDeedsStatus:"", constructionStatus:"", remark:"" },
      { plotNumber:"2",  plotSize:200, builtArea:"", purchaserName:"Hana Melese",               titleDeedsStatus:"", constructionStatus:"", remark:"" },
      { plotNumber:"3",  plotSize:200, builtArea:"", purchaserName:"Genet Birhan",              titleDeedsStatus:"", constructionStatus:"", remark:"" },
      { plotNumber:"4",  plotSize:200, builtArea:"", purchaserName:"Yared Getahun",             titleDeedsStatus:"", constructionStatus:"", remark:"" },
      { plotNumber:"5",  plotSize:200, builtArea:"", purchaserName:"Mamushet Aregaw",           titleDeedsStatus:"", constructionStatus:"", remark:"" },
      { plotNumber:"6",  plotSize:200, builtArea:"", purchaserName:"Daniel Tesfa",              titleDeedsStatus:"", constructionStatus:"", remark:"" },
      { plotNumber:"7",  plotSize:200, builtArea:"", purchaserName:"Janberu Tadese",            titleDeedsStatus:"", constructionStatus:"", remark:"" },
      { plotNumber:"8",  plotSize:200, builtArea:"", purchaserName:"Dr.Daniel Tekle G/Egziabher", titleDeedsStatus:"", constructionStatus:"", remark:"" },
      { plotNumber:"9",  plotSize:200, builtArea:"", purchaserName:"",                          titleDeedsStatus:"", constructionStatus:"", remark:"" },
      { plotNumber:"10", plotSize:200, builtArea:"", purchaserName:"",                          titleDeedsStatus:"", constructionStatus:"", remark:"" },
    ]
  },
};

// ─────────────────────────────────────────────────────────────
// Build the full 44-block array (hand-crafted overrides + generated)
// ─────────────────────────────────────────────────────────────
const TOTAL_BLOCKS = 44;
const allProperties = Array.from({ length: TOTAL_BLOCKS }, (_, i) => {
  const num = i + 1;
  const id  = `BLOCK-${num.toString().padStart(3, "0")}`;
  return HAND_CRAFTED[id] ?? generateProperty(num);
});

// ─────────────────────────────────────────────────────────────
// Insert helpers
// ─────────────────────────────────────────────────────────────
async function upsertProperty(client, p) {
  await client.query(
    `INSERT INTO properties
       (id, block_number, zone, status, price, primary_plots, no_of_plots,
        area, plot_size, buffer_plots, no_of_buffer_plots, sold_plots,
        active_plots, remark, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     ON CONFLICT (id) DO UPDATE SET
       block_number      = EXCLUDED.block_number,
       zone              = EXCLUDED.zone,
       status            = EXCLUDED.status,
       price             = EXCLUDED.price,
       primary_plots     = EXCLUDED.primary_plots,
       no_of_plots       = EXCLUDED.no_of_plots,
       area              = EXCLUDED.area,
       plot_size         = EXCLUDED.plot_size,
       buffer_plots      = EXCLUDED.buffer_plots,
       no_of_buffer_plots= EXCLUDED.no_of_buffer_plots,
       sold_plots        = EXCLUDED.sold_plots,
       active_plots      = EXCLUDED.active_plots,
       remark            = EXCLUDED.remark,
       description       = EXCLUDED.description,
       updated_at        = NOW()`,
    [
      p.id, p.blockNumber, p.zone, p.status, p.price,
      p.primaryPlots, p.noOfPlots, p.area, p.plotSize,
      p.bufferPlots, p.noOfBufferPlots, p.soldPlots,
      p.activePlots, p.remark, p.description,
    ]
  );
}

async function insertPlotDetails(client, blockId, plots) {
  // Clear existing child rows (clean re-seed)
  const existing = await client.query(
    `SELECT id FROM plot_details WHERE block_id = $1`, [blockId]
  );
  for (const row of existing.rows) {
    await client.query(`DELETE FROM ownership_history WHERE plot_detail_id = $1`, [row.id]);
    await client.query(`DELETE FROM payment_records   WHERE plot_detail_id = $1`, [row.id]);
  }
  await client.query(`DELETE FROM plot_details WHERE block_id = $1`, [blockId]);

  for (const plot of plots) {
    const res = await client.query(
      `INSERT INTO plot_details
         (block_id, plot_number, plot_size, built_area, purchaser_name,
          title_deeds_status, construction_status, remark,
          house_type, floors, bedrooms, bathrooms, living_rooms,
          kitchen, dining, garage, balcony, garden, rooftop,
          orientation, year_built, contractor_name, reference_no)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING id`,
      [
        blockId, plot.plotNumber, plot.plotSize, plot.builtArea ?? "",
        plot.purchaserName ?? "", plot.titleDeedsStatus ?? "",
        plot.constructionStatus ?? "", plot.remark ?? "",
        plot.houseType ?? null, plot.floors ?? null,
        plot.bedrooms ?? null, plot.bathrooms ?? null,
        plot.livingRooms ?? null, plot.kitchen ?? null,
        plot.dining ?? null, plot.garage ?? null,
        plot.balcony ?? false, plot.garden ?? false,
        plot.rooftop ?? false, plot.orientation ?? null,
        plot.yearBuilt ?? null, plot.contractorName ?? null,
        plot.referenceNo ?? null,
      ]
    );

    const plotDetailId = res.rows[0].id;

    // Ownership history
    for (const oh of (plot.ownershipHistory ?? [])) {
      await client.query(
        `INSERT INTO ownership_history (plot_detail_id, owner_name, transfer_date, status, notes)
         VALUES ($1,$2,$3,$4,$5)`,
        [plotDetailId, oh.ownerName, oh.transferDate || null, oh.status, oh.notes ?? null]
      );
    }

    // Payment records
    for (const pr of (plot.paymentSchedule ?? [])) {
      await client.query(
        `INSERT INTO payment_records
           (payment_ref, plot_detail_id, description, amount, currency,
            due_date, paid_date, status, notified, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          pr.id, plotDetailId, pr.description, pr.amount, pr.currency,
          pr.dueDate || null, pr.paidDate || null,
          pr.status, pr.notified ?? false, pr.notes ?? null,
        ]
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Main seed runner
// ─────────────────────────────────────────────────────────────
async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("[Seed] Connected to database.\n");

  let propCount  = 0;
  let plotCount  = 0;
  let ownerCount = 0;
  let payCount   = 0;

  for (const prop of allProperties) {
    process.stdout.write(`[Seed] ${prop.id} (Block ${prop.blockNumber})... `);

    await upsertProperty(client, prop);
    propCount++;

    const plots = prop.plotsDetail ?? [];
    if (plots.length > 0) {
      await insertPlotDetails(client, prop.id, plots);
      for (const p of plots) {
        plotCount++;
        ownerCount += (p.ownershipHistory ?? []).length;
        payCount   += (p.paymentSchedule  ?? []).length;
      }
      process.stdout.write(`${plots.length} plots\n`);
    } else {
      process.stdout.write(`(generated — no plot detail)\n`);
    }
  }

  await client.end();

  console.log("\n[Seed] ✅  Done!");
  console.log(`[Seed]   Properties  : ${propCount}`);
  console.log(`[Seed]   Plot details: ${plotCount}`);
  console.log(`[Seed]   Ownerships  : ${ownerCount}`);
  console.log(`[Seed]   Payments    : ${payCount}`);
  console.log("\n[Seed] Next step: update your app API routes to read from DB instead of localStorage.");
}

seed().catch((err) => {
  console.error("[Seed] ❌ Fatal error:", err.message);
  process.exit(1);
});

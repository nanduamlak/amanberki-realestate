/**
 * seed-properties.ts
 * Imports the real property data from lib/data/properties and inserts
 * everything into PostgreSQL.
 *
 * Run with:  npm run db:seed
 * (which calls: tsx scripts/seed-properties.ts)
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import pg from "pg";
import { properties } from "../lib/data/properties";
import type { PlotDetail } from "../lib/data/properties";

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is not set in .env.local");
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// Upsert one property (block) row
// ─────────────────────────────────────────────────────────────
async function upsertProperty(client: pg.Client, p: (typeof properties)[0]) {
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
      p.id, p.blockNumber, p.zone, p.status, p.price,
      p.primaryPlots, p.noOfPlots, p.area, p.plotSize,
      p.bufferPlots, p.noOfBufferPlots, p.soldPlots,
      p.activePlots, p.remark, p.description,
    ]
  );
}

// ─────────────────────────────────────────────────────────────
// Insert plot details + child records for one block
// ─────────────────────────────────────────────────────────────
async function insertPlotDetails(
  client: pg.Client,
  blockId: string,
  plots: PlotDetail[]
) {
  // Clean existing child rows first (idempotent re-seed)
  const existing = await client.query<{ id: number }>(
    `SELECT id FROM plot_details WHERE block_id = $1`,
    [blockId]
  );
  for (const row of existing.rows) {
    await client.query(`DELETE FROM ownership_history WHERE plot_detail_id = $1`, [row.id]);
    await client.query(`DELETE FROM payment_records   WHERE plot_detail_id = $1`, [row.id]);
  }
  await client.query(`DELETE FROM plot_details WHERE block_id = $1`, [blockId]);

  for (const plot of plots) {
    const res = await client.query<{ id: number }>(
      `INSERT INTO plot_details
         (block_id, plot_number, plot_size, built_area, purchaser_name,
          title_deeds_status, construction_status, remark,
          house_type, floors, bedrooms, bathrooms, living_rooms,
          kitchen, dining, garage, balcony, garden, rooftop,
          orientation, year_built, contractor_name, reference_no)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING id`,
      [
        blockId,
        plot.plotNumber,
        plot.plotSize,
        plot.builtArea ?? "",
        plot.purchaserName ?? "",
        plot.titleDeedsStatus ?? "",
        plot.constructionStatus ?? "",
        plot.remark ?? "",
        plot.houseType ?? null,
        plot.floors ?? null,
        plot.bedrooms ?? null,
        plot.bathrooms ?? null,
        plot.livingRooms ?? null,
        plot.kitchen ?? null,
        plot.dining ?? null,
        plot.garage ?? null,
        plot.balcony ?? false,
        plot.garden ?? false,
        plot.rooftop ?? false,
        plot.orientation ?? null,
        plot.yearBuilt ?? null,
        plot.contractorName ?? null,
        plot.referenceNo ?? null,
      ]
    );

    const plotDetailId = res.rows[0].id;

    for (const oh of plot.ownershipHistory ?? []) {
      await client.query(
        `INSERT INTO ownership_history
           (plot_detail_id, owner_name, transfer_date, status, notes)
         VALUES ($1,$2,$3,$4,$5)`,
        [plotDetailId, oh.ownerName, oh.transferDate || null, oh.status, oh.notes ?? null]
      );
    }

    for (const pr of plot.paymentSchedule ?? []) {
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
// Main
// ─────────────────────────────────────────────────────────────
async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log(`[Seed] Connected — seeding ${properties.length} blocks...\n`);

  let propCount  = 0;
  let plotCount  = 0;
  let ownerCount = 0;
  let payCount   = 0;

  for (const prop of properties) {
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
      process.stdout.write(`(no plot detail)\n`);
    }
  }

  await client.end();

  console.log("\n[Seed] ✅  Done!");
  console.log(`[Seed]   Properties  : ${propCount}`);
  console.log(`[Seed]   Plot details: ${plotCount}`);
  console.log(`[Seed]   Ownerships  : ${ownerCount}`);
  console.log(`[Seed]   Payments    : ${payCount}`);
}

seed().catch((err) => {
  console.error("[Seed] ❌ Fatal:", err.message);
  process.exit(1);
});

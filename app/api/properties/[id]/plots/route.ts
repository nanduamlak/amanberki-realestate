import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";

type Ctx = { params: Promise<{ id: string }> };

// ─── Input validation ─────────────────────────────────────────
// Ensures required fields are present and the correct type before
// they touch the database.
function validatePlot(p: Record<string, unknown>): string | null {
  if (!p.plotNumber || typeof p.plotNumber !== "string" || !p.plotNumber.trim()) {
    return "plotNumber is required and must be a non-empty string";
  }
  if (p.plotSize !== undefined && (isNaN(Number(p.plotSize)) || Number(p.plotSize) < 0)) {
    return "plotSize must be a non-negative number";
  }
  if (p.floors    !== undefined && p.floors    !== null && (!Number.isInteger(Number(p.floors))    || Number(p.floors)    < 0)) return "floors must be a non-negative integer";
  if (p.bedrooms  !== undefined && p.bedrooms  !== null && (!Number.isInteger(Number(p.bedrooms))  || Number(p.bedrooms)  < 0)) return "bedrooms must be a non-negative integer";
  if (p.bathrooms !== undefined && p.bathrooms !== null && (!Number.isInteger(Number(p.bathrooms)) || Number(p.bathrooms) < 0)) return "bathrooms must be a non-negative integer";
  return null;
}

// ─── DB error wrapper ─────────────────────────────────────────
// Catches unexpected DB errors and returns a clean 500 instead of
// leaking a stack trace to the client.
async function withDB<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[API:plots] ${label}:`, err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// ─── Shape mapper ─────────────────────────────────────────────
function toPlot(row: Record<string, unknown>) {
  return {
    id:                 row.id,
    blockId:            row.block_id,
    plotNumber:         row.plot_number,
    plotSize:           Number(row.plot_size),
    builtArea:          row.built_area,
    purchaserName:      row.purchaser_name,
    titleDeedsStatus:   row.title_deeds_status,
    constructionStatus: row.construction_status,
    remark:             row.remark,
    houseType:          row.house_type,
    floors:             row.floors,
    bedrooms:           row.bedrooms,
    bathrooms:          row.bathrooms,
    livingRooms:        row.living_rooms,
    kitchen:            row.kitchen,
    dining:             row.dining,
    garage:             row.garage,
    balcony:            row.balcony,
    garden:             row.garden,
    rooftop:            row.rooftop,
    orientation:        row.orientation,
    yearBuilt:          row.year_built,
    contractorName:     row.contractor_name,
    referenceNo:        row.reference_no,
    ownershipHistory:   (row.ownership_history as unknown[]) ?? [],
    paymentSchedule:    (row.payment_schedule  as unknown[]) ?? [],
  };
}

// ─── GET /api/properties/[id]/plots ──────────────────────────
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  const result = await withDB(() => query(
    `SELECT
       pd.*,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object(
           'id',           oh.id,
           'ownerName',    oh.owner_name,
           'transferDate', oh.transfer_date,
           'status',       oh.status,
           'notes',        oh.notes
         )) FILTER (WHERE oh.id IS NOT NULL),
         '[]'
       ) AS ownership_history,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object(
           'id',          pr.payment_ref,
           'description', pr.description,
           'amount',      pr.amount,
           'currency',    pr.currency,
           'dueDate',     pr.due_date,
           'paidDate',    pr.paid_date,
           'status',      pr.status,
           'notified',    pr.notified,
           'notes',       pr.notes
         )) FILTER (WHERE pr.id IS NOT NULL),
         '[]'
       ) AS payment_schedule
     FROM plot_details pd
     LEFT JOIN ownership_history oh ON oh.plot_detail_id = pd.id
     LEFT JOIN payment_records   pr ON pr.plot_detail_id = pd.id
     WHERE pd.block_id = $1
     GROUP BY pd.id
     ORDER BY pd.plot_number`,
    [id]
  ), "GET plots");

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.rows.map(toPlot));
}

// ─── POST /api/properties/[id]/plots ─────────────────────────
export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "super_admin"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

  const { id } = await params;
  const p: Record<string, unknown> = await req.json();

  const validationError = validatePlot(p);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const result = await withDB(async () => {
    const res = await query(
      `INSERT INTO plot_details
         (block_id, plot_number, plot_size, built_area, purchaser_name,
          title_deeds_status, construction_status, remark,
          house_type, floors, bedrooms, bathrooms, living_rooms,
          kitchen, dining, garage, balcony, garden, rooftop,
          orientation, year_built, contractor_name, reference_no)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING id`,
      [
        id, p.plotNumber, p.plotSize ?? 0, p.builtArea ?? "",
        p.purchaserName ?? "", p.titleDeedsStatus ?? "", p.constructionStatus ?? "",
        p.remark ?? "", p.houseType ?? null, p.floors ?? null,
        p.bedrooms ?? null, p.bathrooms ?? null, p.livingRooms ?? null,
        p.kitchen ?? null, p.dining ?? null, p.garage ?? null,
        p.balcony ?? false, p.garden ?? false, p.rooftop ?? false,
        p.orientation ?? null, p.yearBuilt ?? null,
        p.contractorName ?? null, p.referenceNo ?? null,
      ]
    );

    const plotDetailId: number = res.rows[0].id;
    await syncOwnership(plotDetailId, (p.ownershipHistory as Record<string, unknown>[]) ?? []);
    await syncPayments(plotDetailId,  (p.paymentSchedule  as Record<string, unknown>[]) ?? []);
    await refreshBlockCounts(id);

    return NextResponse.json({ id: plotDetailId }, { status: 201 });
  }, "POST plot");

  return result as NextResponse;
}

// ─── PUT /api/properties/[id]/plots ──────────────────────────
export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "super_admin"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

  const { id } = await params;
  const p: Record<string, unknown> = await req.json();

  const validationError = validatePlot(p);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const result = await withDB(async () => {
    const found = await query(
      `SELECT id FROM plot_details WHERE block_id=$1 AND plot_number=$2`,
      [id, p.plotNumber]
    );
    if (!found.rows.length) {
      return NextResponse.json({ error: "Plot not found" }, { status: 404 });
    }
    const plotDetailId: number = found.rows[0].id;

    await query(
      `UPDATE plot_details SET
         plot_size           = $1,  built_area          = $2,
         purchaser_name      = $3,  title_deeds_status  = $4,
         construction_status = $5,  remark              = $6,
         house_type          = $7,  floors              = $8,
         bedrooms            = $9,  bathrooms           = $10,
         living_rooms        = $11, kitchen             = $12,
         dining              = $13, garage              = $14,
         balcony             = $15, garden              = $16,
         rooftop             = $17, orientation         = $18,
         year_built          = $19, contractor_name     = $20,
         reference_no        = $21, updated_at          = NOW()
       WHERE id = $22`,
      [
        p.plotSize, p.builtArea ?? "", p.purchaserName ?? "",
        p.titleDeedsStatus ?? "", p.constructionStatus ?? "", p.remark ?? "",
        p.houseType ?? null, p.floors ?? null, p.bedrooms ?? null,
        p.bathrooms ?? null, p.livingRooms ?? null, p.kitchen ?? null,
        p.dining ?? null, p.garage ?? null,
        p.balcony ?? false, p.garden ?? false, p.rooftop ?? false,
        p.orientation ?? null, p.yearBuilt ?? null,
        p.contractorName ?? null, p.referenceNo ?? null,
        plotDetailId,
      ]
    );

    await syncOwnership(plotDetailId, (p.ownershipHistory as Record<string, unknown>[]) ?? []);
    await syncPayments(plotDetailId,  (p.paymentSchedule  as Record<string, unknown>[]) ?? []);
    await refreshBlockCounts(id);

    return NextResponse.json({ success: true });
  }, "PUT plot");

  return result as NextResponse;
}

// ─── DELETE /api/properties/[id]/plots?plotNumber=X ──────────
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "super_admin"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

  const { id } = await params;
  const plotNumber = req.nextUrl.searchParams.get("plotNumber");
  if (!plotNumber) return NextResponse.json({ error: "plotNumber is required" }, { status: 400 });

  const result = await withDB(async () => {
    await query(
      `DELETE FROM plot_details WHERE block_id=$1 AND plot_number=$2`,
      [id, plotNumber]
    );
    await refreshBlockCounts(id);
    return NextResponse.json({ success: true });
  }, "DELETE plot");

  return result as NextResponse;
}

// ─── Sync helpers (bulk inserts) ──────────────────────────────
// Uses a single parameterized query instead of N sequential round-trips.
async function syncOwnership(plotDetailId: number, list: Record<string, unknown>[]) {
  await query(`DELETE FROM ownership_history WHERE plot_detail_id=$1`, [plotDetailId]);
  if (!list.length) return;

  const values: unknown[] = [];
  const placeholders = list.map((oh, i) => {
    const base = i * 5;
    values.push(plotDetailId, oh.ownerName, oh.transferDate || null, oh.status, oh.notes ?? null);
    return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5})`;
  });

  await query(
    `INSERT INTO ownership_history (plot_detail_id, owner_name, transfer_date, status, notes)
     VALUES ${placeholders.join(",")}`,
    values
  );
}

async function syncPayments(plotDetailId: number, list: Record<string, unknown>[]) {
  await query(`DELETE FROM payment_records WHERE plot_detail_id=$1`, [plotDetailId]);
  if (!list.length) return;

  const values: unknown[] = [];
  const placeholders = list.map((pr, i) => {
    const base = i * 10;
    values.push(
      pr.id, plotDetailId, pr.description, pr.amount, pr.currency,
      pr.dueDate || null, pr.paidDate || null,
      pr.status ?? "pending", pr.notified ?? false, pr.notes ?? null
    );
    return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10})`;
  });

  await query(
    `INSERT INTO payment_records
       (payment_ref, plot_detail_id, description, amount, currency,
        due_date, paid_date, status, notified, notes)
     VALUES ${placeholders.join(",")}`,
    values
  );
}

// ─── Block aggregate counter ──────────────────────────────────
async function refreshBlockCounts(blockId: string) {
  await query(
    `UPDATE properties SET
       no_of_plots  = (SELECT COUNT(*) FROM plot_details WHERE block_id=$1),
       sold_plots   = (SELECT COUNT(*) FROM plot_details WHERE block_id=$1
                       AND purchaser_name NOT ILIKE '%tulu dimtu%'
                       AND purchaser_name <> ''),
       active_plots = (SELECT COUNT(*) FROM plot_details WHERE block_id=$1
                       AND (purchaser_name ILIKE '%tulu dimtu%' OR purchaser_name = '')),
       updated_at   = NOW()
     WHERE id=$1`,
    [blockId]
  );
}

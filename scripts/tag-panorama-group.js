require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL });

// All orange-colored purchaser names from the provided Excel screenshots = Panorama group
const PANORAMA_NAMES = [
  // Block 4
  "ALEMAYEHU DAGNE ZEMARIAN",
  "HANA MELESE GIZAW",
  "GENET BIRHAN",
  "YARED GETAHUN",
  "MAMUSHET AREGAW",
  "DANIEL TESFA",
  "JENBERU TADESSE NADEW",
  "DR.DANIEL TEKLE G/EGZIABHER",
  "YOSEF MICHAEL AMBAYE",

  // Block 5
  "ABERA ZEWEDU TESEMA",
  "DENNENESH GENANAW",
  "GETU TEDLA AYELE",
  "DR. MEKURIA AREGAW",
  "SHEWANDAGNE SEIFU",
  "ROMAN SEIFU AND TED WONDAGEGNEH",
  "ETALEM DEMISE",
  "DANIEL SAMUEL NEGASH",
  "MEAZA W/MARIAM & GIRMA W/T",
  "BELETE DEMISEW W",
  "ZEGEYE ABEBE & NIGISTE ASEFAW",
  "SIRAKE ZEWEDE & SABA ABREHAM",
  "HIRUT YIMERE/HAILU TADESSE",
  "ADDISALEM W/G.&YOSEF ALEME",

  // Block 6 (all 18)
  "ESKEDAR MENGESHA",
  "ZERIHUN MEKONNEN DAMTE",
  "GETENET TESHOME METAFERIA",
  "SELAMAWIT HABTE HAGOS",
  "MERUTSE GIRMAI & LEMLEM G/HIWOTE",
  "ROMAN ADMASU",
  "HABTAMU ASEFA",
  "MUNIRA ABDULLAHI",
  "HIRUT DERESE WOLDE",
  "AZEBE MOGESE",
  "MENBERE FIKADE",
  "ELENI TEKLE G/EGEZIHABERE",
  "GIRMA NEGASH & BETHLIHEM Z.",
  "ALEMAZ TECHANE",
  "REBECA G/HIWOT SOLOMON",
  "KEHASENA W/MIHRET",
  "EWNETU ABTE & HIRUT NIGATU",
  "NETSANET GIZAW &SEIFU W/YOHANES",

  // Block 7 (all 18 except empty)
  "HALEWIYA OSMAN SEMERAI",
  "HIWOT ABEBE",
  "ABERA KIDANU HABTE",
  "SAMSON TESFAYE G/EGIZEYABHER",
  "GETACHEW VENERA GEMARI",
  "ALMAW BIRU CHIKUALA",
  "GETACHEW ARAYA",
  "FEDILA MOHAMMED REDI",
  "MERID ADEMASU BEYENE",
  "WELLELA HIRPHASA",
  "ALEMAZ ABERA MAMO",
  "SAADA ABDULLAHI ALI",
  "LEMELEM ALEMAYEHU",
  "AMIN JEMAL",
  "FIKRE AMARE",
  "FITSUM KEBEDE",
  "ALISE PAROUNAKIAN YOHANESE",

  // Block 8 (only orange rows: 1, 5, 6, 7)
  "MIHIRET SISAY",
  "ABEBA TAFA",
  "MOLALET TSEDEKE W/GIORGIS",
  "SELAM DESTA KEBEDE",
];

c.connect().then(async () => {
  console.log("[Panorama] Connected.\n");

  // First reset any accidental group assignments
  const reset = await c.query(
    `UPDATE plot_details SET buyer_group = NULL WHERE buyer_group = 'Panorama'`
  );
  console.log(`[Panorama] Cleared ${reset.rowCount} old Panorama tags.`);

  let total = 0;
  let notFound = [];

  for (const name of PANORAMA_NAMES) {
    // Use ILIKE for case-insensitive + TRIM for whitespace safety
    const res = await c.query(
      `UPDATE plot_details
       SET buyer_group = 'Panorama', updated_at = NOW()
       WHERE TRIM(UPPER(purchaser_name)) = $1
       RETURNING id, purchaser_name`,
      [name.trim().toUpperCase()]
    );
    if (res.rowCount > 0) {
      total += res.rowCount;
      console.log(`  ✅  ${res.rowCount}x  "${name}"`);
    } else {
      notFound.push(name);
      console.log(`  ⚠️   NOT FOUND: "${name}"`);
    }
  }

  console.log(`\n[Panorama] 🎉  Tagged ${total} plots as Panorama.`);
  if (notFound.length) {
    console.log(`\n[Panorama] ⚠️  ${notFound.length} names not found (may be empty plots or slightly different spelling):`);
    notFound.forEach(n => console.log(`  - "${n}"`));

    // Try fuzzy match for not-found ones
    console.log("\n[Panorama] Attempting fuzzy match for not-found names...");
    for (const name of notFound) {
      const words = name.trim().split(/\s+/).filter(w => w.length > 3);
      if (!words.length) continue;
      const res = await c.query(
        `SELECT id, purchaser_name FROM plot_details
         WHERE purchaser_name ILIKE $1 AND buyer_group IS NULL
         LIMIT 3`,
        [`%${words[0]}%`]
      );
      if (res.rows.length) {
        console.log(`  "${name}" ~ possible match:`, res.rows.map(r => r.purchaser_name));
      }
    }
  }

  // Final summary
  const summary = await c.query(
    `SELECT COUNT(*) FROM plot_details WHERE buyer_group = 'Panorama'`
  );
  console.log(`\n[Verify] Total Panorama plots in DB: ${summary.rows[0].count}`);

  await c.end();
}).catch(e => { console.error("[Error]", e.message); c.end(); });

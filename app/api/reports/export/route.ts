import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const tempFilename = `export_${crypto.randomUUID()}.xlsx`;
  const tempFilePath = path.join(process.cwd(), "scripts", tempFilename);

  try {
    const body = await req.json(); // body is Array of filtered plots
    
    // Spawn python process passing temp file path as argument
    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const python = spawn(pythonCmd, ["-u", "scripts/export_excel.py", tempFilePath]);
    
    // Write JSON to python stdin
    python.stdin.write(JSON.stringify(body));
    python.stdin.end();
    
    // Handle error logging
    let errData = "";
    python.stderr.on("data", (chunk) => {
      errData += chunk.toString();
    });
    
    return new Promise<NextResponse>((resolve) => {
      python.on("close", async (code) => {
        if (code !== 0) {
          console.error("[Excel Export API] Python error:", errData);
          resolve(NextResponse.json({ error: "Failed to generate Excel sheet", details: errData }, { status: 500 }));
          return;
        }
        
        try {
          // Read binary buffer from temporary file
          const buffer = await fs.readFile(tempFilePath);
          
          // Cleanup temp file immediately
          await fs.unlink(tempFilePath);
          
          resolve(new NextResponse(buffer, {
            status: 200,
            headers: {
              "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              "Content-Disposition": "attachment; filename=Tulu_Dimtu_Inventory_Ledger.xlsx",
              "Pragma": "no-cache",
              "Expires": "0"
            }
          }));
        } catch (readErr: any) {
          console.error("[Excel Export API] Error reading/deleting temp file:", readErr);
          resolve(NextResponse.json({ error: "Failed to retrieve generated file" }, { status: 500 }));
        }
      });
    });
  } catch (err: any) {
    console.error("[Excel Export API] Error:", err);
    // Cleanup on main catch if file exists
    try {
      await fs.unlink(tempFilePath);
    } catch {}
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}

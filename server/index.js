// server.js
import express from "express";
import cors from "cors";
import pkg from "pg";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { execFile } from "child_process";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());
// --- File upload storage to uploads/ ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".nc";
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const isNc = file.mimetype === "application/x-netcdf" || file.originalname.endsWith(".nc");
    if (!isNc) return cb(new Error("Only .nc NetCDF files are allowed"));
    cb(null, true);
  },
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

// Upload endpoint
app.post("/api/upload-nc", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    return res.status(200).json({
      message: "File uploaded",
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Failed to upload file" });
  }
});

// Analyze endpoint: run python analyzer with uploaded filename
app.post("/api/analyze-nc", express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: "filename is required" });
    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });

    const pythonScript = path.join(__dirname, "../analyzer/app.py");
    if (!fs.existsSync(pythonScript)) {
      return res.status(500).json({ error: "Python analyzer not found at analyzer/app.py" });
    }

    execFile("python3", [pythonScript, filePath], { timeout: 120000 }, (error, stdout, stderr) => {
      if (error) {
        console.error("Python error:", error, stderr);
        return res.status(500).json({ error: "Analysis failed", details: stderr?.toString() });
      }
      try {
        const result = JSON.parse(stdout.toString());
        return res.status(200).json(result);
      } catch (parseErr) {
        console.error("Failed to parse python output as JSON:", parseErr, stdout);
        return res.status(500).json({ error: "Invalid analysis output" });
      }
    });
  } catch (err) {
    console.error("Analyze error:", err);
    return res.status(500).json({ error: "Failed to analyze file" });
  }
});

// PostgreSQL connection (Docker configuration)
const pool = new Pool({
  user: process.env.DB_USER || "ayush", // your postgres username
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "postgres", // ✅ fixed
  password: process.env.DB_PASS || "secret123", // change if needed
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// --- API Routes ---

// 1) Get list of floats (unique platform_id)
app.get("/api/floats", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT platform_id FROM floats ORDER BY platform_id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching floats:", err);
    res.status(500).json({ error: "Failed to fetch floats" });
  }
});

// 2) Get measurements for a specific float
app.get("/api/floats/:platform_id/data", async (req, res) => {
  const { platform_id } = req.params;
  console.log("Requested platform_id:", platform_id);
  try {
    const result = await pool.query(
      `SELECT measurement_date, pressure_dbar, temperature_celsius, salinity_psu, latitude, longitude
       FROM floats
       WHERE platform_id = $1
       ORDER BY measurement_date, pressure_dbar`,
      [platform_id]
    );
    console.log(result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching float data:", err);
    res.status(500).json({ error: "Failed to fetch float data" });
  }
});
// Latest location for a float
app.get("/api/floats/:platform_id/latest", async (req, res) => {
  const { platform_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT platform_id, latitude, longitude
       FROM floats
       WHERE platform_id = $1
       ORDER BY measurement_date DESC
       LIMIT 1`,
      [platform_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No data found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching latest location:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all float locations for map overview
app.get("/api/floats/locations", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (platform_id) 
         platform_id, 
         latitude, 
         longitude,
         measurement_date
       FROM floats
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL
       ORDER BY platform_id, measurement_date DESC`
    );

    console.log(`Fetched ${result.rows.length} float locations for map`);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching float locations:", err);
    res.status(500).json({ error: "Failed to fetch float locations" });
  }
});


// Export all float data as CSV or JSON
app.get("/api/export", async (req, res) => {
  const format = (req.query.format || "csv").toLowerCase();
  try {
    const result = await pool.query(
      `SELECT platform_id, measurement_date, pressure_dbar, temperature_celsius, salinity_psu, latitude, longitude
       FROM floats
       ORDER BY platform_id, measurement_date, pressure_dbar`
    );

    const rows = result.rows || [];

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="argo_floats_${Date.now()}.json"`
      );
      return res.status(200).json(rows);
    }

    // Default to CSV
    const headers = [
      "platform_id",
      "measurement_date",
      "pressure_dbar",
      "temperature_celsius",
      "salinity_psu",
      "latitude",
      "longitude",
    ];

    const escapeCsv = (value) => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const csvLines = [headers.join(",")];
    for (const row of rows) {
      csvLines.push(
        [
          row.platform_id,
          row.measurement_date instanceof Date
            ? row.measurement_date.toISOString()
            : row.measurement_date,
          row.pressure_dbar,
          row.temperature_celsius,
          row.salinity_psu,
          row.latitude,
          row.longitude,
        ]
          .map(escapeCsv)
          .join(",")
      );
    }

    const csv = csvLines.join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="argo_floats_${Date.now()}.csv"`
    );
    return res.status(200).send(csv);
  } catch (err) {
    console.error("Error exporting data:", err);
    return res.status(500).json({ error: "Failed to export data" });
  }
});


// Export NetCDF (raw or filtered)
// GET /export-netcdf?filename=<optional>&variable=salinity&startDate=2023-03-01&endDate=2023-03-31&month=03&year=2023
app.get("/export-netcdf", async (req, res) => {
  try {
    const { filename, variable, startDate, endDate, month, year } = req.query;

    // Resolve source file: use provided filename in uploads or latest .nc in uploads
    const getLatestNcFile = () => {
      const files = fs
        .readdirSync(uploadDir)
        .filter((f) => f.toLowerCase().endsWith(".nc"))
        .map((f) => ({ f, mtime: fs.statSync(path.join(uploadDir, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);
      return files.length ? path.join(uploadDir, files[0].f) : null;
    };

    const srcPath = filename
      ? path.join(uploadDir, path.basename(filename))
      : getLatestNcFile();

    if (!srcPath || !fs.existsSync(srcPath)) {
      return res.status(404).json({ error: "NetCDF file not found in uploads/" });
    }

    // If no filters -> stream the original file
    const hasFilters = Boolean(variable || startDate || endDate || (month && year));
    if (!hasFilters) {
      res.setHeader("Content-Type", "application/x-netcdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.basename(srcPath)}"`
      );
      return fs.createReadStream(srcPath).pipe(res);
    }

    // Build filter window from month/year if provided
    let start = startDate;
    let end = endDate;
    if (month && year && (!start || !end)) {
      const m = String(month).padStart(2, "0");
      const y = String(year);
      start = start || `${y}-${m}-01`;
      // Compute end as last day of month
      const endDateObj = new Date(Number(y), Number(m), 0); // day 0 of next month = last day
      const endStr = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, "0")}-${String(endDateObj.getDate()).padStart(2, "0")}`;
      end = end || endStr;
    }

    // Create temp output file path
    const tmpOut = path.join(uploadDir, `export_${Date.now()}.nc`);

    // Use a small Python script with xarray to subset and write NetCDF
    const pyCode = `
import sys, json, os
import pandas as pd
try:
    import xarray as xr
except Exception as exc:
    print(json.dumps({"error": f"xarray not available: {exc}"}))
    sys.exit(1)

src = sys.argv[1]
dst = sys.argv[2]
var = sys.argv[3] if sys.argv[3] != "__NONE__" else None
start = sys.argv[4] if sys.argv[4] != "__NONE__" else None
end = sys.argv[5] if sys.argv[5] != "__NONE__" else None

try:
    ds = xr.open_dataset(src)
    # Try to find a time coordinate
    time_key = None
    for k in ["time", "TIME", "JULD", "juld"]:
        if k in ds.variables or k in ds.coords:
            time_key = k
            break

    # Apply time filter if available
    if time_key and (start or end):
        t = pd.to_datetime(ds[time_key].to_pandas(), errors='coerce')
        mask = pd.Series([True]*len(t))
        if start:
            mask &= t >= pd.to_datetime(start)
        if end:
            # include entire end day
            mask &= t <= pd.to_datetime(end) + pd.Timedelta(days=1)
        # index along time dim
        dim_name = ds[time_key].dims[0] if ds[time_key].dims else time_key
        ds = ds.sel({dim_name: mask.values})

    # If variable specified, keep it plus coordinates
    if var and var in ds:
        keep = {var: ds[var]}
        # Keep likely coords
        for ck in ["lat", "latitude", "LATITUDE", "lon", "longitude", "LONGITUDE", "PRES", "PRES_ADJUSTED", time_key]:
            if ck and ck in ds and ck not in keep:
                keep[ck] = ds[ck]
        ds = xr.Dataset(keep)

    ds.to_netcdf(dst)
    print(json.dumps({"ok": True, "path": dst}))
except Exception as exc:
    print(json.dumps({"error": str(exc)}))
    sys.exit(1)
`;

    const args = [
      "-c",
      pyCode,
      srcPath,
      tmpOut,
      variable ? String(variable) : "__NONE__",
      start ? String(start) : "__NONE__",
      end ? String(end) : "__NONE__",
    ];

    execFile("python3", args, { timeout: 120000 }, (error, stdout, stderr) => {
      const cleanup = () => {
        fs.existsSync(tmpOut) && fs.unlink(tmpOut, () => {});
      };

      if (error) {
        console.error("NetCDF export error:", error, stderr);
        cleanup();
        return res.status(500).json({ error: "Failed to export NetCDF", details: String(stderr || error.message) });
      }
      try {
        const out = JSON.parse(stdout.toString().trim() || "{}");
        if (!out.ok || !fs.existsSync(tmpOut)) {
          cleanup();
          return res.status(500).json({ error: out.error || "Export failed" });
        }
        res.setHeader("Content-Type", "application/x-netcdf");
        res.setHeader("Content-Disposition", `attachment; filename="argo_data.nc"`);
        const stream = fs.createReadStream(tmpOut);
        stream.on("close", cleanup);
        return stream.pipe(res);
      } catch (e) {
        cleanup();
        return res.status(500).json({ error: "Invalid export output", details: e.message });
      }
    });
  } catch (err) {
    console.error("Export NetCDF error:", err);
    return res.status(500).json({ error: "Failed to export NetCDF" });
  }
});

// Export human-readable data (CSV or JSON) using the same filters
// GET /export-readable?format=csv|json&filename=...&variable=...&startDate=...&endDate=...&month=...&year=...
app.get("/export-readable", async (req, res) => {
  try {
    const { filename, variable, startDate, endDate, month, year } = req.query;
    const format = (req.query.format || "csv").toString().toLowerCase();

    const getLatestNcFile = () => {
      const files = fs
        .readdirSync(uploadDir)
        .filter((f) => f.toLowerCase().endsWith(".nc"))
        .map((f) => ({ f, mtime: fs.statSync(path.join(uploadDir, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);
      return files.length ? path.join(uploadDir, files[0].f) : null;
    };

    const srcPath = filename
      ? path.join(uploadDir, path.basename(filename))
      : getLatestNcFile();

    if (!srcPath || !fs.existsSync(srcPath)) {
      return res.status(404).json({ error: "NetCDF file not found in uploads/" });
    }

    // Build filter window from month/year if provided
    let start = startDate;
    let end = endDate;
    if (month && year && (!start || !end)) {
      const m = String(month).padStart(2, "0");
      const y = String(year);
      start = start || `${y}-${m}-01`;
      const endDateObj = new Date(Number(y), Number(m), 0);
      const endStr = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, "0")}-${String(endDateObj.getDate()).padStart(2, "0")}`;
      end = end || endStr;
    }

    // Python that prints CSV/JSON to stdout
    const pyCode = `
import sys, json, pandas as pd
try:
    import xarray as xr
except Exception as exc:
    print(json.dumps({"error": f"xarray not available: {exc}"}))
    sys.exit(1)

src = sys.argv[1]
fmt = sys.argv[2]
var = sys.argv[3] if sys.argv[3] != "__NONE__" else None
start = sys.argv[4] if sys.argv[4] != "__NONE__" else None
end = sys.argv[5] if sys.argv[5] != "__NONE__" else None

try:
    ds = xr.open_dataset(src)
    # detect time/lat/lon/pressure/temp/sal variables
    def find(keys):
        for k in keys:
            if k in ds.variables or k in ds.coords:
                return k
        lower = {k.lower(): k for k in ds.variables.keys()}
        for k in keys:
            if k.lower() in lower:
                return lower[k.lower()]
        return None

    time_key = find(["time","TIME","JULD","juld"]) 
    lat_key = find(["latitude","LATITUDE","lat","LAT"]) 
    lon_key = find(["longitude","LONGITUDE","lon","LON"]) 
    pres_key = find(["pressure","PRES","PRES_ADJUSTED"]) 
    temp_key = find(["TEMP","TEMP_ADJUSTED","temperature"]) 
    sal_key = find(["PSAL","PSAL_ADJUSTED","salinity"]) 
    platform_key = find(["platform_number","PLATFORM_NUMBER","float_serial_no","FLOAT_SERIAL_NO","platform"]) 

    if time_key and (start or end):
        t = pd.to_datetime(ds[time_key].to_pandas(), errors='coerce')
        mask = pd.Series([True]*len(t))
        if start:
            mask &= t >= pd.to_datetime(start)
        if end:
            mask &= t <= pd.to_datetime(end) + pd.Timedelta(days=1)
        dim_name = ds[time_key].dims[0] if ds[time_key].dims else time_key
        ds = ds.sel({dim_name: mask.values})

    cols = []
    if platform_key and platform_key in ds: cols.append((platform_key, 'platform'))
    if time_key and time_key in ds: cols.append((time_key, 'time'))
    if lat_key and lat_key in ds: cols.append((lat_key, 'lat'))
    if lon_key and lon_key in ds: cols.append((lon_key, 'lon'))
    if pres_key and pres_key in ds: cols.append((pres_key, 'pressure'))
    if temp_key and temp_key in ds: cols.append((temp_key, 'temperature'))
    if sal_key and sal_key in ds: cols.append((sal_key, 'salinity'))
    # include requested variable if provided and not already in list
    if var and var in ds and all(var != c[0] for c in cols):
        cols.append((var, var))

    if not cols:
        print(json.dumps({"error": "No recognizable variables to export"}))
        sys.exit(1)

    df_parts = []
    for k, alias in cols:
        s = ds[k].to_pandas()
        s = s.reset_index()
        s = s.rename(columns={k: alias})
        # keep only alias column and any index columns like time dims
        df_parts.append(s)

    # merge on common index columns if possible
    from functools import reduce
    def smart_merge(a,b):
        common = [c for c in a.columns if c in b.columns and c not in [col for _, col in cols]]
        if not common:
            return pd.concat([a, b], axis=1)
        return pd.merge(a, b, on=common, how='outer')

    df = reduce(smart_merge, df_parts)

    # thin to reasonable size
    if len(df) > 100000:
        df = df.sample(100000, random_state=0).sort_index()

    if fmt == 'json':
        print(df.to_json(orient='records'))
    else:
        # csv
        print(df.to_csv(index=False))
except Exception as exc:
    print(json.dumps({"error": str(exc)}))
    sys.exit(1)
`;

    const args = ["-c", pyCode, srcPath, format, variable ? String(variable) : "__NONE__", start ? String(start) : "__NONE__", end ? String(end) : "__NONE__"];

    execFile("python3", args, { timeout: 120000 }, async (error, stdout, stderr) => {
      if (error) {
        console.error("Readable export error (python path):", error, stderr);
        // Fallback to database export if python/xarray not available
        try {
          const colMap = {
            salinity: "salinity_psu",
            temperature: "temperature_celsius",
            pressure: "pressure_dbar",
          };

          const selected = [];
          const wheres = [];
          const params = [];

          // Select a reasonable set of columns
          if (variable && colMap[String(variable).toLowerCase()]) {
            selected.push(colMap[String(variable).toLowerCase()] + " AS " + String(variable).toLowerCase());
          }
          selected.push(
            "platform_id",
            "measurement_date",
            "latitude",
            "longitude",
            "pressure_dbar",
            "temperature_celsius",
            "salinity_psu"
          );

          // Time filters
          let start = startDate;
          let end = endDate;
          if (month && year && (!start || !end)) {
            const m = String(month).padStart(2, "0");
            const y = String(year);
            start = start || `${y}-${m}-01`;
            const endDateObj = new Date(Number(y), Number(m), 0);
            const endStr = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, "0")}-${String(endDateObj.getDate()).padStart(2, "0")}`;
            end = end || endStr;
          }
          if (start) {
            params.push(start);
            wheres.push(`measurement_date >= $${params.length}`);
          }
          if (end) {
            params.push(end + " 23:59:59");
            wheres.push(`measurement_date <= $${params.length}`);
          }

          const sql = `SELECT ${[...new Set(selected)].join(",")} FROM floats ${wheres.length ? "WHERE " + wheres.join(" AND ") : ""} ORDER BY platform_id, measurement_date LIMIT 100000`;
          const result = await pool.query(sql, params);

          if (format === "json") {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="argo_data.json"`);
            return res.status(200).send(JSON.stringify(result.rows));
          }

          // CSV fallback
          const rows = result.rows || [];
          if (rows.length === 0) {
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="argo_data.csv"`);
            return res.status(200).send("");
          }
          const headers = Object.keys(rows[0]);
          const escapeCsv = (value) => {
            if (value === null || value === undefined) return "";
            const str = String(value);
            if (/[",\n]/.test(str)) {
              return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
          };
          const csvLines = [headers.join(",")];
          for (const row of rows) {
            csvLines.push(headers.map((h) => escapeCsv(row[h])).join(","));
          }
          const csv = csvLines.join("\n");
          res.setHeader("Content-Type", "text/csv; charset=utf-8");
          res.setHeader("Content-Disposition", `attachment; filename="argo_data.csv"`);
          return res.status(200).send(csv);
        } catch (dbErr) {
          console.error("Readable export DB fallback error:", dbErr);
          return res.status(500).json({ error: "Failed to export readable data" });
        }
      }
      const out = stdout.toString();
      // If output looks like a JSON error payload
      if (out.trim().startsWith("{")) {
        try {
          const j = JSON.parse(out);
          if (j && j.error) {
            return res.status(400).json(j);
          }
        } catch {}
      }

      if (format === "json") {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="argo_data.json"`);
        return res.status(200).send(out);
      }
      // default CSV
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="argo_data.csv"`);
      return res.status(200).send(out);
    });
  } catch (err) {
    console.error("Export Readable error:", err);
    return res.status(500).json({ error: "Failed to export readable data" });
  }
});

// Monthly average salinity & pressure for a float
app.get("/api/floats/:platform_id/monthly-avg", async (req, res) => {
  const { platform_id } = req.params;
  console.log(`Fetching monthly averages for platform: ${platform_id}`);
  try {
    const result = await pool.query(
      `SELECT 
         DATE_TRUNC('month', measurement_date) AS month,
         AVG(salinity_psu) AS avg_salinity,
         AVG(pressure_dbar) AS avg_pressure
       FROM floats
       WHERE platform_id = $1
       GROUP BY month
       ORDER BY month`,
      [platform_id]
    );

    console.log(`Monthly averages query returned ${result.rows.length} rows`);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching monthly averages:", err);
    res.status(500).json({ error: "Failed to fetch monthly averages" });
  }
});





// Monthly average temperature per pressure for a float
app.get("/api/floats/:platform_id/monthly-heatmap", async (req, res) => {
  const { platform_id } = req.params;
  console.log(`Fetching monthly heatmap for platform: ${platform_id}`);
  try {
    const result = await pool.query(
      `SELECT 
         DATE_TRUNC('month', measurement_date) AS month,
         pressure_dbar,
         AVG(temperature_celsius) AS avg_temperature
       FROM floats
       WHERE platform_id = $1
       GROUP BY month, pressure_dbar
       ORDER BY month, pressure_dbar`,
      [platform_id]
    );

    console.log(`Monthly heatmap query returned ${result.rows.length} rows`);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching monthly heatmap data:", err);
    res.status(500).json({ error: "Failed to fetch monthly heatmap data" });
  }
});




const PORT = 5001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

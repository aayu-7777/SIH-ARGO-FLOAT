// ExportNetCDF.jsx
import React, { useState, useMemo } from "react";

const ExportNetCDF = () => {
  const [filename, setFilename] = useState("");
  const [variable, setVariable] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [format, setFormat] = useState("netcdf"); // netcdf | csv | json
  const [error, setError] = useState(null);

  const hasFilters = useMemo(() => {
    return Boolean(variable || startDate || endDate || (month && year));
  }, [variable, startDate, endDate, month, year]);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filename) params.set("filename", filename);
    if (variable) params.set("variable", variable);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (month) params.set("month", month);
    if (year) params.set("year", year);
    return params.toString();
  };

  const handleDownload = async () => {
    setError(null);
    setDownloading(true);
    try {
      const qs = buildQueryString();
      const base = format === "netcdf" ? "export-netcdf" : "export-readable";
      const url = `http://localhost:5001/${base}${qs ? `?${qs}` : ""}${format !== "netcdf" ? `${qs ? "&" : "?"}format=${format}` : ""}`;
      // Fetch as blob to force download with custom name
      const resp = await fetch(url);
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `HTTP ${resp.status}`);
      }
      const blob = await resp.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = format === "netcdf" ? "argo_data.nc" : (format === "json" ? "argo_data.json" : "argo_data.csv");
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(dlUrl);
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white/90 shadow-lg mb-6">
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></div>
            <span>Data Export & Processing</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            <span className="bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 bg-clip-text text-transparent">
              Export NetCDF
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Export oceanographic data in multiple formats with advanced filtering options
          </p>
        </header>

        <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-white/90 mb-2 font-medium">Filename (optional, from uploads/)</label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="e.g., nodc_D1900816_277_...nc"
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-slate-400/50 focus:outline-none transition-all duration-300"
              />
              <p className="text-xs text-white/60 mt-2">If empty, latest .nc in uploads/ is used.</p>
            </div>

            <div>
              <label className="block text-sm text-white/90 mb-2 font-medium">Variable (optional)</label>
              <input
                type="text"
                value={variable}
                onChange={(e) => setVariable(e.target.value)}
                placeholder="e.g., salinity, temperature, PRES"
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-slate-400/50 focus:outline-none transition-all duration-300"
              />
              <p className="text-xs text-white/60 mt-2">If provided, export keeps this variable and common coordinates.</p>
            </div>

            <div>
              <label className="block text-sm text-white/90 mb-2 font-medium">Start Date (optional)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-slate-400/50 focus:outline-none transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm text-white/90 mb-2 font-medium">End Date (optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-slate-400/50 focus:outline-none transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm text-white/90 mb-2 font-medium">Month (optional)</label>
              <input
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="MM"
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-slate-400/50 focus:outline-none transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm text-white/90 mb-2 font-medium">Year (optional)</label>
              <input
                type="number"
                min="1900"
                max="2100"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="YYYY"
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-slate-400/50 focus:outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-white/90 font-medium">Format:</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-slate-400/50 focus:outline-none transition-all duration-300"
              >
                <option value="netcdf" className="bg-slate-800 text-white">NetCDF (.nc)</option>
                <option value="csv" className="bg-slate-800 text-white">CSV</option>
                <option value="json" className="bg-slate-800 text-white">JSON</option>
              </select>
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-600 text-white rounded-xl disabled:opacity-50 hover:from-slate-600 hover:to-slate-500 font-semibold shadow-xl hover:shadow-slate-500/25 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Preparing...
                </>
              ) : (
                <>
                  <span>📥</span>
                  {format === "netcdf" ? (hasFilters ? "Download Filtered NetCDF" : "Download Full NetCDF") : `Download ${format.toUpperCase()}`}
                </>
              )}
            </button>
            <button
              onClick={() => { setVariable(""); setStartDate(""); setEndDate(""); setMonth(""); setYear(""); }}
              disabled={downloading}
              className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl border border-white/20 hover:bg-white/20 font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <span>🗑️</span>
              Clear Filters
            </button>
          </div>

          {error && (
            <div className="mt-6 bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 rounded-xl p-4 text-sm">{error}</div>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>💡</span>
            Examples
          </h2>
          <ul className="space-y-3 text-white/80">
            <li className="flex items-start gap-3">
              <span className="text-slate-400 mt-1">•</span>
              <span><strong className="text-white">Variable & date range:</strong> salinity from 2023-03-01 to 2023-03-31</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 mt-1">•</span>
              <span><strong className="text-white">Month/year:</strong> temperature for March 2023</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 mt-1">•</span>
              <span><strong className="text-white">No filters:</strong> full file download</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExportNetCDF;



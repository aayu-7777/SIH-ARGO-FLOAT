// UploadAnalyze.jsx
import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const UploadAnalyze = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Improve default Leaflet marker icons in Vite
  // (Ensures markers load correctly without local assets config)
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

  const mapCenter = useMemo(() => {
    if (!result?.records || result.records.length === 0) return null;
    const withCoords = result.records.filter(
      (r) => r.lat != null && r.lon != null
    );
    if (withCoords.length === 0) return null;
    // Center on the first coordinate set in the records
    return [Number(withCoords[0].lat), Number(withCoords[0].lon)];
  }, [result]);

  const handleUpload = async () => {
    if (!file) return;
    setError(null);
    setUploading(true);
    setUploaded(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("http://localhost:5001/api/upload-nc", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const json = await res.json();
      setUploaded(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!uploaded?.filename) return;
    setError(null);
    setAnalyzing(true);
    setResult(null);
    try {
      const params = new URLSearchParams();
      params.set("filename", uploaded.filename);
      const res = await fetch("http://localhost:5001/api/analyze-nc", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      if (!res.ok) throw new Error(`Analyze failed: ${res.status}`);
      const json = await res.json();
      setResult(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 drop-shadow-sm">Upload NetCDF (.nc)</h1>

        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6 hover:shadow-xl transition">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <input
              type="file"
              accept=".nc,application/x-netcdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full md:w-auto text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-4 py-2 bg-indigo-600 disabled:opacity-50 text-white rounded-md hover:bg-indigo-700"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !uploaded?.filename}
                className="px-4 py-2 bg-green-600 disabled:opacity-50 text-white rounded-md hover:bg-green-700"
              >
                {analyzing ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </div>
          {uploaded && (
            <p className="mt-2 text-xs text-gray-600">Saved as <span className="font-mono">{uploaded.filename}</span> ({uploaded.size} bytes)</p>
          )}
        </div>

        {uploaded && (
          <div className="bg-white rounded-xl shadow p-4 mb-4">
            <div className="text-sm text-gray-700">
              <div><b>Saved as:</b> {uploaded.filename}</div>
              <div><b>Size:</b> {uploaded.size} bytes</div>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {analyzing ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 rounded p-3 mb-4">{error}</div>
        )}

        {result && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Measurements</h2>

            {Array.isArray(result.records) && result.records.length > 0 ? (
              <>
                <div className="text-sm text-gray-600 mb-3">
                  Showing {Math.min(result.records.length, 100)} of {result.records.length} records
                </div>
                <div className="overflow-auto border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Platform</th>
                        <th className="px-3 py-2 text-left">Lat</th>
                        <th className="px-3 py-2 text-left">Lon</th>
                        <th className="px-3 py-2 text-left">Pressure (dbar)</th>
                        <th className="px-3 py-2 text-left">Temp (°C)</th>
                        <th className="px-3 py-2 text-left">Salinity (PSU)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.records.slice(0, 100).map((r, i) => (
                        <tr key={i} className={i % 2 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-3 py-2">{r.platform ?? "-"}</td>
                          <td className="px-3 py-2">{r.lat != null ? Number(r.lat).toFixed(4) : "-"}</td>
                          <td className="px-3 py-2">{r.lon != null ? Number(r.lon).toFixed(4) : "-"}</td>
                          <td className="px-3 py-2">{r.pressure != null ? Number(r.pressure).toFixed(1) : "-"}</td>
                          <td className="px-3 py-2">{r.temperature != null ? Number(r.temperature).toFixed(3) : "-"}</td>
                          <td className="px-3 py-2">{r.salinity != null ? Number(r.salinity).toFixed(3) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <pre className="text-xs overflow-auto max-h-96 bg-gray-50 p-3 rounded">
{JSON.stringify(result, null, 2)}
              </pre>
            )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Map</h2>
              {mapCenter ? (
                <MapContainer center={mapCenter} zoom={3} style={{ height: "320px", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                  {result.records
                    .filter((r) => r.lat != null && r.lon != null)
                    .slice(0, 50)
                    .map((r, idx) => (
                      <Marker key={idx} position={[Number(r.lat), Number(r.lon)]}>
                        <Popup>
                          <div className="text-sm">
                            <div className="font-semibold">Float {r.platform ?? "Unknown"}</div>
                            <div>Lat: {Number(r.lat).toFixed(4)}, Lon: {Number(r.lon).toFixed(4)}</div>
                            {r.pressure != null && (
                              <div>Pressure: {Number(r.pressure).toFixed(1)} dbar</div>
                            )}
                            {r.temperature != null && (
                              <div>Temp: {Number(r.temperature).toFixed(3)} °C</div>
                            )}
                            {r.salinity != null && (
                              <div>Salinity: {Number(r.salinity).toFixed(3)} PSU</div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>
              ) : (
                <div className="text-sm text-gray-500">No coordinates found in analyzed data.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadAnalyze;



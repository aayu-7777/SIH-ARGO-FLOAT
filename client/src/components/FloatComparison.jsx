import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ErrorBoundary from "./ErrorBoundary";

const FloatComparison = () => {
  const [platforms, setPlatforms] = useState([]);
  const [selectedFloat1, setSelectedFloat1] = useState("");
  const [selectedFloat2, setSelectedFloat2] = useState("");
  const [float1Data, setFloat1Data] = useState([]);
  const [float2Data, setFloat2Data] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Fetch list of floats
  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5001/api/floats")
      .then((res) => res.json())
      .then((json) => {
        setPlatforms(json);
        if (json.length >= 2) {
          setSelectedFloat1(json[0].platform_id);
          setSelectedFloat2(json[1].platform_id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch data for both floats when selection changes
  useEffect(() => {
    if (!selectedFloat1 || !selectedFloat2) return;

    setDataLoading(true);

    const fetchFloatData = async (platformId) => {
      try {
        const response = await fetch(
          `http://localhost:5001/api/floats/${platformId}/monthly-avg`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();

        // Process and deduplicate data
        const monthMap = new Map();

        json.forEach((d) => {
          const monthKey = new Date(d.month).toISOString().slice(0, 7); // YYYY-MM
          const displayMonth = new Date(d.month).toLocaleDateString("en-GB", {
            year: "numeric",
            month: "short",
          });

          if (monthMap.has(monthKey)) {
            // If duplicate month, average the values
            const existing = monthMap.get(monthKey);
            monthMap.set(monthKey, {
              ...existing,
              avg_salinity: (
                (parseFloat(existing.avg_salinity) +
                  parseFloat(d.avg_salinity)) /
                2
              ).toFixed(2),
              avg_pressure: (
                (parseFloat(existing.avg_pressure) +
                  parseFloat(d.avg_pressure)) /
                2
              ).toFixed(2),
            });
          } else {
            monthMap.set(monthKey, {
              month: displayMonth,
              monthKey: monthKey,
              avg_salinity: parseFloat(d.avg_salinity).toFixed(2),
              avg_pressure: parseFloat(d.avg_pressure).toFixed(2),
            });
          }
        });

        return Array.from(monthMap.values()).sort((a, b) =>
          a.monthKey.localeCompare(b.monthKey)
        );
      } catch (error) {
        console.error(`Error fetching data for float ${platformId}:`, error);
        return [];
      }
    };

    const fetchBothFloats = async () => {
      const [data1, data2] = await Promise.all([
        fetchFloatData(selectedFloat1),
        fetchFloatData(selectedFloat2),
      ]);

      setFloat1Data(data1);
      setFloat2Data(data2);
      setDataLoading(false);
    };

    fetchBothFloats();
  }, [selectedFloat1, selectedFloat2]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-12 h-12 border-4 border-indigo-500 border-dashed rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading floats...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 drop-shadow-sm">
            🔍 Float Comparison Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Compare monthly averages between two ARGO floats
          </p>
        </header>

        {/* Float selectors */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="flex flex-col items-center">
            <label className="text-sm font-medium text-gray-700 mb-2">
              Float 1
            </label>
            <select
              value={selectedFloat1}
              onChange={(e) => setSelectedFloat1(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white min-w-[150px]"
            >
              {platforms.map((p) => (
                <option key={p.platform_id} value={p.platform_id}>
                  Float #{p.platform_id}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-center">
            <label className="text-sm font-medium text-gray-700 mb-2">
              Float 2
            </label>
            <select
              value={selectedFloat2}
              onChange={(e) => setSelectedFloat2(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white min-w-[150px]"
            >
              {platforms.map((p) => (
                <option key={p.platform_id} value={p.platform_id}>
                  Float #{p.platform_id}
                </option>
              ))}
            </select>
          </div>
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-indigo-500 border-dashed rounded-full animate-spin"></div>
            <p className="ml-3 text-gray-500">Loading comparison data...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Salinity Comparison */}
            <ErrorBoundary>
              <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  🧂 Salinity Comparison
                </h2>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={float1Data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                      label={{
                        value: "PSU",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avg_salinity"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name={`Float #${selectedFloat1} Salinity`}
                      dot={{
                        key: (entry, index) =>
                          `salinity1-${entry.monthKey || index}`,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ErrorBoundary>

            <ErrorBoundary>
              <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  🧂 Salinity Comparison
                </h2>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={float2Data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                      label={{
                        value: "PSU",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avg_salinity"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name={`Float #${selectedFloat2} Salinity`}
                      dot={{
                        key: (entry, index) =>
                          `salinity2-${entry.monthKey || index}`,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ErrorBoundary>

            {/* Pressure Comparison */}
            <ErrorBoundary>
              <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  📊 Pressure Comparison
                </h2>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={float1Data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                      label={{
                        value: "dbar",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avg_pressure"
                      stroke="#10b981"
                      strokeWidth={2}
                      name={`Float #${selectedFloat1} Pressure`}
                      dot={{
                        key: (entry, index) =>
                          `pressure1-${entry.monthKey || index}`,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ErrorBoundary>

            <ErrorBoundary>
              <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  📊 Pressure Comparison
                </h2>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={float2Data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                      label={{
                        value: "dbar",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avg_pressure"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name={`Float #${selectedFloat2} Pressure`}
                      dot={{
                        key: (entry, index) =>
                          `pressure2-${entry.monthKey || index}`,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ErrorBoundary>
          </div>
        )}

        {/* Combined Comparison Chart */}
        {!dataLoading && float1Data.length > 0 && float2Data.length > 0 && (
          <div className="mt-8">
            <ErrorBoundary>
              <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  📈 Combined Comparison
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={float1Data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avg_salinity"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name={`Float #${selectedFloat1} Salinity`}
                      dot={{
                        key: (entry, index) =>
                          `combined-salinity1-${entry.monthKey || index}`,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avg_pressure"
                      stroke="#10b981"
                      strokeWidth={2}
                      name={`Float #${selectedFloat1} Pressure`}
                      dot={{
                        key: (entry, index) =>
                          `combined-pressure1-${entry.monthKey || index}`,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatComparison;

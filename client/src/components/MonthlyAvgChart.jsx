// components/MonthlyAvgChart.jsx
import React, { useEffect, useState, memo } from "react";
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

const MonthlyAvgChart = ({ platformId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!platformId) return;
    setLoading(true);
    setData([]); // Clear previous data

    const controller = new AbortController();

    fetch(`http://localhost:5001/api/floats/${platformId}/monthly-avg`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
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
              monthKey: monthKey, // Add unique key
              avg_salinity: parseFloat(d.avg_salinity).toFixed(2),
              avg_pressure: parseFloat(d.avg_pressure).toFixed(2),
            });
          }
        });

        const formatted = Array.from(monthMap.values()).sort((a, b) =>
          a.monthKey.localeCompare(b.monthKey)
        );
        console.log("MonthlyAvg data processed:", {
          dataPoints: formatted.length,
          sampleData: formatted.slice(0, 3),
        });
        setData(formatted);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Error fetching monthly avg data:", err);
          setData([]);
        }
        setLoading(false);
      });

    return () => controller.abort();
  }, [platformId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          📊 Monthly Avg Salinity & Pressure
        </h2>
        <div className="flex items-center justify-center p-6">
          <div className="w-8 h-8 border-4 border-indigo-500 border-dashed rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-500">Loading monthly averages...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          📊 Monthly Avg Salinity & Pressure
        </h2>
        <div className="flex items-center justify-center p-6">
          <p className="text-gray-500">No monthly average data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition mt-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        📊 Monthly Averages - Salinity, Pressure & Temperature
      </h2>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
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
            name="Avg Salinity (PSU)"
            dot={{
              key: (entry, index) => `salinity-${entry.monthKey || index}`,
            }}
          />
          <Line
            type="monotone"
            dataKey="avg_pressure"
            stroke="#ef4444"
            strokeWidth={2}
            name="Avg Pressure (dbar)"
            dot={{
              key: (entry, index) => `pressure-${entry.monthKey || index}`,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(MonthlyAvgChart);

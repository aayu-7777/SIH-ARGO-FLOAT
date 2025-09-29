// LineChartComponent.jsx
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const LineChartComponent = ({ platformId }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!platformId) return;

    fetch(`http://localhost:5001/api/floats/${platformId}/data`)
      .then((res) => res.json())
      .then((json) => {
        // ✅ Fix date format
        const formatted = json.map((d) => ({
          ...d,
          measurement_date: new Date(
            d.measurement_date.replace(" ", "T")
          ).toLocaleDateString("en-GB", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }), // human-friendly date
        }));
        setData(formatted);
      })
      .catch((err) => console.error("Error fetching float data:", err));
  }, [platformId]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-gray-500 animate-pulse">Loading float data...</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      {/* Temperature Line Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          🌡 Temperature over Time
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="measurement_date" />
            <YAxis
              label={{ value: "°C", angle: -90, position: "insideLeft" }}
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="temperature_celsius"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Salinity Bar Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          🧂 Salinity over Time
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="measurement_date" />
            <YAxis
              label={{ value: "PSU", angle: -90, position: "insideLeft" }}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey="salinity_psu" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LineChartComponent;

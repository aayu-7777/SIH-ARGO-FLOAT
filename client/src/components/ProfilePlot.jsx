// components/ProfilePlot.jsx
import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const ProfilePlot = ({ data }) => {
  console.log(data);
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-4 text-center text-gray-500">
        No profile data available
      </div>
    );
  }

  // Prepare data: Depth (y) vs Temperature (x)
  const chartData = data.map((d) => ({
    depth: d.pressure_dbar, // y-axis
    temp: d.temperature_celsius, // x-axis
  }));

  return (
    <div className="bg-white rounded-2xl shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">
        🌡 Temperature Profile (Temp vs Depth)
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="temp"
            type="number"
            label={{
              value: "Temperature (°C)",
              position: "insideBottom",
              dy: 10,
            }}
          />
          <YAxis
            dataKey="depth"
            reversed
            label={{
              value: "Depth (dbar)",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip />
          <Line type="monotone" dataKey="temp" stroke="#6366F1" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProfilePlot;

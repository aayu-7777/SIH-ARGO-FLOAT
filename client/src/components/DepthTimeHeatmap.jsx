import Plot from "react-plotly.js";

const DepthTimeHeatmap = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-4 my-4">
        <h2 className="text-lg font-semibold mb-2">
          Salinity Depth-Time Heatmap
        </h2>
        <p className="text-gray-500 text-center">No data available</p>
      </div>
    );
  }

  // Group data by date and create a matrix for heatmap
  const dateGroups = {};
  data.forEach((d) => {
    const date = new Date(d.measurement_date).toISOString().split("T")[0];
    if (!dateGroups[date]) {
      dateGroups[date] = [];
    }
    dateGroups[date].push({
      depth: d.pressure_dbar,
      salinity: d.salinity_psu,
    });
  });

  const dates = Object.keys(dateGroups).sort();
  const allDepths = [...new Set(data.map((d) => d.pressure_dbar))].sort(
    (a, b) => b - a
  ); // Sort descending for depth

  // Create z matrix for heatmap
  const z = dates.map((date) =>
    allDepths.map((depth) => {
      const dayData = dateGroups[date].find((d) => d.depth === depth);
      return dayData ? dayData.salinity : null;
    })
  );

  return (
    <div className="bg-white shadow-lg rounded-2xl p-4 my-4">
      <h2 className="text-lg font-semibold mb-2">
        Salinity Depth-Time Heatmap
      </h2>
      <Plot
        data={[
          {
            x: dates,
            y: allDepths,
            z: z,
            type: "heatmap",
            colorscale: "Viridis",
            showscale: true,
            colorbar: {
              title: "Salinity (PSU)",
            },
          },
        ]}
        layout={{
          autosize: true,
          height: 500,
          xaxis: { title: "Date" },
          yaxis: { title: "Depth (dbar)", autorange: "reversed" },
          title: "Salinity vs Depth and Time",
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default DepthTimeHeatmap;

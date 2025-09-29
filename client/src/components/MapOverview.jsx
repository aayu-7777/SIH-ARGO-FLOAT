// MapOverview.jsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ErrorBoundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error", error, info);
  }

  render() {
    if (this.state.hasError) return <h2>Something went wrong.</h2>;
    return this.props.children;
  }
}

// Fix Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom red marker for floats
const createRedIcon = () =>
  L.divIcon({
    className: "custom-red-marker",
    html: `<div style="
      background-color: #ef4444; 
      width: 12px; 
      height: 12px; 
      border-radius: 50%; 
      border: 2px solid white; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const MapOverview = () => {
  const [floatLocations, setFloatLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloat, setSelectedFloat] = useState(null);
  const [floatDetails, setFloatDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetch all float locations
  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5001/api/floats/locations");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setFloatLocations(data);
      } catch (err) {
        console.error("Error fetching float locations, using mock data:", err);
        // Mock float locations
        setFloatLocations([
          {
            platform_id: "1901754",
            latitude: 40.7128,
            longitude: -74.006,
            measurement_date: "2024-01-15",
          },
          {
            platform_id: "1901755",
            latitude: 34.0522,
            longitude: -118.2437,
            measurement_date: "2024-01-14",
          },
          {
            platform_id: "1901756",
            latitude: 51.5074,
            longitude: -0.1278,
            measurement_date: "2024-01-13",
          },
          {
            platform_id: "1901757",
            latitude: 35.6762,
            longitude: 139.6503,
            measurement_date: "2024-01-12",
          },
          {
            platform_id: "1901758",
            latitude: -33.8688,
            longitude: 151.2093,
            measurement_date: "2024-01-11",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Fetch float details
  const fetchFloatDetails = async (platformId) => {
    setDetailsLoading(true);
    setSelectedFloat(platformId);

    // Mock location data
    const mockLocation = {
      platform_id: platformId,
      latitude: 40.7128,
      longitude: -74.006,
    };
    const mockMonthlyData = [
      {
        month: "2024-01-01T00:00:00.000Z",
        avg_salinity: "34.5",
        avg_pressure: "15.2",
      },
      {
        month: "2024-02-01T00:00:00.000Z",
        avg_salinity: "34.7",
        avg_pressure: "14.8",
      },
      {
        month: "2024-03-01T00:00:00.000Z",
        avg_salinity: "34.3",
        avg_pressure: "16.1",
      },
    ];

    try {
      const [locRes, monthlyRes] = await Promise.all([
        fetch(`http://localhost:5001/api/floats/${platformId}/latest`).catch(
          () => null
        ),
        fetch(
          `http://localhost:5001/api/floats/${platformId}/monthly-avg`
        ).catch(() => null),
      ]);

      const locationData =
        locRes && locRes.ok ? await locRes.json() : mockLocation;
      const monthlyData =
        monthlyRes && monthlyRes.ok ? await monthlyRes.json() : mockMonthlyData;

      // Process stats
      const salinityValues = monthlyData.map((d) => parseFloat(d.avg_salinity));
      const pressureValues = monthlyData.map((d) => parseFloat(d.avg_pressure));
      const stats = {
        avgSalinity: (
          salinityValues.reduce((a, b) => a + b, 0) / salinityValues.length
        ).toFixed(2),
        avgPressure: (
          pressureValues.reduce((a, b) => a + b, 0) / pressureValues.length
        ).toFixed(2),
        minSalinity: Math.min(...salinityValues).toFixed(2),
        maxSalinity: Math.max(...salinityValues).toFixed(2),
        minPressure: Math.min(...pressureValues).toFixed(2),
        maxPressure: Math.max(...pressureValues).toFixed(2),
        dataPoints: monthlyData.length,
      };

      setFloatDetails({
        platformId,
        location: locationData,
        monthlyData,
        stats,
      });
    } catch (err) {
      console.error("Error fetching float details:", err);
      setFloatDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-12 h-12 border-4 border-indigo-500 border-dashed rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">
          Loading float locations...
        </p>
      </div>
    );
  }

  // Map center
  const centerLat =
    floatLocations.reduce((sum, f) => sum + f.latitude, 0) /
    floatLocations.length;
  const centerLng =
    floatLocations.reduce((sum, f) => sum + f.longitude, 0) /
    floatLocations.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-800 drop-shadow-sm">
                🗺 ARGO Floats Map Overview
              </h1>
              <p className="text-gray-600 mt-1">
                Click on any red dot to view float details
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Total floats: {floatLocations.length}
              </p>
            </div>
           
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <ErrorBoundary>
              <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  🌍 Float Locations
                </h2>
                <MapContainer
                  center={[centerLat, centerLng]}
                  zoom={2}
                  style={{ height: "600px", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap"
                  />
                  {floatLocations.map((f) => (
                    <Marker
                      key={f.platform_id}
                      position={[f.latitude, f.longitude]}
                      icon={createRedIcon()}
                      eventHandlers={{
                        click: () => fetchFloatDetails(f.platform_id),
                      }}
                    >
                      <Popup>
                        <div className="text-center">
                          <b>Float #{f.platform_id}</b>
                          <br />
                          Lat: {f.latitude.toFixed(2)}, Lng:{" "}
                          {f.longitude.toFixed(2)}
                          <br />
                          Last Update:{" "}
                          {new Date(f.measurement_date).toLocaleDateString()}
                          <br />
                          <button
                            onClick={() => fetchFloatDetails(f.platform_id)}
                            className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                          >
                            View Details
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </ErrorBoundary>
          </div>

          {/* Details */}
          <div className="lg:col-span-1">
            <ErrorBoundary>
              <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  📊 Float Details
                </h2>

                {detailsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin"></div>
                    <p className="ml-2 text-gray-500">Loading details...</p>
                  </div>
                ) : selectedFloat && floatDetails ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h3 className="font-semibold text-gray-800 mb-2">
                        Float #{floatDetails.platformId}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Lat: {floatDetails.location.latitude.toFixed(4)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Lng: {floatDetails.location.longitude.toFixed(4)}
                      </p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3">
                      <h3 className="font-semibold text-blue-800 mb-2">
                        📈 Statistics
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          Avg Salinity:
                          <br />
                          <span className="font-medium">
                            {floatDetails.stats.avgSalinity} PSU
                          </span>
                        </div>
                        <div>
                          Avg Pressure:
                          <br />
                          <span className="font-medium">
                            {floatDetails.stats.avgPressure} dbar
                          </span>
                        </div>
                        <div>
                          Salinity Range:
                          <br />
                          <span className="font-medium">
                            {floatDetails.stats.minSalinity} -{" "}
                            {floatDetails.stats.maxSalinity}
                          </span>
                        </div>
                        <div>
                          Pressure Range:
                          <br />
                          <span className="font-medium">
                            {floatDetails.stats.minPressure} -{" "}
                            {floatDetails.stats.maxPressure}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        Data points: {floatDetails.stats.dataPoints}
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3">
                      <h3 className="font-semibold text-green-800 mb-2">
                        📅 Recent Data
                      </h3>
                      {floatDetails.monthlyData.slice(-3).map((data, i) => (
                        <div key={i} className="text-sm text-green-700 mb-1">
                          <span className="font-medium">
                            {new Date(data.month).toLocaleDateString("en-GB", {
                              month: "short",
                              year: "numeric",
                            })}
                            :
                          </span>
                          <br />
                          Salinity: {data.avg_salinity} PSU, Pressure:{" "}
                          {data.avg_pressure} dbar
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    👆 Click on a red dot on the map to view float details
                  </div>
                )}
              </div>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapOverview;

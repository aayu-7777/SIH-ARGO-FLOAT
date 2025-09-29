// MapComponent.jsx
import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Default Leaflet marker fix (otherwise broken in React apps)
import "leaflet/dist/leaflet.css";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MapComponent = ({ latitude, longitude, platformId, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          🗺 Float Location
        </h2>
        <div className="flex items-center justify-center p-6">
          <div className="w-8 h-8 border-4 border-indigo-500 border-dashed rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-500">Loading location...</p>
        </div>
      </div>
    );
  }

  if (!latitude || !longitude) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          🗺 Float Location
        </h2>
        <div className="flex items-center justify-center p-6">
          <p className="text-gray-500">No location data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition mt-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        🗺 Float Location
      </h2>
      <MapContainer
        center={[latitude, longitude]}
        zoom={4}
        style={{ height: "400px", width: "100%", borderRadius: "1rem" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        />
        <Marker position={[latitude, longitude]}>
          <Popup>
            <b>Platform ID:</b> {platformId} <br />
            🌍 Lat: {latitude.toFixed(2)}, Lng: {longitude.toFixed(2)}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapComponent;

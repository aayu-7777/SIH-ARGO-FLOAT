import React, { useEffect, useState } from "react";
import MapComponent from "./MapComponent";
import MonthlyAvgChart from "./MonthlyAvgChart";
import ErrorBoundary from "./ErrorBoundary";

const Dashboard = () => {
  const [platforms, setPlatforms] = useState([]);
  const [selected, setSelected] = useState("");
  const [latestLocation, setLatestLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Fetch list of floats
  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5001/api/floats")
      .then((res) => res.json())
      .then((json) => {
        setPlatforms(json);
        if (json.length > 0) {
          setSelected(json[0].platform_id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch latest location when float changes
  useEffect(() => {
    if (!selected) return;

    console.log("Fetching location for platform:", selected);

    const timeoutId = setTimeout(async () => {
      const now = Date.now();
      // Rate limiting: don't fetch if last fetch was less than 500ms ago
      if (now - lastFetchTime < 500) {
        console.log("Rate limiting: skipping fetch");
        return;
      }

      setLastFetchTime(now);
      setLocationLoading(true);
      try {
        console.log(
          "Making API call to:",
          `http://localhost:5001/api/floats/${selected}/latest`
        );
        const response = await fetch(
          `http://localhost:5001/api/floats/${selected}/latest`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        console.log("Location data received:", json);
        setLatestLocation(json);
      } catch (error) {
        console.error("Error fetching latest location:", error);
        setLatestLocation(null);
      } finally {
        setLocationLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      console.log("Cleaning up timeout for platform:", selected);
      clearTimeout(timeoutId);
    };
  }, [selected, lastFetchTime]);


  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-400/30 border-dashed rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-slate-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className="mt-6 text-slate-300 font-medium text-lg">Loading ocean data...</p>
        <div className="mt-4 flex space-x-1">
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white/90 shadow-lg mb-6">
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></div>
            <span>Real-time Ocean Data</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            <span className="bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 bg-clip-text text-transparent">
              ARGO Float Dashboard
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Explore temperature & salinity time-series from ocean floats with interactive visualizations
          </p>
        </header>

        {/* Float selector */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <select
              value={selected}
              onChange={(e) => {
                console.log("Changing float to:", e.target.value);
                setSelected(e.target.value);
              }}
              className="appearance-none bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-3 pr-10 text-white focus:ring-2 focus:ring-slate-400/50 focus:outline-none shadow-xl hover:bg-white/15 transition-all duration-300 min-w-[200px]"
            >
              {platforms.map((p) => (
                <option key={p.platform_id} value={p.platform_id} className="bg-slate-800 text-white">
                  Float #{p.platform_id}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Charts */}
        {selected && (
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-2xl">
              <ErrorBoundary>
                <MonthlyAvgChart platformId={selected} />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-2xl">
          <ErrorBoundary>
            <MapComponent
              latitude={latestLocation?.latitude}
              longitude={latestLocation?.longitude}
              platformId={selected}
              loading={locationLoading}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

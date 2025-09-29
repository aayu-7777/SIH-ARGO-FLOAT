#!/usr/bin/env python3
import sys
import os
import json
import numpy as np
import math
import pandas as pd

try:
    import xarray as xr
except Exception as exc:
    print(json.dumps({"error": f"xarray not available: {exc}"}))
    sys.exit(1)


def _clean_number(value):
    try:
        if value is None:
            return None
        num = float(value)
        if math.isnan(num) or math.isinf(num):
            return None
        return num
    except Exception:
        return None


def summarize_dataset(ds: "xr.Dataset") -> dict:
    info = {
        "dims": {k: int(v) for k, v in ds.dims.items()},
        "coords": list(ds.coords.keys()),
        "vars": {},
    }

    for name, da in ds.data_vars.items():
        v = {
            "dtype": str(da.dtype),
            "dims": list(da.dims),
            "shape": [int(s) for s in da.shape],
            "attrs": {k: (str(v) if not isinstance(v, (int, float, bool)) else v) for k, v in da.attrs.items()},
        }
        # simple stats for numeric variables
        if np.issubdtype(da.dtype, np.number):
            dd = da.to_numpy()
            with np.errstate(all='ignore'):
                v["min"] = _clean_number(np.nanmin(dd) if dd.size else None)
                v["max"] = _clean_number(np.nanmax(dd) if dd.size else None)
                v["mean"] = _clean_number(np.nanmean(dd) if dd.size else None)
        info["vars"][name] = v

    # detect likely time/lat/lon/pressure variables
    def find(keys):
        for k in keys:
            if k in ds:
                return k
        lower = {k.lower(): k for k in ds.variables.keys()}
        for k in keys:
            if k.lower() in lower:
                return lower[k.lower()]
        return None

    time_key = find(["time", "TIME", "JULD"]) or find(list(ds.coords.keys()))
    lat_key = find(["latitude", "LATITUDE", "lat", "LAT"]) 
    lon_key = find(["longitude", "LONGITUDE", "lon", "LON"]) 
    pres_key = find(["pressure", "PRES", "PRES_ADJUSTED"]) 
    temp_key = find(["TEMP", "TEMP_ADJUSTED"]) 
    sal_key = find(["PSAL", "PSAL_ADJUSTED"]) 
    platform_key = find(["platform_number", "PLATFORM_NUMBER", "float_serial_no", "FLOAT_SERIAL_NO"]) 

    preview = {"time": time_key, "lat": lat_key, "lon": lon_key, "pressure": pres_key, "temperature": temp_key, "salinity": sal_key, "platform": platform_key}

    sample = []
    records = []
    try:
        # Build a simple flattened preview of up to 1000 rows if axes are present
        if time_key and lat_key and lon_key:
            time_vals = ds[time_key]
            lat_vals = ds[lat_key]
            lon_vals = ds[lon_key]
            # Broadcast where possible, else take first along extra dims
            def as1d(da):
                arr = da.values
                if arr.ndim == 0:
                    return np.array([arr])
                return arr.reshape(-1)
            t = as1d(time_vals)
            la = as1d(lat_vals)
            lo = as1d(lon_vals)
            n = int(min(1000, max(len(t), len(la), len(lo))))
            # Resolve platform once
            platform_value = None
            if platform_key and platform_key in ds:
                try:
                    pv = ds[platform_key].values
                    if pv.size == 0:
                        platform_value = None
                    else:
                        platform_value = str(pv.flat[0]).strip()
                except Exception:
                    platform_value = None

            for i in range(n):
                item = {
                    "time": str(pd.to_datetime(t[i], errors="coerce")),
                    "lat": _clean_number(la[i]) if i < len(la) and np.isfinite(la[i]) else None,
                    "lon": _clean_number(lo[i]) if i < len(lo) and np.isfinite(lo[i]) else None,
                }
                if platform_value is not None:
                    item["platform"] = platform_value
                if pres_key and pres_key in ds:
                    pa = as1d(ds[pres_key])
                    item["pressure"] = _clean_number(pa[i]) if i < len(pa) and np.isfinite(pa[i]) else None
                if temp_key and temp_key in ds:
                    ta = as1d(ds[temp_key])
                    item["temperature"] = _clean_number(ta[i]) if i < len(ta) and np.isfinite(ta[i]) else None
                if sal_key and sal_key in ds:
                    sa = as1d(ds[sal_key])
                    item["salinity"] = _clean_number(sa[i]) if i < len(sa) and np.isfinite(sa[i]) else None
                sample.append(item)

                # Records limited to requested fields
                records.append({
                    "platform": item.get("platform"),
                    "lat": item.get("lat"),
                    "lon": item.get("lon"),
                    "pressure": item.get("pressure"),
                    "temperature": item.get("temperature"),
                    "salinity": item.get("salinity"),
                })
    except Exception:
        pass

    # Cap records to 1000 entries for payload size
    return {"summary": info, "preview_keys": preview, "records": records[:1000]}


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        return 1
    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"error": f"File not found: {file_path}"}))
        return 1
    try:
        with xr.open_dataset(file_path) as ds:
            result = summarize_dataset(ds)
        print(json.dumps(result, allow_nan=False))
        return 0
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())



import os
import sys
import json
import re
import time
import numpy as np
import pandas as pd
import netCDF4 as nc

# Optional: Only needed for directory ingestion to DB (legacy mode)
try:
    import psycopg2
    import psycopg2.extras
except Exception:  # pragma: no cover
    psycopg2 = None


# --- Configuration ---
POSTGRES_CONN_STRING = "dbname='postgres' user='ayush' password='secret123' host='localhost' port=5432"
DATA_DIR = 'test/'


def find_variable_case_insensitive(target_vars, available_vars):
    for target in target_vars:
        for available in available_vars:
            if available.lower() == target.lower():
                return available
    return None


def mask_check(array, idx):
    if hasattr(array, 'mask'):
        try:
            mask_element = array.mask[idx]
            if isinstance(mask_element, (np.ndarray, np.ma.MaskedArray)):
                return mask_element.any()
            else:
                return bool(mask_element)
        except Exception:
            return False
    return False


def safe_isnan(value):
    try:
        if isinstance(value, (np.ndarray, np.ma.MaskedArray)):
            if isinstance(value, np.ma.MaskedArray):
                return np.all(np.logical_or(value.mask, np.isnan(value.data)))
            else:
                return np.all(np.isnan(value))
        else:
            return np.isnan(value)
    except Exception:
        return False


def safe_float_conversion(value):
    try:
        if isinstance(value, (np.ndarray, np.ma.MaskedArray)):
            if value.size == 1:
                return float(value.flat[0])
            else:
                if isinstance(value, np.ma.MaskedArray):
                    valid_indices = ~value.mask
                    if np.any(valid_indices):
                        return float(value.data[valid_indices][0])
                else:
                    valid_indices = ~np.isnan(value)
                    if np.any(valid_indices):
                        return float(value[valid_indices][0])
                raise ValueError("No valid values to convert")
        else:
            return float(value)
    except Exception:
        raise ValueError(f"Cannot convert {value} to float")


def process_argo_file(file_path):
    """Extract measurements from a single Argo NetCDF file.

    Returns list of tuples:
    (platform_id, measurement_date[pandas.Timestamp], latitude, longitude, pressure, temperature|None, salinity|None)
    """
    all_profiles_data = []

    with nc.Dataset(file_path, 'r') as ds:
        if 'N_PROF' in ds.dimensions:
            num_profiles = len(ds.dimensions['N_PROF'])
            is_multi_profile = True
        else:
            num_profiles = 1
            is_multi_profile = False

        available_vars = list(ds.variables.keys())

        pressure_var = find_variable_case_insensitive(['PRES_ADJUSTED', 'PRES'], available_vars)
        temp_var = find_variable_case_insensitive(['TEMP_ADJUSTED', 'TEMP'], available_vars)
        salinity_var = find_variable_case_insensitive(['PSAL_ADJUSTED', 'PSAL'], available_vars)
        platform_var_name = find_variable_case_insensitive(['PLATFORM_NUMBER', 'FLOAT_SERIAL_NO', 'WMO_INST_TYPE'], available_vars)
        juld_var_name = find_variable_case_insensitive(['JULD'], available_vars)
        lat_var_name = find_variable_case_insensitive(['LATITUDE'], available_vars)
        lon_var_name = find_variable_case_insensitive(['LONGITUDE'], available_vars)
        ref_date_var_name = find_variable_case_insensitive(['REFERENCE_DATE_TIME'], available_vars)

        missing_vars = []
        if not pressure_var:
            missing_vars.append('pressure (PRES_ADJUSTED/PRES)')
        if not platform_var_name:
            missing_vars.append('platform_number (PLATFORM_NUMBER/FLOAT_SERIAL_NO)')
        if not juld_var_name:
            missing_vars.append('date (JULD)')
        if not lat_var_name:
            missing_vars.append('latitude (LATITUDE)')
        if not lon_var_name:
            missing_vars.append('longitude (LONGITUDE)')
        # REFERENCE_DATE_TIME is optional; if missing we will try JULD units
        if missing_vars:
            return []

        for i in range(num_profiles):
            try:
                if is_multi_profile:
                    platform_raw = ds.variables[platform_var_name][i]
                    juld_value = ds.variables[juld_var_name][i]
                    latitude = float(ds.variables[lat_var_name][i])
                    longitude = float(ds.variables[lon_var_name][i])
                    pressure = ds.variables[pressure_var][i, :]
                    temperature = ds.variables[temp_var][i, :] if temp_var else np.ma.masked_all_like(pressure)
                    salinity = ds.variables[salinity_var][i, :] if salinity_var else np.ma.masked_all_like(pressure)
                else:
                    platform_var = ds.variables[platform_var_name]
                    platform_raw = platform_var[0] if len(platform_var.shape) > 0 else platform_var
                    juld_var = ds.variables[juld_var_name]
                    juld_value = juld_var[0] if len(juld_var.shape) > 0 else juld_var
                    lat_var = ds.variables[lat_var_name]
                    lon_var = ds.variables[lon_var_name]
                    latitude = float(lat_var[0]) if len(lat_var.shape) > 0 else float(lat_var)
                    longitude = float(lon_var[0]) if len(lon_var.shape) > 0 else float(lon_var)
                    pressure = ds.variables[pressure_var][:]
                    temperature = ds.variables[temp_var][:] if temp_var else np.ma.masked_all_like(pressure)
                    salinity = ds.variables[salinity_var][:] if salinity_var else np.ma.masked_all_like(pressure)

                # Platform ID decoding
                if hasattr(platform_raw, 'data'):
                    if hasattr(platform_raw.data, 'shape') and platform_raw.data.shape == ():
                        platform_id = str(platform_raw.data).strip()
                    else:
                        try:
                            platform_id = ''.join([
                                b.decode('utf-8') if isinstance(b, bytes) else str(b)
                                for b in platform_raw.data if b != b' ' and b != ' '
                            ]).strip()
                        except Exception:
                            platform_id = str(platform_raw.data).strip()
                else:
                    platform_id = str(platform_raw).strip()

                if not platform_id or platform_id == 'None':
                    filename = os.path.basename(file_path)
                    platform_match = re.search(r'([0-9]{7,8})', filename)
                    platform_id = platform_match.group(1) if platform_match else filename.replace('.nc', '')

                # Reference base date and measurement date
                base_date = None
                if ref_date_var_name:
                    try:
                        ref_date_raw = ds.variables[ref_date_var_name][:]
                        if hasattr(ref_date_raw, 'data'):
                            try:
                                ref_date_str = ''.join([
                                    b.decode('utf-8') if isinstance(b, bytes) else str(b)
                                    for b in ref_date_raw.data
                                ]).strip()
                            except Exception:
                                ref_date_str = str(ref_date_raw.data).strip()
                        else:
                            ref_date_str = str(ref_date_raw).strip()
                        base_date = pd.to_datetime(ref_date_str, format='%Y%m%d%H%M%S')
                    except Exception:
                        base_date = None

                # Compute measurement date using either base_date or JULD units
                if np.ma.is_masked(juld_value) or safe_isnan(juld_value):
                    continue
                measurement_date = None
                try:
                    if base_date is not None:
                        measurement_date = base_date + pd.to_timedelta(float(juld_value), unit='D')
                    else:
                        juld_var = ds.variables[juld_var_name]
                        units = getattr(juld_var, 'units', None)
                        if units:
                            # Use CF units on JULD
                            dt = nc.num2date(float(juld_value), units)
                            # Convert to pandas Timestamp (ensure naive UTC)
                            measurement_date = pd.Timestamp(dt).tz_localize(None)
                        else:
                            # Fallback: treat JULD as days since 1950-01-01 per Argo convention
                            fallback_base = pd.Timestamp('1950-01-01T00:00:00Z')
                            measurement_date = fallback_base + pd.to_timedelta(float(juld_value), unit='D')
                except Exception:
                    continue

                if np.isnan(latitude) or np.isnan(longitude):
                    continue

                try:
                    # Build a boolean mask for valid pressure values
                    if hasattr(pressure, 'mask'):
                        valid_pressure_mask = ~pressure.mask
                        pressure_vals = pressure.data
                    else:
                        pressure_vals = np.array(pressure)
                        valid_pressure_mask = ~np.isnan(pressure_vals)
                    # Exclude negative pressures
                    valid_pressure_mask = np.logical_and(valid_pressure_mask, pressure_vals >= 0)
                    valid_count = int(np.sum(valid_pressure_mask))
                except Exception:
                    valid_count = 0
                if valid_count == 0:
                    continue

                for j in range(int(len(pressure))):
                    try:
                        p_val = pressure[j]
                        if mask_check(pressure, j) or safe_isnan(p_val):
                            continue
                        pressure_val = safe_float_conversion(p_val)
                        if pressure_val < 0:
                            continue
                        temp_val = safe_float_conversion(temperature[j]) if temp_var and not (mask_check(temperature, j) or safe_isnan(temperature[j])) else None
                        sal_val = safe_float_conversion(salinity[j]) if salinity_var and not (mask_check(salinity, j) or safe_isnan(salinity[j])) else None

                        all_profiles_data.append((
                            platform_id,
                            measurement_date,
                            latitude,
                            longitude,
                            pressure_val,
                            temp_val,
                            sal_val,
                        ))
                    except Exception:
                        continue
            except Exception:
                continue

    return all_profiles_data


def summarize_to_json(data):
    if not data:
        return {"points": 0, "message": "No valid measurements found"}

    platform_ids = [row[0] for row in data]
    latitudes = [row[2] for row in data]
    longitudes = [row[3] for row in data]
    pressures = [row[4] for row in data]
    temps = [row[5] for row in data if row[5] is not None]
    sals = [row[6] for row in data if row[6] is not None]
    dates = [pd.Timestamp(row[1]) for row in data]

    def most_common(seq):
        try:
            return max(set(seq), key=seq.count)
        except Exception:
            return seq[0]

    summary = {
        "points": len(data),
        "platform_id": most_common(platform_ids),
        "lat": float(np.nanmean(latitudes)) if latitudes else None,
        "lon": float(np.nanmean(longitudes)) if longitudes else None,
        "time_range": [
            min(dates).strftime("%Y-%m-%dT%H:%M:%SZ") if dates else None,
            max(dates).strftime("%Y-%m-%dT%H:%M:%SZ") if dates else None,
        ],
        "pressure": {
            "min": float(np.nanmin(pressures)) if pressures else None,
            "max": float(np.nanmax(pressures)) if pressures else None,
        },
        "temperature": {
            "min": float(np.nanmin(temps)) if temps else None,
            "max": float(np.nanmax(temps)) if temps else None,
            "avg": float(np.nanmean(temps)) if temps else None,
        },
        "salinity": {
            "min": float(np.nanmin(sals)) if sals else None,
            "max": float(np.nanmax(sals)) if sals else None,
            "avg": float(np.nanmean(sals)) if sals else None,
        },
        # Provide a small sample for plotting preview
        "sample": [
            {
                "measurement_date": pd.Timestamp(row[1]).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "pressure_dbar": row[4],
                "temperature_celsius": row[5],
                "salinity_psu": row[6],
            }
            for row in data[:1000]
        ],
    }
    return summary


def main():
    # Analysis mode: a file path is provided by the server (frontend upload)
    if len(sys.argv) >= 2:
        file_path = sys.argv[1]
        if not os.path.exists(file_path):
            print(json.dumps({"error": f"File not found: {file_path}"}))
            return 1
        try:
            data = process_argo_file(file_path)
            result = summarize_to_json(data)
            print(json.dumps(result))
            return 0
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            return 1

    # Legacy ingestion mode: no args -> walk DATA_DIR and insert into DB
    if psycopg2 is None:
        print(json.dumps({"error": "psycopg2 not available and no input file provided"}))
        return 1

    try:
        if not os.path.exists(DATA_DIR):
            print(json.dumps({"error": f"Directory '{DATA_DIR}' not found"}))
            return 1

        nc_files = []
        for root, _, files in os.walk(DATA_DIR):
            for f in files:
                if f.endswith('.nc'):
                    nc_files.append(os.path.join(root, f))
        if not nc_files:
            print(json.dumps({"error": f"No .nc files found in '{DATA_DIR}'"}))
            return 1

        pg_conn = psycopg2.connect(POSTGRES_CONN_STRING)
        cursor = pg_conn.cursor()

        total_rows = 0
        for file_path in nc_files:
            data = process_argo_file(file_path)
            if not data:
                continue
            psycopg2.extras.execute_values(
                cursor,
                """INSERT INTO floats
                   (platform_id, measurement_date, latitude, longitude,
                    pressure_dbar, temperature_celsius, salinity_psu)
                   VALUES %s""",
                data,
            )
            pg_conn.commit()
            total_rows += len(data)

        print(json.dumps({"ingested_rows": total_rows, "files": len(nc_files)}))
        return 0
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        return 1


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""
Minimal analysis script for NetCDF uploads.

Usage:
  python3 app.py /absolute/path/to/file.nc

Outputs a JSON object to stdout. This placeholder does not parse NetCDF
contents to avoid extra dependencies. It returns basic file metadata so the
end-to-end flow works. Replace the "analysis" section with real logic using
`xarray`/`netCDF4` if available.
"""

import json
import os
import sys
import time


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        return 1

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"error": f"File not found: {file_path}"}))
        return 1

    try:
        stat = os.stat(file_path)
        result = {
            "file": {
                "path": file_path,
                "name": os.path.basename(file_path),
                "size_bytes": stat.st_size,
                "modified": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(stat.st_mtime)),
            },
            "analysis": {
                "summary": "Placeholder analysis. Install xarray/netCDF4 for real parsing.",
                "variables": [],
                "dimensions": {},
            },
        }
        print(json.dumps(result))
        return 0
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())



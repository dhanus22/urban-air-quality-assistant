import { useState, useEffect, useCallback, useRef } from 'react';
import { AirQualityData } from '../types';
import { api } from '../services/api';

export interface UseAirQualityReturn {
  data: AirQualityData | null;
  loading: boolean;
  error: string | null;
  fetchAirQuality: (city: string) => Promise<void>;
  fetchByLocation: () => Promise<void>;
}

export function useAirQuality(initialCity: string = 'Delhi'): UseAirQualityReturn {
  const [data, setData] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAirQuality = useCallback(async (city: string) => {
    if (!city || !city.trim()) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await api.getAirQuality(city.trim(), controller.signal);
      setData(result);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Ignored if cancelled
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to fetch air quality data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const result = await api.getGeoAirQuality(latitude, longitude, controller.signal);
          setData(result);
          setError(null);
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') return;
          const message = err instanceof Error ? err.message : 'Failed to fetch local air quality';
          setError(message);
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        let msg = 'Failed to obtain device location';
        if (geoError.code === geoError.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please search by city name.';
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          msg = 'Location is currently unavailable.';
        } else if (geoError.code === geoError.TIMEOUT) {
          msg = 'Location request timed out.';
        }
        setError(msg);
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, []);

  // Initial load
  useEffect(() => {
    fetchAirQuality(initialCity);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAirQuality, initialCity]);

  return {
    data,
    loading,
    error,
    fetchAirQuality,
    fetchByLocation,
  };
}

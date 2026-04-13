import { useState, useEffect } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface GeolocationState {
  location: Location | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        location: null,
        error: "Geolocation is not supported by your browser",
        loading: false,
      });
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setState({
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        error: null,
        loading: false,
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      setState({
        location: null, // Could set a default city here if desired, e.g. London { lat: 51.505, lng: -0.09 }
        error: error.message,
        loading: false,
      });
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}

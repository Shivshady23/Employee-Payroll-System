export const requestCurrentLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      error => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });

export const getLocationErrorMessage = error => {
  if (!error) return "Unable to fetch location";

  if (error.code === 1) {
    return "location denied";
  }
  if (error.code === 2) {
    return "Location unavailable. Please retry from open sky or better network.";
  }
  if (error.code === 3) {
    return "Location request timed out. Please retry.";
  }

  return error.message || "Unable to fetch location";
};

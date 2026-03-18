export const getVideoInputDevices = async () => {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return [];
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(device => device.kind === "videoinput");
};

export const hasCameraDevice = async () => {
  const videoInputs = await getVideoInputDevices();
  return videoInputs.length > 0;
};

export const requestCameraStream = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    const error = new Error("Camera APIs are not supported in this browser");
    error.code = "UNSUPPORTED";
    throw error;
  }

  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  });
};

export const stopMediaStream = stream => {
  if (!stream) return;
  stream.getTracks().forEach(track => track.stop());
};

export const getCameraErrorMessage = error => {
  if (!error) return "Unable to access camera";

  if (error.code === "UNSUPPORTED") {
    return "Camera is not supported in this browser";
  }

  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return "camera permission denied";
  }

  if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
    return "no camera found";
  }

  if (error.name === "NotReadableError") {
    return "Camera is currently in use by another application";
  }

  return error.message || "Unable to access camera";
};

export const detectDeviceType = () => {
  if (typeof navigator === "undefined") return "unknown";
  return /android|iphone|ipad|mobile/i.test(navigator.userAgent)
    ? "mobile"
    : "desktop";
};

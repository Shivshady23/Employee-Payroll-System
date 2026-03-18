const VECTOR_SIZE = 64;

export const extractFaceVectorFromSnapshot = snapshotBase64 => {
  /*
    Integration point for real embeddings (MediaPipe Face Landmarker / FaceNet):
    replace this deterministic signal with actual face embeddings so face matching
    is robust against pose, lighting, and camera differences.
  */
  if (!snapshotBase64 || typeof snapshotBase64 !== "string") {
    return [];
  }

  const payload = snapshotBase64.slice(0, 8192);
  const vector = new Array(VECTOR_SIZE).fill(0);

  for (let index = 0; index < payload.length; index += 1) {
    const code = payload.charCodeAt(index);
    vector[index % VECTOR_SIZE] += code;
  }

  const maxValue = Math.max(...vector, 1);
  return vector.map(value => value / maxValue);
};

export const captureSnapshotFromVideo = videoElement => {
  if (!videoElement || videoElement.readyState < 2) {
    throw new Error("Camera feed is not ready");
  }

  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth || 640;
  canvas.height = videoElement.videoHeight || 480;

  const context = canvas.getContext("2d");
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.82);
};

const MIN_FACE_VECTOR_LENGTH = 32;
const DEFAULT_FACE_MATCH_THRESHOLD = 0.14;

const isValidFaceVector = faceVector =>
  Array.isArray(faceVector) &&
  faceVector.length >= MIN_FACE_VECTOR_LENGTH &&
  faceVector.every(value => Number.isFinite(value));

const compareFaceVectors = (candidateVector, registeredVector) => {
  if (!isValidFaceVector(candidateVector) || !isValidFaceVector(registeredVector)) {
    return { matched: false, distance: Number.POSITIVE_INFINITY };
  }

  if (candidateVector.length !== registeredVector.length) {
    return { matched: false, distance: Number.POSITIVE_INFINITY };
  }

  let squaredError = 0;
  for (let index = 0; index < candidateVector.length; index += 1) {
    const delta = candidateVector[index] - registeredVector[index];
    squaredError += delta * delta;
  }

  const distance = Math.sqrt(squaredError / candidateVector.length);
  const threshold = Number(process.env.FACE_MATCH_THRESHOLD) || DEFAULT_FACE_MATCH_THRESHOLD;

  return {
    matched: distance <= threshold,
    distance,
    threshold
  };
};

const extractFaceVectorFromSnapshot = snapshotBase64 => {
  /*
    Integration point for real face embedding extraction (MediaPipe / FaceNet / DeepFace):
    1) decode image
    2) detect and align face
    3) generate embedding vector
    4) return normalized vector

    Current implementation intentionally uses a deterministic lightweight signal extracted
    from the snapshot string, so the system works end-to-end without external ML services.
  */
  if (typeof snapshotBase64 !== "string" || !snapshotBase64.trim()) {
    return [];
  }

  const payload = snapshotBase64.slice(0, 8192);
  const vectorSize = 64;
  const vector = new Array(vectorSize).fill(0);

  for (let index = 0; index < payload.length; index += 1) {
    const code = payload.charCodeAt(index);
    vector[index % vectorSize] += code;
  }

  const maxValue = Math.max(...vector, 1);
  return vector.map(value => value / maxValue);
};

module.exports = {
  compareFaceVectors,
  extractFaceVectorFromSnapshot,
  isValidFaceVector,
  MIN_FACE_VECTOR_LENGTH
};

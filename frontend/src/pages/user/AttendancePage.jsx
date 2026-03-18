import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import QRFallback from "../../components/attendance/QRFallback";
import {
  detectDeviceType,
  getCameraErrorMessage,
  hasCameraDevice,
  requestCameraStream,
  stopMediaStream
} from "../../helpers/cameraDevice";
import { extractFaceVectorFromSnapshot, captureSnapshotFromVideo } from "../../helpers/faceVector";
import { getLocationErrorMessage, requestCurrentLocation } from "../../helpers/location";

const formatDateTime = value => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
};

const AttendancePage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [todayInfo, setTodayInfo] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraPermission, setCameraPermission] = useState("idle");
  const [locationPermission, setLocationPermission] = useState("idle");
  const [hasCamera, setHasCamera] = useState(null);
  const [location, setLocation] = useState(null);
  const [lastSnapshot, setLastSnapshot] = useState("");

  const mobileAttendanceUrl = useMemo(
    () => `${window.location.origin}/user/attendance`,
    []
  );

  const officeLat = process.env.REACT_APP_OFFICE_LAT;
  const officeLng = process.env.REACT_APP_OFFICE_LNG;
  const officeRadius =
    process.env.REACT_APP_OFFICE_RADIUS_METERS || todayInfo?.office?.radiusMeters || "-";

  const attendance = todayInfo?.attendance;
  const hasFaceProfile = Boolean(todayInfo?.hasFaceProfile);
  const checkInDone = Boolean(attendance?.checkInAt);
  const checkOutDone = Boolean(attendance?.checkOutAt);

  const loadToday = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/attendance/today");
      setTodayInfo(response.data);
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || "Failed to load attendance status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  useEffect(
    () => () => {
      stopMediaStream(cameraStream);
    },
    [cameraStream]
  );

  const askCameraPermission = async () => {
    setError("");
    setSuccess("");

    try {
      const cameraFound = await hasCameraDevice();
      setHasCamera(cameraFound);

      if (!cameraFound) {
        setCameraPermission("denied");
        setError("no camera found");
        return;
      }

      const stream = await requestCameraStream();
      stopMediaStream(cameraStream);
      setCameraStream(stream);
      setCameraPermission("granted");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (cameraError) {
      setCameraPermission("denied");
      setError(getCameraErrorMessage(cameraError));
    }
  };

  const askLocationPermission = async () => {
    setError("");
    setSuccess("");

    try {
      const coords = await requestCurrentLocation();
      setLocation(coords);
      setLocationPermission("granted");
    } catch (locationError) {
      setLocationPermission("denied");
      setError(getLocationErrorMessage(locationError));
    }
  };

  const createFacePayload = () => {
    const snapshot = captureSnapshotFromVideo(videoRef.current);
    const faceVector = extractFaceVectorFromSnapshot(snapshot);

    if (!faceVector.length) {
      throw new Error("face not matched");
    }

    setLastSnapshot(snapshot);
    return {
      selfieSnapshot: snapshot,
      faceVector
    };
  };

  const ensureLocation = async () => {
    if (location) return location;
    const coords = await requestCurrentLocation();
    setLocation(coords);
    setLocationPermission("granted");
    return coords;
  };

  const runAttendanceAction = async (endpoint, actionName) => {
    setError("");
    setSuccess("");
    setBusyAction(actionName);

    try {
      if (hasCamera === false) {
        throw new Error("no camera found");
      }

      if (cameraPermission !== "granted") {
        throw new Error("camera permission denied");
      }

      const facePayload = createFacePayload();
      const currentLocation = await ensureLocation();

      const response = await api.post(endpoint, {
        ...facePayload,
        location: currentLocation,
        deviceType: detectDeviceType()
      });

      setSuccess(response.data?.message || `${actionName} completed`);
      await loadToday();
    } catch (actionError) {
      const apiMessage = actionError.response?.data?.message;
      if (apiMessage) {
        setError(apiMessage);
      } else if (actionName === "Check In" || actionName === "Check Out") {
        if (actionError.message === "User denied Geolocation") {
          setError("location denied");
        } else {
          setError(actionError.message || `${actionName} failed`);
        }
      } else {
        setError(actionError.message || `${actionName} failed`);
      }
    } finally {
      setBusyAction("");
    }
  };

  const registerFace = async () => {
    setError("");
    setSuccess("");
    setBusyAction("Register Face");

    try {
      if (hasCamera === false) {
        throw new Error("no camera found");
      }

      if (cameraPermission !== "granted") {
        throw new Error("camera permission denied");
      }

      const payload = createFacePayload();
      const response = await api.post("/attendance/register-face", payload);
      setSuccess(response.data?.message || "Face profile registered");
      await loadToday();
    } catch (registerError) {
      setError(registerError.response?.data?.message || registerError.message);
    } finally {
      setBusyAction("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Employee Attendance</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="tabs">
        <button className="tab-btn" onClick={() => navigate("/user")}>
          Back To Dashboard
        </button>
      </div>

      <div className="tab-content attendance-page">
        {loading ? (
          <p>Loading attendance details...</p>
        ) : (
          <>
            <div className="attendance-card">
              <h3>Today Status</h3>
              <p><strong>Date:</strong> {todayInfo?.dateKey || "-"}</p>
              <p><strong>Face Registered:</strong> {hasFaceProfile ? "Yes" : "No"}</p>
              <p><strong>Check In:</strong> {formatDateTime(attendance?.checkInAt)}</p>
              <p><strong>Check Out:</strong> {formatDateTime(attendance?.checkOutAt)}</p>
              <p>
                <strong>Office Radius:</strong> {officeRadius} meters
              </p>
              <p>
                <strong>Office Lat/Lng (frontend env):</strong> {officeLat || "-"} /{" "}
                {officeLng || "-"}
              </p>
            </div>

            <div className="attendance-card">
              <h3>Step 1: Grant Permissions</h3>
              <div className="attendance-actions">
                <button type="button" onClick={askCameraPermission}>
                  Allow Camera Access
                </button>
                <button type="button" onClick={askLocationPermission}>
                  Allow Location Access
                </button>
              </div>
              <p>
                <strong>Camera:</strong> {cameraPermission}
              </p>
              <p>
                <strong>Location:</strong> {locationPermission}
              </p>
              {location && (
                <p>
                  <strong>Current Location:</strong> {location.lat.toFixed(6)},{" "}
                  {location.lng.toFixed(6)} (+/-{Math.round(location.accuracy || 0)}m)
                </p>
              )}
            </div>

            <div className="attendance-card">
              <h3>Step 2: Camera Check</h3>
              {hasCamera === false ? (
                <QRFallback attendanceUrl={mobileAttendanceUrl} />
              ) : (
                <div className="camera-box">
                  <video ref={videoRef} autoPlay muted playsInline />
                  {!cameraStream && (
                    <p className="camera-hint">
                      Start camera access first to enable face capture.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="attendance-card">
              <h3>Step 3: Face + Attendance Actions</h3>
              <p>
                Register your face once. After that, use check-in and check-out with live face
                and location verification.
              </p>

              <div className="attendance-actions">
                <button
                  type="button"
                  onClick={registerFace}
                  disabled={busyAction === "Register Face" || hasCamera === false}
                >
                  {busyAction === "Register Face" ? "Registering..." : "Register Face"}
                </button>

                <button
                  type="button"
                  onClick={() => runAttendanceAction("/attendance/check-in", "Check In")}
                  disabled={
                    busyAction === "Check In" || !hasFaceProfile || checkInDone || hasCamera === false
                  }
                >
                  {busyAction === "Check In" ? "Checking In..." : "Check In"}
                </button>

                <button
                  type="button"
                  onClick={() => runAttendanceAction("/attendance/check-out", "Check Out")}
                  disabled={
                    busyAction === "Check Out" ||
                    !checkInDone ||
                    checkOutDone ||
                    hasCamera === false
                  }
                >
                  {busyAction === "Check Out" ? "Checking Out..." : "Check Out"}
                </button>
              </div>
            </div>

            {lastSnapshot && (
              <div className="attendance-card">
                <h3>Latest Snapshot</h3>
                <img src={lastSnapshot} alt="Latest attendance capture" className="snapshot-img" />
              </div>
            )}

            {error && <div className="attendance-error">{error}</div>}
            {success && <div className="attendance-success">{success}</div>}
          </>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;

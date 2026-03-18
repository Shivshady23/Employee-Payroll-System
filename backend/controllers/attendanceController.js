const Attendance = require("../models/Attendance");
const FaceProfile = require("../models/FaceProfile");
const Employee = require("../models/Employee");
const { haversineDistanceMeters } = require("../utils/haversine");
const {
  compareFaceVectors,
  extractFaceVectorFromSnapshot,
  isValidFaceVector
} = require("../utils/faceMatcher");

const OFFICE_TIMEZONE = process.env.OFFICE_TIMEZONE || "Asia/Kolkata";
const OFFICE_LAT = Number(process.env.OFFICE_LAT);
const OFFICE_LNG = Number(process.env.OFFICE_LNG);
const OFFICE_RADIUS_METERS = Number(process.env.OFFICE_RADIUS_METERS) || 300;

const isOfficeConfigured = () =>
  Number.isFinite(OFFICE_LAT) && Number.isFinite(OFFICE_LNG);

const getDateKey = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: OFFICE_TIMEZONE }).format(new Date());

const resolveDeviceType = req => {
  const bodyDevice = req.body?.deviceType;
  if (["desktop", "mobile", "unknown"].includes(bodyDevice)) {
    return bodyDevice;
  }

  const userAgent = req.headers["user-agent"] || "";
  if (/android|iphone|ipad|mobile/i.test(userAgent)) return "mobile";
  if (userAgent) return "desktop";
  return "unknown";
};

const toFiniteNumber = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildLocationPayload = location => ({
  lat: toFiniteNumber(location?.lat),
  lng: toFiniteNumber(location?.lng),
  accuracy: toFiniteNumber(location?.accuracy)
});

const ensureEmployeeLinked = async req => {
  if (!req.user?.employeeId) {
    return null;
  }
  return Employee.findById(req.user.employeeId).select("_id name email employeeCode").lean();
};

const extractFaceVector = (faceVector, selfieSnapshot) => {
  if (isValidFaceVector(faceVector)) {
    return faceVector;
  }
  return extractFaceVectorFromSnapshot(selfieSnapshot);
};

const verifyLocation = location => {
  if (location.lat === null || location.lng === null) {
    return {
      ok: false,
      code: 400,
      message: "location denied or unavailable",
      payload: null
    };
  }

  if (!isOfficeConfigured()) {
    return {
      ok: false,
      code: 500,
      message: "Office location env is not configured",
      payload: null
    };
  }

  const distance = haversineDistanceMeters(location.lat, location.lng, OFFICE_LAT, OFFICE_LNG);
  if (distance > OFFICE_RADIUS_METERS) {
    return {
      ok: false,
      code: 403,
      message: "outside office radius",
      payload: {
        distanceFromOfficeMeters: Math.round(distance),
        allowedRadiusMeters: OFFICE_RADIUS_METERS
      }
    };
  }

  return {
    ok: true,
    code: 200,
    message: "location verified",
    payload: {
      distanceFromOfficeMeters: Math.round(distance)
    }
  };
};

exports.registerFace = async (req, res) => {
  try {
    const employee = await ensureEmployeeLinked(req);
    if (!employee) {
      return res.status(404).json({ message: "Employee mapping not found" });
    }

    const { faceVector, selfieSnapshot } = req.body;
    const computedVector = extractFaceVector(faceVector, selfieSnapshot);

    if (!isValidFaceVector(computedVector)) {
      return res.status(400).json({ message: "face not matched" });
    }

    const profile = await FaceProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        employeeId: req.user.employeeId,
        faceVector: computedVector,
        selfieImageRef: selfieSnapshot || ""
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    return res.json({
      message: "Face profile registered successfully",
      profileId: profile._id,
      updatedAt: profile.updatedAt
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getTodayAttendance = async (req, res) => {
  try {
    const employee = await ensureEmployeeLinked(req);
    if (!employee) {
      return res.status(404).json({ message: "Employee mapping not found" });
    }

    const dateKey = getDateKey();
    const attendance = await Attendance.findOne({
      userId: req.user.id,
      dateKey
    }).lean();

    const faceProfileExists = await FaceProfile.exists({ userId: req.user.id });

    return res.json({
      dateKey,
      attendance: attendance || null,
      hasFaceProfile: Boolean(faceProfileExists),
      office: {
        lat: Number(process.env.OFFICE_LAT || 0),
        lng: Number(process.env.OFFICE_LNG || 0),
        radiusMeters: OFFICE_RADIUS_METERS
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const employee = await ensureEmployeeLinked(req);
    if (!employee) {
      return res.status(404).json({ message: "Employee mapping not found" });
    }

    const dateKey = getDateKey();
    const existing = await Attendance.findOne({ userId: req.user.id, dateKey });
    if (existing?.checkInAt) {
      return res.status(409).json({ message: "attendance already marked" });
    }

    const faceProfile = await FaceProfile.findOne({ userId: req.user.id }).lean();
    if (!faceProfile || !isValidFaceVector(faceProfile.faceVector)) {
      return res.status(400).json({ message: "Face profile not registered yet" });
    }

    const { faceVector, selfieSnapshot } = req.body;
    const computedVector = extractFaceVector(faceVector, selfieSnapshot);
    if (!isValidFaceVector(computedVector)) {
      return res.status(400).json({ message: "face not matched" });
    }

    const faceResult = compareFaceVectors(computedVector, faceProfile.faceVector);
    if (!faceResult.matched) {
      return res.status(403).json({
        message: "face not matched",
        distance: faceResult.distance,
        threshold: faceResult.threshold
      });
    }

    const location = buildLocationPayload(req.body.location);
    const locationResult = verifyLocation(location);
    if (!locationResult.ok) {
      return res.status(locationResult.code).json({
        message: locationResult.message,
        ...locationResult.payload
      });
    }

    const attendance = await Attendance.create({
      employeeId: req.user.employeeId,
      userId: req.user.id,
      dateKey,
      checkInAt: new Date(),
      faceMatched: true,
      locationVerified: true,
      deviceType: resolveDeviceType(req),
      location,
      selfieImageRef: selfieSnapshot || "",
      checkInSelfieRef: selfieSnapshot || "",
      meta: {
        distanceFromOfficeMeters: locationResult.payload.distanceFromOfficeMeters
      }
    });

    return res.status(201).json({
      message: "Check-in successful",
      attendance
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "attendance already marked" });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const employee = await ensureEmployeeLinked(req);
    if (!employee) {
      return res.status(404).json({ message: "Employee mapping not found" });
    }

    const dateKey = getDateKey();
    const attendance = await Attendance.findOne({ userId: req.user.id, dateKey });

    if (!attendance || !attendance.checkInAt) {
      return res.status(400).json({ message: "Please complete check-in first" });
    }

    if (attendance.checkOutAt) {
      return res.status(409).json({ message: "Check-out already marked for today" });
    }

    const faceProfile = await FaceProfile.findOne({ userId: req.user.id }).lean();
    if (!faceProfile || !isValidFaceVector(faceProfile.faceVector)) {
      return res.status(400).json({ message: "Face profile not registered yet" });
    }

    const { faceVector, selfieSnapshot } = req.body;
    const computedVector = extractFaceVector(faceVector, selfieSnapshot);
    if (!isValidFaceVector(computedVector)) {
      return res.status(400).json({ message: "face not matched" });
    }

    const faceResult = compareFaceVectors(computedVector, faceProfile.faceVector);
    if (!faceResult.matched) {
      return res.status(403).json({
        message: "face not matched",
        distance: faceResult.distance,
        threshold: faceResult.threshold
      });
    }

    const location = buildLocationPayload(req.body.location);
    const locationResult = verifyLocation(location);
    if (!locationResult.ok) {
      return res.status(locationResult.code).json({
        message: locationResult.message,
        ...locationResult.payload
      });
    }

    attendance.checkOutAt = new Date();
    attendance.faceMatched = true;
    attendance.locationVerified = true;
    attendance.deviceType = resolveDeviceType(req);
    attendance.location = location;
    attendance.selfieImageRef = selfieSnapshot || attendance.selfieImageRef;
    attendance.checkOutSelfieRef = selfieSnapshot || "";
    attendance.meta = {
      ...attendance.meta,
      distanceFromOfficeMeters: locationResult.payload.distanceFromOfficeMeters
    };
    await attendance.save();

    return res.json({
      message: "Check-out successful",
      attendance
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

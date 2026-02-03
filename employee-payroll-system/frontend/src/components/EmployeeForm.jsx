import { useState } from "react";
import api from "../api/axios";

const EmployeeForm = ({ onEmployeeCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    dob: "",
    dateOfJoining: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateName = (name) => {
    return /^[a-zA-Z\s]{2,50}$/.test(name) ? "" : "Name must contain only letters (2-50 characters)";
  };

  const validateEmail = (email) => {
    return /^\S+@\S+\.\S+$/.test(email) ? "" : "Invalid email format";
  };

  const validateContactNumber = (number) => {
    return /^[0-9]{10}$/.test(number) ? "" : "Contact number must be exactly 10 digits";
  };

  const validateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 ? age - 1 : age;
    return actualAge >= 18 ? "" : "Employee must be at least 18 years old";
  };

  const validateDateOfJoining = (joining) => {
    const joiningDate = new Date(joining);
    const today = new Date();
    return joiningDate <= today ? "" : "Joining date cannot be in the future";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = "Employee name is required";
    } else {
      const nameError = validateName(formData.name);
      if (nameError) newErrors.name = nameError;
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else {
      const emailError = validateEmail(formData.email);
      if (emailError) newErrors.email = emailError;
    }

    if (!formData.contactNumber) {
      newErrors.contactNumber = "Contact number is required";
    } else {
      const contactError = validateContactNumber(formData.contactNumber);
      if (contactError) newErrors.contactNumber = contactError;
    }

    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
    } else {
      const ageError = validateAge(formData.dob);
      if (ageError) newErrors.dob = ageError;
    }

    if (!formData.dateOfJoining) {
      newErrors.dateOfJoining = "Date of joining is required";
    } else {
      const joiningError = validateDateOfJoining(formData.dateOfJoining);
      if (joiningError) newErrors.dateOfJoining = joiningError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/employees/create", formData);
      
      // Show credentials in alert
      alert(
        `✅ Employee Created Successfully!\n\n` +
        `Employee Code: ${res.data.credentials.email.split('@')[0]}\n` +
        `Login Email: ${res.data.credentials.email}\n` +
        `Password: ${res.data.credentials.password}\n\n` +
        `Please note down these credentials for future login.`
      );

      setFormData({
        name: "",
        email: "",
        contactNumber: "",
        dob: "",
        dateOfJoining: ""
      });

      if (onEmployeeCreated) {
        onEmployeeCreated();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container professional-form">
      <h2 className="form-title">➕ Add New Employee</h2>

      <form onSubmit={handleSubmit} className="employee-form">
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            👤 Employee Name <span className="required">*</span>
          </label>
          <input
            id="name"
            type="text"
            name="name"
            className={`form-input ${errors.name ? "input-error" : ""}`}
            placeholder="Enter full name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          {errors.name ? (
            <small className="form-error">❌ {errors.name}</small>
          ) : (
            <small className="form-hint">Full name as per official documents</small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            📧 Email Address <span className="required">*</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            className={`form-input ${errors.email ? "input-error" : ""}`}
            placeholder="name@company.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {errors.email ? (
            <small className="form-error">❌ {errors.email}</small>
          ) : (
            <small className="form-hint">Used for login and communication</small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="contactNumber" className="form-label">
            📱 Contact Number <span className="required">*</span>
          </label>
          <input
            id="contactNumber"
            type="text"
            name="contactNumber"
            className={`form-input ${errors.contactNumber ? "input-error" : ""}`}
            placeholder="10-digit mobile number"
            value={formData.contactNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
              handleChange({ target: { name: "contactNumber", value } });
            }}
            maxLength="10"
            required
          />
          {errors.contactNumber ? (
            <small className="form-error">❌ {errors.contactNumber}</small>
          ) : (
            <small className="form-hint">10 digits without country code</small>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dob" className="form-label">
              🎂 Date of Birth <span className="required">*</span>
            </label>
            <input
              id="dob"
              type="date"
              name="dob"
              className={`form-input ${errors.dob ? "input-error" : ""}`}
              value={formData.dob}
              onChange={handleChange}
              required
            />
            {errors.dob ? (
              <small className="form-error">❌ {errors.dob}</small>
            ) : (
              <small className="form-hint">Must be 18+ years</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="dateOfJoining" className="form-label">
              📅 Date of Joining <span className="required">*</span>
            </label>
            <input
              id="dateOfJoining"
              type="date"
              name="dateOfJoining"
              className={`form-input ${errors.dateOfJoining ? "input-error" : ""}`}
              value={formData.dateOfJoining}
              onChange={handleChange}
              required
            />
            {errors.dateOfJoining ? (
              <small className="form-error">❌ {errors.dateOfJoining}</small>
            ) : (
              <small className="form-hint">Employee start date</small>
            )}
          </div>
        </div>

        <button type="submit" disabled={loading} className="form-button">
          {loading ? "⏳ Creating..." : "✅ Create Employee"}
        </button>
      </form>
    </div>
  );
};

export default EmployeeForm;
import { useEffect, useState } from "react";
import api from "../api/axios";

const SalaryForm = () => {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [basic, setBasic] = useState("");
  const [hra, setHra] = useState("");
  const [conveyance, setConveyance] = useState("");
  const [loading, setLoading] = useState(false);
  const [calculatedValues, setCalculatedValues] = useState(null);
  const [errors, setErrors] = useState({});

  const validateSalaryAmount = (amount, fieldName) => {
    const num = Number(amount);
    if (num <= 0) return `${fieldName} must be greater than 0`;
    if (num > 1000000) return `${fieldName} cannot exceed ₹10,00,000`;
    return "";
  };

  const validateTotalSalary = () => {
    const total = Number(basic) + Number(hra) + Number(conveyance);
    if (total > 1000000) return "Total salary cannot exceed ₹10,00,000";
    return "";
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/employees?limit=100");
      setEmployees(res.data.employees);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  // Calculate deductions in real-time for preview
  const calculateDeductions = () => {
    const basicNum = Number(basic) || 0;
    const hraNum = Number(hra) || 0;
    const conveyanceNum = Number(conveyance) || 0;
    
    const totalEarnings = basicNum + hraNum + conveyanceNum;
    
    // PF Calculations
    const employeePF = Math.round(totalEarnings * 0.12);
    const employerPFTotal = Math.round(totalEarnings * 0.12);
    const employerPension = Math.round(employerPFTotal * 0.8333);
    const employerPF = employerPFTotal - employerPension;
    
    // ESIC Calculations
    const esicApplicable = totalEarnings <= 21000;
    const employeeESIC = esicApplicable ? Math.round(totalEarnings * 0.0075) : 0;
    const employerESIC = esicApplicable ? Math.round(totalEarnings * 0.0325) : 0;
    
    // Total deductions
    const totalEmployeeDeductions = employeePF + employeeESIC;
    const totalEmployerContribution = employerPF + employerPension + employerESIC;
    const netPay = totalEarnings - totalEmployeeDeductions;

    return {
      totalEarnings,
      employeePF,
      employeeESIC,
      totalEmployeeDeductions,
      netPay,
      employerPF,
      employerPension,
      employerESIC,
      totalEmployerContribution,
      esicApplicable
    };
  };

  // Update calculations when salary inputs change
  useEffect(() => {
    if (basic || hra || conveyance) {
      setCalculatedValues(calculateDeductions());
    }
  }, [basic, hra, conveyance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!employeeId) {
      newErrors.employeeId = "Please select an employee";
    }

    if (!basic) {
      newErrors.basic = "Basic salary is required";
    } else {
      const basicError = validateSalaryAmount(basic, "Basic salary");
      if (basicError) newErrors.basic = basicError;
    }

    if (!hra) {
      newErrors.hra = "HRA is required";
    } else {
      const hraError = validateSalaryAmount(hra, "HRA");
      if (hraError) newErrors.hra = hraError;
    }

    if (!conveyance) {
      newErrors.conveyance = "Conveyance is required";
    } else {
      const conveyanceError = validateSalaryAmount(conveyance, "Conveyance");
      if (conveyanceError) newErrors.conveyance = conveyanceError;
    }

    const totalError = validateTotalSalary();
    if (totalError && !newErrors.basic) {
      newErrors.basic = totalError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/salary/create", {
        employeeId,
        basic: Number(basic),
        hra: Number(hra),
        conveyance: Number(conveyance)
      });

      const calc = res.data.salary;
      alert(
        `✅ Salary created/updated successfully!\n\n` +
        `Total Earnings: ₹${calc.totalEarnings}\n\n` +
        `EMPLOYEE DEDUCTIONS:\n` +
        `├─ PF (12%): ₹${calc.employeePF}\n` +
        `├─ ESIC (0.75%): ₹${calc.employeeESIC}\n` +
        `└─ Total Deductions: ₹${calc.employeePF + calc.employeeESIC}\n\n` +
        `EMPLOYER CONTRIBUTIONS:\n` +
        `├─ PF (3.67%): ₹${calc.employerPF}\n` +
        `├─ Pension (8.33%): ₹${calc.employerPensionContribution}\n` +
        `├─ ESIC (3.25%): ₹${calc.employerESIC}\n` +
        `└─ Total: ₹${calc.employerPF + calc.employerPensionContribution + calc.employerESIC}`
      );
      
      setEmployeeId("");
      setBasic("");
      setHra("");
      setConveyance("");
      setCalculatedValues(null);
    } catch (err) {
      alert(err.response?.data?.message || "Error creating salary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container professional-form">
      <h2 className="form-title">💰 Create/Update Salary</h2>

      <form onSubmit={handleSubmit} className="salary-form">
        <div className="form-group">
          <label htmlFor="employeeId" className="form-label">
            👤 Select Employee <span className="required">*</span>
          </label>
          <select
            id="employeeId"
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(e.target.value);
              if (errors.employeeId) setErrors({ ...errors, employeeId: "" });
            }}
            className={`form-input form-select ${errors.employeeId ? "input-error" : ""}`}
            required
          >
            <option value="">-- Choose Employee --</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.employeeCode} - {emp.name}
              </option>
            ))}
          </select>
          {errors.employeeId ? (
            <small className="form-error">❌ {errors.employeeId}</small>
          ) : (
            <small className="form-hint">Select employee to configure salary</small>
          )}
        </div>

        <div className="salary-inputs-grid">
          <div className="form-group">
            <label htmlFor="basic" className="form-label">
              💵 Basic Salary <span className="required">*</span>
            </label>
            <div className="input-with-currency">
              <span className="currency-symbol">₹</span>
              <input
                id="basic"
                type="number"
                className={`form-input ${errors.basic ? "input-error" : ""}`}
                placeholder="50000"
                value={basic}
                onChange={(e) => {
                  setBasic(e.target.value);
                  if (errors.basic) setErrors({ ...errors, basic: "" });
                }}
                required
                min="0"
                max="1000000"
              />
            </div>
            {errors.basic ? (
              <small className="form-error">❌ {errors.basic}</small>
            ) : (
              <small className="form-hint">Fixed monthly basic salary (max ₹10,00,000)</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="hra" className="form-label">
              🏠 House Rent Allowance (HRA) <span className="required">*</span>
            </label>
            <div className="input-with-currency">
              <span className="currency-symbol">₹</span>
              <input
                id="hra"
                type="number"
                className={`form-input ${errors.hra ? "input-error" : ""}`}
                placeholder="10000"
                value={hra}
                onChange={(e) => {
                  setHra(e.target.value);
                  if (errors.hra) setErrors({ ...errors, hra: "" });
                }}
                required
                min="0"
                max="1000000"
              />
            </div>
            {errors.hra ? (
              <small className="form-error">❌ {errors.hra}</small>
            ) : (
              <small className="form-hint">Housing allowance component (max ₹10,00,000)</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="conveyance" className="form-label">
              🚗 Conveyance <span className="required">*</span>
            </label>
            <div className="input-with-currency">
              <span className="currency-symbol">₹</span>
              <input
                id="conveyance"
                type="number"
                className={`form-input ${errors.conveyance ? "input-error" : ""}`}
                placeholder="2000"
                value={conveyance}
                onChange={(e) => {
                  setConveyance(e.target.value);
                  if (errors.conveyance) setErrors({ ...errors, conveyance: "" });
                }}
                required
                min="0"
                max="1000000"
              />
            </div>
            {errors.conveyance ? (
              <small className="form-error">❌ {errors.conveyance}</small>
            ) : (
              <small className="form-hint">Travel and transport allowance (max ₹10,00,000)</small>
            )}
          </div>
        </div>

        {calculatedValues && (
          <div className="salary-preview">
            <h3 className="preview-title">📊 Salary Breakdown Preview</h3>
            
            <div className="preview-section earnings-section">
              <strong>📈 Earnings</strong>
              <div className="preview-item">
                {basic && `Basic: ₹${Number(basic).toLocaleString()}`}
              </div>
              <div className="preview-item">
                {hra && `HRA: ₹${Number(hra).toLocaleString()}`}
              </div>
              <div className="preview-item">
                {conveyance && `Conveyance: ₹${Number(conveyance).toLocaleString()}`}
              </div>
              <div className="preview-total">
                Total: ₹{calculatedValues.totalEarnings.toLocaleString()}
              </div>
            </div>

            <div className="preview-section deductions-section">
              <strong>👤 Employee Deductions</strong>
              <div className="preview-item">
                PF (12%): ₹{calculatedValues.employeePF.toLocaleString()}
              </div>
              <div className="preview-item">
                ESIC (0.75%): ₹{calculatedValues.employeeESIC.toLocaleString()}
                {!calculatedValues.esicApplicable && <span className="badge">Not Applicable</span>}
              </div>
              <div className="preview-total">
                Total Deductions: ₹{calculatedValues.totalEmployeeDeductions.toLocaleString()}
              </div>
            </div>

            <div className="preview-section employer-section">
              <strong>🏢 Employer Contributions</strong>
              <div className="preview-item">
                PF (3.67%): ₹{calculatedValues.employerPF.toLocaleString()}
              </div>
              <div className="preview-item">
                Pension (8.33%): ₹{calculatedValues.employerPension.toLocaleString()}
              </div>
              <div className="preview-item">
                ESIC (3.25%): ₹{calculatedValues.employerESIC.toLocaleString()}
                {!calculatedValues.esicApplicable && <span className="badge">Not Applicable</span>}
              </div>
              <div className="preview-total">
                Total: ₹{calculatedValues.totalEmployerContribution.toLocaleString()}
              </div>
            </div>

            <div className="preview-section netpay-section">
              <strong>💰 Net Pay</strong>
              <div className="preview-netpay">
                ₹{calculatedValues.netPay.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} className="form-button">
          {loading ? "⏳ Saving..." : "✅ Save Salary"}
        </button>
      </form>
    </div>
  );
};

export default SalaryForm;
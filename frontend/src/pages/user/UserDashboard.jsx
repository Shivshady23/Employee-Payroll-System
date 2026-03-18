import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [salary, setSalary] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOwnSalary = useCallback(async employeeId => {
    try {
      const response = await api.get(`/salary/${employeeId}`);
      setSalary(response.data);
    } catch (_error) {
      setSalary(null);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/employees/me");
      setUserInfo(response.data);
      fetchOwnSalary(response.data._id);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchOwnSalary]);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      fetchUserData();
    }
  }, [fetchUserData]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Employee Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {userInfo && (
        <div className="user-info-card">
          <h3>Your Information</h3>
          <p><strong>Name:</strong> {userInfo.name}</p>
          <p><strong>Email:</strong> {userInfo.email}</p>
          <p><strong>Employee Code:</strong> {userInfo.employeeCode}</p>
          <p><strong>Contact:</strong> {userInfo.contactNumber}</p>
        </div>
      )}

      <div className="tabs">
        <button className="tab-btn active" type="button">
          My Salary
        </button>
        <button
          className="tab-btn"
          type="button"
          onClick={() => navigate("/user/attendance")}
        >
          Attendance
        </button>
      </div>

      <div className="tab-content">
        <div className="salary-view">
          <h2>Your Salary Details</h2>
          {loading ? (
            <p>Loading...</p>
          ) : salary ? (
            <div className="salary-card">
              <div className="salary-section">
                <h3>Earnings</h3>
                <p><strong>Basic Salary:</strong> Rs {salary.basic.toLocaleString()}</p>
                <p><strong>HRA:</strong> Rs {salary.hra.toLocaleString()}</p>
                <p><strong>Conveyance:</strong> Rs {salary.conveyance.toLocaleString()}</p>
                <p className="total">
                  <strong>Total Earnings:</strong> Rs {salary.totalEarnings.toLocaleString()}
                </p>
              </div>

              <div className="salary-section">
                <h3>Deductions</h3>
                <p><strong>Employee PF (12%):</strong> Rs {salary.employeePF.toLocaleString()}</p>
                <p>
                  <strong>Pension Contribution (5%):</strong> Rs{" "}
                  {salary.pensionContribution.toLocaleString()}
                </p>
                {salary.employeeESIC > 0 && (
                  <p><strong>Employee ESIC:</strong> Rs {salary.employeeESIC.toLocaleString()}</p>
                )}
              </div>

              <div className="salary-section">
                <h3>Employer Contributions</h3>
                <p>
                  <strong>Employer Contributions (3.67%):</strong> Rs{" "}
                  {salary.employerPF.toLocaleString()}
                </p>
                {salary.employerESIC > 0 && (
                  <p><strong>Employer ESIC:</strong> Rs {salary.employerESIC.toLocaleString()}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="no-data">No salary information available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [salary, setSalary] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get user info from localStorage and fetch employee data
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserData();
    }
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/employees");
      if (res.data.employees.length > 0) {
        const userEmp = res.data.employees[0];
        setUserInfo(userEmp);
        fetchOwnSalary(userEmp._id);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnSalary = async (empId) => {
    try {
      const res = await api.get(`/salary/${empId}`);
      setSalary(res.data);
    } catch (err) {
      setSalary(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>👤 Employee Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

      {/* User Info Card */}
      {userInfo && (
        <div className="user-info-card">
          <h3>📋 Your Information</h3>
          <p><strong>Name:</strong> {userInfo.name}</p>
          <p><strong>Email:</strong> {userInfo.email}</p>
          <p><strong>Employee Code:</strong> {userInfo.employeeCode}</p>
          <p><strong>Contact:</strong> {userInfo.contactNumber}</p>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="tabs">
        <button className="tab-btn active">
          💰 My Salary
        </button>
      </div>

      {/* Salary Content */}
      <div className="tab-content">
          <div className="salary-view">
            <h2>💰 Your Salary Details</h2>
            {loading ? (
              <p>Loading...</p>
            ) : salary ? (
              <div className="salary-card">
                <div className="salary-section">
                  <h3>📊 Earnings</h3>
                  <p><strong>Basic Salary:</strong> ₹{salary.basic.toLocaleString()}</p>
                  <p><strong>HRA:</strong> ₹{salary.hra.toLocaleString()}</p>
                  <p><strong>Conveyance:</strong> ₹{salary.conveyance.toLocaleString()}</p>
                  <p className="total"><strong>Total Earnings:</strong> ₹{salary.totalEarnings.toLocaleString()}</p>
                </div>

                <div className="salary-section">
                  <h3>🔻 Deductions</h3>
                  <p><strong>Employee PF (12%):</strong> ₹{salary.employeePF.toLocaleString()}</p>
                  <p><strong>Pension Contribution (5%):</strong> ₹{salary.pensionContribution.toLocaleString()}</p>
                  {salary.employeeESIC > 0 && (
                    <p><strong>Employee ESIC:</strong> ₹{salary.employeeESIC.toLocaleString()}</p>
                  )}
                </div>

                <div className="salary-section">
                  <h3>🏢 Employer Contributions</h3>
                  <p><strong>Employer Contributions (3.67%):</strong> ₹{salary.employerPF.toLocaleString()}</p>
                  {salary.employerESIC > 0 && (
                    <p><strong>Employer ESIC:</strong> ₹{salary.employerESIC.toLocaleString()}</p>
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
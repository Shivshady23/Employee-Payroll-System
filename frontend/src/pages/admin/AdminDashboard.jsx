import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeForm from "../../components/EmployeeForm";
import SalaryForm from "../../components/SalaryForm";
import AdminAttendanceView from "../../components/AdminAttendanceView";
import AIAssistant from "../../components/AIAssistant/AIAssistant";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("employees");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleEmployeeCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === "employees" ? "active" : ""}`}
            onClick={() => setActiveTab("employees")}
          >
            Add Employee
          </button>
          <button
            className={`tab-btn ${activeTab === "salary" ? "active" : ""}`}
            onClick={() => setActiveTab("salary")}
          >
            Create Salary
          </button>
          <button
            className={`tab-btn ${activeTab === "attendance" ? "active" : ""}`}
            onClick={() => setActiveTab("attendance")}
          >
            Attendance
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "employees" && (
            <EmployeeForm key={refreshKey} onEmployeeCreated={handleEmployeeCreated} />
          )}

          {activeTab === "salary" && <SalaryForm />}

          {activeTab === "attendance" && <AdminAttendanceView />}
        </div>
      </div>
      <AIAssistant />
    </>
  );
};

export default AdminDashboard;

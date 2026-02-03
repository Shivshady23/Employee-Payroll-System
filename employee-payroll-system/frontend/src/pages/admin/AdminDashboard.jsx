import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import EmployeeForm from "../../components/EmployeeForm";
import SalaryForm from "../../components/SalaryForm";

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
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>👨‍💼 Admin Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "employees" ? "active" : ""}`}
          onClick={() => setActiveTab("employees")}
        >
          ➕ Add Employee
        </button>
        <button
          className={`tab-btn ${activeTab === "salary" ? "active" : ""}`}
          onClick={() => setActiveTab("salary")}
        >
          💰 Create Salary
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "employees" && (
          <EmployeeForm key={refreshKey} onEmployeeCreated={handleEmployeeCreated} />
        )}

        {activeTab === "salary" && (
          <SalaryForm />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
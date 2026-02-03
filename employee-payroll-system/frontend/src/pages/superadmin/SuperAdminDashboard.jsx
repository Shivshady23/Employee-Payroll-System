import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import EmployeeForm from "../../components/EmployeeForm";
import SalaryForm from "../../components/SalaryForm";
import EmployeeList from "../../components/EmployeeList";

const SuperAdminDashboard = () => {
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
        <h1>👑 SuperAdmin Dashboard</h1>
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
          👥 View Employees
        </button>
        <button
          className={`tab-btn ${activeTab === "add-employee" ? "active" : ""}`}
          onClick={() => setActiveTab("add-employee")}
        >
          ➕ Add Employee
        </button>
        <button
          className={`tab-btn ${activeTab === "salary" ? "active" : ""}`}
          onClick={() => setActiveTab("salary")}
        >
          💰 Create/Update Salary
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "employees" && (
          <div>
            <h2>👥 All Employees</h2>
            <EmployeeList key={refreshKey} />
          </div>
        )}

        {activeTab === "add-employee" && (
          <EmployeeForm key={refreshKey} onEmployeeCreated={handleEmployeeCreated} />
        )}

        {activeTab === "salary" && (
          <SalaryForm />
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
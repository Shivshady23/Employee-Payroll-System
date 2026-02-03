import { useEffect, useState } from "react";
import api from "../api/axios";

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get(
        `/employees?page=${page}&limit=5&search=${search}`
      );
      setEmployees(res.data.employees);
      setPages(res.data.pages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, search]);

  const viewSalary = async (employeeId) => {
    try {
      const res = await api.get(`/salary/${employeeId}`);
      setSelectedSalary(res.data);
    } catch (err) {
      alert("Salary not found or you don't have permission to view it");
    }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/employees/${id}`);
      alert("✅ Employee deleted successfully");
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting employee");
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search by name, email, phone, code"
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
      />

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Email</th>
            <th>Contact</th>
            <th>DOB</th>
            <th>Joining</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp._id}>
              <td>{emp.employeeCode}</td>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.contactNumber}</td>
              <td>{emp.dob.slice(0, 10)}</td>
              <td>{emp.dateOfJoining.slice(0, 10)}</td>
              <td>
                <button 
                  className="action-btn view-btn"
                  onClick={() => viewSalary(emp._id)}
                >
                  💰 View Salary
                </button>
                {userRole === "superadmin" && (
                  <button
                    className="action-btn delete-btn"
                    onClick={() => deleteEmployee(emp._id)}
                  >
                    🗑️ Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            ⬅️ Prev
        </button>

        <span> Page {page} of {pages} </span>

        <button disabled={page === pages} onClick={() => setPage(page + 1)}>
            Next ➡️
        </button>
      </div>

      {/* Salary Modal */}
      {selectedSalary && (
        <div className="modal-overlay" onClick={() => setSelectedSalary(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setSelectedSalary(null)}
            >
              ✕
            </button>

            <h3>💰 Salary Details</h3>
            <p><strong>Employee:</strong> {selectedSalary.employeeId.name} ({selectedSalary.employeeId.employeeCode})</p>

            <div className="salary-details">
              <h4>📊 Earnings</h4>
              <p>Basic: ₹{selectedSalary.basic.toLocaleString()}</p>
              <p>HRA: ₹{selectedSalary.hra.toLocaleString()}</p>
              <p>Conveyance: ₹{selectedSalary.conveyance.toLocaleString()}</p>
              <p className="total">Total Earnings: ₹{selectedSalary.totalEarnings.toLocaleString()}</p>

              <h4>🔻 Deductions</h4>
              <p>Employee PF: ₹{selectedSalary.employeePF.toLocaleString()}</p>
              <p>Pension: ₹{selectedSalary.pensionContribution.toLocaleString()}</p>
              {selectedSalary.employeeESIC > 0 && (
                <p>Employee ESIC: ₹{selectedSalary.employeeESIC.toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
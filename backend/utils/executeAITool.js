const Employee = require("../models/Employee");
const Salary = require("../models/Salary");
const AuditLog = require("../models/AuditLog");

const toRoundedNumber = value => Number(Math.round(Number(value || 0)));

const buildEmployeeMatch = identifier => ({
  $or: [
    { name: { $regex: identifier, $options: "i" } },
    { employeeCode: { $regex: identifier, $options: "i" } }
  ]
});

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { now, start, nextMonthStart };
};

const executeAITool = async (toolName, toolInput = {}, context = {}) => {
  switch (toolName) {
    case "get_all_employees": {
      let query = {};
      if (toolInput?.filter?.joinedThisMonth) {
        const { start, nextMonthStart } = getCurrentMonthRange();
        query.dateOfJoining = { $gte: start, $lt: nextMonthStart };
      }

      const employees = await Employee.find(query).sort({ createdAt: -1 }).lean();
      return {
        count: employees.length,
        employees: employees.map(e => ({
          name: e.name,
          email: e.email,
          employeeCode: e.employeeCode,
          dateOfJoining: e.dateOfJoining,
          contact: e.contactNumber
        }))
      };
    }

    case "get_employees_missing_salary": {
      const employees = await Employee.find({}).lean();
      const salaries = await Salary.find({}).lean();
      const salaryEmployeeIds = new Set(salaries.map(s => s.employeeId.toString()));
      const missing = employees.filter(
        e => !salaryEmployeeIds.has(e._id.toString())
      );

      return {
        count: missing.length,
        employees: missing.map(e => ({
          name: e.name,
          employeeCode: e.employeeCode,
          email: e.email
        }))
      };
    }

    case "get_salary_by_employee": {
      const identifier = (toolInput?.identifier || "").trim();
      if (!identifier) {
        return { error: "identifier is required" };
      }

      const employee = await Employee.findOne(buildEmployeeMatch(identifier)).lean();
      if (!employee) {
        return { error: `No employee found matching "${identifier}"` };
      }

      const salary = await Salary.findOne({ employeeId: employee._id }).lean();
      if (!salary) {
        return {
          employee: employee.name,
          employeeCode: employee.employeeCode,
          error: "No salary record found for this employee"
        };
      }

      const employeeESIC = Number(salary.employeeESIC || 0);
      const employeePF = Number(salary.employeePF || 0);
      const totalEarnings = Number(salary.totalEarnings || 0);

      return {
        employee: employee.name,
        employeeCode: employee.employeeCode,
        ...salary,
        netPay: totalEarnings - employeePF - employeeESIC
      };
    }

    case "get_employees_joined_this_month": {
      const { now, start, nextMonthStart } = getCurrentMonthRange();
      const employees = await Employee.find({
        dateOfJoining: { $gte: start, $lt: nextMonthStart }
      }).lean();

      return {
        month: now.toLocaleString("default", { month: "long" }),
        year: now.getFullYear(),
        count: employees.length,
        employees: employees.map(e => ({
          name: e.name,
          employeeCode: e.employeeCode,
          dateOfJoining: e.dateOfJoining
        }))
      };
    }

    case "get_payroll_summary": {
      const employees = await Employee.find({}).lean();
      const salaries = await Salary.find({}).lean();

      const totalNetPay = salaries.reduce(
        (sum, s) =>
          sum +
          (Number(s.totalEarnings || 0) -
            Number(s.employeePF || 0) -
            Number(s.employeeESIC || 0)),
        0
      );
      const totalPF = salaries.reduce(
        (sum, s) => sum + Number(s.employeePF || 0) + Number(s.employerPF || 0),
        0
      );
      const totalESIC = salaries.reduce(
        (sum, s) => sum + Number(s.employeeESIC || 0) + Number(s.employerESIC || 0),
        0
      );
      const totalPayrollCost = salaries.reduce(
        (sum, s) =>
          sum +
          Number(s.totalEarnings || 0) +
          Number(s.employerPF || 0) +
          Number(s.employerESIC || 0),
        0
      );

      return {
        totalEmployees: employees.length,
        employeesWithSalary: salaries.length,
        employeesWithoutSalary: employees.length - salaries.length,
        totalNetPay: toRoundedNumber(totalNetPay),
        totalPF: toRoundedNumber(totalPF),
        totalESIC: toRoundedNumber(totalESIC),
        totalPayrollCost: toRoundedNumber(totalPayrollCost)
      };
    }

    case "create_salary_structure": {
      const employeeIdentifier = (toolInput?.employeeIdentifier || "").trim();
      const basic = Number(toolInput?.basic);
      const hra = Number(toolInput?.hra);
      const conveyance = Number(toolInput?.conveyance);
      const confirmed = toolInput?.confirmed === true;

      if (!confirmed) {
        return {
          confirmationRequired: true,
          message:
            "Salary creation/update requires explicit confirmation. Ask the user to confirm and retry with confirmed=true."
        };
      }

      if (!employeeIdentifier) {
        return { error: "employeeIdentifier is required" };
      }
      if ([basic, hra, conveyance].some(value => Number.isNaN(value) || value < 0)) {
        return {
          error: "basic, hra and conveyance must be valid numbers greater than or equal to 0"
        };
      }

      const employee = await Employee.findOne(
        buildEmployeeMatch(employeeIdentifier)
      ).lean();
      if (!employee) {
        return { error: `No employee found matching "${employeeIdentifier}"` };
      }

      const totalEarnings = basic + hra + conveyance;
      const employeePF = toRoundedNumber(basic * 0.12);
      const employerPF = toRoundedNumber(basic * 0.12);
      const employerPensionContribution = toRoundedNumber(basic * 0.0833);
      const pensionContribution = employerPensionContribution;
      const esicApplicable = totalEarnings <= 21000;
      const employeeESIC = esicApplicable ? toRoundedNumber(totalEarnings * 0.0075) : 0;
      const employerESIC = esicApplicable ? toRoundedNumber(totalEarnings * 0.0325) : 0;

      const salaryData = {
        employeeId: employee._id,
        basic,
        hra,
        conveyance,
        totalEarnings,
        employeePF,
        employerPF,
        pensionContribution,
        employerPensionContribution,
        esicApplicable,
        employeeESIC,
        employerESIC
      };

      const previous = await Salary.findOne({ employeeId: employee._id }).lean();
      const saved = await Salary.findOneAndUpdate({ employeeId: employee._id }, salaryData, {
        upsert: true,
        new: true
      }).lean();

      if (context?.performedBy) {
        try {
          await AuditLog.create({
            performedBy: context.performedBy,
            action: previous
              ? "AI updated salary structure"
              : "AI created salary structure",
            targetCollection: "Salary",
            targetId: saved._id,
            oldValue: previous,
            newValue: saved
          });
        } catch (auditError) {
          console.error("AI salary audit log failed:", auditError.message);
        }
      }

      return {
        success: true,
        message: `Salary structure created for ${employee.name}`,
        summary: {
          totalEarnings,
          employeePF,
          employeeESIC,
          netPay: totalEarnings - employeePF - employeeESIC
        }
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
};

module.exports = { executeAITool };

const payrollTools = [
  {
    name: "get_all_employees",
    description:
      "Fetch all employees from the database. Use when asked about employee list, count, or overview.",
    input_schema: {
      type: "object",
      properties: {
        filter: {
          type: "object",
          description:
            "Optional filter object, for example { joinedThisMonth: true }."
        }
      },
      required: []
    }
  },
  {
    name: "get_employees_missing_salary",
    description: "Find employees who have no salary record assigned yet.",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "get_salary_by_employee",
    description:
      "Get salary structure for a specific employee by name or employeeCode.",
    input_schema: {
      type: "object",
      properties: {
        identifier: {
          type: "string",
          description: "Employee name or employee code"
        }
      },
      required: ["identifier"]
    }
  },
  {
    name: "get_employees_joined_this_month",
    description:
      "Find all employees whose dateOfJoining is in the current month and year.",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "get_payroll_summary",
    description:
      "Get a summary of total payroll: total employees, total net pay, total PF, total ESIC.",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "create_salary_structure",
    description:
      "Create or update salary structure for an employee. Use when admin says 'create salary for [name]'.",
    input_schema: {
      type: "object",
      properties: {
        employeeIdentifier: {
          type: "string",
          description: "Employee name or employee code"
        },
        basic: { type: "number" },
        hra: { type: "number" },
        conveyance: { type: "number" },
        confirmed: {
          type: "boolean",
          description:
            "Must be true before creating or updating salary data."
        }
      },
      required: ["employeeIdentifier", "basic", "hra", "conveyance"]
    }
  }
];

module.exports = { payrollTools };

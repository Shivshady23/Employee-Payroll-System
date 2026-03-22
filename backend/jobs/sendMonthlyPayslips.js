const cron = require("node-cron");

const Employee = require("../models/Employee");
const User = require("../models/User");
const Salary = require("../models/Salary");
const PayslipLog = require("../models/PayslipLog");

const generatePayslipPDF = require("../utils/generatePayslipPDF");
const sendPayslipEmail = require("../utils/sendPayslipEmail");

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

let cronTask;

const resolveMonthYear = ({ month, year } = {}) => {
  const now = new Date();
  const resolvedMonth = month ? Number(month) : now.getMonth() + 1;
  const resolvedYear = year ? Number(year) : now.getFullYear();

  if (!Number.isInteger(resolvedMonth) || resolvedMonth < 1 || resolvedMonth > 12) {
    throw new Error("Month must be an integer between 1 and 12");
  }

  if (!Number.isInteger(resolvedYear) || resolvedYear < 2000 || resolvedYear > 9999) {
    throw new Error("Year must be a valid 4-digit number");
  }

  const monthName = new Date(resolvedYear, resolvedMonth - 1, 1).toLocaleString(
    "default",
    { month: "long" }
  );

  return { month: resolvedMonth, year: resolvedYear, monthName };
};

const runMonthlyPayslipJob = async options => {
  const runAt = new Date();
  const { month, year, monthName } = resolveMonthYear(options);
  const employees = await Employee.find({});
  let sent = 0;
  let failed = 0;

  for (const employee of employees) {
    try {
      const salary = await Salary.findOne({ employeeId: employee._id });
      if (!salary) {
        failed += 1;
        console.warn(
          `Skipping payslip: salary record not found for employee ${employee._id}`
        );
        await delay(500);
        continue;
      }

      let recipientEmail = employee.email;
      let recipientName = employee.name || "Employee";

      if (!recipientEmail) {
        const linkedUser = await User.findOne({ employeeId: employee._id }).select(
          "email name"
        );
        recipientEmail = linkedUser?.email;
        if (linkedUser?.name) {
          recipientName = linkedUser.name;
        }
      }

      if (!recipientEmail) {
        failed += 1;
        console.warn(`Skipping payslip: email not found for employee ${employee._id}`);
        await delay(500);
        continue;
      }

      const pdfBuffer = await generatePayslipPDF(employee, salary, monthName, year);

      await sendPayslipEmail({
        name: recipientName,
        email: recipientEmail,
        month: monthName,
        year,
        pdfBuffer,
        employeeCode: employee.employeeCode
      });

      sent += 1;
    } catch (error) {
      failed += 1;
      console.error(
        `Payslip send failed for employee ${employee._id}:`,
        error.message
      );
    }

    await delay(500);
  }

  console.log(
    `Payslip job done: ${runAt.toISOString()} - ${sent} sent, ${failed} failed`
  );

  try {
    await PayslipLog.create({
      month,
      year,
      totalEmployees: employees.length,
      sent,
      failed,
      runAt
    });
  } catch (error) {
    console.error("Payslip log save failed:", error.message);
  }

  return {
    success: true,
    month,
    year,
    totalEmployees: employees.length,
    sent,
    failed,
    runAt
  };
};

const startPayslipCronJob = () => {
  if (cronTask) {
    return cronTask;
  }

  cronTask = cron.schedule("0 9 7 * *", async () => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      await runMonthlyPayslipJob({ month, year });
    } catch (error) {
      console.error("Monthly payslip cron job failed:", error.message);
    }
  });

  console.log("Payslip cron job scheduled: 0 9 7 * *");
  return cronTask;
};

module.exports = {
  startPayslipCronJob,
  runMonthlyPayslipJob
};

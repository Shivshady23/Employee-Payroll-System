const Salary = require("../models/Salary");

/* 💰 CREATE SALARY */
exports.createSalary = async (req, res) => {
  try {
    const { employeeId, basic, hra, conveyance } = req.body;

    // Calculate total earnings
    const totalEarnings = basic + hra + conveyance;

    // PF CALCULATIONS
    // Employee PF: 12% of total earnings
    const employeePF = Math.round(totalEarnings * 0.12);
    
    // Employer PF: 12% total
    // - 8.33% goes to employee pension
    // - Remaining (~3.67%) goes to employer PF
    const employerPFTotal = Math.round(totalEarnings * 0.12);
    const employerPensionContribution = Math.round(employerPFTotal * 0.8333);
    const employerPFContribution = employerPFTotal - employerPensionContribution;
    
    // ESIC CALCULATIONS (Employees' State Insurance Corporation)
    // Rules:
    // - If wages > ₹21,000/month: ESIC is not applicable
    // - If wages <= ₹21,000/month:
    //   - Employee contribution: 0.75% of gross wages
    //   - Employer contribution: 3.25% of gross wages
    const esicApplicable = totalEarnings <= 21000;
    const employeeESIC = esicApplicable ? Math.round(totalEarnings * 0.0075) : 0;
    const employerESIC = esicApplicable ? Math.round(totalEarnings * 0.0325) : 0;
    
    // Employee pension contribution (employer's pension component)
    const pensionContribution = employerPensionContribution;

    // Check if salary already exists for this employee
    let salary = await Salary.findOne({ employeeId });

    if (salary) {
      // Update existing salary
      salary.basic = basic;
      salary.hra = hra;
      salary.conveyance = conveyance;
      salary.totalEarnings = totalEarnings;
      salary.employeePF = employeePF;
      salary.employerPF = employerPFContribution;
      salary.employerPensionContribution = employerPensionContribution;
      salary.pensionContribution = pensionContribution;
      salary.employeeESIC = employeeESIC;
      salary.employerESIC = employerESIC;
      salary.esicApplicable = esicApplicable;
      await salary.save();
    } else {
      // Create new salary
      salary = await Salary.create({
        employeeId,
        basic,
        hra,
        conveyance,
        totalEarnings,
        employeePF,
        employerPF: employerPFContribution,
        employerPensionContribution,
        pensionContribution,
        employeeESIC,
        employerESIC,
        esicApplicable
      });
    }

    res.status(201).json({
      message: "Salary created/updated successfully",
      salary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployeeSalary = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const loggedInUser = req.user;

    /* 🛑 USER CAN SEE ONLY OWN SALARY */
    if (
      loggedInUser.role === "user" &&
      loggedInUser.employeeId?.toString() !== employeeId
    ) {
      return res.status(403).json({
        message: "You can view only your own salary"
      });
    }

    const salary = await Salary.findOne({ employeeId })
      .populate("employeeId", "name email employeeCode");

    if (!salary) {
      return res.status(404).json({ message: "Salary not found" });
    }

    res.json(salary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
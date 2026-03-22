const PDFDocument = require("pdfkit");

const formatDate = value => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const formatCurrency = value =>
  `₹ ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const drawSectionTitle = (doc, title) => {
  doc.moveDown(0.8);
  doc.font("Helvetica-Bold").fontSize(12).text(title);
  doc.moveDown(0.3);
};

const drawTwoColumnRow = (doc, label, amount, isBold = false) => {
  const startY = doc.y;
  doc
    .font(isBold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(10)
    .text(label, 50, startY, { width: 360 });
  doc
    .font(isBold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(10)
    .text(amount, 410, startY, { width: 140, align: "right" });
  doc.moveDown(0.6);
};

const drawDivider = doc => {
  const y = doc.y + 2;
  doc
    .moveTo(50, y)
    .lineTo(550, y)
    .lineWidth(0.8)
    .strokeColor("#BDBDBD")
    .stroke();
  doc.moveDown(0.4);
};

const generatePayslipPDF = async (employee, salary, month, year) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const effectiveBasic =
      salary.applyProration && salary.proratedBasic !== null
        ? Number(salary.proratedBasic)
        : Number(salary.basic || 0);
    const hra = Number(salary.hra || 0);
    const conveyance = Number(salary.conveyance || 0);
    const totalEarnings =
      salary.totalEarnings !== undefined && salary.totalEarnings !== null
        ? Number(salary.totalEarnings)
        : effectiveBasic + hra + conveyance;

    const employeePF = Number(salary.employeePF || 0);
    const employeeESIC = salary.esicApplicable ? Number(salary.employeeESIC || 0) : 0;
    const totalDeductions = employeePF + employeeESIC;

    const employerPF = Number(salary.employerPF || 0);
    const employerPension = Number(
      salary.employerPensionContribution || salary.pensionContribution || 0
    );
    const employerESIC = salary.esicApplicable ? Number(salary.employerESIC || 0) : 0;

    const netPay = totalEarnings - totalDeductions;

    doc.font("Helvetica-Bold").fontSize(18).text("Employee Payroll System");
    doc.moveDown(0.4);
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`Salary Slip - ${month} ${year}`);
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(`Generated on: ${formatDate(new Date())}`);

    drawSectionTitle(doc, "Employee Details");
    drawTwoColumnRow(doc, "Employee Name", employee.name || "N/A");
    drawTwoColumnRow(doc, "Employee Code", employee.employeeCode || "N/A");
    drawTwoColumnRow(doc, "Date of Joining", formatDate(employee.dateOfJoining));
    drawTwoColumnRow(doc, "Department", employee.department || "N/A");

    drawSectionTitle(doc, "Earnings");
    drawTwoColumnRow(doc, "Basic Salary", formatCurrency(effectiveBasic));
    drawTwoColumnRow(doc, "HRA", formatCurrency(hra));
    drawTwoColumnRow(doc, "Conveyance", formatCurrency(conveyance));
    drawDivider(doc);
    drawTwoColumnRow(doc, "Total Earnings", formatCurrency(totalEarnings), true);

    drawSectionTitle(doc, "Deductions");
    drawTwoColumnRow(doc, "Employee PF (12%)", formatCurrency(employeePF));
    if (salary.esicApplicable) {
      drawTwoColumnRow(doc, "Employee ESIC", formatCurrency(employeeESIC));
    }
    drawDivider(doc);
    drawTwoColumnRow(doc, "Total Deductions", formatCurrency(totalDeductions), true);

    drawSectionTitle(doc, "Employer Contributions (Informational)");
    drawTwoColumnRow(doc, "Employer PF", formatCurrency(employerPF));
    drawTwoColumnRow(doc, "Employer Pension", formatCurrency(employerPension));
    if (salary.esicApplicable) {
      drawTwoColumnRow(doc, "Employer ESIC", formatCurrency(employerESIC));
    }

    doc.moveDown(0.8);
    const boxY = doc.y;
    doc.roundedRect(50, boxY, 500, 48, 6).fillAndStroke("#F5F8FF", "#1F3A8A");
    doc
      .fillColor("#1F3A8A")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(`NET PAY: ${formatCurrency(netPay)}`, 70, boxY + 14, {
        width: 460,
        align: "center"
      });
    doc.fillColor("black");

    doc.moveDown(2.8);
    doc
      .font("Helvetica")
      .fontSize(9)
      .text("This is a system-generated payslip. No signature required.", {
        align: "center"
      });
    doc.fontSize(9).text("For queries contact HR.", { align: "center" });

    doc.end();
  });

module.exports = generatePayslipPDF;

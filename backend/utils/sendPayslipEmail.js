const transporter = require("./mailer");

const sendPayslipEmail = async ({
  name,
  email,
  month,
  year,
  pdfBuffer,
  employeeCode
}) => {
  await transporter.sendMail({
    from: `"Employee Payroll System" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Your Salary Slip for ${month} ${year} - Employee Payroll System`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <p>Dear ${name},</p>
        <p>Please find attached your salary slip for ${month} ${year}.</p>
        <p>If you have any queries, please contact HR.</p>
      </div>
    `,
    attachments: [
      {
        filename: `Payslip-${employeeCode || "EMP"}-${month}-${year}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf"
      }
    ]
  });
};

module.exports = sendPayslipEmail;

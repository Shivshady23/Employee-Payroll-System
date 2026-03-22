const transporter = require("./mailer");

const sendCredentialEmail = async ({
  name,
  email,
  loginId,
  password,
  employeeCode
}) => {
  const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #1a1a2e; padding: 24px; text-align: center;">
    <h2 style="color: #ffffff; margin: 0;">Employee Payroll System</h2>
  </div>
  <div style="padding: 32px;">
    <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
    <p>Welcome! Your employee account has been created. Here are your login credentials:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
      <tr style="background: #f5f5f5;">
        <td style="padding: 12px; font-weight: bold;">Employee Code</td>
        <td style="padding: 12px;">${employeeCode}</td>
      </tr>
      <tr>
        <td style="padding: 12px; font-weight: bold;">Login ID (Email)</td>
        <td style="padding: 12px;">${loginId}</td>
      </tr>
      <tr style="background: #f5f5f5;">
        <td style="padding: 12px; font-weight: bold;">Temporary Password</td>
        <td style="padding: 12px; font-family: monospace; font-size: 16px;">${password}</td>
      </tr>
    </table>
    <p style="color: #e53935; font-weight: bold;">Please login and change your password immediately.</p>
    <a href="${process.env.FRONTEND_URL}" style="display: inline-block; background: #1a1a2e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 8px;">Login Now</a>
  </div>
  <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #888;">
    This is an automated email from Employee Payroll System. Do not reply.
  </div>
</div>
`;

  await transporter.sendMail({
    from: `"Employee Payroll System" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Welcome to Employee Payroll System - Your Login Credentials",
    html: htmlContent
  });
};

module.exports = sendCredentialEmail;

const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
  try {
    // Keep behavior same: if creds are missing, do not fail request.
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("Email service disabled - set EMAIL_USER and EMAIL_PASS in env");
      console.log(`Email would have been sent to: ${to}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.mailtrap.io",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Payroll System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });

    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Email error:", error.message);
  }
};

module.exports = sendEmail;

import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   service: "Gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",     // ✅ Explicit Zoho host
  port: 587,                 // ✅ Use 465 for SSL
  secure: false,             // ✅ false for TLS (587), true for SSL (465)
  auth: {
    user: process.env.EMAIL_USER,  // e.g., "noreply@gowizly.com"
    pass: process.env.EMAIL_PASS,  // your Zoho app password
  },
});

export const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
};

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTP = async (email: string, otp: string) => {
  const mailOptions = {
    from: `"Bounce Back Academy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Verification Code - Bounce Back Academy',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #6366f1;">Welcome to Bounce Back Academy!</h2>
        <p>Please use the following verification code to activate your account:</p>
        <div style="background: #f3f4f6; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; color: #4338ca;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280;">© 2024 Bounce Back Academy. All rights reserved.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

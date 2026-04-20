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

export const sendBulkAnnouncement = async (emails: string[], subject: string, message: string, imageUrl?: string) => {
  // Convert line breaks to <br> tags for HTML email
  const formattedMessage = message.replace(/\n/g, '<br/>');
  
  const mailOptions = {
    from: `"Bounce Back Academy" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // Send to self
    bcc: emails, // Use BCC to hide recipients from each other
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #6366f1; margin-bottom: 5px;">Bounce Back Academy</h2>
        </div>
        
        ${imageUrl ? `
        <div style="margin-bottom: 25px; text-align: center;">
          <img src="${imageUrl}" alt="Announcement Image" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
        </div>
        ` : ''}
        
        <div style="font-size: 16px; line-height: 1.6; color: #374151; background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6366f1;">
          ${formattedMessage}
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0 20px;" />
        <div style="text-align: center;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">You are receiving this email because you are registered at Bounce Back Academy.</p>
          <p style="font-size: 12px; color: #6b7280; margin: 5px 0 0;">© ${new Date().getFullYear()} Bounce Back Academy. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

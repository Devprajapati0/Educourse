import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export async function sendForgotPasswordEmail(username: string, email: string, code: string) {
  try {
    console.log('MAILER_USER:', process.env.MAILER_USER);
    console.log('MAILER_PASS:', process.env.MAILER_PASS);

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASS,
      },
    });

    const mailOptions = {
      from: 'devheinji@gmail.com',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Hello ${username},</h2>
        <p>
          It seems like you've requested a password reset. Please use the following link to reset your password:
        </p>
        <p>
          <a href="${process.env.DOMAIN}/reset-password/${code}" style="color: #61dafb;">Reset your password</a>
        </p>
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info);
    return info;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

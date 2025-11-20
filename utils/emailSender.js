import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html, attachmentURL = null) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  const mailOptions = {
    from: `"College Admin" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  };

  // If file exists, attach it
  if (attachmentURL) {
    mailOptions.attachments = [
      {
        filename: attachmentURL.split("/").pop(),   // Extract filename
        path: attachmentURL,                        // Local path or hosted URL
      },
    ];
  }

  await transporter.sendMail(mailOptions);
};

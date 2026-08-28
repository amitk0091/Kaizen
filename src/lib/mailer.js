import nodemailer from 'nodemailer';

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

export async function sendNewPasswordEmail(to, newPassword) {
  const from = process.env.MAIL_FROM || 'Kaizen <no-reply@kaizen.app>';
  const t = getTransporter();
  await t.sendMail({
    from,
    to,
    subject: 'Your new Kaizen password',
    text: `Here is your new temporary password: ${newPassword}\n\nLog in and change it soon. Get 1% better, every day.\n- Kaizen`,
    html: `<p>Here is your new temporary password:</p><p style="font-size:18px;font-weight:bold">${newPassword}</p><p>Log in with it and consider changing it soon.</p><p style="color:#059669">Get 1% better, every day. — Kaizen</p>`,
  });
}

export function randomPassword(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

const { transporter } = require("./config/nodemailer");

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"Sahakarya Support" <${process.env.EMAIL}>`,
      to,
      subject,
      text,
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error(`Error sending email to ${to}:`, err.message);
  }
};

module.exports = { sendEmail };

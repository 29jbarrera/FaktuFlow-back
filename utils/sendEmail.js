// utils/sendEmail.js
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = (to, verificationCode) => {
  const emailContent = `
      <h1>Verificación de Email</h1>
      <p>¡Gracias por registrarte! Por favor, usa el siguiente código para verificar tu cuenta:</p>
      <h2>${verificationCode}</h2>
      <p>Si no solicitaste este correo, ignóralo.</p>
    `;

  return resend.emails.send({
    from: "onboarding@resend.dev", // Esto lo cambiarás por tu dominio cuando lo tengas
    to,
    subject: "Código de Verificación",
    html: emailContent,
  });
};

module.exports = { sendVerificationEmail };

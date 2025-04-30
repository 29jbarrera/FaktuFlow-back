// utils/sendEmail.js
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (to, verificationCode) => {
  try {
    const response = await resend.emails.send({
      from: "onboarding@resend.dev", // O tu dominio verificado
      to,
      subject: "Tu código de verificación - FaktuFlow",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <div style="text-align: center;">
            <img src="http://localhost:3000/static/FaktuFlow.webp" alt="FaktuFlow Logo" style="width: 150px; margin-bottom: 20px;" />
          </div>
    
          <h2 style="color: #2C3E50; text-align: center;">¡Verifica tu cuenta!</h2>
          <p style="font-size: 16px; color: #333;">
            Gracias por registrarte en <strong>FaktuFlow</strong>, tu solución integral para la gestión de facturas, gastos e ingresos.
          </p>
    
          <p style="font-size: 16px; color: #333;">
            Tu código de verificación es:
          </p>
    
          <div style="background-color: #f2f2f2; padding: 15px; border-radius: 6px; text-align: center; font-size: 24px; font-weight: bold; color: #007BFF; letter-spacing: 4px;">
            ${verificationCode}
          </div>
    
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Este código expirará en 1 hora. Si no solicitaste este código, puedes ignorar este correo.
          </p>
    
          <hr style="margin: 30px 0;" />
    
          <p style="font-size: 12px; color: #999; text-align: center;">
            © ${new Date().getFullYear()} FaktuFlow · Todos los derechos reservados<br/>
            ¿Necesitas ayuda? Escríbenos a <a href="mailto:soporte@faktuflow.com">soporte@faktuflow.com</a>
          </p>
        </div>
      `,
    });

    if (response.error) throw new Error(response.error.message);
    return true;
  } catch (err) {
    console.error("❌ Error enviando email:", err);
    return false;
  }
};

module.exports = { sendVerificationEmail };

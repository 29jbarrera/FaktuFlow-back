const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
require("dotenv").config();

const sendVerificationEmail = async (to, verificationCode) => {
  try {
    const response = await resend.emails.send({
      from: "FaktuFlow <soporte@faktuflow.es>",
      to,
      subject: "FaktuFlow - Tu código de verificación",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">       
        <div style="text-align: center;">
             <a href="${process.env.FRONTEND_URL_PROD}"target="_blank">
              <img src="${process.env.BACKEND_URL_PROD}static/FaktuFlow.avif" alt="FaktuFlow Logo" style="width: 150px; margin-bottom: 20px;" />
              </a>
            </div>
          <h2 style="color: #112c35; text-align: center;">¡Verifica tu cuenta!</h2>
          <p style="font-size: 16px; color: #333;">
            Gracias por registrarte en <span style="font-weight: bold; color: #4ce1b9">FaktuFlow</span>, tu solución integral para la gestión de facturas, gastos e ingresos.
          </p>
    
          <p style="font-size: 16px; color: #333;">
            Tu código de verificación es:
          </p>
    
          <div style="background-color: #f2f2f2; padding: 15px; border-radius: 6px; text-align: center; font-size: 24px; font-weight: bold; color: #112c35; letter-spacing: 4px;">
            ${verificationCode}
          </div>
    
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Este código expirará en 1 hora. Si no solicitaste este código, puedes ignorar este correo.
          </p>
    
          <hr style="margin: 30px 0;" />
    
          <p style="font-size: 12px; color: #999; text-align: center;">
            © ${new Date().getFullYear()} FaktuFlow · Todos los derechos reservados<br/>
            ¿Necesitas ayuda? Escríbenos a <a href="mailto:soporte@faktuflow.com" style="color: #4ce1b9;">soporte@faktuflow.com</a>
          </p>
        </div>
      `,
    });

    if (response.error) throw new Error(response.error.message);
    return true;
  } catch (err) {
    return false;
  }
};

const sendResetPasswordEmail = async (to, resetLink) => {
  try {
    const response = await resend.emails.send({
      from: "FaktuFlow <soporte@faktuflow.es>",
      to,
      subject: "FaktuFlow - Restablece tu contraseña",

      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">   
           <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL_PROD}" target="_blank">
              <img src="${process.env.BACKEND_URL_PROD}static/FaktuFlow.avif" alt="FaktuFlow Logo" style="width: 150px; margin-bottom: 20px;" />
          </a>
          </div>
          <h2 style="color: #112c35; text-align: center;">Restablece tu contraseña</h2>
          <p style="font-size: 16px; color: #333;">
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <span style="font-weight: bold; color: #4ce1b9">FaktuFlow</span>.
          </p>
    
          <p style="font-size: 16px; color: #333;">
            Para restablecer tu contraseña, haz clic en el siguiente enlace:
          </p>
    
         <div style="text-align: center; margin: 30px;">
          <a href="${resetLink}" style="
            padding: 12px 24px;
            background-color: #4ce1b9;
            color: white;
            font-size: 16px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            display: inline-block;
            text-align: center;
            white-space: normal;
            word-break: break-word;
            max-width: 90%;
            ">
            Restablecer Contraseña
            </a>
          </div>
    
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Si no solicitaste este cambio, verifica que tengas acceso o puedes ignorar este correo.
          </p>
           <p style="font-size: 12px; color: #666;">
            *La contraseña solo puede restablecerse una vez cada 3 meses.
          </p>
    
          <hr style="margin: 30px 0;" />
    
          <p style="font-size: 12px; color: #999; text-align: center;">
            © ${new Date().getFullYear()} FaktuFlow · Todos los derechos reservados<br/>
            ¿Necesitas ayuda? Escríbenos a <a href="mailto:soporte@faktuflow.com" style="color: #4ce1b9;">soporte@faktuflow.com</a>
          </p>
        </div>
      `,
    });

    if (response.error) throw new Error(response.error.message);
    return true;
  } catch (err) {
    return false;
  }
};

const sendWelcomeEmail = async (to) => {
  try {
    const response = await resend.emails.send({
      from: "FaktuFlow <soporte@faktuflow.es>",
      to,
      subject: "Bienvenido a FaktuFlow",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">   
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL_PROD}" target="_blank">
              <img src="${process.env.BACKEND_URL_PROD}static/FaktuFlow.avif" alt="FaktuFlow Logo" style="width: 150px; margin-bottom: 20px;" />
            </a>
          </div>
          <h2 style="color: #112c35; text-align: center;">¡Bienvenid@ a FaktuFlow!</h2>
          <p style="font-size: 16px; color: #333;">
            Te damos la bienvenida a <strong style="color: #4ce1b9;">FaktuFlow</strong>, La forma más moderna de gestionar tus finanzas, facturas y clientes desde cualquier dispositivo.
          </p>

          <p style="font-size: 16px; color: #333;">
          Estamos encantados de tenerte con nosotros. Si necesitas ayuda, no dudes en contactarnos. ¡Bienvenid@ a la comunidad FaktuFlow!
          </p>

          <div style="text-align: center; margin: 30px;">
            <a href="${process.env.FRONTEND_URL_PROD}" style="
              padding: 12px 24px;
              background-color: #112c35;
              color: white;
              font-size: 16px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            ">
              Ir a FaktuFlow
            </a>
          </div>
          <hr style="margin: 30px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">
            © ${new Date().getFullYear()} FaktuFlow · Todos los derechos reservados<br/>
            ¿Necesitas ayuda? Escríbenos a <a href="mailto:soporte@faktuflow.com" style="color: #4ce1b9;">soporte@faktuflow.com</a>
          </p>
        </div>
      `,
    });

    if (response.error) throw new Error(response.error.message);
    return true;
  } catch (err) {
    console.error("❌ Error enviando email de bienvenida:", err);
    return false;
  }
};

const sendGoodbyeEmail = async (to) => {
  try {
    const response = await resend.emails.send({
      from: "FaktuFlow <soporte@faktuflow.es>",
      to,
      subject: "Faktuflow | Lamentamos que te vayas",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL_PROD}" target="_blank">
              <img src="${process.env.BACKEND_URL_PROD}static/FaktuFlow.avif" alt="FaktuFlow Logo" style="width: 150px; margin-bottom: 20px;" />
            </a>
          </div>
          <h2 style="color: #112c35; text-align: center;">Esperamos verte de nuevo</h2>
          <p style="font-size: 16px; color: #333;">
            Tu cuenta en <strong style="color: #4ce1b9;">FaktuFlow</strong> ha sido eliminada correctamente. Lamentamos verte partir.
          </p>
          <p style="font-size: 16px; color: #333;">
            Si en el futuro decides regresar, estaremos encantados de tenerte de vuelta.
          </p>
          <p style="font-size: 14px; color: #666;">
            Mientras tanto, si tienes algún comentario o sugerencia para mejorar nuestro servicio, puedes escribirnos. Tu opinión es muy valiosa para nosotros.
          </p>
          <hr style="margin: 30px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">
            © ${new Date().getFullYear()} FaktuFlow · Todos los derechos reservados<br/>
            ¿Necesitas ayuda? Escríbenos a <a href="mailto:soporte@faktuflow.com" style="color: #4ce1b9;">soporte@faktuflow.com</a>
          </p>
        </div>
      `,
    });

    if (response.error) throw new Error(response.error.message);
    return true;
  } catch (err) {
    console.error("❌ Error enviando email de despedida:", err);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendWelcomeEmail,
  sendGoodbyeEmail,
};

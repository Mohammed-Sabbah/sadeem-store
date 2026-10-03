const crypto = require('crypto');
const { Resend } = require('resend');

function generateOtp() {
    return crypto.randomInt(100000, 1000000).toString();
}

async function sendEmail(email, otp) {
    const { RESEND_API_KEY, RESEND_FROM } = process.env;

    if (!RESEND_API_KEY || !RESEND_FROM) {
        throw new Error('Resend configuration is missing');
    }

    const resend = new Resend(RESEND_API_KEY);
    const result = await resend.emails.send({
        from: RESEND_FROM,
        to: email,
        subject: 'Password reset code',
        text: `Your password reset code is ${otp}. It expires in 10 minutes.`,
        html: `<p>Your password reset code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });

    if (result.error) {
        throw new Error(result.error.message);
    }
}

module.exports = { generateOtp, sendEmail };
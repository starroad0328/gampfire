import nodemailer from 'nodemailer'

// Create email transporter
// Note: You'll need to configure these environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

/**
 * Send verification email with code
 */
export async function sendVerificationEmail(
  email: string,
  verificationCode: string
): Promise<void> {
  // 개발 환경에서는 콘솔에 출력
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n==============================================')
    console.log('📧 이메일 인증 코드 (개발 모드)')
    console.log('==============================================')
    console.log(`이메일: ${email}`)
    console.log(`인증 코드: ${verificationCode}`)
    console.log('==============================================\n')
  }

  const mailOptions = {
    from: `"GAMERATE" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '[GAMERATE] 이메일 인증 코드',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              border: 1px solid #e0e0e0;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #6366f1;
            }
            .code-box {
              background-color: #fff;
              border: 2px dashed #6366f1;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .code {
              font-size: 36px;
              font-weight: bold;
              color: #6366f1;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .message {
              text-align: center;
              margin: 20px 0;
              color: #666;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              color: #999;
              font-size: 12px;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎮 GAMERATE</div>
              <h2 style="color: #333; margin-top: 10px;">이메일 인증</h2>
            </div>

            <p>GAMERATE에 가입해 주셔서 감사합니다!</p>
            <p>아래 인증 코드를 입력하여 회원가입을 완료해주세요.</p>

            <div class="code-box">
              <div style="color: #666; font-size: 14px; margin-bottom: 10px;">인증 코드</div>
              <div class="code">${verificationCode}</div>
            </div>

            <div class="message">
              <p>인증 코드는 <strong>24시간</strong> 동안 유효합니다.</p>
            </div>

            <div class="warning">
              <strong>⚠️ 주의사항</strong><br>
              본인이 요청하지 않은 경우, 이 이메일을 무시하시기 바랍니다.<br>
              인증 코드는 타인에게 절대 공유하지 마세요.
            </div>

            <div class="footer">
              <p>이 이메일은 발신 전용입니다. 답장하지 마세요.</p>
              <p>&copy; 2025 GAMERATE. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
GAMERATE 이메일 인증

인증 코드: ${verificationCode}

위 코드를 입력하여 회원가입을 완료해주세요.
인증 코드는 24시간 동안 유효합니다.

본인이 요청하지 않은 경우, 이 이메일을 무시하시기 바랍니다.

© 2025 GAMERATE
    `,
  }

  await transporter.sendMail(mailOptions)
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

  const mailOptions = {
    from: `"GAMERATE" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '[GAMERATE] 비밀번호 재설정',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>🎮 GAMERATE</h2>
            <h3>비밀번호 재설정</h3>
            <p>비밀번호 재설정을 요청하셨습니다.</p>
            <p>아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                비밀번호 재설정하기
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
            <p style="color: #999; font-size: 12px; word-break: break-all;">${resetUrl}</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              본인이 요청하지 않은 경우, 이 이메일을 무시하시기 바랍니다.<br>
              이 링크는 24시간 동안 유효합니다.
            </p>
          </div>
        </body>
      </html>
    `,
  }

  await transporter.sendMail(mailOptions)
}

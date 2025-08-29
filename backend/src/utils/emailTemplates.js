export const getVerificationEmailTemplate = (username, verifyLink) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - GoWizly</title>
        <style>
            body {
                font-family: 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #4f46e5;
                margin-bottom: 10px;
            }
            .content {
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                padding: 14px 28px;
                background-color: #4f46e5;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                text-align: center;
                margin: 20px 0;
            }
            .button:hover {
                background-color: #4338ca;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 14px;
                color: #666;
                text-align: center;
            }
            .warning {
                background-color: #fef3cd;
                border: 1px solid #fecaca;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">GoWizly</div>
                <h1>Welcome to GoWizly!</h1>
            </div>
            
            <div class="content">
                <p>Hi ${username},</p>
                
                <p>Thank you for signing up for GoWizly! We're excited to have you on board.</p>
                
                <p>To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center;">
                    <a href="${verifyLink}" class="button">Verify Email Address</a>
                </div>
                
                <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #4f46e5;">${verifyLink}</p>
                
                <div class="warning">
                    <strong>Important:</strong> This verification link will expire in 24 hours for security reasons.
                </div>
            </div>
            
            <div class="footer">
                <p>If you didn't create an account with GoWizly, you can safely ignore this email.</p>
                <p>Need help? Contact our support team at support@gowizly.com</p>
                <p>&copy; 2024 GoWizly. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

export const getPasswordResetEmailTemplate = (username, resetLink) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - GoWizly</title>
        <style>
            body {
                font-family: 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #4f46e5;
                margin-bottom: 10px;
            }
            .content {
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                padding: 14px 28px;
                background-color: #dc2626;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                text-align: center;
                margin: 20px 0;
            }
            .button:hover {
                background-color: #b91c1c;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 14px;
                color: #666;
                text-align: center;
            }
            .warning {
                background-color: #fef3cd;
                border: 1px solid #fecaca;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
                font-size: 14px;
            }
            .security-notice {
                background-color: #dbeafe;
                border: 1px solid #93c5fd;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">GoWizly</div>
                <h1>Reset Your Password</h1>
            </div>
            
            <div class="content">
                <p>Hi ${username},</p>
                
                <p>We received a request to reset your password for your GoWizly account.</p>
                
                <p>If you made this request, click the button below to reset your password:</p>
                
                <div style="text-align: center;">
                    <a href="${resetLink}" class="button">Reset Password</a>
                </div>
                
                <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #dc2626;">${resetLink}</p>
                
                <div class="warning">
                    <strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.
                </div>
                
                <div class="security-notice">
                    <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your account remains secure.
                </div>
            </div>
            
            <div class="footer">
                <p>For security reasons, this link can only be used once.</p>
                <p>Need help? Contact our support team at support@gowizly.com</p>
                <p>&copy; 2024 GoWizly. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

export const getWelcomeEmailTemplate = (username) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to GoWizly!</title>
        <style>
            body {
                font-family: 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #4f46e5;
                margin-bottom: 10px;
            }
            .content {
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                padding: 14px 28px;
                background-color: #10b981;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                text-align: center;
                margin: 20px 0;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 14px;
                color: #666;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">GoWizly</div>
                <h1>Welcome to GoWizly!</h1>
            </div>
            
            <div class="content">
                <p>Hi ${username},</p>
                
                <p>🎉 Congratulations! Your email has been successfully verified and your GoWizly account is now active.</p>
                
                <p>You can now access all the features and start your journey with us.</p>
                
                <div style="text-align: center;">
                    <a href="${process.env.CLIENT_URL}/dashboard" class="button">Go to Dashboard</a>
                </div>
                
                <p>Here are a few things you can do to get started:</p>
                <ul>
                    <li>Complete your profile setup</li>
                    <li>Explore our features and tools</li>
                    <li>Connect with the community</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>Need help getting started? Check out our <a href="${process.env.CLIENT_URL}/help">help center</a> or contact support.</p>
                <p>Happy to have you on board!</p>
                <p>&copy; 2024 GoWizly. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

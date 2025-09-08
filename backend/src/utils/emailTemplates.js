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
                  background-color: #f8fafc;
              }
              .container {
                  background: white;
                  padding: 40px;
                  border-radius: 12px;
                  box-shadow: 0 8px 25px rgba(79, 70, 229, 0.1);
                  border: 1px solid rgba(79, 70, 229, 0.1);
              }
              .header {
                  text-align: center;
                  margin-bottom: 30px;
              }
              .logo {
                  font-size: 32px;
                  font-weight: bold;
                  color: #4f46e5;
                  margin-bottom: 10px;
              }
              .content {
                  margin-bottom: 30px;
              }
              .button {
                  display: inline-block;
                  padding: 16px 32px;
                  background: #4f46e5;
                  color: white;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  text-align: center;
                  margin: 20px 0;
                  transition: all 0.3s ease;
                  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
              }
              .button:hover {
                  background: #4338ca;
                  transform: translateY(-2px);
                  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
              }
              .footer {
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                  font-size: 14px;
                  color: #6b7280;
                  text-align: center;
              }
              .warning {
                  background: #fef3f3;
                  border: 1px solid #f59e0b;
                  padding: 16px;
                  border-radius: 8px;
                  margin: 20px 0;
                  font-size: 14px;
                  color: #92400e;
              }
              .link-text {
                  word-break: break-all; 
                  color: #4f46e5;
                  background-color: #f3f4f6;
                  padding: 8px;
                  border-radius: 4px;
                  font-family: monospace;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="logo">GoWizly</div>
                  <h1 style="color: #374151;">Please Verify Your Email</h1>
              </div>
              
              <div class="content">
                  <p>Hi ${username},</p>
                  
                  <p>Thank you for signing up for GoWizly! Please verify your email address by clicking the button below:</p>
                  
                  <div style="text-align: center;">
                      <a href="${verifyLink}" class="button">Verify Email Address</a>
                  </div>
                  
                  <p>If the button doesn't work, copy and paste this link into your browser:</p>
                  <div class="link-text">${verifyLink}</div>
                  
                  <div class="warning">
                      This verification link will expire in 24 hours.
                  </div>
              </div>
              
              <div class="footer">
                  <p>If you didn't create an account with GoWizly, you can ignore this email.</p>
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
                  background-color: #f8fafc;
              }
              .container {
                  background: white;
                  padding: 40px;
                  border-radius: 12px;
                  box-shadow: 0 8px 25px rgba(79, 70, 229, 0.1);
                  border: 1px solid rgba(79, 70, 229, 0.1);
              }
              .header {
                  text-align: center;
                  margin-bottom: 30px;
              }
              .logo {
                  font-size: 32px;
                  font-weight: bold;
                  color: #4f46e5;
                  margin-bottom: 10px;
              }
              .content {
                  margin-bottom: 30px;
              }
              .button {
                  display: inline-block;
                  padding: 16px 32px;
                  background: #4f46e5;
                  color: white;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  text-align: center;
                  margin: 20px 0;
                  transition: all 0.3s ease;
                  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
              }
              .button:hover {
                  background: #4338ca;
                  transform: translateY(-2px);
                  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
              }
              .footer {
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                  font-size: 14px;
                  color: #6b7280;
                  text-align: center;
              }
              .warning {
                  background: #fef3f3;
                  border: 1px solid #f59e0b;
                  padding: 16px;
                  border-radius: 8px;
                  margin: 20px 0;
                  font-size: 14px;
                  color: #92400e;
              }
              .security-notice {
                  background: #f3f0ff;
                  border: 1px solid #7c3aed;
                  padding: 16px;
                  border-radius: 8px;
                  margin: 20px 0;
                  font-size: 14px;
                  color: #4f46e5;
              }
              .link-text {
                  word-break: break-all; 
                  color: #4f46e5;
                  background-color: #f3f4f6;
                  padding: 8px;
                  border-radius: 4px;
                  font-family: monospace;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="logo">GoWizly</div>
                  <h1 style="color: #374151;">Reset Your Password</h1>
              </div>
              
              <div class="content">
                  <p>Hi ${username},</p>
                  
                  <p>We received a request to reset your password. Click the button below to proceed:</p>
                  
                  <div style="text-align: center;">
                      <a href="${resetLink}" class="button">Reset Password</a>
                  </div>
                  
                  <p>If the button doesn't work, copy and paste this link into your browser:</p>
                  <div class="link-text">${resetLink}</div>
                  
                  <div class="warning">
                      This password reset link will expire in 1 hour.
                  </div>
                  
                  <div class="security-notice">
                      If you didn’t request a password reset, please ignore this email.
                  </div>
              </div>
              
              <div class="footer">
                  <p>&copy; 2024 GoWizly. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  };
  
  export const getWelcomeEmailTemplate = (username, dashboardUrl) => {
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
                  background-color: #f8fafc;
              }
              .container {
                  background: white;
                  padding: 40px;
                  border-radius: 12px;
                  box-shadow: 0 8px 25px rgba(79, 70, 229, 0.1);
                  border: 1px solid rgba(79, 70, 229, 0.1);
              }
              .header {
                  text-align: center;
                  margin-bottom: 30px;
              }
              .logo {
                  font-size: 32px;
                  font-weight: bold;
                  color: #4f46e5;
                  margin-bottom: 10px;
              }
              .content {
                  margin-bottom: 30px;
              }
              .button {
                  display: inline-block;
                  padding: 16px 32px;
                  background: #4f46e5;
                  color: white;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  text-align: center;
                  margin: 20px 0;
                  transition: all 0.3s ease;
                  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
              }
              .button:hover {
                  background: #4338ca;
                  transform: translateY(-2px);
                  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
              }
              .footer {
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                  font-size: 14px;
                  color: #6b7280;
                  text-align: center;
              }
              .welcome-box {
                  background: #f3f0ff;
                  border: 1px solid #7c3aed;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
                  text-align: center;
                  color: #4f46e5;
              }
              .features {
                  background-color: #f9fafb;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
              }
              .features ul {
                  margin: 0;
                  padding-left: 20px;
              }
              .features li {
                  margin: 8px 0;
                  color: #374151;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="logo">GoWizly</div>
                  <h1 style="color: #374151;">Welcome to GoWizly!</h1>
              </div>
              
              <div class="content">
                  <p>Hi ${username},</p>
                  
                  <div class="welcome-box">
                      <h2 style="margin-top: 0;">Your Account is Active</h2>
                      <p style="margin-bottom: 0;">Your email has been successfully verified and your GoWizly account is now ready to use.</p>
                  </div>
                  
                  <p>You can now access all the features and start your journey with us.</p>
                  
                  <div style="text-align: center;">
                      <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
                  </div>
                  
                  <div class="features">
                      <p><strong>Here are a few things you can do to get started:</strong></p>
                      <ul>
                          <li>Complete your profile setup</li>
                          <li>Explore our features and tools</li>
                          <li>Connect with the community</li>
                          <li>Check out our getting started guide</li>
                      </ul>
                  </div>
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
  
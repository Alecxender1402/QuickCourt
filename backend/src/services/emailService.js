import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
  }

  // Initialize transporter when needed
  getTransporter() {
    if (!this.transporter) {
      // Check if email credentials are configured
      const isConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

      if (isConfigured) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
      } else {
        console.log('⚠️ Email credentials not configured - OTP will be logged to console');
        return null;
      }
    }
    return this.transporter;
  }

  // Send OTP email with fallback to console logging
  async sendOTPEmail(email, name, otpCode) {
    const transporter = this.getTransporter();

    // If email is not configured, just log the OTP
    if (!transporter) {
      console.log(`📧 OTP Code for ${email}: ${otpCode}`);
      console.log('⚠️ Email service not configured - OTP logged to console');
      return { messageId: 'console-log', email, otpCode };
    }

    try {
      const mailOptions = {
        from: `"QuickCourt" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verify Your Email - QuickCourt',
        html: this.getOTPEmailTemplate(name, otpCode),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ OTP email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Error sending OTP email:', error.message);
      console.log(`📧 OTP Code (email failed): ${otpCode}`);
      // Don't throw error, just log the OTP as fallback
      return { messageId: 'email-failed', email, otpCode, error: error.message };
    }
  }

  // Send welcome email after verification
  async sendWelcomeEmail(email, name) {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.log(`📧 Welcome email would be sent to: ${email}`);
      return null;
    }

    try {
      const mailOptions = {
        from: `"QuickCourt" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Welcome to QuickCourt!',
        html: this.getWelcomeEmailTemplate(name),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      return null;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, name, resetToken) {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.log(`📧 Password reset token for ${email}: ${resetToken}`);
      console.log('⚠️ Email service not configured - reset token logged to console');
      return { messageId: 'console-log', email, resetToken };
    }

    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      const mailOptions = {
        from: `"QuickCourt" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Reset Your Password - QuickCourt',
        html: this.getPasswordResetEmailTemplate(name, resetUrl, resetToken),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Error sending password reset email:', error.message);
      console.log(`📧 Password reset token (email failed): ${resetToken}`);
      return { messageId: 'email-failed', email, resetToken, error: error.message };
    }
  }

  // Send account suspension email
  async sendAccountSuspensionEmail({ email, name, reason }) {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.log(`📧 Account suspension notification for ${email}: ${reason}`);
      console.log('⚠️ Email service not configured - suspension notice logged to console');
      return { messageId: 'console-log', email, reason };
    }

    try {
      const mailOptions = {
        from: `"QuickCourt" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Account Suspended - QuickCourt',
        html: this.getAccountSuspensionEmailTemplate(name, reason),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Account suspension email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Error sending account suspension email:', error.message);
      console.log(`📧 Account suspension notice (email failed): ${reason}`);
      return { messageId: 'email-failed', email, reason, error: error.message };
    }
  }

  // Send account reactivation email
  async sendAccountReactivationEmail({ email, name }) {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.log(`📧 Account reactivation notification for ${email}`);
      console.log('⚠️ Email service not configured - reactivation notice logged to console');
      return { messageId: 'console-log', email };
    }

    try {
      const mailOptions = {
        from: `"QuickCourt" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Account Reactivated - QuickCourt',
        html: this.getAccountReactivationEmailTemplate(name),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Account reactivation email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Error sending account reactivation email:', error.message);
      console.log(`📧 Account reactivation notice (email failed)`);
      return { messageId: 'email-failed', email, error: error.message };
    }
  }

  // Send venue approval email
  async sendVenueApprovalEmail({ email, ownerName, venueName, venueId }) {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.log(`📧 Venue approval notification for ${email}: ${venueName} approved`);
      console.log('⚠️ Email service not configured - approval notice logged to console');
      return { messageId: 'console-log', email, venueName };
    }

    try {
      const mailOptions = {
        from: `"QuickCourt" <${process.env.SMTP_USER}>`,
        to: email,
        subject: '🎉 Venue Approved - QuickCourt',
        html: this.getVenueApprovalEmailTemplate(ownerName, venueName, venueId),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Venue approval email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Error sending venue approval email:', error.message);
      console.log(`📧 Venue approval notice (email failed): ${venueName}`);
      return { messageId: 'email-failed', email, venueName, error: error.message };
    }
  }

  // Send venue rejection email
  async sendVenueRejectionEmail({ email, ownerName, venueName, rejectionReason, venueId }) {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.log(`📧 Venue rejection notification for ${email}: ${venueName} rejected - ${rejectionReason}`);
      console.log('⚠️ Email service not configured - rejection notice logged to console');
      return { messageId: 'console-log', email, venueName, rejectionReason };
    }

    try {
      const mailOptions = {
        from: `"QuickCourt" <${process.env.SMTP_USER}>`,
        to: email,
        subject: '❌ Venue Application Update - QuickCourt',
        html: this.getVenueRejectionEmailTemplate(ownerName, venueName, rejectionReason, venueId),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Venue rejection email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Error sending venue rejection email:', error.message);
      console.log(`📧 Venue rejection notice (email failed): ${venueName}`);
      return { messageId: 'email-failed', email, venueName, rejectionReason, error: error.message };
    }
  }

  // OTP Email Template
  getOTPEmailTemplate(name, otpCode) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px 20px; }
          .otp-box { background-color: #f8fafc; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; margin: 10px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏟️ QuickCourt</h1>
            <p>Sports Facility Booking Platform</p>
          </div>
          <div class="content">
            <h2>Hi ${name}!</h2>
            <p>Welcome to QuickCourt! To complete your registration, please verify your email address using the OTP code below:</p>
            <div class="otp-box">
              <p>Your verification code is:</p>
              <div class="otp-code">${otpCode}</div>
              <p><small>This code will expire in 10 minutes</small></p>
            </div>
            <p>If you didn't create an account with QuickCourt, please ignore this email.</p>
            <p>Best regards,<br>The QuickCourt Team</p>
          </div>
          <div class="footer">
            <p><small>© 2025 QuickCourt. All rights reserved.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Welcome Email Template
  getWelcomeEmailTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to QuickCourt</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px 20px; }
          .feature-box { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to QuickCourt!</h1>
            <p>Your account has been verified successfully</p>
          </div>
          <div class="content">
            <h2>Hi ${name}!</h2>
            <p>Congratulations! Your email has been verified and your QuickCourt account is now active.</p>
            <h3>What you can do now:</h3>
            <div class="feature-box">
              <strong>🏟️ Browse Venues</strong><br>
              Discover sports facilities in your area
            </div>
            <div class="feature-box">
              <strong>📅 Book Courts</strong><br>
              Reserve your preferred time slots instantly
            </div>
            <div class="feature-box">
              <strong>⭐ Leave Reviews</strong><br>
              Share your experience and help others
            </div>
            <p>Ready to get started? Visit our platform and book your first court!</p>
            <p>Best regards,<br>The QuickCourt Team</p>
          </div>
          <div class="footer">
            <p><small>© 2025 QuickCourt. All rights reserved.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Password Reset Email Template
  getPasswordResetEmailTemplate(name, resetUrl, resetToken) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px 20px; }
          .reset-button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .token-box { background-color: #f8fafc; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 QuickCourt</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Hi ${name}!</h2>
            <p>We received a request to reset your password for your QuickCourt account. If you made this request, click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="reset-button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <div class="token-box">
              <p><small>Reset Link:</small></p>
              <p style="word-break: break-all; font-size: 12px;">${resetUrl}</p>
            </div>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email. Your password will not be changed.</p>
            <p>Best regards,<br>The QuickCourt Team</p>
          </div>
          <div class="footer">
            <p><small>© 2025 QuickCourt. All rights reserved.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Account Suspension Email Template
  getAccountSuspensionEmailTemplate(name, reason) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Suspended</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px 20px; }
          .warning-box { background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .reason-box { background-color: #f9fafb; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
          .contact-info { background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 6px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚫 Account Suspended</h1>
            <p>QuickCourt</p>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <div class="warning-box">
              <p><strong>⚠️ Your QuickCourt account has been suspended.</strong></p>
              <p>Your account access has been temporarily restricted due to a violation of our Terms of Service.</p>
            </div>
            
            <h3>Suspension Reason:</h3>
            <div class="reason-box">
              <p><strong>${reason}</strong></p>
            </div>
            
            <h3>What this means:</h3>
            <ul>
              <li>You cannot access your QuickCourt account</li>
              <li>All active bookings may be affected</li>
              <li>You cannot make new bookings until the suspension is lifted</li>
              <li>Any venue management activities are suspended</li>
            </ul>
            
            <h3>Next Steps:</h3>
            <p>If you believe this suspension was made in error or would like to appeal this decision, please contact our support team immediately.</p>
            
            <div class="contact-info">
              <h4>📧 Contact Support:</h4>
              <p><strong>Email:</strong> support@quickcourt.com</p>
              <p><strong>Subject:</strong> Account Suspension Appeal - ${name}</p>
              <p><strong>Phone:</strong> +1-800-QUICKCOURT</p>
            </div>
            
            <p>We take account security and community guidelines seriously. Please review our Terms of Service to ensure compliance in the future.</p>
            
            <p>Best regards,<br>The QuickCourt Administration Team</p>
          </div>
          <div class="footer">
            <p><small>© 2025 QuickCourt. All rights reserved.</small></p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Account Reactivation Email Template
  getAccountReactivationEmailTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Reactivated</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
          .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px 20px; }
          .success-box { background-color: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
          .features-box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
          .login-button { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Account Reactivated</h1>
            <p>QuickCourt</p>
          </div>
          <div class="content">
            <h2>Welcome back, ${name}!</h2>
            
            <div class="success-box">
              <p><strong>🎉 Great news! Your QuickCourt account has been reactivated.</strong></p>
              <p>You now have full access to all platform features.</p>
            </div>
            
            <h3>You can now:</h3>
            <div class="features-box">
              <ul style="margin: 0; padding-left: 20px;">
                <li>✅ Access your QuickCourt account</li>
                <li>✅ Make new bookings at sports facilities</li>
                <li>✅ Manage your existing bookings</li>
                <li>✅ Review and rate venues</li>
                <li>✅ Update your profile information</li>
                <li>✅ Access venue management (if applicable)</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/login" class="login-button">Login to Your Account</a>
            </div>
            
            <h3>Moving Forward:</h3>
            <p>Please ensure you comply with our Terms of Service to maintain uninterrupted access to your account. We're committed to providing a safe and enjoyable experience for all users.</p>
            
            <p>If you have any questions or need assistance, our support team is here to help.</p>
            
            <p>Thank you for being part of the QuickCourt community!</p>
            
            <p>Best regards,<br>The QuickCourt Team</p>
          </div>
          <div class="footer">
            <p><small>© 2025 QuickCourt. All rights reserved.</small></p>
            <p><small>Need help? Contact us at support@quickcourt.com</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Venue Approval Email Template
  getVenueApprovalEmailTemplate(ownerName, venueName, venueId) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Venue Approved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
          .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px 20px; }
          .success-box { background-color: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
          .venue-info { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .next-steps { background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
          .dashboard-button { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Venue Approved!</h1>
            <p>QuickCourt - Facility Management</p>
          </div>
          <div class="content">
            <h2>Congratulations, ${ownerName}!</h2>
            
            <div class="success-box">
              <p><strong>✅ Great news! Your venue has been approved by our admin team.</strong></p>
              <p>Your facility is now live on the QuickCourt platform and ready to accept bookings!</p>
            </div>
            
            <div class="venue-info">
              <h3>📍 Approved Venue Details:</h3>
              <p><strong>Venue Name:</strong> ${venueName}</p>
              <p><strong>Venue ID:</strong> #${venueId}</p>
              <p><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">✅ APPROVED</span></p>
              <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="next-steps">
              <h3>🚀 What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>✅ Your venue is now visible</strong> to users on QuickCourt</li>
                <li><strong>📅 Customers can book</strong> your courts and facilities</li>
                <li><strong>💰 Start earning revenue</strong> from bookings immediately</li>
                <li><strong>📊 Monitor performance</strong> through your owner dashboard</li>
                <li><strong>⭐ Collect reviews</strong> and build your reputation</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/owner/dashboard" class="dashboard-button">Access Your Dashboard</a>
            </div>
            
            <h3>📈 Tips for Success:</h3>
            <ul>
              <li><strong>Keep your calendar updated</strong> - Ensure availability is always accurate</li>
              <li><strong>Respond to inquiries promptly</strong> - Great customer service builds loyalty</li>
              <li><strong>Maintain your facilities</strong> - Clean, well-maintained venues get better reviews</li>
              <li><strong>Update pricing strategically</strong> - Consider peak times and demand</li>
              <li><strong>Upload quality photos</strong> - Great visuals attract more bookings</li>
            </ul>
            
            <p>We're excited to have you as part of the QuickCourt family! If you have any questions or need assistance managing your venue, don't hesitate to reach out to our support team.</p>
            
            <p>Best of luck with your venue!</p>
            
            <p>Best regards,<br>The QuickCourt Admin Team</p>
          </div>
          <div class="footer">
            <p><small>© 2025 QuickCourt. All rights reserved.</small></p>
            <p><small>Need help? Contact us at support@quickcourt.com | Phone: +1-800-QUICKCOURT</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Venue Rejection Email Template
  getVenueRejectionEmailTemplate(ownerName, venueName, rejectionReason, venueId) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Venue Application Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px 20px; }
          .warning-box { background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .venue-info { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .reason-box { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
          .next-steps { background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
          .resubmit-button { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
          .contact-info { background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 6px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Venue Application Update</h1>
            <p>QuickCourt - Facility Management</p>
          </div>
          <div class="content">
            <h2>Dear ${ownerName},</h2>
            
            <div class="warning-box">
              <p><strong>⚠️ We've reviewed your venue application and need some adjustments before approval.</strong></p>
              <p>Your venue submission requires modifications to meet our platform standards.</p>
            </div>
            
            <div class="venue-info">
              <h3>📍 Venue Application Details:</h3>
              <p><strong>Venue Name:</strong> ${venueName}</p>
              <p><strong>Application ID:</strong> #${venueId}</p>
              <p><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">❌ NEEDS REVISION</span></p>
              <p><strong>Review Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <h3>📝 Reason for Revision Request:</h3>
            <div class="reason-box">
              <p><strong>${rejectionReason}</strong></p>
            </div>
            
            <div class="next-steps">
              <h3>🔄 Next Steps:</h3>
              <ol style="margin: 0; padding-left: 20px;">
                <li><strong>Review the feedback above</strong> and understand what needs to be addressed</li>
                <li><strong>Make the necessary changes</strong> to your venue information, photos, or documentation</li>
                <li><strong>Resubmit your application</strong> through your owner dashboard</li>
                <li><strong>Our team will review</strong> your updated submission within 2-3 business days</li>
              </ol>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/owner/venues/edit/${venueId}" class="resubmit-button">Update Your Venue</a>
            </div>
            
            <h3>💡 Common Issues & Tips:</h3>
            <ul>
              <li><strong>Photos:</strong> Ensure high-quality, recent images of all facilities</li>
              <li><strong>Description:</strong> Provide detailed, accurate facility descriptions</li>
              <li><strong>Pricing:</strong> Set competitive, reasonable rates for your area</li>
              <li><strong>Amenities:</strong> List all available facilities and equipment</li>
              <li><strong>Location:</strong> Verify address accuracy and accessibility information</li>
              <li><strong>Policies:</strong> Clear cancellation and booking policies</li>
            </ul>
            
            <div class="contact-info">
              <h4>📧 Need Help?</h4>
              <p>If you have questions about the feedback or need guidance on making improvements:</p>
              <p><strong>Email:</strong> support@quickcourt.com</p>
              <p><strong>Subject:</strong> Venue Application Help - ${venueName} (#${venueId})</p>
              <p><strong>Phone:</strong> +1-800-QUICKCOURT</p>
              <p><strong>Hours:</strong> Monday-Friday, 9 AM - 6 PM</p>
            </div>
            
            <p>We want to help you succeed on our platform! Don't be discouraged - most venues are approved after addressing the initial feedback. We're here to support you through the process.</p>
            
            <p>Thank you for choosing QuickCourt to list your venue.</p>
            
            <p>Best regards,<br>The QuickCourt Admin Team</p>
          </div>
          <div class="footer">
            <p><small>© 2025 QuickCourt. All rights reserved.</small></p>
            <p><small>This is an automated message. Please contact support for assistance.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Verify email service configuration
  async verifyConnection() {
    try {
      const transporter = this.getTransporter();

      if (!transporter) {
        console.log('⚠️ Email credentials not configured - OTP will be logged to console');
        return false;
      }

      await transporter.verify();
      console.log('✅ Email service is ready to send emails');
      return true;
    } catch (error) {
      console.error('❌ Email service configuration error:', error.message);
      console.log('⚠️ OTP codes will be logged to console instead');
      return false;
    }
  }

  // Helper function to format time for display
  formatTime(timeStr) {
    if (!timeStr) return '';
    
    // Handle Date objects from database (stored times)
    if (timeStr instanceof Date) {
      const hours = timeStr.getUTCHours();
      const minutes = timeStr.getUTCMinutes();
      
      // Create a proper date object for formatting without timezone issues
      const today = new Date();
      const timeDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);
      
      return timeDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // Handle time strings like "14:30"
    if (typeof timeStr === 'string' && timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const today = new Date();
      const timeDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);
      
      return timeDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    return timeStr;
  }

  // Helper function to format date for display
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Send booking confirmation email
  async sendBookingConfirmationEmail(booking) {
    const transporter = this.getTransporter();

    // If email is not configured, just log the notification
    if (!transporter) {
      console.log(`📧 Booking Confirmation for ${booking.user.email}:`);
      console.log(`   Booking ID: ${booking.id}`);
      console.log(`   Venue: ${booking.venue.name}`);
      console.log(`   Court: ${booking.court.name}`);
      console.log(`   Date: ${this.formatDate(booking.bookingDate)}`);
      console.log(`   Time: ${this.formatTime(booking.startTime)} - ${this.formatTime(booking.endTime)}`);
      console.log(`   Amount: ₹${booking.totalAmount}`);
      console.log('⚠️ Email service not configured - notification logged to console');
      return { messageId: 'console-log' };
    }

    try {
      const mailOptions = {
        from: `"QuickCourt" <${process.env.SMTP_USER}>`,
        to: booking.user.email,
        subject: 'Booking Confirmed - QuickCourt',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Booking Confirmed! ✅</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your court reservation is all set</p>
            </div>
            
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Booking Details</h2>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Booking ID:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">#${booking.id}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Venue:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${booking.venue.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Court:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${booking.court.name} (${booking.court.sportType})</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Date:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${this.formatDate(booking.bookingDate)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Time:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${this.formatTime(booking.startTime)} - ${this.formatTime(booking.endTime)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Amount Paid:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #10b981; font-weight: bold;">₹${booking.totalAmount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #374151;">Status:</td>
                    <td style="padding: 8px 0; color: #10b981; font-weight: bold;">CONFIRMED</td>
                  </tr>
                </table>
              </div>
              
              ${booking.notes ? `<div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #374151;">Notes:</h3>
                <p style="margin: 0; color: #6b7280;">${booking.notes}</p>
              </div>` : ''}
              
              <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  <strong>Important:</strong> Please arrive 10 minutes before your scheduled time. 
                  Contact the venue if you need to make any changes to your booking.
                </p>
              </div>
            </div>
            
            <div style="background: #1f2937; color: white; padding: 20px; text-align: center;">
              <p style="margin: 0 0 10px 0;">Questions? Contact us at support@quickcourt.com</p>
              <p style="margin: 0; font-size: 14px; color: #9ca3af;">Thank you for choosing QuickCourt!</p>
            </div>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Booking confirmation email sent to ${booking.user.email}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('❌ Failed to send booking confirmation email:', error);
      throw error;
    }
  }

  // Send booking cancellation email
  async sendBookingCancellationEmail(booking, reason = 'User cancellation') {
    const transporter = this.getTransporter();

    // If email is not configured, just log the notification
    if (!transporter) {
      console.log(`📧 Booking Cancellation for ${booking.user.email}:`);
      console.log(`   Booking ID: ${booking.id}`);
      console.log(`   Reason: ${reason}`);
      console.log('⚠️ Email service not configured - notification logged to console');
      return { messageId: 'console-log' };
    }

    try {
      const mailOptions = {
        from: `"QuickCourt" <${process.env.SMTP_USER}>`,
        to: booking.user.email,
        subject: 'Booking Cancelled - QuickCourt',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Booking Cancelled ❌</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your court reservation has been cancelled</p>
            </div>
            
            <div style="padding: 30px; background: #f9fafb;">
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #1f2937; margin-bottom: 15px;">Cancelled Booking Details</h2>
                <p><strong>Booking ID:</strong> #${booking.id}</p>
                <p><strong>Venue:</strong> ${booking.venue.name}</p>
                <p><strong>Court:</strong> ${booking.court.name}</p>
                <p><strong>Date:</strong> ${this.formatDate(booking.bookingDate)}</p>
                <p><strong>Time:</strong> ${this.formatTime(booking.startTime)} - ${this.formatTime(booking.endTime)}</p>
                <p><strong>Reason:</strong> ${reason}</p>
              </div>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Refund Information:</strong> If applicable, your refund will be processed within 5-7 business days.
                </p>
              </div>
            </div>
            
            <div style="background: #1f2937; color: white; padding: 20px; text-align: center;">
              <p style="margin: 0 0 10px 0;">Questions? Contact us at support@quickcourt.com</p>
              <p style="margin: 0; font-size: 14px; color: #9ca3af;">We hope to serve you again soon!</p>
            </div>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Booking cancellation email sent to ${booking.user.email}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('❌ Failed to send booking cancellation email:', error);
      throw error;
    }
  }

  // Send payment success email
  async sendPaymentSuccessEmail(userEmail, paymentDetails) {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.log(`📧 Payment Success notification for ${userEmail}: Amount ₹${paymentDetails.amount}`);
      return { messageId: 'console-log' };
    }

    try {
      const mailOptions = {
        from: `"QuickCourt" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: 'Payment Successful - QuickCourt',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Payment Successful! 💳</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p><strong>Amount:</strong> ₹${paymentDetails.amount}</p>
              <p><strong>Transaction ID:</strong> ${paymentDetails.transactionId}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Payment success email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('❌ Failed to send payment success email:', error);
      throw error;
    }
  }

  // Send payment failure email
  async sendPaymentFailureEmail(userEmail, paymentDetails) {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.log(`📧 Payment Failure notification for ${userEmail}: ${paymentDetails.reason}`);
      return { messageId: 'console-log' };
    }

    try {
      const mailOptions = {
        from: `"QuickCourt" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: 'Payment Failed - QuickCourt',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Payment Failed ❌</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p><strong>Reason:</strong> ${paymentDetails.reason}</p>
              <p><strong>Amount:</strong> ₹${paymentDetails.amount}</p>
              <p>Please try again or contact support if the issue persists.</p>
            </div>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Payment failure email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('❌ Failed to send payment failure email:', error);
      throw error;
    }
  }
}

// Create and export a single instance
const emailService = new EmailService();
export default emailService;

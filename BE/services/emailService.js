const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // Khởi tạo ban đầu là null
        this.transporter = null;
        this._usingTestAccount = false;
        
        // Gọi hàm khởi tạo transporter bằng cấu hình người dùng
        this._initUserTransport();
    }

    // Hàm mới: Khởi tạo transporter bằng biến môi trường
    _initUserTransport() {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
            this.transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
            this._usingTestAccount = false;
        }
    }

    async _ensureTestTransport() {
        // CHỈ tạo tài khoản thử nghiệm nếu KHÔNG CÓ TRANSPORTER NÀO
        if (this.transporter) return;

        if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
             this._initUserTransport();
             if (this.transporter) return; // Nếu khởi tạo lại thành công, thoát.
        }
        
        // Nếu vẫn không có transporter, tạo tài khoản thử nghiệm
        const testAccount = await nodemailer.createTestAccount();
        this._usingTestAccount = true;
        this._testAccount = testAccount;
        this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    }

    async verifyConnection() {
        if (!this.transporter) {
            // Nếu chưa có transporter, thử khởi tạo bằng user config (nếu có)
            this._initUserTransport();
            if (!this.transporter) return false;
        }

        return new Promise((resolve) => {
            this.transporter.verify((error, success) => {
                if (error) {
                    console.error('SMTP Error:', error.message);
                    // Nếu lỗi và đang dùng user config, set transporter về null để thử lại sau
                    if (!this._usingTestAccount) {
                         this.transporter = null;
                    }
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    async sendVerificationEmail(email, name, verificationToken) {
        try {
            // Giữ nguyên: _ensureTestTransport sẽ cố gắng dùng user config trước Ethereal
            if (!this.transporter) await this._ensureTestTransport();

            const rawAppUrl = process.env.APP_URL || 'http://localhost:5000';
            const baseUrl = String(rawAppUrl).replace(/\/+$/, '');
            const verificationLink = `${baseUrl}/api/verify-email?token=${verificationToken}`;

            console.log('\ud83d\udce7 Sending verification email to:', email);

            const mailOptions = {
                from: process.env.EMAIL_USER || (this._testAccount && this._testAccount.user),
                to: email,
                subject: 'Email Verification - JWT Login App',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #667eea;">Welcome to JWT Login App!</h2>
                        <p>Hi <strong>${name}</strong>,</p>
                        <p>Thank you for signing up. Please verify your email address to activate your account.</p>
                        
                        <div style="margin: 30px 0;">
                            <a href="${verificationLink}" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                Verify Email
                            </a>
                        </div>
                        
                        <p>Or copy and paste this link in your browser:</p>
                        <p style="word-break: break-all; color: #666;">
                            ${verificationLink}
                        </p>
                        
                        <p style="color: #999; font-size: 12px; margin-top: 30px;">
                            This link will expire in 24 hours.
                        </p>
                    </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);

            // If using Ethereal test account, return preview URL for debugging
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl && this._usingTestAccount) {
                console.log('\ud83d\udd0d Preview URL (Ethereal):', previewUrl);
                return previewUrl;
            }

            console.log('\u2705 Email sent successfully to:', email);
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            // Quan trọng: Nếu gửi lỗi, set transporter về null để thử khởi tạo lại ở lần gửi sau.
            if (!this._usingTestAccount) {
                this.transporter = null; 
            }
            throw new Error('Failed to send verification email: ' + error.message);
        }
    }

    async sendWelcomeEmail(email, name) {
        try {
            if (!this.transporter) await this._ensureTestTransport();

            const mailOptions = {
                from: process.env.EMAIL_USER || (this._testAccount && this._testAccount.user),
                to: email,
                subject: 'Email Verified - Welcome!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #667eea;">Email Verified!</h2>
                        <p>Hi <strong>${name}</strong>,</p>
                        <p>Your email has been successfully verified. Your account is now active and you can log in anytime.</p>
                        
                        <p style="margin-top: 30px;">Enjoy using our application!</p>
                        <p>Best regards,<br>JWT Login App Team</p>
                    </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl && this._usingTestAccount) return previewUrl;
            return true;
        } catch (error) {
            console.error('Error sending welcome email:', error);
            if (!this._usingTestAccount) {
                this.transporter = null; 
            }
            throw new Error('Failed to send welcome email: ' + error.message);
        }
    }
}

module.exports = new EmailService();
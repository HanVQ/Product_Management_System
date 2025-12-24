# Email Verification Postman Guide

## Setup Instructions

### 1. Update `.env` with Gmail Credentials

First, set up Gmail App Password:
- Go to [Google Account Security](https://myaccount.google.com/security)
- Enable 2-Factor Authentication
- Create an **App Password** (NOT your regular Gmail password)
- Update `.env`:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
APP_URL=http://localhost:5000
```

Or use other email services like SendGrid, Mailgun, etc.

---

## Postman Testing Workflow

### Step 1: Sign Up Request
```
Method: POST
URL: http://localhost:5000/api/signup

Headers:
- Content-Type: application/json

Body (JSON):
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for verification link.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": false
  }
}
```

✅ **Check your email inbox** - You should receive a verification email!

---

### Step 2: Verify Email (Two Options)

#### Option A: Click Email Link
The email contains a link like: `http://localhost:5000/api/verify-email?token=abc123...`
- Click the link in the email
- You'll see a JSON response confirming verification

#### Option B: Postman Request
```
Method: GET
URL: http://localhost:5000/api/verify-email?token=<TOKEN_FROM_EMAIL>

Headers:
- Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": true
  }
}
```

---

### Step 3: Login Request
```
Method: POST
URL: http://localhost:5000/api/login

Headers:
- Content-Type: application/json

Body (JSON):
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": true
  }
}
```

**Response (If Email Not Verified):**
```json
{
  "success": false,
  "message": "Please verify your email before logging in"
}
```

---

### Step 4: Verify JWT Token
```
Method: GET
URL: http://localhost:5000/api/verify

Headers:
- Content-Type: application/json
- authorization: <YOUR_JWT_TOKEN_HERE>
```

**Response:**
```json
{
  "success": true,
  "message": "Token verified successfully",
  "user": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "iat": 1702300000,
    "exp": 1702386400
  }
}
```

---

## Email Flow Diagram

```
1. User Signup
        ↓
2. Verification Email Sent (token valid for 24h)
        ↓
3. User Clicks Email Link or Uses Verification Endpoint
        ↓
4. Email Marked as Verified
        ↓
5. User Can Now Login
        ↓
6. JWT Token Generated on Successful Login
        ↓
7. Use Token in Authorization Header
```

---

## Error Responses

### Invalid/Expired Verification Token
```json
{
  "success": false,
  "message": "Invalid or expired verification token"
}
```

### User Already Exists
```json
{
  "success": false,
  "message": "User already exists with this email"
}
```

### Login Without Email Verification
```json
{
  "success": false,
  "message": "Please verify your email before logging in"
}
```

### Invalid Credentials
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## Testing Checklist

- [ ] Signup successful
- [ ] Verification email received
- [ ] Token in email URL is valid
- [ ] Verify email endpoint works
- [ ] Can't login without email verification
- [ ] Can login after verification
- [ ] JWT token received on login
- [ ] Token verification works with Authorization header
- [ ] Expired token is rejected

---

## Using Postman Variables (Optional)

Create Environment Variables for easier testing:

```
email: john@example.com
password: password123
token: (auto-save from signup response)
verify_token: (extract from email)
jwt_token: (auto-save from login response)
base_url: http://localhost:5000
```

Then use in requests:
- `{{base_url}}/api/signup`
- `{{base_url}}/api/verify-email?token={{verify_token}}`
- Headers: `authorization: {{jwt_token}}`

---

## Email Configuration Examples

### Gmail (with App Password)
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

### Other Services
See [Nodemailer Transports](https://nodemailer.com/smtp/) for SendGrid, AWS SES, etc.

### Disable Email (Development)
```javascript
// In emailService.js, comment out:
// await this.transporter.sendMail(mailOptions);
```

This allows testing without actual email setup!

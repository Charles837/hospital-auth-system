# CityCare Hospital Auth System

A simple hospital-themed authentication system built with Node.js + Express.

Features:
- User identification using staff ID and email
- Authentication using password + 2FA via TOTP
- Role-based authorization for 3 roles:
  - Admin
  - Doctor
  - Nurse
- Clean healthcare-themed interface

## How to run

1. Install dependencies:
   npm install

2. Start the server:
   npm start

3. Open the app in your browser:
   http://localhost:3000

## Registration flow

1. Register a new staff account from the UI.
2. Scan the QR code with an authenticator app such as:
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
3. Log in with your email and password.
4. Enter the 6-digit 2FA code.
5. Access the dashboard based on your role.

## Roles

- Admin: full hospital administration access
- Doctor: clinical dashboard access
- Nurse: ward and patient care access

## Notes

This is a simple demo implementation using in-memory storage. For production, you should add:
- a real database
- secure password reset flow
- audit logs
- HTTPS
- CSRF protection
- session expiration and refresh logic

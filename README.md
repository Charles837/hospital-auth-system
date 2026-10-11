# CityCare Hospital Auth System

A hospital-themed authentication system built with Node.js, Express, SQLite, and TOTP-based 2FA.

Features:
- User identification using staff ID and email
- Password authentication
- Two-factor authentication using authenticator apps
- Role-based access control for Admin, Doctor, and Nurse
- SQLite database persistence for user records
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
2. Scan the QR code with a TOTP app such as:
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
3. Log in with your email and password.
4. Enter the 6-digit code from your authenticator app.
5. Access the dashboard based on your assigned role.

## Roles

- Admin: hospital administration access
- Doctor: clinical and medical operations access
- Nurse: ward and patient care access

## Database

The app stores registered users in a local SQLite database file named:
- hospital_auth.db

This keeps staff data persistent between server restarts.

## Notes

This is a demo project intended for learning and prototyping. For a production hospital system, you would also want:
- HTTPS
- stronger audit logging
- password reset and account recovery
- email/SMS verification
- role permissions management
- SQL migrations and backup strategy

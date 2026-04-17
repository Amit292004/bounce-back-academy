# Bounce Back Academy - Full-Stack Educational Platform

This plan details the architecture and implementation steps to build the "Bounce Back Academy" web application, an educational platform providing study materials for Classes 8 to 12 with a dedicated admin management system.

## User Review Required

> [!IMPORTANT]
> **Database Selection:** I propose using **Prisma with SQLite** for the database. This requires zero setup on your machine and stores data in a local file, making it perfect for rapid development. It can be easily migrated to PostgreSQL later. Is this acceptable?
> 
> **File Storage:** Uploaded files (PDFs, Notes, Logos, Photos) will be stored locally within the application's `public/uploads` directory. For production, a cloud service like AWS S3 or Cloudinary is recommended.
> 
> **Email & OTP:** The signup flow requires OTP verification. To send real emails, an SMTP service (like Nodemailer with a Gmail account or Resend) is needed. I can implement a mock OTP system for testing, or we can use real credentials if you provide them (securely).

## Open Questions

> [!WARNING]
> 1. What exact data should "Phase" for Class 8 & 9 Question Papers contain? (e.g., "Phase 1", "Phase 2", "Mid-term", "Finals"?)
> 2. Do you have a preferred color palette or theme (e.g., Dark mode by default, vibrant colors) for the premium design?

## Proposed Changes

### 1. Technology Stack Setup
- **Framework:** Next.js (App Router) for both the frontend UI and backend API routes.
- **Styling:** Vanilla CSS (CSS Modules) to craft a highly customized, premium, and dynamic design as per the system guidelines (No Tailwind CSS).
- **Database:** Prisma ORM.
- **Authentication:** Custom JWT-based authentication via Next.js middleware and API routes to ensure strict separation between Student and Admin sessions.

### 2. Database Schema (Prisma)
We will create models for:
- `User`: Student accounts (Name, Class, Email, Password, OTP details).
- `Admin`: Admin accounts.
- `Subject`: Dynamic subjects managed by Admin.
- `AcademicYear`: Dynamic years managed by Admin.
- `QuestionPaper`: Title, Class, SubjectId, YearId, Phase, ViewUrl, DownloadFile, createdAt.
- `Note`: Title, Class, SubjectId, ViewUrl, DownloadFile, createdAt.
- `Video`: Title, YoutubeLink, Category (Class/Subject/General), createdAt.
- `Announcement`: Message, isActive.
- `Feedback`: Name, Class, Message, createdAt.
- `Branding`: SiteLogo, AdminPhoto.

### 3. Frontend Pages (Public / Students)
- **Home (`/`)**: 
  - Dynamic Welcome Banner.
  - Carousels for Latest Papers, Notes, Videos.
  - Class-wise Navigation Cards (Class 8 to 12).
  - Live Announcements Banner.
- **Content Pages (`/papers`, `/notes`)**:
  - Filter sidebars (Class, Subject, Year, Phase).
  - Content grid.
  - **View Action**: Opens content directly (Free access).
  - **Download Action**: Checks authentication; prompts login if unauthenticated.
- **Videos (`/videos`)**: Embedded YouTube player grid with Category filters.
- **Contact & Feedback (`/contact`, `/feedback`)**:
  - Information layout with Admin photo, phone, email, and social links.
  - Form to submit feedback to the database.
- **Student Auth (`/login`, `/signup`)**:
  - Beautiful, glassmorphism-styled forms for authentication and OTP verification.

### 4. Admin Authentication & Dashboard
- **Admin Login (`/admin/login`)**:
  - Completely isolated from student login. 
  - Uses the default credentials provided (`Amitsharmabouncebackacademy@2026` / `Amitsharmanagalanduniversity@2027`). Passwords will be securely hashed in the database on initialization.
- **Admin Dashboard Routes (`/admin/dashboard/*`)**:
  - **Overview**: Stats on users, content counts.
  - **Content Management**: Interfaces to upload, edit, and delete Papers, Notes, and Videos.
  - **Taxonomy**: Add/Edit/Delete Subjects and Years.
  - **Branding**: Upload and replace Admin Photo & Website Logo.
  - **Users & Feedback**: View list of students, delete users, read feedback.
  - **Announcements**: Broadcast messages to the Home page.

## Verification Plan

### Automated/Manual Verification
1. **Routing & Security**: Verify that navigating to `/admin/dashboard` or attempting to download files as a guest redirects to the respective login pages.
2. **Database Initialization**: Run a setup script to seed the initial Admin credentials and verify successful login.
3. **CRUD Functionality**: As Admin, create a Subject, a Year, and upload a test Question Paper. Verify it appears on the student frontend.
4. **Student Flow**: Register a new student, simulate OTP verification, log in, and verify the ability to download the previously uploaded Question Paper.
5. **Design Review**: Ensure the application meets the "Rich Aesthetics" requirement with animations, modern typography, and responsive layout.

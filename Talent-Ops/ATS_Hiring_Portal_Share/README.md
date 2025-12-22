# ATS Hiring Portal

A comprehensive **Applicant Tracking System (ATS)** built with React, featuring a modern dark theme with glassmorphism effects, designed to streamline the recruitment process from job posting to offer generation.

![Dashboard](./screenshots/dashboard.png)

## ✨ Features

### Core Modules
- **📋 Job Postings** - Create, publish, and manage job listings with department, location, and skill requirements
- **👥 Candidate Pipeline** - Drag-and-drop Kanban board to track candidates through hiring stages
- **📅 Interview Scheduling** - Schedule interviews with panel selection, mode (online/offline), and calendar integration
- **💬 Feedback Forms** - Structured feedback with ratings, comments, and hire/hold/reject recommendations
- **📄 Offer Generator** - Generate professional offer letters with PDF export capability
- **📊 Analytics Dashboard** - Recruitment metrics, conversion rates, and pipeline insights
- **⚙️ Settings** - User management with role-based access control and audit logging

### Technical Features
- 🌙 Modern dark theme with purple accents
- 💎 Glassmorphism UI design
- 🔐 Role-based access control (Admin, HR, Interviewer)
- 💾 LocalStorage persistence with audit trail
- 📱 Responsive design
- 🎯 Drag-and-drop candidate management
- 📑 PDF offer letter generation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
cd talent-acquisition-portal

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/
│   ├── Common/          # Modal, Toast
│   ├── Feedback/        # FeedbackForm
│   ├── Jobs/            # JobCard, JobForm
│   ├── Layout/          # Sidebar, Header, Layout
│   └── Offers/          # OfferForm, OfferPreview
├── context/
│   ├── AuthContext.jsx  # Authentication & roles
│   └── DataContext.jsx  # Global data management
├── pages/
│   ├── Dashboard.jsx
│   ├── Jobs.jsx
│   ├── Pipeline.jsx
│   ├── Candidates.jsx
│   ├── Interviews.jsx
│   ├── Feedback.jsx
│   ├── Offers.jsx
│   ├── Analytics.jsx
│   └── Settings.jsx
├── services/
│   ├── storage.js       # LocalStorage with audit
│   └── pdfGenerator.js  # Offer letter PDF
├── utils/
│   ├── constants.js     # App constants
│   └── helpers.js       # Utility functions
├── App.jsx
├── main.jsx
└── index.css            # Global styles
```

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all features including user management and audit logs |
| **HR** | Manage jobs, candidates, interviews, feedback, and offers |
| **Interviewer** | View assigned interviews and submit feedback only |

## 🎨 Design System

The portal uses a custom CSS design system featuring:
- **Colors**: Purple accent palette with dark backgrounds
- **Typography**: Inter font family
- **Components**: Glass-effect cards, gradient buttons, smooth animations
- **Layout**: Responsive grid system with collapsible sidebar

## 📊 Pipeline Stages

1. **Applied** - Initial application received
2. **Screening** - Resume/phone screening
3. **Interview** - Active interview process
4. **Offer** - Offer extended to candidate
5. **Hired** - Candidate accepted and onboarded
6. **Rejected** - Candidate not selected

## 🔧 Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **@hello-pangea/dnd** - Drag and drop
- **jsPDF** - PDF generation
- **Lucide React** - Icons

## 📝 License

MIT License - feel free to use this project for your own purposes.

---

Built with ❤️ for modern recruitment teams

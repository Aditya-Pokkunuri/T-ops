# InvoicePro - Professional Invoice Generator

A modern, premium invoice generator application built with React and Supabase. Features role-based access control, automatic invoice numbering, client management, and beautiful PDF generation.

## ✨ Features

- 🔐 **Secure Authentication** - Email/password authentication with Supabase
- 👥 **Role-Based Access** - Manager and Executive roles with different permissions
- 📊 **Auto-Generated Invoice Numbers** - Sequential invoice numbering per user
- 👤 **Client Management** - Store and manage client information
- 💾 **Database Integration** - All invoices saved to Supabase with full history
- 📄 **PDF Export** - Generate professional PDF invoices
- 🎨 **Premium UI** - Modern glassmorphic design with smooth animations
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 💰 **Multi-Currency Support** - INR, USD, EUR, GBP, JPY, CAD, AUD
- 🔒 **Row Level Security** - Data isolation per user with RLS policies

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Supabase account ([sign up free](https://supabase.com))

### Installation

1. **Clone or download this repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   
   a. Create a new project in [Supabase Dashboard](https://app.supabase.com)
   
   b. Go to SQL Editor and run all the SQL scripts from `DATABASE_SETUP.md`
   
   c. Get your credentials:
      - Go to Project Settings → API
      - Copy the `Project URL`
      - Copy the `anon public` key

4. **Configure environment variables**
   
   Open the `.env` file and add your Supabase credentials:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_project_url_here
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Database Setup

Follow the detailed instructions in `DATABASE_SETUP.md` to set up:

- User profiles table
- Clients table
- Invoices table
- Invoice items table
- Invoice sequence table (for auto-numbering)
- Storage buckets (for logos and PDFs)
- Row Level Security (RLS) policies
- Database functions and triggers

## 🎯 Usage

### First Time Setup

1. **Sign Up** - Create an account with your email and password
2. **Choose Role** - Select either Manager or Executive role
3. **Complete Profile** - Add your company details and logo

### Creating an Invoice

1. **Fill Company Details** - Your company information (auto-saved from profile)
2. **Select/Add Client** - Choose existing client or enter new client details
3. **Add Items** - Add invoice line items with description, quantity, price, and tax
4. **Set Payment Terms** - Add payment method, notes, and terms & conditions
5. **Generate Invoice** - Click "Generate Invoice" to save to database
6. **Export PDF** - Click "Export PDF" to download the invoice

### Managing Clients

- Add new clients using the "+ Add New Client" button
- Select existing clients from the dropdown
- Client information is automatically filled when selected

## 🔐 Roles & Permissions

### Executive
- Create and manage their own invoices
- View their own invoices
- Manage their own clients
- Upload company logo

### Manager
- All Executive permissions
- (Optional) View all invoices in the organization
  - Uncomment the manager policy in `DATABASE_SETUP.md` to enable

## 🎨 Customization

### Changing Theme Colors

Edit `src/InvoiceGenerator.css` and `src/components/Auth.css` to customize:
- Primary gradient colors
- Background colors
- Border colors
- Shadow effects

### Modifying Invoice Template

Edit the `generatePDF()` function in `src/InvoiceGenerator.jsx` to customize:
- PDF layout
- Font styles
- Colors
- Header/footer content

## 📁 Project Structure

```
InvoiceGenerator-main/
├── public/
├── src/
│   ├── components/
│   │   ├── Auth.js           # Authentication component
│   │   └── Auth.css          # Auth styles
│   ├── contexts/
│   │   └── AuthContext.js    # Authentication context
│   ├── services/
│   │   └── invoiceService.js # Supabase service layer
│   ├── App.js                # Main app component
│   ├── App.css               # App styles
│   ├── InvoiceGenerator.jsx  # Invoice generator component
│   ├── InvoiceGenerator.css  # Invoice generator styles
│   ├── supabaseClient.js     # Supabase client config
│   └── index.js              # App entry point
├── .env                      # Environment variables (add your credentials)
├── .env.example              # Environment variables template
├── DATABASE_SETUP.md         # Database setup guide
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🛠️ Technologies Used

- **Frontend**: React 19
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Styling**: CSS3 with Glassmorphism

## 🔒 Security Features

- Row Level Security (RLS) on all tables
- User data isolation
- Secure file uploads
- Environment variable protection
- SQL injection prevention
- XSS protection

## 📝 Invoice Number Format

Invoices are automatically numbered in the format: `INV-00001`, `INV-00002`, etc.

You can customize the prefix by updating the `invoice_sequences` table in Supabase.

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Make sure you've created the `.env` file
- Verify your credentials are correct
- Restart the development server after adding credentials

### "Failed to create invoice"
- Check that you've run all SQL scripts from `DATABASE_SETUP.md`
- Verify RLS policies are enabled
- Check browser console for detailed error messages

### "Logo upload failed"
- Ensure the `company-logos` storage bucket exists
- Verify RLS policies on storage are set correctly
- Check file size (should be under 5MB)

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Support

For issues, questions, or contributions, please create an issue in the repository.

## 🎉 Enjoy!

You now have a fully functional, production-ready invoice generator with a premium UI and robust backend!

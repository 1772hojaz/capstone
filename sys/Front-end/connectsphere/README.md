# ConnectSphere - Group Buying Platform

A modern React-based front-end application for a collaborative group buying platform, built with TypeScript, Vite, and TailwindCSS.

## Features

### 🔐 Authentication
- Login and Registration pages with clean, modern UI
- Role-based access (Admin, Trader, User)

### 📊 Dashboards
- **Admin Dashboard**: Analytics, ML training progress, user/group metrics
- **Trader Dashboard**: Sales performance, order management, revenue tracking

### 👥 User Management
- View and manage user accounts
- Role assignment and permissions
- User activity tracking

### 🛍️ Group Management
- Browse and search group buy listings
- Track member counts and active deals
- Growth analytics per group

### 🛡️ Content Moderation
- Review pending group approvals
- Handle reported content
- Compliance and quality control

### 📦 Product Catalog
- Comprehensive product inventory management
- Stock tracking
- Category organization

### ⚙️ System Settings
- Platform configuration
- Notification preferences
- Security settings
- Email configuration
- Database backup management

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd connectsphere
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit:
```
http://localhost:5173
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
connectsphere/
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Main layout wrapper
│   │   └── StatCard.tsx        # Reusable stat card component
│   ├── pages/
│   │   ├── LoginPage.tsx       # Login/Registration
│   │   ├── AdminDashboard.tsx  # Admin analytics dashboard
│   │   ├── TraderDashboard.tsx # Trader dashboard
│   │   ├── GroupList.tsx       # Group buy listings
│   │   ├── GroupModeration.tsx # Content moderation
│   │   ├── UserManagement.tsx  # User management
│   │   ├── ProductCatalog.tsx  # Product inventory
│   │   └── SystemSettings.tsx  # Platform settings
│   ├── App.tsx                 # Main app component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Features Overview

### Admin Dashboard
- Real-time analytics summary (users, groups, transactions, revenue)
- Platform activity charts showing growth trends
- ML training progress visualization
- Model performance breakdown
- Quick access to management tools

### Trader Dashboard
- Product and revenue statistics
- Sales performance charts
- Recent orders table with status tracking
- Order management interface

### Group Management
- Search and filter functionality
- Category-based organization
- Member and deal tracking
- Group status indicators

### User Management
- User search and filtering
- Role-based badges (Admin, Trader, User)
- Status management (Active/Inactive)
- Bulk actions support

### Content Moderation
- Pending group approval queue
- Reported content review
- Severity-based prioritization
- Quick approve/reject actions

### Product Catalog
- Visual product cards
- Stock management
- Category filtering
- Price and availability tracking

### System Settings
- General platform configuration
- Notification preferences
- Security settings (2FA, session timeout)
- Email/SMTP configuration
- Database backup management

## Design Credits

UI/UX designs created with [Visily](https://www.visily.ai/)

## License

This project is licensed under the MIT License.

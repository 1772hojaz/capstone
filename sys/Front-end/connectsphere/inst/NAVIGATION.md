# ConnectSphere - Navigation Guide

## Quick Start Routes

Once the development server is running (`npm run dev`), you can access the following pages:

### Authentication
- **Login/Registration**: `http://localhost:5173/login`
  - Toggle between Login and Register tabs
  - Quick access buttons to Admin and Trader dashboards

### Main Dashboards

#### Admin Dashboard
- **URL**: `http://localhost:5173/admin`
- **Features**:
  - Analytics summary (Total Users, Active Groups, Transactions, Revenue)
  - Platform activity bar chart (monthly trends)
  - ML Training Progress section with:
    - Model Performance Breakdown (pie chart)
    - Training Stage Progression (radar chart)
    - Overall ML System Status
  - Management Tools cards with quick links

#### Trader Dashboard
- **URL**: `http://localhost:5173/trader`
- **Features**:
  - Product, Revenue, Orders statistics
  - Sales Performance line chart
  - Recent Orders table with status tracking

### Management Pages

#### Group Buy List
- **URL**: `http://localhost:5173/groups`
- **Features**:
  - Search and filter groups
  - Grid view of all group buys
  - Member counts and active deals
  - Growth analytics per group

#### Group Moderation
- **URL**: `http://localhost:5173/moderation`
- **Features**:
  - Pending group approvals
  - Reported content review
  - Approve/Reject actions
  - Severity indicators

#### User Management
- **URL**: `http://localhost:5173/users`
- **Features**:
  - User search
  - Role-based badges (Admin, Trader, User)
  - Status indicators (Active/Inactive)
  - User actions (Edit, Manage Roles, Delete)

#### Product Catalog
- **URL**: `http://localhost:5173/products`
- **Features**:
  - Product grid view
  - Category filtering
  - Stock management
  - Price and availability tracking

#### System Settings
- **URL**: `http://localhost:5173/settings`
- **Features**:
  - General platform settings
  - Notification preferences
  - Security settings (2FA, session timeout)
  - Email/SMTP configuration
  - Database backup management

## Page Components

### Shared Components

1. **Layout Component** (`src/components/Layout.tsx`)
   - Used by all main pages
   - Includes header with logo and user menu
   - Footer with navigation links
   - Consistent styling across all pages

2. **StatCard Component** (`src/components/StatCard.tsx`)
   - Reusable statistics card
   - Color variants: blue, green, red, yellow
   - Used in dashboards and management pages

## Design Patterns

### Color Scheme
- **Primary Blue**: `#2563eb` (buttons, links, highlights)
- **Success Green**: `#10b981` (positive states)
- **Warning Yellow**: `#f59e0b` (warnings)
- **Danger Red**: `#ef4444` (errors, critical actions)

### Typography
- Headings: Bold, gray-900
- Body text: Regular, gray-700
- Muted text: gray-600

### Spacing
- Page padding: `px-6 py-8`
- Card padding: `p-6`
- Gap between elements: `gap-4` or `gap-6`

## Data Flow

Currently, all data is mocked/hardcoded in the components. To connect to a backend:

1. Create an API service layer in `src/services/`
2. Replace hardcoded data with API calls
3. Add state management (Context API, Redux, or Zustand)
4. Implement loading and error states

## Future Enhancements

- [ ] Connect to real backend API
- [ ] Add authentication and protected routes
- [ ] Implement real-time updates with WebSockets
- [ ] Add form validation
- [ ] Implement pagination for tables
- [ ] Add export functionality (CSV, PDF)
- [ ] Implement dark mode
- [ ] Add internationalization (i18n)
- [ ] Mobile responsiveness improvements
- [ ] Add unit and integration tests

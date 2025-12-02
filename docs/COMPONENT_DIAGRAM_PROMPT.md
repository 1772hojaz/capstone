# ConnectSphere Component Diagram Generation Prompt

## 🎯 **TASK: Generate Component Diagram**
Create a detailed component diagram for the ConnectSphere platform that shows all major software components and their relationships.

## 📋 **PLATFORM CONTEXT**
ConnectSphere is an AI-powered group-buying platform for informal traders in Zimbabwe, built with:
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: FastAPI + Python + SQLAlchemy
- **Database**: SQLite/PostgreSQL
- **ML Engine**: Hybrid recommender system
- **External Services**: Flutterwave payments, Cloudinary media, notifications

## 🏗 **COMPONENT DIAGRAM REQUIREMENTS**

### **Core Components to Include:**

#### **Frontend Components**
1. **React Application**
   - Main App component with routing
   - Authentication components (Login, Register)
   - Dashboard components (User Dashboard, Admin Dashboard)
   - Group components (Group List, Group Details, Group Chat)
   - Payment components (Payment Form, QR Display)
   - ML components (Recommendation List, Explanation Modal)

2. **State Management**
   - Zustand stores (User Store, Group Store, Payment Store)
   - Context providers for global state

3. **Services Layer**
   - API service (Axios HTTP client)
   - WebSocket service for real-time features
   - Authentication service
   - Payment service
   - ML recommendation service

#### **Backend Components**
1. **FastAPI Application**
   - Main application with middleware
   - Router modules (auth, products, groups, ML, admin, supplier, payment, analytics)
   - WebSocket manager for real-time communication

2. **Business Logic Layer**
   - Authentication service (JWT handling)
   - User management service
   - Group management service
   - Payment processing service
   - ML recommendation service
   - Analytics service

3. **Data Access Layer**
   - SQLAlchemy models (User, Group, Product, Payment, etc.)
   - Database connection manager
   - Repository pattern implementations

#### **ML Components**
1. **Recommendation Engine**
   - Collaborative filtering (NMF)
   - Content-based filtering (TF-IDF)
   - Popularity boosting
   - Cold start handler
   - Explainability module (LIME/SHAP)

2. **Model Management**
   - Training pipeline
   - Model persistence
   - Performance monitoring
   - A/B testing framework

#### **External Service Components**
1. **Payment Gateway**
   - Flutterwave integration
   - Webhook handler
   - Payment verification

2. **Media Services**
   - Cloudinary integration
   - Image optimization
   - CDN delivery

3. **Communication Services**
   - Email service
   - SMS gateway
   - Push notification service

#### **Infrastructure Components**
1. **Web Server**
   - Nginx reverse proxy
   - Load balancer
   - SSL termination

2. **Application Server**
   - Uvicorn ASGI server
   - Process manager
   - Health monitoring

3. **Database Server**
   - PostgreSQL primary
   - Read replicas
   - Connection pooling

4. **Cache & Session Store**
   - Redis cache
   - Session management
   - Real-time data storage

## 🔗 **RELATIONSHIP TYPES TO SHOW**

### **Dependency Relationships**
- **Uses/Imports**: Component A uses functionality from Component B
- **Implements**: Component implements an interface or contract
- **Extends**: Component inherits from or extends another component

### **Data Flow Relationships**
- **Reads/Writes**: Data access patterns between components
- **Publishes/Subscribes**: Event-driven communication
- **Requests/Responds**: API communication patterns

### **Deployment Relationships**
- **Contains**: Parent component contains child components
- **Deploys To**: Components deployed to specific infrastructure
- **Connects To**: Network connections between components

## 📊 **DIAGRAM SPECIFICATIONS**

### **Visual Elements**
- **Rectangles**: Main components and subsystems
- **Circles/Diamonds**: Interfaces and ports
- **Arrows**: Dependencies and data flows
- **Grouping Boxes**: Logical groupings (Frontend, Backend, Infrastructure)
- **Colors**: Different colors for different layers/types

### **Component Details**
For each component, show:
- **Name**: Clear, descriptive name
- **Type**: Frontend, Backend, Database, External Service, Infrastructure
- **Technology**: Specific framework/library used
- **Responsibilities**: Key functions/capabilities
- **Interfaces**: Provided and required interfaces

### **Layer Organization**
1. **Presentation Layer**: React components, UI logic
2. **Application Layer**: Business logic, use cases
3. **Domain Layer**: Core business entities, rules
4. **Infrastructure Layer**: External services, persistence

## 🎯 **OUTPUT FORMAT**

### **Diagram Structure**
```
┌─────────────────────────────────────────────────────────────────┐
│                    CONNECTSPHERE COMPONENT DIAGRAM               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │   Frontend      │  │   Backend       │  │   Database      │   │
│  │   Components    │  │   Services      │  │   Layer         │   │
│  │                 │  │                 │  │                 │   │
│  │  ┌────────────┐ │  │  ┌────────────┐ │  │  ┌────────────┐ │   │
│  │  │ React App  │ │  │  │ FastAPI    │ │  │  │ PostgreSQL │ │   │
│  │  │ Components │ │  │  │ Services  │ │  │  │ Models     │ │   │
│  │  └────────────┘ │  │  └────────────┘ │  │  └────────────┘ │   │
│  │                 │  │                 │  │                 │   │
│  │  ┌────────────┐ │  │  ┌────────────┐ │  │  ┌────────────┐ │   │
│  │  │ Services   │◄┼──┼──┼►│ Business  │◄┼──┼──┼►│ Repositories│ │   │
│  │  │ Layer      │ │  │  │ Logic      │ │  │  │             │ │   │
│  │  └────────────┘ │  │  └────────────┘ │  │  └────────────┘ │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │   ML Engine     │  │   External      │  │   Infrastructure│   │
│  │   Components    │  │   Services      │  │   Components    │   │
│  │                 │  │                 │  │                 │   │
│  │  ┌────────────┐ │  │  ┌────────────┐ │  │  ┌────────────┐ │   │
│  │  │ Recommender│◄┼──┼──┼►│ Flutterwave│◄┼──┼──┼►│ Nginx       │ │   │
│  │  │ Engine     │ │  │  │ Payments   │ │  │  │ Load Balancer│ │   │
│  │  └────────────┘ │  │  └────────────┘ │  │  └────────────┘ │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### **Component Descriptions**
Provide detailed descriptions for each major component including:
- **Purpose**: What the component does
- **Responsibilities**: Key functions
- **Dependencies**: What it depends on
- **Interfaces**: How other components interact with it
- **Technology**: Specific tools/frameworks used

### **Relationship Explanations**
Explain the relationships between components:
- **Data Flow**: How data moves between components
- **Control Flow**: How components coordinate actions
- **Deployment**: How components are organized in production

## ✅ **VALIDATION CHECKLIST**
- [ ] All major components identified and categorized
- [ ] Clear dependency relationships shown
- [ ] Data flow patterns documented
- [ ] Technology stack properly represented
- [ ] Scalability considerations included
- [ ] Security boundaries defined
- [ ] External integrations properly connected

Generate the component diagram with all required details and explanations.</content>
<parameter name="filePath">/home/humphrey/capstone/COMPONENT_DIAGRAM_PROMPT.md
# ConnectSphere Architecture Generation Prompt

## 🎯 **PLATFORM OVERVIEW**
You are tasked with generating a comprehensive architectural overview for **ConnectSphere**, an AI-powered group-buying platform designed to democratize bulk purchasing for informal traders in Harare, Zimbabwe.

## 📋 **PLATFORM MISSION & TARGET USERS**
- **Mission**: Enable informal traders (Mbare market vendors) to access bulk purchasing through AI-powered group recommendations
- **Target Users**: Small-scale traders, market vendors, informal business owners in Zimbabwe
- **Business Model**: Commission-based (10% platform fee on successful group purchases)
- **Market Problem**: Informal traders lack access to bulk pricing due to limited individual purchasing power

## 🛠 **CORE FEATURES & FUNCTIONALITY**

### **User-Facing Features**
1. **AI-Powered Recommendations**: Hybrid ML system suggesting relevant group-buy opportunities
2. **Group Buying**: Join existing groups or create new ones for bulk purchases
3. **Real-time Collaboration**: Group chat, progress tracking, deadline management
4. **Secure Payments**: Multi-method payment processing (cards, mobile money, QR payments)
5. **QR Logistics**: Digital pickup system with encrypted QR codes for secure collection
6. **Mobile-First Design**: PWA capabilities for offline functionality
7. **Multi-language Support**: English and local languages (Shona/Ndebele)

### **Admin Features**
1. **User Management**: CRUD operations, role assignment, permission control
2. **Group Moderation**: Create/edit groups, monitor progress, handle disputes
3. **ML Model Monitoring**: Performance tracking, retraining, A/B testing
4. **Analytics Dashboard**: Real-time KPIs, custom reports, system health
5. **Supplier Oversight**: B2B portal access, order monitoring, payment processing

### **Supplier B2B Features**
1. **Product Management**: Catalog upload, pricing tiers, stock management
2. **Order Processing**: Quote submission, order acceptance/rejection
3. **Fulfillment Tracking**: Status updates, delivery tracking, quality control
4. **Payment Processing**: Invoice generation, payout management, reconciliation

## 💻 **TECHNICAL STACK**

### **Frontend**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **HTTP Client**: Axios
- **Real-time**: WebSocket client
- **PWA**: Service workers, offline capabilities
- **Mobile Features**: QR scanner, camera integration

### **Backend**
- **Framework**: FastAPI (Python)
- **ASGI Server**: Uvicorn
- **Database**: SQLite (development), PostgreSQL (production)
- **ORM**: SQLAlchemy
- **Authentication**: JWT tokens
- **Real-time**: WebSocket support
- **API Documentation**: Automatic OpenAPI/Swagger

### **Machine Learning**
- **Recommendation Engine**: Hybrid system combining:
  - Collaborative Filtering (NMF matrix factorization)
  - Content-Based Filtering (TF-IDF similarity)
  - Popularity Boosting (trending products)
- **Explainability**: LIME/SHAP for recommendation transparency
- **Cold Start Handling**: Similarity-based recommendations for new users
- **Model Training**: Automated retraining with progress tracking

### **External Integrations**
- **Payments**: Flutterwave (cards, mobile money, bank transfers)
- **Media Storage**: Cloudinary (image optimization, CDN)
- **Notifications**: Email service, SMS gateway
- **Analytics**: Event tracking, ETL pipelines

## 🏗 **ARCHITECTURAL REQUIREMENTS**

### **System Architecture**
- **Microservices Design**: Modular backend services (auth, products, ML, payments, etc.)
- **Event-Driven**: Real-time event processing and WebSocket communication
- **Scalable**: Horizontal scaling capabilities for high user loads
- **Secure**: JWT authentication, input sanitization, rate limiting, CORS

### **Data Architecture**
- **User Data**: Profiles, preferences, transaction history, behavior analytics
- **Product Data**: Catalog, pricing, suppliers, categories
- **Group Data**: Participants, progress, deadlines, fulfillment status
- **ML Data**: User vectors, similarity matrices, recommendation logs
- **Analytics**: Event streams, KPIs, performance metrics

### **Infrastructure Requirements**
- **Deployment**: Docker containerization with docker-compose
- **Load Balancing**: Nginx reverse proxy
- **Caching**: Redis for session storage and API caching
- **Monitoring**: Health checks, performance monitoring, error tracking
- **Backup**: Automated database backups with point-in-time recovery

## 📊 **NON-FUNCTIONAL REQUIREMENTS**
- **Performance**: <200ms API response times, <100ms real-time updates
- **Availability**: 99.5% uptime target
- **Security**: PCI DSS compliance for payments, data encryption
- **Scalability**: Support 10,000+ concurrent users
- **Mobile Experience**: Optimized for low-bandwidth connections

## 🎨 **OUTPUT REQUIREMENTS**

### **Architecture Diagram**
Create a comprehensive architectural diagram showing:
1. **User Layer**: Different user types and their interfaces
2. **Application Layer**: Frontend components and backend services
3. **Data Layer**: Database schema and data flow
4. **Infrastructure Layer**: Servers, containers, load balancers
5. **External Services**: Third-party integrations and APIs

### **Component Descriptions**
For each major component, provide:
- **Purpose**: What it does and why it's needed
- **Technology Stack**: Specific tools and frameworks used
- **Data Flow**: How data enters, processes, and exits
- **Integration Points**: How it connects to other components
- **Scalability Considerations**: How it handles growth

### **System Flow Diagrams**
Include detailed flow diagrams for:
1. **User Registration & Onboarding**
2. **ML Recommendation Engine**
3. **Group Buying Process**
4. **Payment Processing**
5. **QR Logistics & Pickup**
6. **Analytics & Reporting**

### **Database Schema**
Design and document the database schema including:
- **Entity Relationships**: Tables and their connections
- **Key Fields**: Important columns and data types
- **Indexing Strategy**: Performance optimization
- **Migration Strategy**: How schema changes are handled

### **API Architecture**
Document the API design including:
- **RESTful Endpoints**: Resource-based URL structure
- **Authentication**: JWT token flow
- **Rate Limiting**: Request throttling strategy
- **Error Handling**: Standardized error responses
- **Versioning**: API evolution strategy

### **Security Architecture**
Detail security measures including:
- **Authentication & Authorization**: User access control
- **Data Protection**: Encryption and privacy measures
- **Payment Security**: PCI compliance requirements
- **API Security**: Input validation and sanitization
- **Infrastructure Security**: Network and container security

## 📋 **DELIVERABLES CHECKLIST**
- [ ] High-level system architecture diagram
- [ ] Detailed component architecture breakdown
- [ ] Database schema design with relationships
- [ ] API endpoint documentation
- [ ] Data flow diagrams for key processes
- [ ] Security architecture overview
- [ ] Infrastructure and deployment architecture
- [ ] Scalability and performance considerations
- [ ] Integration points with external services

## 🎯 **SUCCESS CRITERIA**
The architecture should:
1. **Support Business Goals**: Enable efficient group buying at scale
2. **Ensure Technical Excellence**: Modern, maintainable, scalable design
3. **Prioritize User Experience**: Fast, reliable, mobile-optimized
4. **Enable Future Growth**: Modular design for feature expansion
5. **Maintain Security**: Protect user data and financial transactions
6. **Support Analytics**: Comprehensive data collection for ML improvement

Generate this comprehensive architectural overview for the ConnectSphere platform.</content>
<parameter name="filePath">/home/humphrey/capstone/ARCHITECTURE_GENERATION_PROMPT.md
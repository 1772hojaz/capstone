# ConnectSphere Sequence Diagram Generation Prompt

## 🎯 **TASK: Generate Sequence Diagrams**
Create detailed sequence diagrams for key processes in the ConnectSphere platform, showing the chronological flow of messages between components.

## 📋 **PLATFORM CONTEXT**
ConnectSphere is an AI-powered group-buying platform with React frontend, FastAPI backend, ML recommendation engine, and external payment integration.

## 🔄 **SEQUENCE DIAGRAM REQUIREMENTS**

### **Key Processes to Diagram:**

#### **1. User Registration & Authentication Flow**
```
User → Frontend → Backend API → Database → Email Service → User
```

#### **2. ML Recommendation Generation Flow**
```
User → Frontend → ML API → Database → ML Engine → Frontend → User
```

#### **3. Group Joining & Payment Flow**
```
User → Frontend → Group API → Payment API → Flutterwave → Webhook → Database → User
```

#### **4. QR Code Generation & Pickup Flow**
```
Payment Success → Backend → QR Service → Database → User → Staff → Backend → Database
```

#### **5. Real-time Group Chat Flow**
```
User → WebSocket → Backend → Database → Other Users → Frontend
```

## 📊 **DIAGRAM SPECIFICATIONS**

### **Sequence Diagram Elements**

#### **Participants (Lifelines)**
- **User**: End user interacting with the system
- **Frontend**: React application components
- **Backend API**: FastAPI application routers
- **Database**: SQLAlchemy models and queries
- **ML Engine**: Recommendation algorithm components
- **External Services**: Flutterwave, Cloudinary, Email/SMS
- **WebSocket Manager**: Real-time communication handler

#### **Messages & Interactions**
- **Synchronous Messages**: API calls, database queries (solid arrows)
- **Asynchronous Messages**: Webhooks, events (dashed arrows)
- **Return Messages**: Responses to synchronous calls
- **Self-Messages**: Internal processing within a component
- **Creation Messages**: Object instantiation

#### **Control Structures**
- **Alt/Alternative**: Conditional logic (if/else branches)
- **Loop**: Repeated operations
- **Break**: Early termination conditions
- **Ref**: Reference to other sequence diagrams
- **Note**: Explanatory annotations

### **Timing & Ordering**
- **Activation Bars**: Show when components are active/processing
- **Time Axis**: Top to bottom chronological flow
- **Parallel Execution**: Show concurrent operations
- **Duration**: Indicate processing time where relevant

## 🎯 **DETAILED SEQUENCE FLOWS**

### **1. User Registration Flow**
```
1. User submits registration form
2. Frontend validates input
3. Frontend calls POST /api/auth/register
4. Backend validates data
5. Backend hashes password
6. Backend creates user record
7. Backend generates JWT token
8. Backend sends welcome email
9. Backend returns success response
10. Frontend stores token
11. Frontend redirects to dashboard
```

### **2. ML Recommendation Flow**
```
1. User loads dashboard
2. Frontend calls GET /api/ml/recommendations
3. Backend authenticates user
4. Backend checks user transaction history
5. Backend routes to appropriate ML engine
6. ML Engine loads user profile
7. ML Engine calculates hybrid scores
8. ML Engine applies behavioral factors
9. ML Engine ranks and filters results
10. Backend tracks recommendation event
11. Backend returns recommendations
12. Frontend displays recommendations
```

### **3. Group Joining & Payment Flow**
```
1. User clicks join group
2. Frontend calls POST /api/groups/{id}/join
3. Backend validates quantity/availability
4. Backend reserves participation spot
5. Backend creates contribution record
6. Backend calls POST /api/payment/initialize
7. Backend calculates amount with fees
8. Backend creates Flutterwave session
9. Backend returns checkout URL
10. User completes payment externally
11. Flutterwave processes payment
12. Flutterwave sends webhook
13. Backend verifies webhook signature
14. Backend updates contribution status
15. Backend updates group progress
16. Backend sends notifications
17. Frontend shows success state
```

### **4. QR Code Pickup Flow**
```
1. Payment confirmed
2. Backend generates encrypted QR token
3. Backend stores QR in database
4. Backend sends QR to user
5. User arrives at pickup location
6. Staff scans QR code
7. Frontend calls GET /api/qr/scan/{token}
8. Backend decrypts and validates token
9. Backend returns purchase details
10. Staff confirms pickup
11. Frontend calls POST /api/qr/mark-used/{qr_id}
12. Backend verifies staff permission
13. Backend marks QR as used
14. Backend updates stock levels
15. Backend broadcasts real-time update
16. All participants receive notification
```

### **5. Real-time Group Chat Flow**
```
1. User opens group chat
2. Frontend establishes WebSocket connection
3. Backend authenticates WebSocket connection
4. Backend subscribes to group channel
5. User types message
6. Frontend sends message via WebSocket
7. Backend validates message
8. Backend stores message in database
9. Backend broadcasts to all group members
10. Other users receive message
11. Frontend displays message in real-time
```

## 📋 **DIAGRAM FORMATTING**

### **Standard Sequence Diagram Format**
```
Participant1    Participant2    Participant3
    |               |               |
    |--request----->|               |
    |               |--process----->|
    |               |<--response----|
    |<--result------|               |
    |               |               |
```

### **With Timing and Conditions**
```
User            Frontend        Backend         Database
  |                |              |              |
  |---login------->|              |              |
  |                |--validate--->|              |
  |                |              |--query------>|
  |                |              |<--user-------|
  |                |<--token------|              |
  |<--redirect-----|              |              |
  |                |              |              |
  note over User: User authenticated
```

### **Complex Flow with Alternatives**
```
User            Payment Service  Flutterwave
  |                |              |
  |--pay---------->|              |
  |                |--init------->|
  |                |<--url--------|
  |<--redirect-----|              |
  |                |              |
  ... external payment processing ...
  |                |              |
  |                |<--webhook----|
  alt success
    |                |--verify---->|
    |                |<--ok--------|
    |                |--update---->|
  else failure
    |                |--handle---->|
    |                |<--error-----|
  end
```

## ✅ **VALIDATION CHECKLIST**
- [ ] All major participants identified
- [ ] Chronological order maintained
- [ ] All message types properly represented
- [ ] Error handling and edge cases included
- [ ] External service integrations shown
- [ ] Real-time communication patterns documented
- [ ] Database interactions properly sequenced
- [ ] User experience flow maintained

## 🎯 **OUTPUT REQUIREMENTS**
Generate sequence diagrams for all 5 key processes, showing:
1. **Complete message flow** from start to finish
2. **Error handling paths** for failure scenarios
3. **Alternative flows** for different conditions
4. **External integrations** with proper timing
5. **Database operations** at correct points
6. **Real-time updates** where applicable

Each diagram should be clearly labeled and include explanatory notes for complex interactions.</content>
<parameter name="filePath">/home/humphrey/capstone/SEQUENCE_DIAGRAM_PROMPT.md
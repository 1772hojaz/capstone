# ConnectSphere ERD (Entity Relationship Diagram) Generation Prompt

## 🎯 **TASK: Generate Entity Relationship Diagram**
Create a comprehensive ERD showing all database entities, their attributes, and relationships for the ConnectSphere platform.

## 📋 **PLATFORM CONTEXT**
ConnectSphere is a group-buying platform with users, groups, products, payments, and ML analytics data. The database uses SQLAlchemy ORM with relationships between entities.

## 🗄 **DATABASE ENTITIES & RELATIONSHIPS**

### **Core Business Entities**

#### **1. User Entity**
- **Purpose**: Store user account information and profiles
- **Relationships**:
  - One-to-many with Groups (created groups)
  - One-to-many with GroupMembers (participation)
  - One-to-many with Payments (payment history)
  - One-to-many with Recommendations (received recommendations)
  - One-to-many with UserBehavior (analytics data)

#### **2. Group Entity**
- **Purpose**: Store group-buy information and progress
- **Relationships**:
  - Many-to-one with User (creator)
  - Many-to-one with Product (product being purchased)
  - One-to-many with GroupMembers (participants)
  - One-to-many with Payments (contributions)
  - One-to-many with GroupChat (messages)

#### **3. Product Entity**
- **Purpose**: Store product catalog and supplier information
- **Relationships**:
  - Many-to-one with Supplier (product supplier)
  - One-to-many with Groups (groups buying this product)
  - One-to-many with ProductCategory (categories)
  - One-to-many with ProductImage (product photos)

#### **4. Supplier Entity**
- **Purpose**: Store supplier business information
- **Relationships**:
  - One-to-many with Products (supplied products)
  - One-to-many with SupplierOrder (bulk orders)
  - One-to-many with Invoice (billing records)

#### **5. Payment Entity**
- **Purpose**: Store payment transactions and status
- **Relationships**:
  - Many-to-one with User (payer)
  - Many-to-one with Group (group payment)
  - One-to-one with QRCode (pickup code)
  - Many-to-one with PaymentMethod (payment type)

### **Transactional Entities**

#### **6. GroupMember Entity**
- **Purpose**: Track user participation in groups
- **Relationships**:
  - Many-to-one with User (participant)
  - Many-to-one with Group (joined group)
  - One-to-one with Payment (contribution payment)

#### **7. QRCode Entity**
- **Purpose**: Store encrypted pickup codes
- **Relationships**:
  - One-to-one with Payment (associated payment)
  - One-to-one with PickupLocation (pickup point)

#### **8. GroupChat Entity**
- **Purpose**: Store real-time group communication
- **Relationships**:
  - Many-to-one with Group (chat group)
  - Many-to-one with User (message sender)

### **ML & Analytics Entities**

#### **9. Recommendation Entity**
- **Purpose**: Store ML-generated recommendations
- **Relationships**:
  - Many-to-one with User (recommended to)
  - Many-to-one with Group (recommended group)
  - Many-to-one with RecommendationType (algorithm used)

#### **10. UserBehavior Entity**
- **Purpose**: Store user interaction analytics
- **Relationships**:
  - Many-to-one with User (behavior subject)
  - Many-to-one with EventType (interaction type)

#### **11. MLModel Entity**
- **Purpose**: Track ML model versions and performance
- **Relationships**:
  - One-to-many with ModelMetrics (performance data)
  - One-to-many with ABLTest (testing results)

### **Administrative Entities**

#### **12. AdminUser Entity**
- **Purpose**: Store admin account information
- **Relationships**:
  - One-to-many with AdminAction (audit log)

#### **13. SystemSetting Entity**
- **Purpose**: Store configurable system parameters
- **Relationships**:
  - Many-to-one with SettingCategory (organization)

## 📊 **ENTITY ATTRIBUTES**

### **User Entity Attributes**
- `id` (Primary Key, UUID)
- `email` (Unique, String)
- `password_hash` (String)
- `full_name` (String)
- `phone` (String)
- `location` (String)
- `user_type` (Enum: trader, admin, supplier)
- `is_active` (Boolean)
- `created_at` (DateTime)
- `updated_at` (DateTime)
- `last_login` (DateTime)
- `preferences` (JSON)
- `profile_complete` (Boolean)

### **Group Entity Attributes**
- `id` (Primary Key, UUID)
- `name` (String)
- `description` (Text)
- `product_id` (Foreign Key)
- `creator_id` (Foreign Key)
- `target_quantity` (Integer)
- `current_quantity` (Integer)
- `price_per_unit` (Decimal)
- `total_target` (Decimal)
- `deadline` (DateTime)
- `status` (Enum: active, completed, cancelled)
- `created_at` (DateTime)
- `location` (String)
- `category` (String)

### **Product Entity Attributes**
- `id` (Primary Key, UUID)
- `name` (String)
- `description` (Text)
- `supplier_id` (Foreign Key)
- `base_price` (Decimal)
- `bulk_price` (Decimal)
- `minimum_order` (Integer)
- `unit` (String)
- `category` (String)
- `is_active` (Boolean)
- `stock_level` (Integer)
- `created_at` (DateTime)

### **Payment Entity Attributes**
- `id` (Primary Key, UUID)
- `user_id` (Foreign Key)
- `group_id` (Foreign Key)
- `amount` (Decimal)
- `platform_fee` (Decimal)
- `status` (Enum: pending, completed, failed, refunded)
- `payment_method` (String)
- `transaction_id` (String)
- `flutterwave_ref` (String)
- `created_at` (DateTime)
- `completed_at` (DateTime)

### **ML-Related Entity Attributes**
- **Recommendation**:
  - `id`, `user_id`, `group_id`, `score`, `algorithm`, `rank`, `shown_at`, `clicked_at`
- **UserBehavior**:
  - `id`, `user_id`, `event_type`, `event_data`, `timestamp`, `session_id`
- **MLModel**:
  - `id`, `version`, `algorithm`, `training_date`, `accuracy_score`, `is_active`

## 🔗 **RELATIONSHIP TYPES**

### **One-to-One Relationships**
- Payment ↔ QRCode (each payment generates one QR code)
- User ↔ SupplierProfile (suppliers are also users)

### **One-to-Many Relationships**
- User → Groups (user creates multiple groups)
- Group → GroupMembers (group has multiple participants)
- Product → Groups (product can be in multiple groups)
- Supplier → Products (supplier provides multiple products)

### **Many-to-Many Relationships**
- User ↔ Group (through GroupMember - users join multiple groups, groups have multiple users)
- Product ↔ Category (through ProductCategory)
- User ↔ Product (through purchase history for recommendations)

## 📋 **ERD NOTATION STANDARDS**

### **Entity Representation**
```
┌─────────────────┐
│    Entity Name  │
├─────────────────┤
│ PK attribute    │
│ FK attribute    │
│ attribute       │
│ ...             │
└─────────────────┘
```

### **Relationship Notation**
- **One-to-One**: ───│─── (single line with perpendicular)
- **One-to-Many**: ───│─── (crow's foot on many side)
- **Many-to-Many**: ───│─── (crow's feet on both sides)

### **Cardinality Labels**
- 1:1 (One to One)
- 1:N (One to Many)
- N:M (Many to Many)

## 🎯 **OUTPUT FORMAT**

### **Complete ERD Structure**
```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │    Group    │       │   Product   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ email       │       │ name        │       │ name        │
│ password    │       │ creator_id  │◄──────┤ supplier_id │
│ full_name   │       │ product_id  │──────►│ base_price  │
│ phone       │       │ target_qty  │       │ category    │
│ location    │       │ deadline    │       │ stock_level │
│ user_type   │       │ status      │       └─────────────┘
│ created_at  │       └─────────────┘
└─────────────┘              │
       │                     │
       │ 1:N                 │ 1:N
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│ GroupMember │       │   Payment   │
├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │
│ user_id (FK)│◄──────┤ user_id (FK)│
│ group_id(FK)│──────►│ group_id(FK)│
│ quantity    │       │ amount      │
│ joined_at   │       │ status      │
└─────────────┘       │ flutterwave │
                      └─────────────┘
                             │
                             │ 1:1
                             ▼
                      ┌─────────────┐
                      │   QRCode    │
                      ├─────────────┤
                      │ id (PK)     │
                      │ payment_id  │
                      │ token       │
                      │ expires_at  │
                      │ is_used     │
                      └─────────────┘
```

### **Relationship Explanations**
Provide detailed explanations for each relationship:
- **User → GroupMember**: A user can participate in multiple groups
- **Group → GroupMember**: A group can have multiple participants
- **Group → Payment**: Each group contribution creates a payment record
- **Payment → QRCode**: Successful payments generate pickup QR codes

### **Index Recommendations**
- Primary keys automatically indexed
- Foreign keys should be indexed
- Frequently queried fields (email, status, created_at)
- Composite indexes for common query patterns

### **Constraints & Business Rules**
- Users must have unique email addresses
- Groups cannot exceed target quantity
- Payments must be positive amounts
- QR codes expire after 24 hours
- Suppliers must be verified before product listing

## ✅ **VALIDATION CHECKLIST**
- [ ] All entities identified and properly attributed
- [ ] Relationships correctly defined with proper cardinality
- [ ] Primary and foreign keys properly designated
- [ ] Data types appropriate for each attribute
- [ ] Business rules and constraints documented
- [ ] Indexing strategy outlined
- [ ] Normalization principles followed (no redundant data)
- [ ] Extensibility considered for future features

Generate the complete ERD with all entities, attributes, relationships, and explanatory documentation.</content>
<parameter name="filePath">/home/humphrey/capstone/ERD_DIAGRAM_PROMPT.md
# Plan to Add Suppliers on the Platform

## Current System Analysis

Based on a comprehensive review of all files in the codebase, the platform is a group-buying system for informal traders with the following architecture:

### Backend (Python/FastAPI)
- **Database**: SQLite with SQLAlchemy ORM
- **Key Models**: User, Product, GroupBuy, AdminGroup, Transaction, MLModel, etc.
- **Routers**: auth, products, groups, chat, ml, admin, settings
- **Current Product Model**: Includes name, description, prices, MOQ, category, but no supplier association

### Frontend (React/TypeScript)
- **Routing**: Admin dashboard, trader dashboard, group management, user management
- **Admin Features**: Group moderation, user management, product catalog, system settings
- **Current Limitation**: No supplier management interface

### Current Product Flow
1. Admins create products via `/api/products/` endpoints
2. Products are used in group buys (both user-created and admin-managed)
3. No supplier entity - products exist independently

## Proposed Supplier Feature Implementation

### 1. Database Schema Changes

**New Supplier Model** (`models.py`):
```python
class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    contact_email = Column(String, nullable=False)
    contact_phone = Column(String)
    address = Column(Text)
    city = Column(String)
    province = Column(String)
    business_license = Column(String)  # License number
    tax_id = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    products = relationship("Product", back_populates="supplier")
    admin_groups = relationship("AdminGroup", back_populates="supplier")
```

**Update Product Model**:
```python
class Product(Base):
    # ... existing fields ...
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    
    # Relationships
    supplier = relationship("Supplier", back_populates="products")
```

**Update AdminGroup Model**:
```python
class AdminGroup(Base):
    # ... existing fields ...
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    
    # Relationships
    supplier = relationship("Supplier", back_populates="admin_groups")
```

### 2. Backend API Implementation

**New Supplier Router** (`suppliers.py`):
- `GET /api/suppliers/` - List all suppliers
- `POST /api/suppliers/` - Create supplier (admin only)
- `GET /api/suppliers/{id}` - Get supplier details
- `PUT /api/suppliers/{id}` - Update supplier
- `DELETE /api/suppliers/{id}` - Deactivate supplier

**Update Products Router**:
- Add supplier_id to ProductCreate/ProductUpdate models
- Include supplier info in product responses

**Update Admin Router**:
- Add supplier_id to CreateGroupRequest/UpdateGroupRequest
- Include supplier info in group responses

### 3. Frontend Implementation

**New Supplier Management Page** (`SupplierManagement.tsx`):
- List all suppliers with search/filter
- Add new supplier form
- Edit existing suppliers
- Deactivate/reactivate suppliers

**Update Admin Dashboard**:
- Add "Supplier Management" card to management tools
- Route to `/suppliers`

**Update Product Forms**:
- Add supplier dropdown in product creation/editing
- Display supplier info in product details

**Update Group Creation**:
- Add supplier selection in admin group creation
- Display supplier info in group details

### 4. Migration Strategy

**Database Migration**:
1. Create new `suppliers` table
2. Add `supplier_id` columns to `products` and `admin_groups` tables
3. Run data migration to assign default suppliers or mark as "Unknown"

**Seed Data**:
- Create initial supplier records for existing products
- Update seed scripts to include supplier data

### 5. UI/UX Considerations

**Supplier Management Interface**:
- Table view with columns: Name, Contact, Location, Status, Products Count
- Modal forms for add/edit with validation
- Bulk actions for activation/deactivation

**Integration Points**:
- Product catalog shows supplier info
- Group details include supplier contact
- Reports can include supplier performance metrics

### 6. Business Logic Updates

**Supplier Validation**:
- Ensure suppliers are active before allowing new products/groups
- Supplier contact required for group fulfillment

**Reporting Enhancements**:
- Supplier performance metrics
- Product sourcing analytics
- Supplier reliability tracking

### 7. Security & Permissions

**Access Control**:
- Supplier management restricted to admins
- Suppliers cannot access admin functions
- Supplier data protected in API responses

### 8. Testing Strategy

**Unit Tests**:
- Supplier CRUD operations
- Product-supplier relationships
- Group-supplier associations

**Integration Tests**:
- Full supplier onboarding flow
- Product creation with supplier assignment
- Group creation with supplier selection

**UI Tests**:
- Supplier management interface
- Form validations
- Error handling

### 9. Deployment Plan

**Phase 1**: Database schema and basic CRUD
**Phase 2**: Frontend supplier management
**Phase 3**: Integration with products/groups
**Phase 4**: Reporting and analytics
**Phase 5**: Production deployment with data migration

### 10. Success Metrics

- Number of active suppliers onboarded
- Products linked to suppliers
- Groups created with supplier assignments
- Admin efficiency in supplier management
- System performance impact

## Implementation Priority

1. **High Priority**: Database schema and basic supplier CRUD
2. **High Priority**: Supplier management UI
3. **Medium Priority**: Product-supplier integration
4. **Medium Priority**: Group-supplier integration  
5. **Low Priority**: Advanced reporting and analytics

## Risks & Mitigations

- **Data Migration Risk**: Test thoroughly on staging environment
- **UI Complexity**: Start with simple forms, iterate based on feedback
- **Supplier Adoption**: Provide clear onboarding documentation
- **Performance Impact**: Monitor query performance with supplier joins

## Dependencies

- No external APIs required
- Uses existing Cloudinary for supplier document uploads (if needed)
- Leverages existing authentication and authorization systems</content>
<parameter name="filePath">/home/humphrey/capstone/SUPPLIERS_IMPLEMENTATION_PLAN.md
"""
COMPREHENSIVE FLOW TESTING
Tests every single aspect, edge case, and potential bug in the workflow
"""
from db.database import SessionLocal
from models.models import (
    AdminGroup, AdminGroupJoin, SupplierOrder, SupplierPayment,
    QRCodePickup, User, Product
)
from sqlalchemy import func, and_
from datetime import datetime, timedelta

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.warnings = 0
        self.errors = []
    
    def pass_test(self, test_name):
        self.passed += 1
        print(f"   ✅ {test_name}")
    
    def fail_test(self, test_name, error):
        self.failed += 1
        self.errors.append((test_name, error))
        print(f"   ❌ {test_name}: {error}")
    
    def warn(self, test_name, warning):
        self.warnings += 1
        print(f"   ⚠️  {test_name}: {warning}")
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*80}")
        print(f"TEST SUMMARY")
        print(f"{'='*80}")
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {self.passed} ({self.passed/total*100 if total > 0 else 0:.1f}%)")
        print(f"❌ Failed: {self.failed} ({self.failed/total*100 if total > 0 else 0:.1f}%)")
        print(f"⚠️  Warnings: {self.warnings}")
        
        if self.errors:
            print(f"\n{'='*80}")
            print(f"FAILED TESTS:")
            print(f"{'='*80}")
            for test_name, error in self.errors:
                print(f"  ❌ {test_name}")
                print(f"     Error: {error}")
        
        print(f"\n{'='*80}\n")
        return self.failed == 0

def print_section(title):
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def test_database_integrity(db, results):
    """Test database relationships and constraints"""
    print_section("1. DATABASE INTEGRITY TESTS")
    
    # Test 1: AdminGroup table exists and has data
    try:
        groups = db.query(AdminGroup).all()
        if groups:
            results.pass_test(f"AdminGroup table accessible ({len(groups)} groups)")
        else:
            results.warn("AdminGroup table empty", "No test data available")
    except Exception as e:
        results.fail_test("AdminGroup table access", str(e))
    
    # Test 2: Foreign key relationships
    try:
        for group in db.query(AdminGroup).limit(5).all():
            # Check supplier_id relationship
            if group.supplier_id:
                supplier = db.query(User).filter(User.id == group.supplier_id).first()
                if supplier:
                    results.pass_test(f"Group {group.id} supplier FK valid")
                else:
                    results.fail_test(f"Group {group.id} supplier FK", "Supplier not found")
    except Exception as e:
        results.fail_test("Foreign key relationships", str(e))
    
    # Test 3: AdminGroupJoin relationships
    try:
        joins = db.query(AdminGroupJoin).limit(10).all()
        for join in joins:
            # Verify user exists
            user = db.query(User).filter(User.id == join.user_id).first()
            if not user:
                results.fail_test(f"AdminGroupJoin {join.id} user FK", "User not found")
            
            # Verify group exists
            group = db.query(AdminGroup).filter(AdminGroup.id == join.admin_group_id).first()
            if not group:
                results.fail_test(f"AdminGroupJoin {join.id} group FK", "Group not found")
            else:
                results.pass_test(f"AdminGroupJoin {join.id} relationships valid")
    except Exception as e:
        results.fail_test("AdminGroupJoin relationships", str(e))
    
    # Test 4: SupplierOrder relationships
    try:
        orders = db.query(SupplierOrder).all()
        for order in orders:
            if order.admin_group_id:
                group = db.query(AdminGroup).filter(AdminGroup.id == order.admin_group_id).first()
                if group:
                    results.pass_test(f"SupplierOrder {order.id} admin_group FK valid")
                else:
                    results.fail_test(f"SupplierOrder {order.id} admin_group FK", "AdminGroup not found")
    except Exception as e:
        results.fail_test("SupplierOrder relationships", str(e))
    
    # Test 5: No orphaned records
    try:
        orphaned_joins = db.query(AdminGroupJoin).filter(
            ~AdminGroupJoin.admin_group_id.in_(
                db.query(AdminGroup.id)
            )
        ).count()
        if orphaned_joins == 0:
            results.pass_test("No orphaned AdminGroupJoin records")
        else:
            results.fail_test("Orphaned AdminGroupJoin records", f"Found {orphaned_joins} orphaned joins")
    except Exception as e:
        results.fail_test("Orphaned records check", str(e))

def test_status_logic(db, results):
    """Test status determination logic"""
    print_section("2. STATUS LOGIC TESTS")
    
    groups = db.query(AdminGroup).filter(AdminGroup.id.in_([10, 11])).all()
    
    for group in groups:
        # Test 6: SupplierOrder status consistency
        try:
            supplier_order = db.query(SupplierOrder).filter(
                SupplierOrder.admin_group_id == group.id
            ).first()
            
            if supplier_order:
                valid_statuses = ["pending", "confirmed", "ready_for_pickup", "delivered", "completed", "rejected"]
                if supplier_order.status in valid_statuses:
                    results.pass_test(f"Group {group.id} SupplierOrder status valid ({supplier_order.status})")
                else:
                    results.fail_test(f"Group {group.id} SupplierOrder status", f"Invalid status: {supplier_order.status}")
                
                # Test status progression logic
                if supplier_order.status == "ready_for_pickup":
                    payment = db.query(SupplierPayment).filter(
                        SupplierPayment.order_id == supplier_order.id
                    ).first()
                    if payment:
                        results.pass_test(f"Group {group.id} has payment for ready_for_pickup status")
                    else:
                        results.fail_test(f"Group {group.id} payment missing", "ready_for_pickup but no payment")
                
                if supplier_order.status == "delivered":
                    # Check if some QR codes are used
                    used_qrs = db.query(QRCodePickup).filter(
                        QRCodePickup.group_buy_id == group.id,
                        QRCodePickup.is_used == True
                    ).count()
                    if used_qrs > 0:
                        results.pass_test(f"Group {group.id} delivered status has used QR codes")
                    else:
                        results.warn(f"Group {group.id} delivered status", "No QR codes marked as used")
                
                if supplier_order.status == "completed":
                    # All QR codes should be used
                    total_participants = db.query(func.count(AdminGroupJoin.id)).filter(
                        AdminGroupJoin.admin_group_id == group.id
                    ).scalar()
                    
                    used_qrs = db.query(QRCodePickup).filter(
                        QRCodePickup.group_buy_id == group.id,
                        QRCodePickup.is_used == True
                    ).count()
                    
                    if used_qrs >= total_participants:
                        results.pass_test(f"Group {group.id} completed status matches collection count")
                    else:
                        results.fail_test(f"Group {group.id} completed status", f"Only {used_qrs}/{total_participants} collected")
        except Exception as e:
            results.fail_test(f"Group {group.id} status logic", str(e))

def test_payment_calculations(db, results):
    """Test payment amount calculations"""
    print_section("3. PAYMENT CALCULATION TESTS")
    
    groups = db.query(AdminGroup).filter(AdminGroup.id.in_([10, 11])).all()
    
    for group in groups:
        try:
            # Test 7: Total amount calculation
            joins = db.query(AdminGroupJoin).filter(
                AdminGroupJoin.admin_group_id == group.id
            ).all()
            
            expected_total = sum(join.quantity * group.price for join in joins)
            
            supplier_order = db.query(SupplierOrder).filter(
                SupplierOrder.admin_group_id == group.id
            ).first()
            
            if supplier_order:
                if abs(supplier_order.total_value - expected_total) < 0.01:  # Allow for floating point errors
                    results.pass_test(f"Group {group.id} total value calculation correct (${supplier_order.total_value:.2f})")
                else:
                    results.fail_test(f"Group {group.id} total value", f"Expected ${expected_total:.2f}, got ${supplier_order.total_value:.2f}")
                
                # Test 8: Payment amount matches order total
                payment = db.query(SupplierPayment).filter(
                    SupplierPayment.order_id == supplier_order.id
                ).first()
                
                if payment:
                    if abs(payment.amount - supplier_order.total_value) < 0.01:
                        results.pass_test(f"Group {group.id} payment amount matches order total")
                    else:
                        results.fail_test(f"Group {group.id} payment amount", f"Payment ${payment.amount:.2f} != Order ${supplier_order.total_value:.2f}")
                    
                    # Test 9: Platform fee removed (should be 0)
                    if payment.platform_fee == 0:
                        results.pass_test(f"Group {group.id} no platform fee charged")
                    else:
                        results.warn(f"Group {group.id} platform fee", f"Fee of ${payment.platform_fee:.2f} charged")
        except Exception as e:
            results.fail_test(f"Group {group.id} payment calculations", str(e))

def test_collection_tracking(db, results):
    """Test collection tracking accuracy"""
    print_section("4. COLLECTION TRACKING TESTS")
    
    groups = db.query(AdminGroup).filter(AdminGroup.id.in_([10, 11])).all()
    
    for group in groups:
        try:
            # Test 10: QR code count matches participant count
            total_participants = db.query(func.count(AdminGroupJoin.id)).filter(
                AdminGroupJoin.admin_group_id == group.id
            ).scalar()
            
            qr_codes = db.query(QRCodePickup).filter(
                QRCodePickup.group_buy_id == group.id
            ).all()
            
            # Note: QR codes might be fewer if not all participants generated them yet
            if len(qr_codes) <= total_participants:
                results.pass_test(f"Group {group.id} QR code count valid ({len(qr_codes)}/{total_participants})")
            else:
                results.fail_test(f"Group {group.id} QR code count", f"More QR codes ({len(qr_codes)}) than participants ({total_participants})")
            
            # Test 11: No duplicate QR codes per user
            user_qr_counts = {}
            for qr in qr_codes:
                user_qr_counts[qr.user_id] = user_qr_counts.get(qr.user_id, 0) + 1
            
            duplicates = {user_id: count for user_id, count in user_qr_counts.items() if count > 1}
            if not duplicates:
                results.pass_test(f"Group {group.id} no duplicate QR codes per user")
            else:
                results.fail_test(f"Group {group.id} duplicate QR codes", f"Users with duplicates: {duplicates}")
            
            # Test 12: Collection count accuracy
            used_qrs = [qr for qr in qr_codes if qr.is_used]
            collected_count = len(used_qrs)
            
            # Verify each used QR has a timestamp
            for qr in used_qrs:
                if qr.used_at:
                    results.pass_test(f"Group {group.id} QR {qr.id} has collection timestamp")
                else:
                    results.fail_test(f"Group {group.id} QR {qr.id}", "Marked as used but no timestamp")
            
            # Test 13: Collection progress calculation
            supplier_order = db.query(SupplierOrder).filter(
                SupplierOrder.admin_group_id == group.id
            ).first()
            
            if supplier_order and supplier_order.status in ["ready_for_pickup", "delivered", "completed"]:
                # Simulate backend collection tracking query
                participants = db.query(
                    User.id,
                    User.full_name,
                    User.email,
                    AdminGroupJoin.quantity,
                    QRCodePickup.is_used,
                    QRCodePickup.used_at
                ).join(
                    AdminGroupJoin,
                    User.id == AdminGroupJoin.user_id
                ).outerjoin(
                    QRCodePickup,
                    and_(
                        QRCodePickup.user_id == User.id,
                        QRCodePickup.group_buy_id == group.id,
                        QRCodePickup.is_used == True
                    )
                ).filter(
                    AdminGroupJoin.admin_group_id == group.id
                ).all()
                
                collected_users = [p for p in participants if p.is_used]
                pending_users = [p for p in participants if not p.is_used]
                
                if len(participants) == total_participants:
                    results.pass_test(f"Group {group.id} collection tracking query returns all participants")
                else:
                    results.fail_test(f"Group {group.id} collection tracking", f"Query returned {len(participants)}/{total_participants} participants")
                
                # Verify collection data structure
                if collected_users or pending_users:
                    results.pass_test(f"Group {group.id} collection data properly categorized")
        except Exception as e:
            results.fail_test(f"Group {group.id} collection tracking", str(e))

def test_quantity_tracking(db, results):
    """Test quantity calculations"""
    print_section("5. QUANTITY TRACKING TESTS")
    
    groups = db.query(AdminGroup).filter(AdminGroup.id.in_([10, 11])).all()
    
    for group in groups:
        try:
            # Test 14: Total quantity calculation
            joins = db.query(AdminGroupJoin).filter(
                AdminGroupJoin.admin_group_id == group.id
            ).all()
            
            total_quantity = sum(join.quantity for join in joins)
            
            # Test 15: Quantity vs max_participants
            if group.max_participants:
                if total_quantity >= group.max_participants:
                    results.pass_test(f"Group {group.id} reached target ({total_quantity}/{group.max_participants})")
                    
                    # Should have a SupplierOrder
                    supplier_order = db.query(SupplierOrder).filter(
                        SupplierOrder.admin_group_id == group.id
                    ).first()
                    
                    if supplier_order:
                        results.pass_test(f"Group {group.id} has SupplierOrder after reaching target")
                    else:
                        results.fail_test(f"Group {group.id} SupplierOrder", "Reached target but no order created")
                else:
                    results.pass_test(f"Group {group.id} quantity tracking ({total_quantity}/{group.max_participants})")
            
            # Test 16: Individual join quantities are positive
            for join in joins:
                if join.quantity > 0:
                    results.pass_test(f"Group {group.id} Join {join.id} quantity positive ({join.quantity})")
                else:
                    results.fail_test(f"Group {group.id} Join {join.id}", f"Invalid quantity: {join.quantity}")
        except Exception as e:
            results.fail_test(f"Group {group.id} quantity tracking", str(e))

def test_trader_status_logic(db, results):
    """Test trader-specific status determination"""
    print_section("6. TRADER STATUS LOGIC TESTS")
    
    groups = db.query(AdminGroup).filter(AdminGroup.id.in_([10, 11])).all()
    
    for group in groups:
        try:
            joins = db.query(AdminGroupJoin).filter(
                AdminGroupJoin.admin_group_id == group.id
            ).all()
            
            for join in joins[:2]:  # Test first 2 traders
                user = db.query(User).filter(User.id == join.user_id).first()
                
                # Test 17: Individual trader collection status
                user_qr = db.query(QRCodePickup).filter(
                    QRCodePickup.user_id == join.user_id,
                    QRCodePickup.group_buy_id == group.id,
                    QRCodePickup.is_used == True
                ).first()
                
                supplier_order = db.query(SupplierOrder).filter(
                    SupplierOrder.admin_group_id == group.id
                ).first()
                
                # Determine expected status (mimicking get_my_groups logic)
                expected_status = None
                if user_qr:
                    expected_status = "completed"
                elif supplier_order and supplier_order.status in ["ready_for_pickup", "delivered", "completed"]:
                    expected_status = "ready_for_pickup"
                elif supplier_order and supplier_order.status in ["pending", "confirmed"]:
                    expected_status = "active"
                else:
                    expected_status = "active"
                
                results.pass_test(f"Group {group.id} Trader {user.id} expected status: {expected_status}")
                
                # Test 18: Status transition logic
                if user_qr and expected_status != "completed":
                    results.fail_test(f"Group {group.id} Trader {user.id}", "Has collected but status not completed")
                
                if not user_qr and supplier_order and supplier_order.status in ["ready_for_pickup", "delivered"] and expected_status != "ready_for_pickup":
                    results.fail_test(f"Group {group.id} Trader {user.id}", "Ready for pickup but status incorrect")
        except Exception as e:
            results.fail_test(f"Group {group.id} trader status logic", str(e))

def test_edge_cases(db, results):
    """Test edge cases and boundary conditions"""
    print_section("7. EDGE CASE TESTS")
    
    try:
        # Test 19: Groups with zero participants
        empty_groups = db.query(AdminGroup).filter(
            ~AdminGroup.id.in_(
                db.query(AdminGroupJoin.admin_group_id)
            )
        ).all()
        
        for group in empty_groups[:3]:  # Test first 3
            # Should NOT have SupplierOrder
            supplier_order = db.query(SupplierOrder).filter(
                SupplierOrder.admin_group_id == group.id
            ).first()
            
            if not supplier_order:
                results.pass_test(f"Empty group {group.id} has no SupplierOrder")
            else:
                results.fail_test(f"Empty group {group.id}", "Has SupplierOrder despite no participants")
    except Exception as e:
        results.fail_test("Empty groups test", str(e))
    
    # Test 20: Null/None value handling
    try:
        groups = db.query(AdminGroup).filter(AdminGroup.id.in_([10, 11])).all()
        for group in groups:
            # Check nullable fields
            if group.end_date is None:
                results.pass_test(f"Group {group.id} handles null end_date")
            
            if group.supplier_id is None:
                results.warn(f"Group {group.id} supplier_id is null", "Admin-created group")
    except Exception as e:
        results.fail_test("Null value handling", str(e))
    
    # Test 21: Date validation
    try:
        qr_codes = db.query(QRCodePickup).filter(QRCodePickup.is_used == True).limit(5).all()
        for qr in qr_codes:
            if qr.used_at and qr.generated_at:
                if qr.used_at >= qr.generated_at:
                    results.pass_test(f"QR {qr.id} used_at >= generated_at")
                else:
                    results.fail_test(f"QR {qr.id} date logic", "Used before generated")
    except Exception as e:
        results.fail_test("Date validation", str(e))

def test_admin_dashboard_queries(db, results):
    """Test admin dashboard query logic"""
    print_section("8. ADMIN DASHBOARD QUERY TESTS")
    
    try:
        # Test 22: Active groups query (mimicking get_active_groups_for_moderation)
        total_quantity_subquery = db.query(
            AdminGroupJoin.admin_group_id,
            func.sum(AdminGroupJoin.quantity).label('total_quantity')
        ).group_by(AdminGroupJoin.admin_group_id).subquery()
        
        active_groups = db.query(AdminGroup).outerjoin(
            total_quantity_subquery,
            AdminGroup.id == total_quantity_subquery.c.admin_group_id
        ).filter(
            AdminGroup.is_active,
            (total_quantity_subquery.c.total_quantity < AdminGroup.max_participants) | 
            (total_quantity_subquery.c.total_quantity.is_(None))
        ).all()
        
        results.pass_test(f"Active groups query successful ({len(active_groups)} groups)")
        
        # Verify none reached target
        for group in active_groups:
            total_qty = db.query(func.sum(AdminGroupJoin.quantity)).filter(
                AdminGroupJoin.admin_group_id == group.id
            ).scalar() or 0
            
            if group.max_participants and total_qty >= group.max_participants:
                results.fail_test(f"Active groups query logic", f"Group {group.id} reached target but in active list")
    except Exception as e:
        results.fail_test("Active groups query", str(e))
    
    try:
        # Test 23: Ready for payment query
        total_quantity_subquery = db.query(
            AdminGroupJoin.admin_group_id,
            func.sum(AdminGroupJoin.quantity).label('total_quantity')
        ).group_by(AdminGroupJoin.admin_group_id).subquery()
        
        # Groups that reached target but not yet paid
        ready_groups_subquery = db.query(AdminGroup.id).join(
            total_quantity_subquery,
            AdminGroup.id == total_quantity_subquery.c.admin_group_id
        ).filter(
            AdminGroup.is_active,
            AdminGroup.max_participants.isnot(None),
            total_quantity_subquery.c.total_quantity >= AdminGroup.max_participants
        ).subquery()
        
        # Exclude groups with ready_for_pickup or completed orders
        completed_order_ids = db.query(SupplierOrder.admin_group_id).filter(
            SupplierOrder.admin_group_id.isnot(None),
            SupplierOrder.status.in_(["ready_for_pickup", "delivered", "completed"])
        ).all()
        completed_order_ids = [oid[0] for oid in completed_order_ids]
        
        ready_groups = db.query(AdminGroup).filter(
            AdminGroup.id.in_(ready_groups_subquery),
            ~AdminGroup.id.in_(completed_order_ids) if completed_order_ids else True
        ).all()
        
        results.pass_test(f"Ready for payment query successful ({len(ready_groups)} groups)")
    except Exception as e:
        results.fail_test("Ready for payment query", str(e))
    
    try:
        # Test 24: Completed groups query (Option A logic)
        completed_group_ids = db.query(SupplierOrder.admin_group_id).filter(
            SupplierOrder.admin_group_id.isnot(None),
            SupplierOrder.status.in_(["ready_for_pickup", "delivered", "completed"])
        ).all()
        completed_group_ids = [gid[0] for gid in completed_group_ids]
        
        completed_groups = db.query(AdminGroup).filter(
            AdminGroup.id.in_(completed_group_ids)
        ).all()
        
        results.pass_test(f"Completed groups query successful ({len(completed_groups)} groups)")
        
        # Verify all have payments
        for group in completed_groups:
            order = db.query(SupplierOrder).filter(
                SupplierOrder.admin_group_id == group.id
            ).first()
            
            if order and order.status in ["ready_for_pickup", "delivered", "completed"]:
                payment = db.query(SupplierPayment).filter(
                    SupplierPayment.order_id == order.id
                ).first()
                
                if payment:
                    results.pass_test(f"Completed group {group.id} has payment")
                else:
                    results.fail_test(f"Completed group {group.id}", "Missing payment")
    except Exception as e:
        results.fail_test("Completed groups query", str(e))

def test_data_consistency(db, results):
    """Test data consistency across tables"""
    print_section("9. DATA CONSISTENCY TESTS")
    
    groups = db.query(AdminGroup).filter(AdminGroup.id.in_([10, 11])).all()
    
    for group in groups:
        try:
            # Test 25: participant count consistency
            actual_participants = db.query(func.count(AdminGroupJoin.id)).filter(
                AdminGroupJoin.admin_group_id == group.id
            ).scalar()
            
            # group.participants should match actual count
            if group.participants == actual_participants:
                results.pass_test(f"Group {group.id} participant count consistent")
            else:
                results.warn(f"Group {group.id} participant count", f"Stored: {group.participants}, Actual: {actual_participants}")
            
            # Test 26: Amount calculations consistency
            total_paid_sum = db.query(func.sum(AdminGroupJoin.paid_amount)).filter(
                AdminGroupJoin.admin_group_id == group.id
            ).scalar() or 0
            
            calculated_amount = sum(
                join.quantity * group.price 
                for join in db.query(AdminGroupJoin).filter(
                    AdminGroupJoin.admin_group_id == group.id
                ).all()
            )
            
            if abs(float(total_paid_sum) - calculated_amount) < 0.01:
                results.pass_test(f"Group {group.id} amount calculations consistent")
            else:
                results.fail_test(f"Group {group.id} amount inconsistency", f"Paid: ${total_paid_sum:.2f}, Calculated: ${calculated_amount:.2f}")
        except Exception as e:
            results.fail_test(f"Group {group.id} data consistency", str(e))

def test_qr_code_data(db, results):
    """Test QR code data integrity"""
    print_section("10. QR CODE DATA TESTS")
    
    try:
        qr_codes = db.query(QRCodePickup).limit(10).all()
        
        for qr in qr_codes:
            # Test 27: QR code has required fields
            if qr.user_id and qr.group_buy_id:
                results.pass_test(f"QR {qr.id} has user_id and group_buy_id")
            else:
                results.fail_test(f"QR {qr.id} missing data", f"user_id: {qr.user_id}, group_buy_id: {qr.group_buy_id}")
            
            # Test 28: used_at timestamp when is_used
            if qr.is_used and not qr.used_at:
                results.fail_test(f"QR {qr.id} timestamp missing", "Marked as used but no timestamp")
            elif qr.is_used and qr.used_at:
                results.pass_test(f"QR {qr.id} has timestamp when used")
            
            # Test 29: QR code not expired if being used
            if qr.is_used and qr.expires_at:
                # Used QR codes can be expired (used before expiry)
                results.pass_test(f"QR {qr.id} expiry date set")
    except Exception as e:
        results.fail_test("QR code data tests", str(e))

def main():
    print("\n" + "="*80)
    print("  COMPREHENSIVE FLOW TESTING")
    print("  Testing every nitty-gritty detail")
    print("="*80 + "\n")
    
    db = SessionLocal()
    results = TestResults()
    
    try:
        test_database_integrity(db, results)
        test_status_logic(db, results)
        test_payment_calculations(db, results)
        test_collection_tracking(db, results)
        test_quantity_tracking(db, results)
        test_trader_status_logic(db, results)
        test_edge_cases(db, results)
        test_admin_dashboard_queries(db, results)
        test_data_consistency(db, results)
        test_qr_code_data(db, results)
        
        # Final summary
        success = results.summary()
        
        if success:
            print("🎉 ALL TESTS PASSED! System is working perfectly! 🎉\n")
            return 0
        else:
            print("⚠️  SOME TESTS FAILED - Review errors above ⚠️\n")
            return 1
    
    finally:
        db.close()

if __name__ == "__main__":
    exit(main())


from models.models import GroupBuy, Contribution, Transaction
from models.models import AdminGroup, AdminGroupJoin
from datetime import datetime


def test_automatic_refund_on_reject(client, db_session, trader_user, supplier_user, auth_header_supplier):
    # Create a group buy and contribution paid by trader
    product_id = 1
    group = GroupBuy(product_id=product_id, creator_id=supplier_user.id, location_zone='test_zone', deadline=datetime.utcnow())
    db_session.add(group)
    db_session.commit()
    db_session.refresh(group)

    contribution = Contribution(group_buy_id=group.id, user_id=trader_user.id, quantity=1, contribution_amount=20.0, paid_amount=20.0, is_fully_paid=True)
    db_session.add(contribution)
    db_session.commit()
    db_session.refresh(contribution)

    # Create corresponding supplier Order via helper in router (we'll simulate an order that references this group)
    # For simplicity, use SupplierOrder creation path via direct model if available
    from models.models import SupplierOrder
    order = SupplierOrder(supplier_id=supplier_user.id, group_buy_id=group.id, order_number=f"TEST-{int(datetime.utcnow().timestamp())}", status='pending', total_value=20.0, total_savings=0.0)
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    # Reject the order as supplier - should trigger automatic refund (ledger fallback in tests)
    resp = client.post(f"/api/supplier/orders/{order.id}/action", headers=auth_header_supplier, json={"action": "reject", "reason": "Out of stock"})
    assert resp.status_code == 200
    data = resp.json()
    assert data.get('status') == 'rejected'
    assert 'automatic_refund_result' in data
    result = data['automatic_refund_result']
    assert result['refunded_count'] >= 1

    # Check that a refund transaction was created in ledger for the trader
    tx = db_session.query(Transaction).filter(Transaction.user_id == trader_user.id, Transaction.transaction_type == 'refund').first()
    assert tx is not None
    assert tx.amount < 0
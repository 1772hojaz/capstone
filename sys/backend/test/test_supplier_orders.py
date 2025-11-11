from datetime import datetime
from models.models import SupplierOrder


def test_confirm_ship_deliver_cycle(client, db_session, supplier_user, auth_header_supplier):
    # Create an order for the supplier
    order = SupplierOrder(
        supplier_id=supplier_user.id,
        order_number=f"TEST-ORD-{int(datetime.utcnow().timestamp())}",
        status="pending",
        total_value=100.0,
        total_savings=10.0
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    # Confirm order
    resp = client.post(f"/api/supplier/orders/{order.id}/action", headers=auth_header_supplier, json={"action": "confirm"})
    assert resp.status_code == 200
    assert resp.json().get('message') is not None

    # Mark shipped
    resp = client.post(f"/api/supplier/orders/{order.id}/ship", headers=auth_header_supplier, json={})
    assert resp.status_code == 200
    data = resp.json()
    assert data.get('message') == 'Order marked as shipped'

    db_session.refresh(order)
    assert order.status == 'shipped'
    assert order.shipped_at is not None

    # Mark delivered
    resp = client.post(f"/api/supplier/orders/{order.id}/deliver", headers=auth_header_supplier, json={})
    assert resp.status_code == 200
    assert resp.json().get('message') == 'Order marked as delivered'

    db_session.refresh(order)
    assert order.status == 'delivered'
    assert order.delivered_at is not None

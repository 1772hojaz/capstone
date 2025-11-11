import pytest
import requests
from payment.flutterwave_service import FlutterwaveService


class DummyResponse:
    def __init__(self, ok=True, json_data=None, status_code=200, text=''):
        self._json = json_data or {}
        self.ok = ok
        self.status_code = status_code
        self.text = text

    def json(self):
        return self._json


def test_refund_payment_success(monkeypatch):
    svc = FlutterwaveService()

    def fake_post(url, json, headers):
        return DummyResponse(ok=True, json_data={"status": "success", "data": {"id": "r_123"}})

    monkeypatch.setattr(requests, 'post', fake_post)

    result = svc.refund_payment('tx_123', amount=10.0)
    assert result.get('status') == 'success'
    assert 'data' in result


def test_get_refund_status(monkeypatch):
    svc = FlutterwaveService()

    def fake_get(url, headers):
        return DummyResponse(ok=True, json_data={"status": "success", "data": {"id": "r_123", "status": "completed"}})

    monkeypatch.setattr(requests, 'get', fake_get)

    result = svc.get_refund_status('r_123')
    assert result.get('status') == 'success'
    assert result['data']['status'] == 'completed'

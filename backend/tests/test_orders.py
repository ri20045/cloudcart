"""
Unit tests for Orders Lambda handler and service.
"""

import json
import os
import sys
import unittest
from pathlib import Path

# Setup sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Force local storage mode for isolated tests
os.environ["STORAGE_MODE"] = "local"

from db.client import reset_local_tables_for_testing
from handlers.orders_handler import lambda_handler


class TestOrdersHandler(unittest.TestCase):

    def setUp(self):
        reset_local_tables_for_testing()

    def _sample_order_payload(self):
        return {
            "customer": {
                "name": "Jane Doe",
                "email": "jane.doe@example.com",
                "address": "123 Serverless Way",
                "city": "Seattle",
                "postalCode": "98101",
                "country": "US"
            },
            "items": [
                {
                    "productId": "prod-001",
                    "quantity": 1
                },
                {
                    "productId": "prod-002",
                    "quantity": 2
                }
            ]
        }

    def test_cors_options(self):
        event = {"httpMethod": "OPTIONS", "path": "/orders"}
        res = lambda_handler(event, {})
        self.assertEqual(res["statusCode"], 200)
        self.assertEqual(res["headers"]["Access-Control-Allow-Origin"], "*")

    def test_create_order_success(self):
        payload = self._sample_order_payload()
        event = {
            "httpMethod": "POST",
            "path": "/orders",
            "body": json.dumps(payload)
        }
        res = lambda_handler(event, {})
        self.assertEqual(res["statusCode"], 201)
        order = json.loads(res["body"])

        self.assertTrue(order["orderId"].startswith("ord-"))
        self.assertEqual(order["status"], "PENDING")
        self.assertEqual(order["customer"]["name"], "Jane Doe")
        self.assertEqual(len(order["items"]), 2)

        # Expected subtotal = 249.99 * 1 + 129.50 * 2 = 249.99 + 259.00 = 508.99
        self.assertAlmostEqual(order["subtotal"], 508.99, places=2)
        # Expected tax = round(508.99 * 0.08, 2) = 40.72
        self.assertAlmostEqual(order["tax"], 40.72, places=2)
        # Expected total = 508.99 + 40.72 = 549.71
        self.assertAlmostEqual(order["total"], 549.71, places=2)

    def test_create_order_missing_customer_name(self):
        payload = self._sample_order_payload()
        payload["customer"]["name"] = ""
        event = {
            "httpMethod": "POST",
            "path": "/orders",
            "body": json.dumps(payload)
        }
        res = lambda_handler(event, {})
        self.assertEqual(res["statusCode"], 400)
        body = json.loads(res["body"])
        self.assertIn("error", body)
        self.assertIn("Customer 'name' is required", body["error"]["message"])

    def test_create_order_invalid_email(self):
        payload = self._sample_order_payload()
        payload["customer"]["email"] = "not-an-email"
        event = {
            "httpMethod": "POST",
            "path": "/orders",
            "body": json.dumps(payload)
        }
        res = lambda_handler(event, {})
        self.assertEqual(res["statusCode"], 400)
        body = json.loads(res["body"])
        self.assertIn("error", body)
        self.assertIn("email", body["error"]["message"].lower())

    def test_create_order_empty_items(self):
        payload = self._sample_order_payload()
        payload["items"] = []
        event = {
            "httpMethod": "POST",
            "path": "/orders",
            "body": json.dumps(payload)
        }
        res = lambda_handler(event, {})
        self.assertEqual(res["statusCode"], 400)

    def test_create_order_nonexistent_product(self):
        payload = self._sample_order_payload()
        payload["items"] = [{"productId": "prod-fake-999", "quantity": 1}]
        event = {
            "httpMethod": "POST",
            "path": "/orders",
            "body": json.dumps(payload)
        }
        res = lambda_handler(event, {})
        self.assertEqual(res["statusCode"], 404)

    def test_create_order_insufficient_stock(self):
        payload = self._sample_order_payload()
        payload["items"] = [{"productId": "prod-003", "quantity": 99999}]
        event = {
            "httpMethod": "POST",
            "path": "/orders",
            "body": json.dumps(payload)
        }
        res = lambda_handler(event, {})
        self.assertEqual(res["statusCode"], 400)
        body = json.loads(res["body"])
        self.assertIn("Insufficient stock", body["error"]["message"])

    def test_get_orders_list(self):
        # Create an order first
        self.test_create_order_success()

        event = {"httpMethod": "GET", "path": "/orders"}
        res = lambda_handler(event, {})
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertIn("orders", body)
        self.assertGreater(body["count"], 0)

    def test_get_order_by_id_and_patch_status(self):
        # 1. Create order
        create_res = lambda_handler({
            "httpMethod": "POST",
            "path": "/orders",
            "body": json.dumps(self._sample_order_payload())
        }, {})
        order = json.loads(create_res["body"])
        order_id = order["orderId"]

        # 2. Get order by ID
        get_res = lambda_handler({
            "httpMethod": "GET",
            "path": f"/orders/{order_id}",
            "pathParameters": {"id": order_id}
        }, {})
        self.assertEqual(get_res["statusCode"], 200)
        fetched = json.loads(get_res["body"])
        self.assertEqual(fetched["orderId"], order_id)
        self.assertEqual(fetched["status"], "PENDING")

        # 3. Patch status to PROCESSING
        patch_res = lambda_handler({
            "httpMethod": "PATCH",
            "path": f"/orders/{order_id}/status",
            "resource": "/orders/{id}/status",
            "pathParameters": {"id": order_id},
            "body": json.dumps({"status": "PROCESSING"})
        }, {})
        self.assertEqual(patch_res["statusCode"], 200)
        patch_body = json.loads(patch_res["body"])
        self.assertEqual(patch_body["order"]["status"], "PROCESSING")

        # 4. Patch with invalid status
        bad_patch = lambda_handler({
            "httpMethod": "PATCH",
            "path": f"/orders/{order_id}/status",
            "resource": "/orders/{id}/status",
            "pathParameters": {"id": order_id},
            "body": json.dumps({"status": "FLYING"})
        }, {})
        self.assertEqual(bad_patch["statusCode"], 400)


if __name__ == "__main__":
    unittest.main()

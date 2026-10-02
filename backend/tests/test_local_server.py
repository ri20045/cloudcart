"""
Integration test for CloudCart local server routing and Lambda adapter.
"""

import json
import os
import sys
import unittest
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

os.environ["STORAGE_MODE"] = "local"

from handlers.products_handler import lambda_handler as products_handler
from handlers.orders_handler import lambda_handler as orders_handler


class TestEndToEndApiFlow(unittest.TestCase):

    def test_full_shopping_flow(self):
        # 1. Fetch products
        res = products_handler({"httpMethod": "GET", "path": "/products"}, {})
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        products = body["products"]
        self.assertTrue(len(products) > 0)
        chosen_product = products[0]

        # 2. Fetch single product details
        res_detail = products_handler({
            "httpMethod": "GET",
            "path": f"/products/{chosen_product['productId']}",
            "pathParameters": {"id": chosen_product["productId"]}
        }, {})
        self.assertEqual(res_detail["statusCode"], 200)

        # 3. Create Order
        order_payload = {
            "customer": {
                "name": "Alex Mercer",
                "email": "alex.mercer@cloudcart.dev",
                "address": "456 Serverless Blvd",
                "city": "San Francisco",
                "postalCode": "94105",
                "country": "US"
            },
            "items": [
                {
                    "productId": chosen_product["productId"],
                    "quantity": 1
                }
            ]
        }
        res_order = orders_handler({
            "httpMethod": "POST",
            "path": "/orders",
            "body": json.dumps(order_payload)
        }, {})
        self.assertEqual(res_order["statusCode"], 201)
        created_order = json.loads(res_order["body"])
        order_id = created_order["orderId"]
        self.assertEqual(created_order["status"], "PENDING")

        # 4. Fetch Order List
        res_list = orders_handler({"httpMethod": "GET", "path": "/orders"}, {})
        self.assertEqual(res_list["statusCode"], 200)
        orders = json.loads(res_list["body"])["orders"]
        self.assertTrue(any(o["orderId"] == order_id for o in orders))

        # 5. Fetch Single Order by ID
        res_get = orders_handler({
            "httpMethod": "GET",
            "path": f"/orders/{order_id}",
            "pathParameters": {"id": order_id}
        }, {})
        self.assertEqual(res_get["statusCode"], 200)
        fetched_order = json.loads(res_get["body"])
        self.assertEqual(fetched_order["orderId"], order_id)

        # 6. PATCH Order Status: PENDING -> PROCESSING
        res_patch_1 = orders_handler({
            "httpMethod": "PATCH",
            "path": f"/orders/{order_id}/status",
            "resource": "/orders/{id}/status",
            "pathParameters": {"id": order_id},
            "body": json.dumps({"status": "PROCESSING"})
        }, {})
        self.assertEqual(res_patch_1["statusCode"], 200)
        self.assertEqual(json.loads(res_patch_1["body"])["order"]["status"], "PROCESSING")

        # 7. PATCH Order Status: PROCESSING -> SHIPPED
        res_patch_2 = orders_handler({
            "httpMethod": "PATCH",
            "path": f"/orders/{order_id}/status",
            "resource": "/orders/{id}/status",
            "pathParameters": {"id": order_id},
            "body": json.dumps({"status": "SHIPPED"})
        }, {})
        self.assertEqual(res_patch_2["statusCode"], 200)
        self.assertEqual(json.loads(res_patch_2["body"])["order"]["status"], "SHIPPED")

        # 8. PATCH Order Status: SHIPPED -> DELIVERED
        res_patch_3 = orders_handler({
            "httpMethod": "PATCH",
            "path": f"/orders/{order_id}/status",
            "resource": "/orders/{id}/status",
            "pathParameters": {"id": order_id},
            "body": json.dumps({"status": "DELIVERED"})
        }, {})
        self.assertEqual(res_patch_3["statusCode"], 200)
        self.assertEqual(json.loads(res_patch_3["body"])["order"]["status"], "DELIVERED")


if __name__ == "__main__":
    unittest.main()

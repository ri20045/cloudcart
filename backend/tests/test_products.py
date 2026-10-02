"""
Unit tests for Products Lambda handler and service.
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
from handlers.products_handler import lambda_handler


class TestProductsHandler(unittest.TestCase):

    def setUp(self):
        reset_local_tables_for_testing()

    def test_cors_options(self):
        event = {"httpMethod": "OPTIONS", "path": "/products"}
        res = lambda_handler(event, {})
        self.assertEqual(res["statusCode"], 200)
        self.assertEqual(res["headers"]["Access-Control-Allow-Origin"], "*")

    def test_list_products(self):
        event = {"httpMethod": "GET", "path": "/products"}
        res = lambda_handler(event, {})
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertIn("products", body)
        self.assertGreater(body["count"], 0)

    def test_filter_products_by_category(self):
        event = {
            "httpMethod": "GET",
            "path": "/products",
            "queryStringParameters": {"category": "Audio"}
        }
        res = lambda_handler(event, {})
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        for prod in body["products"]:
            self.assertEqual(prod["category"].lower(), "audio")

    def test_filter_products_by_search(self):
        event = {
            "httpMethod": "GET",
            "path": "/products",
            "queryStringParameters": {"search": "Headphones"}
        }
        res = lambda_handler(event, {})
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertTrue(any("Headphones" in p["name"] for p in body["products"]))

    def test_get_product_by_id_success(self):
        event = {
            "httpMethod": "GET",
            "path": "/products/prod-001",
            "pathParameters": {"id": "prod-001"}
        }
        res = lambda_handler(event, {})
        self.assertEqual(res["statusCode"], 200)
        product = json.loads(res["body"])
        self.assertEqual(product["productId"], "prod-001")
        self.assertIn("Apex", product["name"])

    def test_get_product_by_id_not_found(self):
        event = {
            "httpMethod": "GET",
            "path": "/products/prod-nonexistent",
            "pathParameters": {"id": "prod-nonexistent"}
        }
        res = lambda_handler(event, {})
        self.assertEqual(res["statusCode"], 404)
        body = json.loads(res["body"])
        self.assertIn("error", body)


if __name__ == "__main__":
    unittest.main()

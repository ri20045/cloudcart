#!/usr/bin/env python3
"""
Seed DynamoDB Products Table with sample catalog items.

Can be run:
1. Against AWS:
   AWS_REGION=us-east-1 PRODUCTS_TABLE=CloudCart-Products python seed_data.py
2. Against DynamoDB Local / LocalStack:
   DYNAMODB_ENDPOINT_URL=http://localhost:8000 python seed_data.py
3. Against local file store:
   STORAGE_MODE=local python seed_data.py
"""

import json
import os
import sys
from decimal import Decimal
from pathlib import Path

# Add backend directory to sys.path so modules can be imported
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from db.client import get_products_table


def convert_floats_to_decimals(obj):
    """
    Recursively converts float values to Decimal for DynamoDB boto3 compatibility.
    """
    if isinstance(obj, list):
        return [convert_floats_to_decimals(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_floats_to_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, float):
        return Decimal(str(obj))
    return obj


def seed_products():
    sample_file = backend_dir / "data" / "sample_products.json"
    if not sample_file.exists():
        print(f"[ERROR] Sample products file not found at: {sample_file}")
        sys.exit(1)

    with open(sample_file, "r", encoding="utf-8") as f:
        products = json.load(f)

    table = get_products_table()
    table_name = getattr(table, "name", getattr(table, "table_name", "ProductsTable"))
    print(f"[INFO] Seeding {len(products)} products into table: {table_name}...")

    count = 0
    for product in products:
        try:
            # Prepare item with Decimal conversion
            item = convert_floats_to_decimals(product)
            table.put_item(Item=item)
            count += 1
            print(f"  ✓ Added: [{product['productId']}] {product['name']} - ${product['price']:.2f}")
        except Exception as e:
            print(f"  ✗ Failed to add [{product.get('productId')}]: {str(e)}")

    print(f"\n[SUCCESS] Successfully seeded {count}/{len(products)} products.")


if __name__ == "__main__":
    seed_products()

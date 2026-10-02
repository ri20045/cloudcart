"""
DynamoDB Client Abstraction for CloudCart.

Supports:
1. Production AWS DynamoDB via standard boto3.resource('dynamodb')
2. DynamoDB Local / LocalStack via DYNAMODB_ENDPOINT_URL
3. Zero-dependency Local / In-Memory JSON persistence when boto3 is unavailable
   or STORAGE_MODE=local (ideal for local testing, demoing, and CI without AWS credentials).
"""

import json
import os
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Optional

PRODUCTS_TABLE_NAME = os.environ.get("PRODUCTS_TABLE", "CloudCart-Products")
ORDERS_TABLE_NAME = os.environ.get("ORDERS_TABLE", "CloudCart-Orders")
AWS_REGION = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))
DYNAMODB_ENDPOINT_URL = os.environ.get("DYNAMODB_ENDPOINT_URL")

# Try importing boto3
try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    ClientError = Exception


class LocalDynamoTable:
    """
    Local JSON-backed DynamoDB table simulator.
    Implements standard boto3 DynamoDB Table interface for:
    - get_item
    - put_item
    - scan
    - update_item
    - delete_item
    """
    def __init__(self, table_name: str, key_name: str, storage_file: Path):
        self.table_name = table_name
        self.key_name = key_name
        self.storage_file = storage_file
        self._data: Dict[str, Dict[str, Any]] = {}
        self._load()

    def _load(self):
        if self.storage_file.exists():
            try:
                with open(self.storage_file, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                    self._data = raw.get(self.table_name, {})
            except Exception:
                self._data = {}
        else:
            self._data = {}

    def _save(self):
        self.storage_file.parent.mkdir(parents=True, exist_ok=True)
        all_tables = {}
        if self.storage_file.exists():
            try:
                with open(self.storage_file, "r", encoding="utf-8") as f:
                    all_tables = json.load(f)
            except Exception:
                all_tables = {}
        all_tables[self.table_name] = self._data
        with open(self.storage_file, "w", encoding="utf-8") as f:
            json.dump(all_tables, f, indent=2)

    def get_item(self, Key: Dict[str, Any]) -> Dict[str, Any]:
        key_val = str(Key.get(self.key_name))
        item = self._data.get(key_val)
        if item is not None:
            return {"Item": json.loads(json.dumps(item))}
        return {}

    def put_item(self, Item: Dict[str, Any]) -> Dict[str, Any]:
        key_val = str(Item.get(self.key_name))
        # Ensure Decimal or float conversion for consistency
        clean_item = json.loads(json.dumps(Item, default=str))
        self._data[key_val] = clean_item
        self._save()
        return {"ResponseMetadata": {"HTTPStatusCode": 200}}

    def scan(self) -> Dict[str, Any]:
        items = list(self._data.values())
        return {"Items": json.loads(json.dumps(items)), "Count": len(items)}

    def update_item(
        self,
        Key: Dict[str, Any],
        UpdateExpression: str,
        ExpressionAttributeValues: Dict[str, Any],
        ExpressionAttributeNames: Optional[Dict[str, str]] = None,
        ReturnValues: str = "ALL_NEW"
    ) -> Dict[str, Any]:
        key_val = str(Key.get(self.key_name))
        item = self._data.get(key_val)
        if item is None:
            raise KeyError(f"Item not found with key {key_val}")

        # Basic parser for standard SET expressions like:
        # "SET #s = :s, #u = :u" or "SET orderStatus = :s"
        expr = UpdateExpression.strip()
        if expr.startswith("SET ") or expr.startswith("set "):
            assignments = expr[4:].split(",")
            for assignment in assignments:
                parts = assignment.strip().split("=")
                if len(parts) == 2:
                    raw_attr = parts[0].strip()
                    raw_val_key = parts[1].strip()

                    # Resolve alias attribute name if provided
                    attr_name = raw_attr
                    if ExpressionAttributeNames and raw_attr in ExpressionAttributeNames:
                        attr_name = ExpressionAttributeNames[raw_attr]

                    # Resolve attribute value
                    val = ExpressionAttributeValues.get(raw_val_key)
                    if isinstance(val, Decimal):
                        val = float(val)

                    item[attr_name] = val

        self._data[key_val] = item
        self._save()
        return {"Attributes": json.loads(json.dumps(item))}

    def delete_item(self, Key: Dict[str, Any]) -> Dict[str, Any]:
        key_val = str(Key.get(self.key_name))
        if key_val in self._data:
            del self._data[key_val]
            self._save()
        return {"ResponseMetadata": {"HTTPStatusCode": 200}}


# Singleton table references
_products_table = None
_orders_table = None


def get_dynamo_resource():
    """
    Initializes and returns boto3 DynamoDB resource.
    Supports local endpoint override via DYNAMODB_ENDPOINT_URL.
    """
    kwargs: Dict[str, Any] = {"region_name": AWS_REGION}
    if DYNAMODB_ENDPOINT_URL:
        kwargs["endpoint_url"] = DYNAMODB_ENDPOINT_URL
    return boto3.resource("dynamodb", **kwargs)


def get_products_table():
    """
    Returns the DynamoDB products table resource.
    """
    global _products_table
    if _products_table is not None:
        return _products_table

    storage_mode = os.environ.get("STORAGE_MODE", "auto").lower()

    if storage_mode != "local" and BOTO3_AVAILABLE and os.environ.get("AWS_EXECUTION_ENV"):
        # Running in real AWS Lambda
        dynamo = get_dynamo_resource()
        _products_table = dynamo.Table(PRODUCTS_TABLE_NAME)
    elif storage_mode != "local" and BOTO3_AVAILABLE and DYNAMODB_ENDPOINT_URL:
        # Running against LocalStack or DynamoDB Local
        dynamo = get_dynamo_resource()
        _products_table = dynamo.Table(PRODUCTS_TABLE_NAME)
    else:
        # Local mock table
        storage_path = Path(__file__).resolve().parent.parent / "data" / "local_storage.json"
        table = LocalDynamoTable(PRODUCTS_TABLE_NAME, "productId", storage_path)
        # Preload sample products if table is currently empty
        if not table._data:
            sample_file = Path(__file__).resolve().parent.parent / "data" / "sample_products.json"
            if sample_file.exists():
                with open(sample_file, "r", encoding="utf-8") as f:
                    samples = json.load(f)
                    for prod in samples:
                        table.put_item(prod)
        _products_table = table

    return _products_table


def get_orders_table():
    """
    Returns the DynamoDB orders table resource.
    """
    global _orders_table
    if _orders_table is not None:
        return _orders_table

    storage_mode = os.environ.get("STORAGE_MODE", "auto").lower()

    if storage_mode != "local" and BOTO3_AVAILABLE and os.environ.get("AWS_EXECUTION_ENV"):
        dynamo = get_dynamo_resource()
        _orders_table = dynamo.Table(ORDERS_TABLE_NAME)
    elif storage_mode != "local" and BOTO3_AVAILABLE and DYNAMODB_ENDPOINT_URL:
        dynamo = get_dynamo_resource()
        _orders_table = dynamo.Table(ORDERS_TABLE_NAME)
    else:
        storage_path = Path(__file__).resolve().parent.parent / "data" / "local_storage.json"
        _orders_table = LocalDynamoTable(ORDERS_TABLE_NAME, "orderId", storage_path)

    return _orders_table


def reset_local_tables_for_testing():
    """
    Utility helper for test suites to reset in-memory state.
    """
    global _products_table, _orders_table
    _products_table = None
    _orders_table = None

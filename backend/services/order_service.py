"""
Order business logic service.
Handles order creation, authoritative price and tax calculation,
inventory stock verification/deduction, order retrieval, and status updates.
"""

import datetime
import uuid
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

from db.client import get_orders_table, get_products_table


class OrderServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class OrderService:
    def __init__(self, orders_table=None, products_table=None):
        self.orders_table = orders_table or get_orders_table()
        self.products_table = products_table or get_products_table()
        self.tax_rate = Decimal("0.08")  # 8% sales tax

    def create_order(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a new order statelessly:
        1. Validates each product exists in the DB.
        2. Validates and enforces available inventory stock.
        3. Authoritatively calculates subtotal, tax, and total (ignoring any client-supplied prices).
        4. Deducts purchased quantity from product inventory.
        5. Persists order with initial PENDING status.
        """
        customer = payload.get("customer", {})
        raw_items = payload.get("items", [])

        # Step 1 & 2: Validate products and inventory
        verified_items: List[Dict[str, Any]] = []
        subtotal = Decimal("0.00")

        # Track products to update stock after all are verified
        products_to_update: List[Tuple[Dict[str, Any], int]] = []

        for item in raw_items:
            product_id = item["productId"]
            requested_qty = int(item["quantity"])

            prod_res = self.products_table.get_item(Key={"productId": product_id})
            product = prod_res.get("Item")

            if not product:
                raise OrderServiceError(f"Product with ID '{product_id}' was not found.", status_code=404)

            current_stock = int(product.get("stock", 0))
            if current_stock < requested_qty:
                product_name = product.get("name", product_id)
                raise OrderServiceError(
                    f"Insufficient stock for '{product_name}'. Requested: {requested_qty}, Available: {current_stock}",
                    status_code=400
                )

            # Authoritative price from database
            price = Decimal(str(product["price"]))
            item_subtotal = round(price * requested_qty, 2)
            subtotal += item_subtotal

            verified_items.append({
                "productId": product_id,
                "name": product.get("name", "Unknown Product"),
                "price": float(price),
                "quantity": requested_qty,
                "subtotal": float(item_subtotal),
                "imageUrl": product.get("imageUrl", "")
            })

            products_to_update.append((product, requested_qty))

        # Calculate tax and total
        tax = round(subtotal * self.tax_rate, 2)
        total = round(subtotal + tax, 2)

        # Deduct inventory stock
        for prod, qty in products_to_update:
            new_stock = int(prod.get("stock", 0)) - qty
            try:
                self.products_table.update_item(
                    Key={"productId": prod["productId"]},
                    UpdateExpression="SET stock = :s",
                    ExpressionAttributeValues={":s": new_stock}
                )
            except Exception:
                # If using local table or basic update
                prod["stock"] = new_stock
                self.products_table.put_item(Item=prod)

        # Generate unique order ID and timestamps
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        order_id = f"ord-{uuid.uuid4().hex[:10]}"

        order_record: Dict[str, Any] = {
            "orderId": order_id,
            "customer": {
                "name": customer.get("name", "").strip(),
                "email": customer.get("email", "").strip(),
                "address": customer.get("address", "").strip(),
                "city": customer.get("city", "").strip(),
                "postalCode": customer.get("postalCode", "").strip(),
                "country": customer.get("country", "US").strip(),
            },
            "items": verified_items,
            "subtotal": float(subtotal),
            "tax": float(tax),
            "total": float(total),
            "status": "PENDING",
            "createdAt": now_iso,
            "updatedAt": now_iso,
        }

        # Save order into DynamoDB
        self.orders_table.put_item(Item=order_record)
        return order_record

    def list_orders(self) -> List[Dict[str, Any]]:
        """
        Retrieves all orders sorted by createdAt descending.
        """
        res = self.orders_table.scan()
        orders = res.get("Items", [])
        # Sort newest first
        orders.sort(key=lambda o: o.get("createdAt", ""), reverse=True)
        return orders

    def get_order_by_id(self, order_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a single order by orderId.
        """
        if not order_id or not isinstance(order_id, str):
            return None

        res = self.orders_table.get_item(Key={"orderId": order_id.strip()})
        return res.get("Item")

    def update_order_status(self, order_id: str, new_status: str) -> Dict[str, Any]:
        """
        Updates the status of an existing order and sets updatedAt timestamp.
        """
        existing = self.get_order_by_id(order_id)
        if not existing:
            raise OrderServiceError(f"Order '{order_id}' was not found.", status_code=404)

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Update in DynamoDB
        try:
            res = self.orders_table.update_item(
                Key={"orderId": order_id.strip()},
                UpdateExpression="SET #s = :status, updatedAt = :updatedAt",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={
                    ":status": new_status,
                    ":updatedAt": now_iso
                },
                ReturnValues="ALL_NEW"
            )
            return res.get("Attributes", {})
        except Exception:
            # Fallback for mock or simpler clients
            existing["status"] = new_status
            existing["updatedAt"] = now_iso
            self.orders_table.put_item(Item=existing)
            return existing

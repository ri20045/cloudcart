"""
Request payload validation utilities for CloudCart API.
Pure Python validation with descriptive error messages.
"""

import re
from typing import Any, Dict, List, Optional, Tuple

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

VALID_ORDER_STATUSES = {
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
}

# State transition validation (optional logical progression)
ALLOWED_STATUS_TRANSITIONS = {
    "PENDING": {"PROCESSING", "CANCELLED"},
    "PROCESSING": {"SHIPPED", "CANCELLED"},
    "SHIPPED": {"DELIVERED", "CANCELLED"},
    "DELIVERED": set(),  # Terminal state
    "CANCELLED": set(),  # Terminal state
}


def validate_order_payload(data: Any) -> Tuple[bool, Optional[str]]:
    """
    Validates the POST /orders request payload.
    Returns (is_valid, error_message).
    """
    if not isinstance(data, dict):
        return False, "Request body must be a JSON object"

    # Validate customer details
    customer = data.get("customer")
    if not customer or not isinstance(customer, dict):
        return False, "Field 'customer' is required and must be an object"

    name = customer.get("name")
    if not name or not isinstance(name, str) or not name.strip():
        return False, "Customer 'name' is required"
    if len(name.strip()) < 2:
        return False, "Customer 'name' must be at least 2 characters long"

    email = customer.get("email")
    if not email or not isinstance(email, str) or not EMAIL_REGEX.match(email.strip()):
        return False, "A valid customer 'email' is required"

    address = customer.get("address")
    if not address or not isinstance(address, str) or not address.strip():
        return False, "Customer 'address' is required"

    city = customer.get("city")
    if not city or not isinstance(city, str) or not city.strip():
        return False, "Customer 'city' is required"

    postal_code = customer.get("postalCode")
    if not postal_code or not isinstance(postal_code, str) or not postal_code.strip():
        return False, "Customer 'postalCode' is required"

    # Validate items
    items = data.get("items")
    if not items or not isinstance(items, list) or len(items) == 0:
        return False, "Order must contain at least one item in 'items' list"

    for idx, item in enumerate(items):
        if not isinstance(item, dict):
            return False, f"Item at index {idx} must be an object"

        product_id = item.get("productId")
        if not product_id or not isinstance(product_id, str) or not product_id.strip():
            return False, f"Item at index {idx} must have a valid 'productId'"

        quantity = item.get("quantity")
        if quantity is None or not isinstance(quantity, int) or quantity < 1:
            return False, f"Item '{product_id}' must have an integer 'quantity' of at least 1"

    return True, None


def validate_status_update(data: Any) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validates PATCH /orders/{id}/status payload.
    Returns (is_valid, error_message, new_status).
    """
    if not isinstance(data, dict):
        return False, "Request body must be a JSON object", None

    status = data.get("status")
    if not status or not isinstance(status, str):
        return False, "Field 'status' is required and must be a string", None

    normalized_status = status.strip().upper()
    if normalized_status not in VALID_ORDER_STATUSES:
        allowed = ", ".join(sorted(VALID_ORDER_STATUSES))
        return False, f"Invalid status '{status}'. Allowed statuses are: {allowed}", None

    return True, None, normalized_status

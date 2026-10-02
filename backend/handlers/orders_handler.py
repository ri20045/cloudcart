"""
AWS Lambda Handler for Order Endpoints.

Routes handled:
- POST /orders
- GET /orders
- GET /orders/{id}
- PATCH /orders/{id}/status
- OPTIONS /orders
- OPTIONS /orders/{id}
- OPTIONS /orders/{id}/status
"""

import json
from typing import Any, Dict

from services.order_service import OrderService, OrderServiceError
from utils.response import build_response, error_response, success_response
from utils.validator import validate_order_payload, validate_status_update

order_service = OrderService()


def parse_body(event: Dict[str, Any]) -> Any:
    """Safely decodes and parses JSON body from API Gateway event."""
    body = event.get("body")
    if not body:
        return {}
    if isinstance(body, dict):
        return body
    try:
        return json.loads(body)
    except Exception:
        raise ValueError("Invalid JSON in request body")


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda proxy integration entrypoint for Orders.
    """
    http_method = event.get("httpMethod", "GET").upper()
    path = event.get("path", "")
    resource = event.get("resource", "")
    path_params = event.get("pathParameters") or {}

    # Handle CORS preflight
    if http_method == "OPTIONS":
        return build_response(200, None)

    order_id = path_params.get("id") or path_params.get("orderId")
    is_status_route = "/status" in path or "/status" in resource

    try:
        # Route 1: PATCH /orders/{id}/status
        if http_method == "PATCH" and order_id and is_status_route:
            try:
                body = parse_body(event)
            except ValueError as e:
                return error_response(str(e), status_code=400)

            is_valid, err_msg, new_status = validate_status_update(body)
            if not is_valid:
                return error_response(err_msg, status_code=400)

            try:
                updated_order = order_service.update_order_status(order_id, new_status)
                return success_response({
                    "message": f"Order status updated to {new_status}",
                    "order": updated_order
                }, status_code=200)
            except OrderServiceError as ose:
                return error_response(ose.message, status_code=ose.status_code)

        # Route 2: GET /orders/{id}
        if http_method == "GET" and order_id and not is_status_route:
            order = order_service.get_order_by_id(order_id)
            if not order:
                return error_response(f"Order '{order_id}' not found", status_code=404)
            return success_response(order, status_code=200)

        # Route 3: POST /orders
        if http_method == "POST" and not order_id:
            try:
                body = parse_body(event)
            except ValueError as e:
                return error_response(str(e), status_code=400)

            is_valid, err_msg = validate_order_payload(body)
            if not is_valid:
                return error_response(err_msg, status_code=400)

            try:
                new_order = order_service.create_order(body)
                return success_response(new_order, status_code=201)
            except OrderServiceError as ose:
                return error_response(ose.message, status_code=ose.status_code)

        # Route 4: GET /orders
        if http_method == "GET" and not order_id:
            orders = order_service.list_orders()
            return success_response({
                "orders": orders,
                "count": len(orders)
            }, status_code=200)

        return error_response(f"Route not found: {http_method} {path}", status_code=404)

    except Exception as e:
        return error_response(f"Internal server error: {str(e)}", status_code=500)

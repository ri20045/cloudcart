#!/usr/bin/env python3
"""
CloudCart Local Development Server.

Simulates AWS API Gateway + Lambda locally using Python's standard library http.server.
Routes all REST requests to the exact same Lambda handlers used in AWS.

Usage:
    python local_server.py
    PORT=5000 python local_server.py
"""

import json
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

# Ensure backend root is on Python sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from handlers.orders_handler import lambda_handler as orders_lambda_handler
from handlers.products_handler import lambda_handler as products_lambda_handler


class ApiGatewaySimulatorHandler(BaseHTTPRequestHandler):
    """
    HTTP Request Handler simulating AWS API Gateway HTTP/REST proxy integration.
    """

    def _send_gateway_response(self, response_dict: dict):
        status_code = response_dict.get("statusCode", 200)
        headers = response_dict.get("headers", {})
        body = response_dict.get("body", "")

        self.send_response(status_code)
        for k, v in headers.items():
            self.send_header(k, v)
        self.end_headers()

        if body:
            self.wfile.write(body.encode("utf-8"))

    def do_OPTIONS(self):
        """Respond to CORS preflight."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token")
        self.end_headers()

    def do_GET(self):
        self._dispatch("GET")

    def do_POST(self):
        self._dispatch("POST")

    def do_PATCH(self):
        self._dispatch("PATCH")

    def do_PUT(self):
        self._dispatch("PUT")

    def do_DELETE(self):
        self._dispatch("DELETE")

    def _dispatch(self, method: str):
        parsed_url = urlparse(self.path)
        path = parsed_url.path.rstrip("/")
        if not path:
            path = "/"

        # Parse query string parameters
        raw_qs = parse_qs(parsed_url.query)
        qs_params = {k: v[0] if len(v) == 1 else v for k, v in raw_qs.items()} if raw_qs else None

        # Read request body if present
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else ""

        # Route matching patterns:
        # /products
        # /products/{id}
        # /orders
        # /orders/{id}
        # /orders/{id}/status

        product_match = re.match(r"^/products(?:/([^/]+))?$", path)
        order_status_match = re.match(r"^/orders/([^/]+)/status$", path)
        order_match = re.match(r"^/orders(?:/([^/]+))?$", path)

        if order_status_match:
            order_id = order_status_match.group(1)
            event = {
                "httpMethod": method,
                "path": path,
                "resource": "/orders/{id}/status",
                "pathParameters": {"id": order_id, "orderId": order_id},
                "queryStringParameters": qs_params,
                "headers": dict(self.headers),
                "body": body,
            }
            res = orders_lambda_handler(event, {})
            self._send_gateway_response(res)
            return

        if order_match:
            order_id = order_match.group(1)
            path_params = {"id": order_id, "orderId": order_id} if order_id else None
            resource = "/orders/{id}" if order_id else "/orders"
            event = {
                "httpMethod": method,
                "path": path,
                "resource": resource,
                "pathParameters": path_params,
                "queryStringParameters": qs_params,
                "headers": dict(self.headers),
                "body": body,
            }
            res = orders_lambda_handler(event, {})
            self._send_gateway_response(res)
            return

        if product_match:
            prod_id = product_match.group(1)
            path_params = {"id": prod_id, "productId": prod_id} if prod_id else None
            resource = "/products/{id}" if prod_id else "/products"
            event = {
                "httpMethod": method,
                "path": path,
                "resource": resource,
                "pathParameters": path_params,
                "queryStringParameters": qs_params,
                "headers": dict(self.headers),
                "body": body,
            }
            res = products_lambda_handler(event, {})
            self._send_gateway_response(res)
            return

        # Fallback 404
        self._send_gateway_response({
            "statusCode": 404,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": {"message": f"Cannot {method} {path}", "statusCode": 404}}),
        })

    def log_message(self, format, *args):
        # Format clean console logs
        sys.stdout.write(f"[LocalGateway] {self.address_string()} - {args[0]} - {args[1]} {args[2]}\n")


class ReusableHTTPServer(HTTPServer):
    allow_reuse_address = True


def run(port: int = 5001):
    current_port = port
    httpd = None

    # Try requested port, with automatic fallback if macOS AirPlay or another service holds it
    for attempt in range(5):
        try:
            server_address = ("0.0.0.0", current_port)
            httpd = ReusableHTTPServer(server_address, ApiGatewaySimulatorHandler)
            break
        except OSError as e:
            if e.errno == 48: # Address already in use
                print(f"[NOTE] Port {current_port} is already in use (common on macOS due to AirPlay on 5000).")
                current_port += 1
                print(f"[INFO] Trying port {current_port} instead...")
            else:
                raise e

    if not httpd:
        print(f"[ERROR] Could not bind to an available port. Exiting.")
        sys.exit(1)

    print(f"\n=======================================================")
    print(f" CloudCart Local API Gateway + Lambda Simulator")
    print(f" Listening on http://localhost:{current_port}")
    print(f"=======================================================")
    print(f" Endpoints:")
    print(f"   GET    http://localhost:{current_port}/products")
    print(f"   GET    http://localhost:{current_port}/products/{{id}}")
    print(f"   POST   http://localhost:{current_port}/orders")
    print(f"   GET    http://localhost:{current_port}/orders")
    print(f"   GET    http://localhost:{current_port}/orders/{{id}}")
    print(f"   PATCH  http://localhost:{current_port}/orders/{{id}}/status")
    print(f"=======================================================\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    run(port)

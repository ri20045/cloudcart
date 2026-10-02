"""
AWS Lambda Handler for Product Endpoints.

Routes handled:
- GET /products
- GET /products/{id}
- OPTIONS /products
- OPTIONS /products/{id}
"""

import json
from typing import Any, Dict

from services.product_service import ProductService
from utils.response import build_response, error_response, success_response

product_service = ProductService()


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda proxy integration entrypoint for Products.
    """
    http_method = event.get("httpMethod", "GET").upper()
    path = event.get("path", "")
    path_params = event.get("pathParameters") or {}
    query_params = event.get("queryStringParameters") or {}

    # Handle CORS preflight
    if http_method == "OPTIONS":
        return build_response(200, None)

    try:
        # Route: GET /products/{id}
        product_id = path_params.get("id") or path_params.get("productId")
        if product_id:
            if http_method == "GET":
                product = product_service.get_product_by_id(product_id)
                if not product:
                    return error_response(f"Product '{product_id}' not found", status_code=404)
                return success_response(product, status_code=200)
            else:
                return error_response(f"Method {http_method} not allowed on /products/{{id}}", status_code=405)

        # Route: GET /products
        if http_method == "GET":
            category = query_params.get("category")
            search = query_params.get("search")
            products = product_service.list_products(category=category, search=search)
            return success_response({
                "products": products,
                "count": len(products)
            }, status_code=200)

        return error_response(f"Unsupported method {http_method}", status_code=405)

    except Exception as e:
        # Unexpected server-side error
        return error_response(f"Internal server error: {str(e)}", status_code=500)

"""
API Gateway HTTP response helper utilities.
Formats responses into standard API Gateway proxy integration JSON with CORS headers
and custom JSON serialization for DynamoDB Decimal types.
"""

import json
from decimal import Decimal
from typing import Any, Dict, Optional


class DecimalEncoder(json.JSONEncoder):
    """
    JSON encoder that converts DynamoDB Decimal instances to float or int.
    boto3 returns numerical attributes as Decimal, which is not JSON-serializable by default.
    """
    def default(self, obj: Any) -> Any:
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


# Common CORS headers required for browser cross-origin requests
CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
}


def build_response(status_code: int, body: Any, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Builds a standard API Gateway proxy response.
    """
    response_headers = CORS_HEADERS.copy()
    if headers:
        response_headers.update(headers)

    return {
        "statusCode": status_code,
        "headers": response_headers,
        "body": json.dumps(body, cls=DecimalEncoder) if body is not None else "",
    }


def success_response(data: Any, status_code: int = 200) -> Dict[str, Any]:
    """
    Standard successful JSON response.
    """
    return build_response(status_code=status_code, body=data)


def error_response(message: str, status_code: int = 400, details: Optional[Any] = None) -> Dict[str, Any]:
    """
    Standardized error response payload.
    """
    error_body: Dict[str, Any] = {
        "error": {
            "message": message,
            "statusCode": status_code
        }
    }
    if details:
        error_body["error"]["details"] = details

    return build_response(status_code=status_code, body=error_body)

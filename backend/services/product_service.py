"""
Product business logic service.
Handles product retrieval, category filtering, search, and stock verification.
"""

from typing import Any, Dict, List, Optional
from db.client import get_products_table


class ProductService:
    def __init__(self, table=None):
        self.table = table or get_products_table()

    def list_products(
        self,
        category: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves all products with optional category and search filtering.
        Stateless scan and in-memory filter.
        """
        response = self.table.scan()
        products = response.get("Items", [])

        # Filter by category if requested
        if category and category.strip():
            target_cat = category.strip().lower()
            products = [
                p for p in products
                if str(p.get("category", "")).lower() == target_cat
            ]

        # Filter by search keyword if requested
        if search and search.strip():
            query = search.strip().lower()
            products = [
                p for p in products
                if query in str(p.get("name", "")).lower()
                or query in str(p.get("description", "")).lower()
            ]

        # Sort predictably by productId
        products.sort(key=lambda p: p.get("productId", ""))
        return products

    def get_product_by_id(self, product_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches a single product by its unique productId.
        Returns None if not found.
        """
        if not product_id or not isinstance(product_id, str):
            return None

        response = self.table.get_item(Key={"productId": product_id.strip()})
        return response.get("Item")

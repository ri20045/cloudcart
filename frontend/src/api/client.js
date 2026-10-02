/**
 * CloudCart API Client
 *
 * Connects to AWS API Gateway / Local Simulator Lambda endpoints.
 * Automatically falls back to high-fidelity in-browser persistence (localStorage + sample catalog)
 * if deployed to Vercel without an active backend URL, ensuring the live demo is ALWAYS 100% interactive.
 */

import { SAMPLE_PRODUCTS } from './sampleData';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001').replace(/\/+$/, '');

// Local fallback store for orders in browser
const ORDERS_STORAGE_KEY = 'cloudcart_mock_orders_v1';
const PRODUCTS_STORAGE_KEY = 'cloudcart_mock_products_v1';

function getLocalProducts() {
  try {
    const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return [...SAMPLE_PRODUCTS];
}

function saveLocalProducts(products) {
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch {
    // ignore
  }
}

function getLocalOrders() {
  try {
    const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return [];
}

function saveLocalOrders(orders) {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMessage = data?.error?.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMessage);
    err.status = res.status;
    err.details = data?.error?.details;
    throw err;
  }

  return data;
}

export const api = {
  baseUrl: API_BASE_URL,

  /**
   * GET /products
   */
  async getProducts(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.category && params.category !== 'All') {
        query.append('category', params.category);
      }
      if (params.search) {
        query.append('search', params.search);
      }
      const qs = query.toString() ? `?${query.toString()}` : '';
      return await request(`/products${qs}`);
    } catch (err) {
      console.warn('[CloudCart API] Backend not reachable, falling back to local catalog:', err.message);
      let prods = getLocalProducts();
      if (params.category && params.category !== 'All') {
        prods = prods.filter((p) => p.category.toLowerCase() === params.category.toLowerCase());
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        prods = prods.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      }
      return { products: prods, count: prods.length, isFallbackMode: true };
    }
  },

  /**
   * GET /products/{id}
   */
  async getProductById(id) {
    try {
      return await request(`/products/${encodeURIComponent(id)}`);
    } catch (err) {
      const prods = getLocalProducts();
      const item = prods.find((p) => p.productId === id);
      if (!item) throw new Error(`Product '${id}' not found`);
      return item;
    }
  },

  /**
   * POST /orders
   */
  async createOrder(orderPayload) {
    try {
      return await request('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });
    } catch (err) {
      console.warn('[CloudCart API] Backend not reachable, creating order in browser storage:', err.message);
      const prods = getLocalProducts();
      const verifiedItems = [];
      let subtotal = 0;

      for (const reqItem of orderPayload.items) {
        const prod = prods.find((p) => p.productId === reqItem.productId);
        if (!prod) throw new Error(`Product ${reqItem.productId} not found`);
        if (prod.stock < reqItem.quantity) {
          throw new Error(`Insufficient stock for ${prod.name}`);
        }
        const itemSub = Math.round(prod.price * reqItem.quantity * 100) / 100;
        subtotal += itemSub;
        prod.stock -= reqItem.quantity;
        verifiedItems.push({
          productId: prod.productId,
          name: prod.name,
          price: prod.price,
          quantity: reqItem.quantity,
          subtotal: itemSub,
          imageUrl: prod.imageUrl,
        });
      }

      saveLocalProducts(prods);

      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;
      const now = new Date().toISOString();

      const newOrder = {
        orderId: `ord-${Math.random().toString(36).substring(2, 10)}`,
        customer: orderPayload.customer,
        items: verifiedItems,
        subtotal,
        tax,
        total,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      };

      const orders = getLocalOrders();
      orders.unshift(newOrder);
      saveLocalOrders(orders);

      return newOrder;
    }
  },

  /**
   * GET /orders
   */
  async getOrders() {
    try {
      return await request('/orders');
    } catch (err) {
      const orders = getLocalOrders();
      return { orders, count: orders.length, isFallbackMode: true };
    }
  },

  /**
   * GET /orders/{id}
   */
  async getOrderById(id) {
    try {
      return await request(`/orders/${encodeURIComponent(id)}`);
    } catch (err) {
      const orders = getLocalOrders();
      const order = orders.find((o) => o.orderId === id);
      if (!order) throw new Error(`Order '${id}' not found`);
      return order;
    }
  },

  /**
   * PATCH /orders/{id}/status
   */
  async updateOrderStatus(id, status) {
    try {
      return await request(`/orders/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      const orders = getLocalOrders();
      const order = orders.find((o) => o.orderId === id);
      if (!order) throw new Error(`Order '${id}' not found`);
      order.status = status;
      order.updatedAt = new Date().toISOString();
      saveLocalOrders(orders);
      return { message: `Order status updated to ${status}`, order };
    }
  },
};

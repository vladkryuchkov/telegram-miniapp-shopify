import { storefront, QUERIES } from "../../lib/shopify";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { action, cartId, merchandiseId, quantity } = req.body || {};
      if (action === "create") {
        const data = await storefront(QUERIES.CART_CREATE, { lines: [] });
        return res.status(200).json(data.data.cartCreate.cart);
      }
      if (action === "add") {
        if (!cartId) return res.status(400).json({ error: "Missing cartId" });
        const lines = [{ merchandiseId, quantity: quantity || 1 }];
        const data = await storefront(QUERIES.CART_LINES_ADD, { cartId, lines });
        return res.status(200).json(data.data.cartLinesAdd.cart);
      }
      return res.status(400).json({ error: "Unknown action" });
    }
    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}

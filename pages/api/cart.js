import { storefront, QUERIES } from "../../lib/shopify";

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { action } = req.body || {};

    if (action === "create") {
      const data = await storefront(QUERIES.CART_CREATE, { lines: [] });
      return res.status(200).json(data.data.cartCreate.cart);
    }

    if (action === "add") {
      const { cartId, merchandiseId, quantity } = req.body || {};
      if (!cartId || !merchandiseId) return res.status(400).json({ error: "Missing cartId or merchandiseId" });
      const lines = [{ merchandiseId, quantity: quantity || 1 }];
      const data = await storefront(QUERIES.CART_LINES_ADD, { cartId, lines });
      return res.status(200).json(data.data.cartLinesAdd.cart);
    }

    if (action === "get") {
      const { cartId } = req.body || {};
      if (!cartId) return res.status(400).json({ error: "Missing cartId" });
      const data = await storefront(QUERIES.CART_QUERY, { id: cartId });
      return res.status(200).json(data.data.cart);
    }

    if (action === "update") {
      const { cartId, lineId, quantity } = req.body || {};
      if (!cartId || !lineId || typeof quantity !== "number")
        return res.status(400).json({ error: "Missing cartId/lineId/quantity" });
      const lines = [{ id: lineId, quantity }];
      const data = await storefront(QUERIES.CART_LINES_UPDATE, { cartId, lines });
      return res.status(200).json(data.data.cartLinesUpdate.cart);
    }

    if (action === "remove") {
      const { cartId, lineId } = req.body || {};
      if (!cartId || !lineId) return res.status(400).json({ error: "Missing cartId/lineId" });
      const data = await storefront(QUERIES.CART_LINES_REMOVE, { cartId, lineIds: [lineId] });
      return res.status(200).json(data.data.cartLinesRemove.cart);
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}

import { useEffect, useState } from "react";

const PRODUCTS_LIMIT = parseInt(process.env.NEXT_PUBLIC_PRODUCTS_LIMIT || process.env.PRODUCTS_LIMIT || "12", 10);

async function gql(query, variables) {
  const res = await fetch("/api/storefront", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      // fetch products (server-side proxy will add token)
      const query = `#graphql
        query P($first:Int!) {
          products(first:$first, sortKey:TITLE) {
            edges {
              node {
                id title handle
                featuredImage { url altText }
                variants(first:1) { edges { node { id title price { amount currencyCode } } } }
              }
            }
          }
        }
      `;
      const data = await gql(query, { first: PRODUCTS_LIMIT });
      const list = data?.data?.products?.edges?.map(e => e.node) || [];
      setProducts(list);

      // restore cart
      const saved = localStorage.getItem("cartId");
      if (saved) setCart({ id: saved });
    })();
  }, []);

  async function ensureCart() {
    if (cart && cart.id) return cart.id;
    const res = await fetch("/api/cart", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ action: "create" })});
    const c = await res.json();
    localStorage.setItem("cartId", c.id);
    setCart(c);
    return c.id;
  }

  async function addToCart(merchandiseId) {
    setLoading(true);
    try {
      const id = await ensureCart();
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ action: "add", cartId: id, merchandiseId, quantity: 1 })
      });
      const updated = await res.json();
      setCart(updated);
    } finally {
      setLoading(false);
    }
  }

  function openCheckout() {
    if (!cart?.checkoutUrl) return;
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(cart.checkoutUrl);
    } else {
      window.open(cart.checkoutUrl, "_blank");
    }
  }

  return (
    <main>
      <h1>Быстрый заказ — Мини‑магазин</h1>
      {products.length === 0 ? <div className="empty">Загружаю товары…</div> : (
        <div className="grid">
          {products.map((p) => {
            const variant = p.variants?.edges?.[0]?.node;
            const price = variant?.price;
            return (
              <div className="card" key={p.id}>
                {p.featuredImage && (
                  <img src={p.featuredImage.url} alt={p.featuredImage.altText || p.title} />
                )}
                <h3>{p.title}</h3>
                <div className="price">{price ? `${price.amount} ${price.currencyCode}` : ""}</div>
                <button disabled={loading} onClick={() => addToCart(variant.id)}>
                  {loading ? "Добавление…" : "В корзину"}
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="footer-spacer" />
      <div className="actions">
        <button onClick={openCheckout} disabled={!cart?.checkoutUrl}>
          Перейти к оплате
        </button>
      </div>
      <script src="https://telegram.org/js/telegram-web-app.js"></script>
    </main>
  );
}

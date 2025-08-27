import { useEffect, useState } from "react";

async function gql(query, variables) {
  const res = await fetch("/api/storefront", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

// пагинированный запрос: берем по 100 за раз, пока hasNextPage = false
const PRODUCTS_PAGED_QUERY = `#graphql
  query ProductsPaged($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: TITLE) {
      edges {
        cursor
        node {
          id
          title
          handle
          featuredImage { url altText }
          variants(first: 1) {
            edges { node { id title price { amount currencyCode } } }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

async function fetchAllProducts() {
  const first = 100; // можно 250 — это максимум для Storefront на products
  let after = null;
  let all = [];

  // защитимся от «бесконечного» цикла
  for (let i = 0; i < 100; i++) {
    const data = await gql(PRODUCTS_PAGED_QUERY, { first, after });
    const conn = data?.data?.products;
    const edges = conn?.edges || [];
    all = all.concat(edges.map(e => e.node));

    if (conn?.pageInfo?.hasNextPage) {
      after = conn.pageInfo.endCursor;
    } else {
      break;
    }
  }
  return all;
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      // 1) тянем все товары со всеми страницами
      const list = await fetchAllProducts();
      setProducts(list);

      // 2) восстанавливаем корзину, если была
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
    // открываем чекаут в том же WebView Telegram
    window.location.href = cart.checkoutUrl;
  }

  return (
    <main>
      <h1>Быстрый заказ — Мини-магазин</h1>
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
                <button disabled={loading || !variant?.id} onClick={() => addToCart(variant.id)}>
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

import { useEffect, useState } from "react";

async function gql(query, variables) {
  const res = await fetch("/api/storefront", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

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
  const first = 100; // можно увеличить до 250
  let after = null;
  let all = [];

  for (let i = 0; i < 100; i++) {
    const data = await gql(PRODUCTS_PAGED_QUERY, { first, after });
    const conn = data?.data?.products;
    const edges = conn?.edges || [];
    all = all.concat(edges.map(e => e.node));
    if (conn?.pageInfo?.hasNextPage) after = conn.pageInfo.endCursor;
    else break;
  }
  return all;
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [loadingId, setLoadingId] = useState(null); // чтобы дизейблить кнопку конкретной карточки
  const [qty, setQty] = useState({}); // { [productId]: number }

  useEffect(() => {
    (async () => {
      const list = await fetchAllProducts();
      setProducts(list);
      // дефолтное количество = 1
      const q = {};
      list.forEach(p => (q[p.id] = 1));
      setQty(q);

      const saved = localStorage.getItem("cartId");
      if (saved) setCart({ id: saved });
    })();
  }, []);

  async function ensureCart() {
    if (cart && cart.id) return cart.id;
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ action: "create" })
    });
    const c = await res.json();
    localStorage.setItem("cartId", c.id);
    setCart(c);
    return c.id;
  }

  async function addToCart(merchandiseId, productId) {
    const count = Math.max(1, parseInt(qty[productId] || 1, 10));
    setLoadingId(productId);
    try {
      const id = await ensureCart();
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          action: "add",
          cartId: id,
          merchandiseId,
          quantity: count
        })
      });
      const updated = await res.json();
      setCart(updated);
    } finally {
      setLoadingId(null);
    }
  }

  function openCheckout() {
    if (!cart?.checkoutUrl) return;
    window.location.href = cart.checkoutUrl; // открываем чекаут в том же WebView
  }

  function changeQty(productId, value) {
    const v = Math.max(1, Math.min(999, Number(value) || 1)); // 1..999
    setQty(prev => ({ ...prev, [productId]: v }));
  }

  return (
    <main>
      <h1>Быстрый заказ — Мини-магазин</h1>
      {products.length === 0 ? (
        <div className="empty">Загружаю товары…</div>
      ) : (
        <div className="grid">
          {products.map((p) => {
            const variant = p.variants?.edges?.[0]?.node;
            const price = variant?.price;
            const currentQty = qty[p.id] ?? 1;
            const loading = loadingId === p.id;

            return (
              <div className="card" key={p.id}>
                {p.featuredImage && (
                  <img src={p.featuredImage.url} alt={p.featuredImage.altText || p.title} />
                )}
                <h3>{p.title}</h3>
                <div className="price">{price ? `${price.amount} ${price.currencyCode}` : ""}</div>

                {/* Блок выбора количества */}
                <div className="qty">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => changeQty(p.id, currentQty - 1)}
                    aria-label="Минус"
                  >−</button>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={currentQty}
                    onChange={(e) => changeQty(p.id, e.target.value)}
                    className="qty-input"
                  />
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => changeQty(p.id, currentQty + 1)}
                    aria-label="Плюс"
                  >+</button>
                </div>

                <button
                  disabled={loading || !variant?.id}
                  onClick={() => addToCart(variant.id, p.id)}
                >
                  {loading ? "Добавление…" : "В корзину"}
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="footer-spacer" />
      <div className="actions two">
  <button onClick={() => (window.location.href = '/cart')}>
    Корзина {cart?.totalQuantity ? `(${cart.totalQuantity})` : ''}
  </button>
  <button onClick={openCheckout} disabled={!cart?.checkoutUrl}>
    Перейти к оплате
  </button>
</div>
      <script src="https://telegram.org/js/telegram-web-app.js"></script>
    </main>
  );
}

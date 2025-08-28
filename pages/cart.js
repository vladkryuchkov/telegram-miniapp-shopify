import { useEffect, useState } from "react";

async function api(action, payload = {}) {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("cartId");
    if (!saved) return;
    (async () => {
      const c = await api("get", { cartId: saved });
      setCart(c);
    })();
  }, []);

  function back() {
    if (history.length > 1) history.back();
    else window.location.href = "/";
  }

  async function changeQty(lineId, nextQty) {
    const cartId = cart?.id;
    if (!cartId) return;
    const qty = Math.max(1, Math.min(999, Number(nextQty) || 1));
    setLoadingId(lineId);
    try {
      const updated = await api("update", { cartId, lineId, quantity: qty });
      const fresh = await api("get", { cartId: updated.id });
      setCart(fresh);
    } finally {
      setLoadingId(null);
    }
  }

  async function removeLine(lineId) {
    const cartId = cart?.id;
    if (!cartId) return;
    setLoadingId(lineId);
    try {
      const updated = await api("remove", { cartId, lineId });
      const fresh = await api("get", { cartId: updated.id });
      setCart(fresh);
    } finally {
      setLoadingId(null);
    }
  }


 function notify(text) {
   if (window.Telegram?.WebApp?.showPopup) {
     window.Telegram.WebApp.showPopup({
       title: "Oops",
       message: text,
       buttons: [{ type: "close" }],
     });
     return;
   }
   if (window.Telegram?.WebApp?.showAlert) {
     window.Telegram.WebApp.showAlert(text);
     return;
   }
   alert(text);
 }

 function checkout() {
   if (!cart || !cart.totalQuantity) {
     notify("Your cart is empty");
     return;
   }
   if (!cart.checkoutUrl) {
     notify("Checkout link is not ready yet");
     return;
   }
   window.location.href = cart.checkoutUrl;
 }


  return (
    <main>
      <div className="header">
        <img src="/logo.png" alt="Logo" className="logo" />
      </div>

      <h1>Cart</h1>

      {!cart ? (
        <div className="empty">
          Your cart is empty. <br />
          <button onClick={back} style={{ marginTop: 10 }}>Back to catalog</button>
        </div>
      ) : (
        <>
          {cart?.lines?.edges?.length ? (
            <div className="cart-list">
              {cart.lines.edges.map(({ node }) => {
                const v = node.merchandise;
                const product = v?.product;
                const img = product?.featuredImage;
                const price = v?.price;
                return (
                  <div className="cart-item" key={node.id}>
                    {img && <img src={img.url} alt={img.altText || product?.title} />}
                    <div className="cart-info">
                      <div className="cart-title">{product?.title}</div>
                      <div className="cart-variant">{v?.title}</div>
                      <div className="cart-price">
                        {price ? `${price.amount} ${price.currencyCode}` : ""}
                      </div>

                      <div className="qty">
                        <button className="qty-btn" onClick={() => changeQty(node.id, node.quantity - 1)} disabled={loadingId === node.id} aria-label="Minus">−</button>
                        <input
                          className="qty-input"
                          type="number"
                          min="1"
                          max="999"
                          value={node.quantity}
                          onChange={(e) => changeQty(node.id, e.target.value)}
                          disabled={loadingId === node.id}
                        />
                        <button className="qty-btn" onClick={() => changeQty(node.id, node.quantity + 1)} disabled={loadingId === node.id} aria-label="Plus">+</button>
                      </div>

                      <button className="remove-btn" onClick={() => removeLine(node.id)} disabled={loadingId === node.id}>
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty">Your cart is empty.</div>
          )}

          <div className="cart-summary">
            <div className="sum">
              Total: {cart?.cost?.subtotalAmount?.amount} {cart?.cost?.subtotalAmount?.currencyCode}
            </div>
            <div className="cart-actions">
              <button onClick={back}>Back</button>
              <button onClick={checkout} disabled={!cart?.checkoutUrl}>Go to checkout</button>
            </div>
          </div>
        </>
      )}
<div className="bottom-spacer" />
<nav className="bottom-nav" role="navigation" aria-label="Bottom navigation">
  <a
    className="nav-item"
    href="/"
    aria-label="Back to catalog"
    onClick={(e) => { e.preventDefault(); window.location.href = '/'; }}
  >
    {/* Можно сделать «домой» или снова корзину — на ваше усмотрение */}
    {typeof window !== 'undefined' && document?.createElement ? (
      <img src="/cart.svg" alt="Catalog" className="nav-icon" onError={(e)=>{e.currentTarget.outerHTML='🏠'}} />
    ) : '🏠'}
    <div className="nav-label">Catalog</div>
  </a>

  <a
    className="nav-item active"
    href="#checkout"
    aria-label="Go to checkout"
    onClick={(e) => { e.preventDefault(); checkout(); }}
  >
    {typeof window !== 'undefined' && document?.createElement ? (
      <img src="/checkout.svg" alt="Checkout" className="nav-icon" onError={(e)=>{e.currentTarget.outerHTML='💳'}} />
    ) : '💳'}
    <div className="nav-label">Checkout</div>
  </a>
</nav>
      <script src="https://telegram.org/js/telegram-web-app.js"></script>
    </main>
  );
}

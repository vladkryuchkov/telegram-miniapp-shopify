export async function storefront(query, variables = {}) {
  const shop = process.env.SHOPIFY_SHOP_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
  if (!shop || !token) {
    throw new Error("Missing Shopify env vars");
  }
  const res = await fetch(`https://${shop}/api/2024-07/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    console.error("Shopify error:", JSON.stringify(json, null, 2));
    throw new Error(json.errors?.[0]?.message || "Shopify Storefront error");
  }
  return json;
}

export const QUERIES = {
  PRODUCTS: `#graphql
    query Products($first: Int!) {
      products(first: $first, sortKey: TITLE) {
        edges {
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
      }
    }
  `,
  CART_CREATE: `#graphql
    mutation CartCreate($lines: [CartLineInput!]) {
      cartCreate(input: { lines: $lines }) {
        cart { id checkoutUrl totalQuantity }
        userErrors { field message }
      }
    }
  `,
  CART_LINES_ADD: `#graphql
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { id totalQuantity checkoutUrl }
        userErrors { field message }
      }
    }
  `,
};

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
        cart {
          id
          checkoutUrl
          totalQuantity
          cost { subtotalAmount { amount currencyCode } }
          lines(first: 100) {
            edges {
              node {
                id
                quantity
                cost { subtotalAmount { amount currencyCode } }
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price { amount currencyCode }
                    product {
                      title
                      featuredImage { url altText }
                    }
                  }
                }
              }
            }
          }
        }
        userErrors { field message }
      }
    }
  `,
  CART_QUERY: `#graphql
    query Cart($id: ID!) {
      cart(id: $id) {
        id
        checkoutUrl
        totalQuantity
        cost { subtotalAmount { amount currencyCode } }
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              cost { subtotalAmount { amount currencyCode } }
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price { amount currencyCode }
                  product {
                    title
                    featuredImage { url altText }
                  }
                }
              }
            }
          }
        }
      }
    }
  `,
  CART_LINES_UPDATE: `#graphql
    mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost { subtotalAmount { amount currencyCode } }
          lines(first: 100) {
            edges {
              node {
                id
                quantity
                cost { subtotalAmount { amount currencyCode } }
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price { amount currencyCode }
                    product {
                      title
                      featuredImage { url altText }
                    }
                  }
                }
              }
            }
          }
        }
        userErrors { field message }
      }
    }
  `,
  CART_LINES_REMOVE: `#graphql
    mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost { subtotalAmount { amount currencyCode } }
          lines(first: 100) {
            edges {
              node {
                id
                quantity
                cost { subtotalAmount { amount currencyCode } }
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price { amount currencyCode }
                    product {
                      title
                      featuredImage { url altText }
                    }
                  }
                }
              }
            }
          }
        }
        userErrors { field message }
      }
    }
  `,
};

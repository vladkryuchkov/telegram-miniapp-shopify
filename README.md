# Telegram Mini App × Shopify (быстрый заказ)

Готовый минимальный шаблон Mini App для Telegram с корзиной и оплатой через стандартный Shopify Checkout
(Storefront Cart API + `checkoutUrl`).

## Что это делает
- Показывает список товаров из Shopify
- Создаёт корзину в Shopify и добавляет позиции
- Открывает `checkoutUrl` для оплаты (всё внутри Shopify — скидки, налоги, доставка и т.д.)

## Быстрый старт (без кода)
1. Скачайте ZIP из чата и распакуйте.
2. Установите Node.js LTS (18+).
3. В папке проекта выполните:
   ```bash
   npm install
   cp .env.example .env.local
   ```
4. Заполните `.env.local`:
   - `SHOPIFY_SHOP_DOMAIN` — ваш домен магазина, например `my-shop.myshopify.com`
   - `SHOPIFY_STOREFRONT_TOKEN` — приватный Storefront access token (создаётся в Shopify → Apps → Develop apps → Ваше app → Storefront API access)
5. Запустите локально:
   ```bash
   npm run dev
   ```
   Откройте `http://localhost:3000` — или вставьте этот URL временно как Web App URL у @BotFather для теста на телефоне (понадобится публичный https-туннель, например ngrok).
6. Деплой:
   - Создайте аккаунт на Vercel.
   - Импортируйте проект (New Project → Import).
   - На шаге «Environment Variables» добавьте `SHOPIFY_SHOP_DOMAIN` и `SHOPIFY_STOREFRONT_TOKEN`.
   - После деплоя получите домен вида `https://yourapp.vercel.app`.
   - В @BotFather → Configure Mini App установите этот домен как **Web App URL**.

## Где взять Storefront Token
Shopify Admin → Apps → Develop apps → Create an app → «Configuration» → Storefront API → выберите требуемые скоупы (Products, Cart) → «Install app» → «API credentials» → **Storefront access token**.
Используйте **PRIVATE** токен на сервере (в API роуте).

## Замечания по безопасности
- Storefront **PRIVATE** token хранится на сервере (API-роуты Next.js), а не в браузере.
- Клиент ходит только в `/api/*`, где мы проксируем запросы к Shopify.

## Кастомизация
- Измените запросы продукта (колонки, фильтры) в `lib/shopify.js` (QUERY.PRODUCTS).
- Стили — в `public/index.css`.
- Логику корзины можно расширить: количество, удаление, купоны и т.д.

## Telegram WebApp
Скрипт Telegram подключён на странице. В продакшене Mini App открывается внутри Telegram.
При клике «Перейти к оплате» используется `Telegram.WebApp.openLink(checkoutUrl)`.

Удачи с запуском!

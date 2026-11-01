# Pre-Loved Thrift

## Seller and rider accounts

Buyer, seller, and rider accounts are stored in the browser's local storage. They work only in the same browser and device where they were created; they are not server-backed accounts. After registration, buyers, sellers, and riders must sign in before entering their dashboards. Passwords are hashed in the browser before storage, but this local-only approach is not suitable for production authentication or sharing accounts across devices.

Run `npm install` and `npm run dev` to start the app. No PostgreSQL database or authentication server is required.

## Prices and currency

Prices are displayed in Philippine pesos (PHP), using the app's fixed conversion of ₱58 per USD. This is a display conversion, not a live exchange rate. Seller inventory prices are entered and saved directly in pesos.

## GCash QR checkout

GCash checkout is not enabled until the seller adds their official QR image at `public/assets/gcash-qr.png`. Use only a QR issued by the seller's GCash account; do not generate or edit a payment QR. Buyers scan the QR and place the order, then the seller must verify the transfer manually before confirming payment. This static QR flow does not verify payments automatically.

# Rutter Shopify Orders

This repository uses the Rutter API to get order and product data from Shopify. This app is built on NextJS and uses the react-rutter-link library.

## 1. Clone the repository
```
$ git clone https://github.com/WeaponXII/shopify-orders-rutter.git
$ cd shopify-orders-rutter
```

## 2. Set up your environment variables

```
$ cp .env.example .env.local
```

Copy `.env.example` to a new file called `.env.local` and fill out the environment variables inside.`RUTTER_CLIENT_ID`, `RUTTER_SECRET`, and `NEXT_PUBLIC_RUTTER_PUBLIC_KEY` must be filled out. Get your Client ID and secrets from
the dashboard: https://dashboard.rutterapi.com

## 3. Run the quickstart

Install required node modules:
```
$ yarn
```

Run the Quickstart:
```
$ yarn dev
```

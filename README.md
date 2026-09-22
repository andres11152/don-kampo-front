# Don Kampo — Frontend

React (Vite) storefront and admin client for Don Kampo, a fresh-produce marketplace. Pairs with the [don-kampo-API](https://github.com/andres11152/don-kampo-API) backend.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Scripts Reference](#scripts-reference)

## Overview

Don Kampo Front is the customer-facing storefront and admin client for a fresh-produce e-commerce platform. It handles browsing and purchasing products, cart and checkout, order tracking, and an admin area for managing the catalog, all backed by the Don Kampo API.

## Features

- **Storefront:** Product catalog, product detail pages, and a shopping cart.
- **Checkout:** Order creation flow with PDF receipt generation (`jspdf` + `html2canvas`).
- **Authentication:** Customer login and registration.
- **Customer Profile:** Order history and account management.
- **Admin Panel:** Product creation, editing, and deletion for catalog management.
- **PWA Support:** Installable as a Progressive Web App (`vite-plugin-pwa`).
- **WhatsApp Contact Widget:** Direct customer support link via `react-floating-whatsapp`.
- **Excel Export:** Data export support via `xlsx`.

## Tech Stack

- **Framework:** React 18, Vite
- **UI Library:** Ant Design (antd)
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **PDF Generation:** jsPDF, html2canvas
- **PWA:** vite-plugin-pwa

## Project Structure

```
src/
├── assets/          # Static assets
├── components/       # Reusable UI components
├── fonts/            # Custom fonts
├── pages/
│   ├── home/          # Landing page
│   ├── products/       # Product catalog and detail views
│   ├── cart/            # Shopping cart
│   ├── checkout/         # Checkout flow
│   ├── createOrder/       # Order creation
│   ├── login/               # Customer login
│   ├── register/             # Customer registration
│   ├── profile/                # Customer profile and order history
│   ├── admin/                    # Admin panel
│   ├── createProduct/             # Admin: create product
│   ├── deleteProduct/              # Admin: delete product
│   └── install/                     # PWA install prompt
├── App.jsx
└── main.jsx
```

## Getting Started

### Prerequisites

- Node.js v18 or higher
- The [don-kampo-API](https://github.com/andres11152/don-kampo-API) running and reachable

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/andres11152/don-kampo-front.git
cd don-kampo-front
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the project root with the API base URL:

```
VITE_API_URL=http://localhost:3000/api
```

**Security note:** Never commit a real `.env` file to version control. Keep `.env` in `.gitignore` and manage real values via your hosting platform's environment variables.

4. **Run the development server**

```bash
npm run dev
```

5. **Build for production**

```bash
npm run build
```

## Scripts Reference

| Command | Description |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint checks |

---

**Developed by Andrés Betancourt**

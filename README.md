# Sport Match Watch ⚽🏀  
A lightweight sports live score & match tracking web app built with Next.js

**Sport Match Watch** is a fast, minimal, and ad-free sports live score website focused on real-time match tracking, schedules, and results.  
It is designed as a weekend indie project with an emphasis on simplicity, performance, and clean UI.

🌐 Live Demo: https://sportlive.win

---

## 🚀 Features

- 📊 Live sports scores and match status
- ⏱️ Real-time match updates (polling-based)
- 📅 Match schedules and fixtures
- 📱 Mobile-friendly, responsive UI
- ⚡ Fast loading, minimal JavaScript
- ❌ No ads, no accounts, no distractions

This project intentionally avoids unnecessary complexity to stay lightweight and easy to maintain.

---

## 🧠 Why This Project

Most sports live score websites today are:
- cluttered with ads
- slow on mobile devices
- overloaded with features users rarely need

**Sport Match Watch** focuses on the core use case:
> _“I just want to quickly check live scores and match status.”_

This makes it ideal for casual viewers, second-screen usage, and fast access during live games.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **Data Source:** Public sports data APIs
- **Backend:** Serverless functions
- **Deployment:** Vercel
- **Architecture:** Client-side rendering + lightweight API polling

No databases, no authentication, no complex real-time infrastructure — just what’s needed to ship fast.

---

## 🧩 Architecture Overview

```text
Next.js App
 ├── UI (Tailwind CSS)
 ├── API Routes (Serverless)
 ├── Sports Data APIs
 └── Client-side Polling & Caching


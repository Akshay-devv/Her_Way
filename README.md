# Her-Way 🛡️📍

A modern, full-stack web application designed to prioritize women's safety during navigation. By leveraging geospatial data, crowdsourced risk zones, and custom heuristic algorithms, Her-Way provides users with the **safest routes** instead of just the fastest ones.

## ✨ Features

- **Safe Routing Engine**: Integrates with Open Source Routing Machine (OSRM) and applies a custom risk-scoring algorithm against known safety zones to map out the most secure path to your destination.
- **Emergency SOS System**: Integrated Twilio SMS API to instantly text your real-time location to emergency contacts with a single button press.
- **Crowdsourced Safety Zones**: A community-driven map where users can report areas as *low*, *moderate*, or *high* risk, creating a dynamic heat map of safety.
- **Dynamic POI Mapping**: Automatically locates safe stops like local police stations and hospitals using the Overpass API (OpenStreetMap).

## 🛠️ Technology Stack

**Frontend**
- React 18, Vite
- Tailwind CSS & Radix UI (shadcn/ui) for styling
- React-Leaflet for spatial map visualization
- Wouter for lightning-fast routing

**Backend & Data**
- Node.js & Express.js
- TypeScript
- Neon Serverless Postgres
- Drizzle ORM
- Twilio API for SMS

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A PostgreSQL Database URL (You can set one up for free using [Neon](https://neon.tech/))
- A Twilio Account (for the SOS feature)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Akshay-devv/Her_Way.git
   cd Her-Way
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add the following keys:
   ```env
   DATABASE_URL=postgres://USER:PASSWORD@YOUR_NEON_HOST/db_name
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ```

4. **Initialize the Database:**
   Push the schema to your Neon database using Drizzle:
   ```bash
   npm run db:push
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The application will boot up at `http://localhost:5000`.

## 📈 Data Science & Analytics Potential
Her-Way is fundamentally built on geospatial and demographic data. Future updates are planned to include:
- **Predictive Risk Modeling:** Time-series forecasting for risk probability mapping.
- **Spatial Clustering:** Utilizing DBSCAN to identify dynamic incident hotspots natively.
- **NLP Threat Extraction:** Auto-categorizing text descriptions from user reports.

## 🤝 Contribution
Contributions, issues, and feature requests are welcome!

## 📜 License
This project is licensed under the MIT License.

# CropSure AI

CropSure AI is a application prototype that helps farmers report crop damage and follow the review process online. Farmers can enter crop and damage details, describe what happened, and attach supporting photos or PDF documents.
Farmers can find their field by searching for a place or selecting its location on an interactive map. The interface is available in **English and Hindi** and includes a built-in help assistant. Farmers can type questions or use voice input where their browser supports it.
Review officers can examine submitted reports, review available evidence and AI-generated image assessments, update report statuses, and add notes for farmers. The AI assessment is optional decision-support; the authorized officer makes the final decision. Farmers can track report updates and download the officer's PDF report when available.
## Features

- Farmer registration and sign-in
- Crop-loss reports with damage details and incident description
- Map-based field selection and address search
- Photo and PDF evidence uploads
- Officer dashboard for report review and status updates
- Optional crop-image assessment using Gemini or OpenAI
- Weather snapshot for the reported field location
- Duplicate-file checks using SHA-256 fingerprints
- Farmer report tracking, officer notes, and downloadable PDF reports
- English and Hindi interface, with a browser-based voice help assistant

## Tech stack

- **Frontend:** React, Vite, React Router, Axios
- **Backend:** Node.js and Express
- **Database:** MongoDB with Mongoose
- **Maps:** Leaflet and OpenStreetMap
- **AI:** Gemini API or OpenAI API
- **Other services:** Open-Meteo weather API and Nominatim geocoding
- **File and PDF tools:** Multer, Sharp, and PDFKit
- **Authentication:** JWT and bcrypt

## Run locally
Server side:
cd server
npm start
Client side:
cd client
npm run dev


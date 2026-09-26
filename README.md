# CropSure AI

CropSure AI is a web application prototype for crop-loss reporting and officer review. Farmers can submit a report with crop and damage details, field location, and supporting evidence. Review officers can examine reports, record a status and note, and share a PDF review report with the farmer.

AI image analysis is optional decision-support. An authorized officer makes the final report decision.

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

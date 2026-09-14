# Role & System Architecture
Act as an Expert Full-Stack Developer and System Architect. I am building a mobile-responsive "Event Lead Retrieval" SaaS app designed for high-concurrency multi-tenancy.

**Tech Stack:**
*   **Framework:** Next.js (App Router) - Full Stack.
*   **Frontend:** React, Tailwind CSS, `framer-motion` (for animations/typewriter effects). Uses HTML5 `<input type="file" accept="image/*" capture="environment">` for camera.
*   **Backend:** Next.js Server Actions or Route Handlers (`/api`).
*   **AI Vision API:** `@google/genai` (Gemini 1.5 Flash or 2.0 Flash) for structured JSON OCR.
*   **Storage & DB:** Google Drive API + Google Sheets API via a single backend Service Account (`credentials.json`). 
*   **No OAuth:** We are strictly using the Service Account sharing method (No OAuth 2.0 user consent screens).

---

# Core Feature: Dynamic Multi-Tenancy
The backend must handle data isolation dynamically based on the client.
1. **Settings UI:** Build a "Configuration" screen where the client pastes their `Google Sheet ID` and `Google Drive Folder ID`. 
2. **Local Storage:** Save these IDs in the browser's `localStorage` and pass them as payload parameters to the Next.js API routes on every scan.
3. **Dynamic Execution:** The backend APIs must use the provided `spreadsheetId` for database appends and `driveFolderId` for Drive image uploads.

---

# Concurrency & Exponential Backoff (CRITICAL)
Google Sheets API allows 60 write requests per minute per user. Because this is an event app, traffic spikes are guaranteed. 
* You **MUST** wrap the `google.sheets().spreadsheets.values.append` backend call in a robust Exponential Backoff retry function. 
* If Google returns a `429 (Too Many Requests)` or `503 (Service Unavailable)`, the backend must wait (e.g., 1s, 2s, 4s) and retry silently up to 4 times before failing. Never drop a lead during a spike.

---

# Business Logic: The 3-Path Workflow
The app opens to a Role selector (`User` / `Company`). When `User` is selected:

### Path 1: Card with Information + Photo
1. **Capture:** Snap a photo of the visitor's card.
2. **API Parallel Execution:** The Next.js API concurrently runs `Promise.all` to:
   - Query Gemini API with a strict JSON schema to extract data AND return `face_detected: true`.
   - Upload the full card image to the dynamically provided Drive Folder, returning the `webViewLink`.
3. **Preview (Typewriter):** Frontend auto-fills the form (Name, Age, Mobile, Email, Address, Gender, Company) using a staggered typewriter effect. Input fields must remain editable controlled components.
4. **Save:** Clicking "Save" triggers the exponential backoff append to save the form data + Drive link to the Google Sheet.

### Path 2: No Card (Manual Entry + Live Photo) - *Zero AI Usage*
1. **Capture:** Click "Manual Entry". An empty form appears.
2. **Input:** Type the data manually. Click "Capture Visitor Photo" to snap a live photo.
3. **Save:** Frontend sends data + photo + IDs to backend. Backend uploads photo to Drive and appends data + link to Sheets using exponential backoff.

### Path 3: Card with Information, but NO Photo
1. **Capture:** Snap a photo of the card.
2. **Processing:** API sends image to Gemini. Gemini extracts JSON data and returns `face_detected: false`. (No Drive upload happens yet).
3. **Preview & Alert:** Frontend auto-fills form with typewriter effect. It detects `face_detected: false` and displays an alert: *"No photo detected on card. Please snap visitor face."* alongside a camera trigger.
4. **Save:** After snapping the live photo, clicking "Save" sends all payloads to the backend. API uploads photo to Drive and appends data + link to Sheets.

---

# Blank Sheet Auto-Initialization
If a client links a completely blank Google Sheet, the backend must configure it automatically on the first save:
1. In the save API route, read the range `Sheet1!A1:J1`.
2. If empty, write the headers exactly as:
   `Role | Name | Mobile | Email | Age | Gender | Address | Company | Photo_Drive_Link | Timestamp`
3. Then append the actual visitor data to Row 2.

---

# Error Handling & Null Safety
1. **Missing Data Rules:** AI extraction MUST NEVER crash if fields are missing. Instruct Gemini: "If a field is missing from the card, set its JSON value to an empty string."
2. **Backend Safety:** Ensure the mapped array length perfectly matches the 10 headers before appending to Sheets.

---

# Required Deliverables
Generate the complete Next.js (App Router) codebase:
1. `package.json` with all dependencies (`googleapis`, `@google/genai`, etc.).
2. `app/page.tsx`: The React UI (3 workflows, Settings Modal, Typewriter hook, Tailwind).
3. `utils/google.ts`: Helper file initializing the `googleapis` auth using `credentials.json` environment variables, and the Exponential Backoff retry function.
4. `app/api/process-card/route.ts`: API route for Gemini JSON extraction and Path 1 Drive upload.
5. `app/api/save-lead/route.ts`: API route for final Drive uploads (Path 2/3) and Sheets operations (Blank Header Check + Backoff Append).
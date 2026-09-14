# Role & System Architecture
Act as an Expert Full-Stack Developer and UI/UX Designer. I am building a mobile-responsive "Event Lead Retrieval" Next.js web application.

**Tech Stack:**
* **Framework:** Next.js (App Router) with Tailwind CSS and `framer-motion`.
* **Camera Trigger:** HTML5 `<input type="file" accept="image/*" capture="environment">`.
* **AI OCR & Vision:** `@google/genai` (Gemini 1.5/2.0 Flash) for structured JSON data and face presence detection.
* **Database & Cloud Storage:** Google Sheets API + Google Drive API using a Service Account (`credentials.json`).
* **Multi-Tenancy:** Dynamically uses the Google Sheet ID and Drive Folder ID stored in `localStorage` from the in-app Settings modal.

---

# UI & Layout Specifications

### 1. Home Screen (Clean Header)
* Remove any `User | Company` role toggle. 
* Top Header contains: App Logo/Name ("EventLead") and the Settings icon ⚙️ (to configure Sheet/Folder IDs).
* Two main interactive cards:
  1. **"Scan Card" Card:** Large camera trigger for automated AI extraction.
  2. **"Manual Entry" Card:** Direct path to form entry without card scanning.

### 2. Enter Details Form (Updated)
* **Form Fields:** Full Name, Mobile, Email, Age, **Gender (Dropdown: Select with options: "Male", "Female", "Other", "N/A")**, Company, Address.
* **Editable Inputs:** All fields must remain standard editable inputs so stall owners can correct any OCR typos before saving.
* **Animations:** Use `framer-motion` so the form smoothly slides down into view with a staggered fill effect once processing completes.

---

# Core Workflows & Logic

### Path 1: Card with Info + Face Photo
1. Stall owner taps "Scan Card" and captures the ID card.
2. An animated processing/shimmer state is displayed.
3. Backend concurrently sends the image to Gemini (which returns extracted JSON and `"face_detected": true`) and uploads the card to the user's Google Drive folder.
4. The form slides down smoothly, auto-filled with the extracted data.
5. Stall owner reviews/edits fields and clicks **"Save Lead"**, which appends the row + Drive photo link to Google Sheets.

### Path 2: Card with Info, but NO Face Photo
1. Stall owner taps "Scan Card" and captures the text-only card.
2. Backend calls Gemini, which extracts data and returns `"face_detected": false`. (No Drive upload yet).
3. The form slides down smoothly with auto-filled fields.
4. **Smart Action Banner:** Above the submit button, display an intuitive prompt:
   - 📸 *"No photo detected on card."*
   - Two buttons: **[Capture Visitor Photo]** (opens camera) and **[Save Without Photo]**.
5. If a photo is taken, it uploads to Drive on save; if skipped, the photo column in Sheets is set to `"N/A"`.

### Path 3: Manual Entry (No Card)
1. Stall owner taps "Manual Entry".
2. Blank form opens with empty fields and the Gender dropdown.
3. Stall owner inputs details and can optionally tap **"Capture Visitor Photo"**.
4. Clicking **"Save Lead"** uploads the photo (if taken) to Google Drive and appends the row to Google Sheets.

---

# Backend & Sheets Schema
* **Google Sheets Row 1 Headers:** `Name | Mobile | Email | Age | Gender | Company | Address | Photo_Drive_Link | Timestamp`.
* **Blank Sheet Auto-Init:** If the linked Google Sheet has no headers in row 1, write the header row first before appending the lead.
* **Exponential Backoff:** Wrap the Google Sheets `append` API call in a 3-step retry mechanism to prevent `429 Rate Limit` errors during event traffic spikes.

---

# Required Deliverables
1. `app/page.tsx`: Full interactive React frontend with Tailwind CSS, Framer Motion animated form transitions, Gender select dropdown, camera inputs, and Settings modal.
2. `app/api/process-card/route.ts`: API route for Gemini JSON extraction and parallel Drive upload (Path 1).
3. `app/api/save-lead/route.ts`: API route for final Drive uploads (Path 2 & 3) and Google Sheets row append with exponential backoff.
4. `utils/google.ts`: Google Sheets & Drive client configuration using Service Account environment variables.
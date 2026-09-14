import { google } from 'googleapis';
import { Readable } from 'stream';

// --- Google Auth (env-only, Vercel-ready) ---
export async function getGoogleClient() {
  const envEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const envKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!envEmail || !envKey) {
    console.warn("Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY in environment.");
    return null;
  }

  const auth = new google.auth.JWT({
    email: envEmail,
    key: envKey.replace(/\\n/g, '\n'),
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
  return auth;
}

// --- Get Service Account Email ---
export function getServiceAccountEmail(): string {
  return process.env.GOOGLE_CLIENT_EMAIL || 'not-configured@example.com';
}

// --- Google Drive Upload ---
export async function uploadToDrive(base64Image: string, folderId: string, fileName: string): Promise<string> {
  const authClient = await getGoogleClient();
  if (!authClient) {
    throw new Error('Google credentials not configured.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drive = google.drive({ version: 'v3', auth: authClient as any });

  const buffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: 'image/jpeg',
      body: stream,
    },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  });

  return file.data.webViewLink || '';
}

// --- Sequential ID Generation ---
export async function getNextLeadId(spreadsheetId: string): Promise<number> {
  const authClient = await getGoogleClient();
  if (!authClient) return Date.now();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sheets = google.sheets({ version: 'v4', auth: authClient as any });

  try {
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:A',
    });

    const numRows = getRes.data.values?.length || 0;
    return numRows <= 1 ? 1 : numRows;
  } catch (err) {
    console.error("Failed to get next lead ID:", err);
    return Date.now();
  }
}

// --- Exponential Backoff for Sheets Writes ---
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 4,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      const status = (error as { code?: number })?.code;
      if ((status === 429 || status === 503) && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`Sheets API rate limited (${status}). Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

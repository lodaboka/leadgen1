import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getGoogleClient, getServiceAccountEmail } from '@/lib/google-auth';
import { google } from 'googleapis';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

function extractId(urlOrId: string): string {
  if (!urlOrId.includes('http')) return urlOrId.trim();
  try {
    const match = urlOrId.match(/\/(?:d|folders)\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : urlOrId.trim();
  } catch {
    return urlOrId.trim();
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { eventName, username, password, sheetUrl, driveUrl } = await req.json();

    if (!eventName?.trim() || !username?.trim() || !password || !sheetUrl?.trim() || !driveUrl?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const masterSheetId = process.env.MASTER_AUTH_SHEET_ID;
    if (!masterSheetId) {
      return NextResponse.json({ error: 'Master sheet not configured.' }, { status: 500 });
    }

    const authClient = await getGoogleClient();
    if (!authClient) {
      return NextResponse.json({ error: 'Google credentials not configured.' }, { status: 500 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const sheetId = extractId(sheetUrl);
    const driveId = extractId(driveUrl);
    const eventId = crypto.randomUUID().slice(0, 8).toUpperCase();

    // Fetch sheet title and folder name for the card display
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drive = google.drive({ version: 'v3', auth: authClient as any });

    let sheetTitle = '';
    let folderTitle = '';

    try {
      const sheetRes = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      sheetTitle = sheetRes.data.properties?.title || '';
    } catch {
      sheetTitle = 'Unable to access sheet';
    }

    try {
      const driveRes = await drive.files.get({ fileId: driveId, fields: 'name' });
      folderTitle = driveRes.data.name || '';
    } catch {
      folderTitle = 'Unable to access folder';
    }

    // Ensure header row exists
    try {
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId: masterSheetId,
        range: 'Sheet1!A1:I1',
      });
      if (!headerRes.data.values || headerRes.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: masterSheetId,
          range: 'Sheet1!A1:I1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Event_ID', 'Event_Name', 'Username', 'Hashed_Password', 'Target_Sheet_ID', 'Target_Drive_ID', 'Created_At', 'Sheet_Title', 'Folder_Title']],
          },
        });
      }
    } catch (err) {
      console.warn('Header check warning:', err);
    }

    // Append event row
    await sheets.spreadsheets.values.append({
      spreadsheetId: masterSheetId,
      range: 'Sheet1!A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[eventId, eventName.trim(), username.trim(), hashedPassword, sheetId, driveId, new Date().toISOString(), sheetTitle, folderTitle]],
      },
    });

    return NextResponse.json({
      success: true,
      event: { eventId, eventName: eventName.trim(), username: username.trim(), sheetId, driveId, sheetTitle, folderTitle, createdAt: new Date().toISOString() },
    });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create event.' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  return NextResponse.json({ serviceEmail: getServiceAccountEmail() });
}

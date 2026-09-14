import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getGoogleClient } from '@/lib/google-auth';
import { google } from 'googleapis';
import bcrypt from 'bcryptjs';

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

    const { eventId, eventName, username, password, sheetUrl, driveUrl } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required.' }, { status: 400 });
    }

    const masterSheetId = process.env.MASTER_AUTH_SHEET_ID;
    if (!masterSheetId) {
      return NextResponse.json({ error: 'Master sheet not configured.' }, { status: 500 });
    }

    const authClient = await getGoogleClient();
    if (!authClient) {
      return NextResponse.json({ error: 'Google credentials not configured.' }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drive = google.drive({ version: 'v3', auth: authClient as any });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: masterSheetId,
      range: 'Sheet1!A:I',
    });

    const rows = res.data.values || [];
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === eventId) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const existingRow = rows[rowIndex];
    const updatedEventName = eventName?.trim() || existingRow[1];
    const updatedUsername = username?.trim() || existingRow[2];
    const updatedPassword = password ? await bcrypt.hash(password, 10) : existingRow[3];
    const updatedSheetId = sheetUrl ? extractId(sheetUrl) : existingRow[4];
    const updatedDriveId = driveUrl ? extractId(driveUrl) : existingRow[5];

    // Fetch updated sheet/folder titles
    let sheetTitle = existingRow[7] || '';
    let folderTitle = existingRow[8] || '';

    if (sheetUrl) {
      try {
        const sheetRes = await sheets.spreadsheets.get({ spreadsheetId: updatedSheetId });
        sheetTitle = sheetRes.data.properties?.title || '';
      } catch { sheetTitle = 'Unable to access'; }
    }

    if (driveUrl) {
      try {
        const driveRes = await drive.files.get({ fileId: updatedDriveId, fields: 'name' });
        folderTitle = driveRes.data.name || '';
      } catch { folderTitle = 'Unable to access'; }
    }

    // Update the row (1-indexed for Sheets API, +1 for header)
    const sheetRow = rowIndex + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: masterSheetId,
      range: `Sheet1!A${sheetRow}:I${sheetRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[eventId, updatedEventName, updatedUsername, updatedPassword, updatedSheetId, updatedDriveId, existingRow[6], sheetTitle, folderTitle]],
      },
    });

    return NextResponse.json({
      success: true,
      event: { eventId, eventName: updatedEventName, username: updatedUsername, sheetId: updatedSheetId, driveId: updatedDriveId, sheetTitle, folderTitle, createdAt: existingRow[6] },
    });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Failed to update event.' }, { status: 500 });
  }
}

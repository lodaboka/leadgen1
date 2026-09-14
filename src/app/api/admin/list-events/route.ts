import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getGoogleClient } from '@/lib/google-auth';
import { google } from 'googleapis';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
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

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: masterSheetId,
      range: 'Sheet1!A:I',
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) {
      return NextResponse.json({ events: [] });
    }

    // Skip header, map rows
    // Columns: Event_ID | Event_Name | Username | Hashed_Password | Target_Sheet_ID | Target_Drive_ID | Created_At | Sheet_Title | Folder_Title
    const events = rows.slice(1).map(row => ({
      eventId: row[0] || '',
      eventName: row[1] || '',
      username: row[2] || '',
      sheetId: row[4] || '',
      driveId: row[5] || '',
      createdAt: row[6] || '',
      sheetTitle: row[7] || '',
      folderTitle: row[8] || '',
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('List events error:', error);
    return NextResponse.json({ error: 'Failed to list events.' }, { status: 500 });
  }
}

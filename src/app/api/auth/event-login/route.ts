import { NextResponse } from 'next/server';
import { createSession } from '@/lib/session';
import { getGoogleClient } from '@/lib/google-auth';
import { google } from 'googleapis';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username?.trim() || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
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
      range: 'Sheet1!A:G',
    });

    const rows = res.data.values || [];
    // Skip header row, find matching username
    // Columns: Event_ID | Event_Name | Username | Hashed_Password | Target_Sheet_ID | Target_Drive_ID | Created_At
    let matchedRow: string[] | null = null;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][2]?.trim().toLowerCase() === username.trim().toLowerCase()) {
        matchedRow = rows[i];
        break;
      }
    }

    if (!matchedRow) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const hashedPassword = matchedRow[3];
    const isValid = await bcrypt.compare(password, hashedPassword);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const eventId = matchedRow[0];
    const eventName = matchedRow[1];
    const targetSheetId = matchedRow[4];
    const targetDriveId = matchedRow[5];

    // Validate target sheet and drive
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drive = google.drive({ version: 'v3', auth: authClient as any });

    let sheetTitle = eventName;
    let folderName = eventName;

    try {
      const sheetRes = await sheets.spreadsheets.get({ spreadsheetId: targetSheetId });
      sheetTitle = sheetRes.data.properties?.title || eventName;
    } catch { /* use eventName as fallback */ }

    try {
      const driveRes = await drive.files.get({ fileId: targetDriveId, fields: 'name' });
      folderName = driveRes.data.name || eventName;
    } catch { /* use eventName as fallback */ }

    await createSession({
      username: username.trim(),
      sheetId: targetSheetId,
      folderId: targetDriveId,
      sheetTitle,
      folderName,
      role: 'staff',
      eventId,
      eventName,
    });

    return NextResponse.json({ success: true, redirectTo: '/scanner' });
  } catch (error) {
    console.error('Event login error:', error);
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}

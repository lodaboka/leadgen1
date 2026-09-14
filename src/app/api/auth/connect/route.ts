import { NextResponse } from 'next/server';
import { getGoogleClient, getServiceAccountEmail } from '@/lib/google-auth';
import { createSession } from '@/lib/session';
import { google } from 'googleapis';

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
    const { username, sheetId: rawSheetId, driveFolderId: rawDriveFolderId } = await req.json();

    if (!username?.trim()) {
      return NextResponse.json({ error: 'Workspace name is required.' }, { status: 400 });
    }
    if (!rawSheetId || !rawDriveFolderId) {
      return NextResponse.json({ error: 'Both Sheet ID and Drive Folder ID are required.' }, { status: 400 });
    }

    const sheetId = extractId(rawSheetId);
    const folderId = extractId(rawDriveFolderId);

    const authClient = await getGoogleClient();
    if (!authClient) {
      return NextResponse.json({
        error: 'Backend missing Google credentials.',
        serviceEmail: getServiceAccountEmail()
      }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drive = google.drive({ version: 'v3', auth: authClient as any });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    // Validate Drive Folder
    let folderName = "";
    try {
      const driveRes = await drive.files.get({
        fileId: folderId,
        fields: 'id, name, mimeType'
      });
      if (driveRes.data.mimeType !== 'application/vnd.google-apps.folder') {
        return NextResponse.json({ error: 'The provided Drive ID is not a folder.' }, { status: 400 });
      }
      folderName = driveRes.data.name || "Unknown Folder";
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };
      if (err.code === 404) return NextResponse.json({ error: 'Drive Folder not found. Make sure you shared it with the service account.' }, { status: 404 });
      return NextResponse.json({ error: `Drive Error: ${err.message}` }, { status: 500 });
    }

    // Validate Google Sheet
    let sheetTitle = "";
    let numericalSheetId = 0;
    try {
      const sheetRes = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      sheetTitle = sheetRes.data.properties?.title || "Unknown Spreadsheet";
      const sheet1 = sheetRes.data.sheets?.find(s => s.properties?.title === 'Sheet1') || sheetRes.data.sheets?.[0];
      numericalSheetId = sheet1?.properties?.sheetId || 0;
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };
      if (err.code === 404) return NextResponse.json({ error: 'Google Sheet not found. Make sure you shared it with the service account.' }, { status: 404 });
      return NextResponse.json({ error: `Sheets Error: ${err.message}` }, { status: 500 });
    }

    // Auto-Init 10-Column Headers + Formatting if blank
    try {
      const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1:J1',
      });
      if (!getRes.data.values || getRes.data.values.length === 0) {
        const headers = ['ID', 'Name', 'Mobile', 'Email', 'Age', 'Gender', 'Company', 'Address', 'Photo_Drive_Link', 'Timestamp'];
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: 'Sheet1!A1:J1',
          valueInputOption: 'RAW',
          requestBody: { values: [headers] },
        });

        // Set column widths and wrapStrategy
        const colWidths = [
          { start: 0, end: 1, width: 50 },
          { start: 1, end: 2, width: 150 },
          { start: 2, end: 3, width: 120 },
          { start: 3, end: 4, width: 250 },
          { start: 4, end: 6, width: 80 },
          { start: 6, end: 7, width: 150 },
          { start: 7, end: 8, width: 300 },
          { start: 8, end: 9, width: 250 },
          { start: 9, end: 10, width: 150 }
        ];

        const requests = [
          ...colWidths.map(col => ({
            updateDimensionProperties: {
              range: { sheetId: numericalSheetId, dimension: 'COLUMNS' as const, startIndex: col.start, endIndex: col.end },
              properties: { pixelSize: col.width },
              fields: 'pixelSize'
            }
          })),
          {
            repeatCell: {
              range: { sheetId: numericalSheetId },
              cell: { userEnteredFormat: { wrapStrategy: 'CLIP' as const } },
              fields: 'userEnteredFormat.wrapStrategy'
            }
          }
        ];

        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: { requests }
        });
      }
    } catch (err) {
      console.warn("Could not check/init headers during connection:", err);
    }

    // Create encrypted session cookie
    await createSession({
      username: username.trim(),
      sheetId,
      folderId,
      sheetTitle,
      folderName,
    });

    return NextResponse.json({
      success: true,
      redirectTo: '/scanner',
      sheetTitle,
      folderName,
    });

  } catch (error: unknown) {
    console.error("auth/connect error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ serviceEmail: getServiceAccountEmail() });
}

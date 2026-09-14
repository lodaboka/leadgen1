import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { uploadToDrive, getGoogleClient, withExponentialBackoff, getNextLeadId } from '@/lib/google-auth';
import { google } from 'googleapis';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated. Please log in.' }, { status: 401 });
    }

    const { data, imageToSave } = await req.json();
    const { sheetId, folderId } = session;

    const authClient = await getGoogleClient();
    if (!authClient) {
      return NextResponse.json({ error: 'Backend missing Google credentials.' }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    // 1. Get the next sequential ID
    const leadId = await getNextLeadId(sheetId);

    // 2. Upload Photo to Drive (named lead_{ID}.jpg)
    let finalDriveLink = "";
    if (imageToSave && folderId) {
      try {
        finalDriveLink = await uploadToDrive(imageToSave, folderId, `lead_${leadId}.jpg`);
      } catch (err) {
        console.error("Failed to upload image to Drive:", err);
      }
    }

    // 3. Blank Sheet Header Check
    let isBlank = false;
    try {
      const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1:L1',
      });
      if (!getRes.data.values || getRes.data.values.length === 0) {
        isBlank = true;
      }
    } catch (err: unknown) {
      console.error("Sheet read error:", err instanceof Error ? err.message : err);
      isBlank = true;
    }

    if (isBlank) {
      const headers = ['ID', 'Name', 'Mobile', 'Email', 'Age', 'Gender', 'Company', 'Address', 'Inquiry', 'Photo_Drive_Link', 'Timestamp'];
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1:L1',
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
    }

    // 4. Append Data Row with Exponential Backoff
    const rowData = [
      leadId,
      data.name || '',
      data.mobile || '',
      data.email || '',
      data.age || '',
      data.gender || 'N/A',
      data.company || '',
      data.address || '',
      data.inquiry || '',
      finalDriveLink || 'N/A',
      new Date().toISOString(),
    ];

    await withExponentialBackoff(() =>
      sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'Sheet1!A:L',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowData] },
      })
    );

    // 5. Dynamic Cell Alignment (Wrap Text) so Company and Address don't overflow
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: { startColumnIndex: 0, endColumnIndex: 12 },
                cell: {
                  userEnteredFormat: {
                    wrapStrategy: 'WRAP',
                    verticalAlignment: 'TOP'
                  }
                },
                fields: 'userEnteredFormat(wrapStrategy,verticalAlignment)',
              }
            }
          ]
        }
      });
    } catch (e) {
      console.error("Format error:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Save lead error:', error);
    return NextResponse.json({ error: 'Failed to save lead.' }, { status: 500 });
  }
}

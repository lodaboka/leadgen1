import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getGoogleClient } from '@/lib/google-auth';
import { google } from 'googleapis';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const authClient = await getGoogleClient();
    if (!authClient) {
      return NextResponse.json({ error: 'Backend missing Google credentials.' }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: session.sheetId,
      range: 'Sheet1!A:J',
    });

    const rows = res.data.values || [];
    // First row is header, rest are leads
    const headers = rows[0] || [];
    const leads = rows.slice(1).map(row => {
      const lead: Record<string, string> = {};
      headers.forEach((header: string, i: number) => {
        lead[header] = row[i] || '';
      });
      return lead;
    });

    return NextResponse.json({
      leads,
      sheetTitle: session.sheetTitle,
      totalCount: leads.length,
    });
  } catch (error: unknown) {
    console.error("get-leads error:", error);
    return NextResponse.json({ error: 'Failed to fetch leads.' }, { status: 500 });
  }
}

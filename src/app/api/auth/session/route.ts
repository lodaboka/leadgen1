import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({
    username: session.username,
    sheetId: session.sheetId,
    folderId: session.folderId,
    sheetTitle: session.sheetTitle,
    folderName: session.folderName,
    role: session.role || 'staff',
    eventId: session.eventId || '',
    eventName: session.eventName || '',
  });
}

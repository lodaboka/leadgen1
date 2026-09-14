import { NextResponse } from 'next/server';
import { createSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (!adminUser || !adminPass) {
      return NextResponse.json({ error: 'Admin credentials not configured.' }, { status: 500 });
    }

    if (username !== adminUser || password !== adminPass) {
      return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
    }

    await createSession({
      username: adminUser,
      sheetId: '',
      folderId: '',
      sheetTitle: '',
      folderName: '',
      role: 'admin',
    });

    return NextResponse.json({ success: true, redirectTo: '/admin' });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}

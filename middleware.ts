import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin auth is handled client-side in app/admin/page.tsx.
// All admin API routes independently verify password via x-admin-password header.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

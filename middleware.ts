import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple pass-through middleware for development
// When Clerk is configured, replace this with proper Clerk middleware
export function middleware(req: NextRequest) {
  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

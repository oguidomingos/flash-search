import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtected = createRouteMatcher([
  '/app(.*)',
  '/api/(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    const authResult = auth();
    const { userId } = await authResult;
    
    // Redirect to sign-in if not authenticated
    if (!userId) {
      return Response.redirect(new URL('/sign-in', req.url));
    }
    
    // For app routes, we don't require org selection since we'll create a default workspace
    // The app will handle workspace creation if needed
  }
});

export const config = {
  matcher: [
    '/((?!_next|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)).*)',
  ]
};
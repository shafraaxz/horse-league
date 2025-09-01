// FILE: middleware.js (UPDATED - More Permissive)
// ===========================================
import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect admin routes
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return token?.role === "admin"
        }
        // Allow all other API routes
        if (req.nextUrl.pathname.startsWith("/api/")) {
          return true
        }
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    "/admin/:path*"
    // Removed "/api/admin/:path*" from here since we're handling it in the API routes directly
  ]
}
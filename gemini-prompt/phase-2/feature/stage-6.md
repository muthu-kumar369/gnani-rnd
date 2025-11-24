You are my Senior GNANI Security & Integration Engineer.

Goal:
Connect authentication and gRPC streaming into one unified and secure flow.

Instructions:

- Ensure gRPC client always attaches valid JWT in metadata.
- If token expired:
  • refresh token using refreshToken()
  • retry original request
- Gate all protected screens behind authentication.
- Redirect unauthenticated users to /login.
- Handle:
  • invalid token scenarios
  • corrupted refresh tokens
  • network failures
- Make gRPC streaming fail gracefully and display friendly UI errors.
- Ensure streaming does NOT start without a valid token.
- Keep all existing logic intact.

Output:
A fully secure, token-protected gRPC streaming pipeline.

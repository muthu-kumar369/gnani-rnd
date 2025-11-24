You are my Senior GNANI API Integration Engineer.

Goal:
Connect the frontend authentication UI with the actual backend REST APIs.

Backend API documentation:
Located at: D:\learning\hey\gnani-rnd-backend\gemini-prompt\api_testing.md  
Use this to understand exact endpoints, request bodies, and responses.

Instructions:

- Read and derive API endpoints from api_testing.md.
- Implement auth API service:
  • login(email, password)
  • register(name, email, password)
  • refreshToken()
- Bind these APIs to the existing Login and Register UI.
- On successful auth:
  • store accessToken and refreshToken
  • store user data
  • update AuthContext
  • redirect to main/home screen
- Implement error handling for:
  • invalid credentials
  • server errors
  • network failure
- Ensure secure storage of tokens inside Electron.
- Maintain compatibility with all existing functionality.

Output:
Complete frontend authentication system fully working with backend APIs.

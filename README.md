# Employee Management API

Serverless employee management system with JWT authentication via AWS Cognito.

Stack: **Lambda (Node/TS)**, **API Gateway HTTP API**, **DynamoDB**, **Cognito JWT**, **SAM**.

## API Endpoints
- `POST /employees` – create employee (requires JWT)
- `GET /employees` – list user's employees (requires JWT)
- `GET /employees/{id}` – get employee by ID (requires JWT)
- `PUT /employees/{id}` – update employee (requires JWT)
- `DELETE /employees/{id}` – delete employee (requires JWT)

## Prerequisites
- AWS CLI configured
- SAM CLI installed
- Node.js 22+
- Existing DynamoDB table: `employee` (us-east-2)
- Cognito User Pool with App Client configured

## Setup & Deploy

### 1. Install Dependencies
```bash
npm install
```

### 2. Build
```bash
npm run build
```

### 3. Deploy with SAM
```bash
sam deploy --guided
```

**Deploy Parameters:**
- Stack Name: `employees-api`
- Region: `us-east-2`
- ExistingTableName: `employee`
- JwtIssuer: `https://cognito-idp.us-east-2.amazonaws.com/us-east-2_XXXXXXX`
- JwtAudience: `ac02jug3jsrsegf3qmdjkoo5n`
- Confirm changes: `yes`
- Save arguments: `yes`

## Features
- **JWT Authentication**: All endpoints require valid Cognito JWT token
- **User Isolation**: Each user only sees their own employees
- **Existing Table**: Uses your existing `employee` table with `employee_id` as primary key
- **ARM64 Architecture**: Optimized for cost and performance
- **Structured Logging**: X-Ray tracing enabled
- **CORS**: Enabled for development (restrict in production)
- **Idempotent Operations**: Optional `clientToken` for create operations

## Employee Data Model
```json
{
  "employee_id": "string",
  "name": "string",
  "role": "string (optional)",
  "ownerId": "string (Cognito user ID)",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

## Testing

### 1. Get Access Token via Hosted UI
```
https://us-east-2boithd6r6.auth.us-east-2.amazoncognito.com/login
  ?client_id=ac02jug3jsrsegf3qmdjkoo5n
  &response_type=code
  &scope=openid+email+profile
  &redirect_uri=http://localhost:3000/api/auth/callback/cognito
```

### 2. Test API with curl
```bash
# List employees
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://YOUR_API_ID.execute-api.us-east-2.amazonaws.com/employees

# Create employee
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "role": "Developer"}' \
  https://YOUR_API_ID.execute-api.us-east-2.amazonaws.com/employees
```

## Next.js Integration

### Environment Variables (.env.local)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
COGNITO_ISSUER=https://cognito-idp.us-east-2.amazonaws.com/us-east-2_boItHd6r6
COGNITO_CLIENT_ID=ac02jug3jsrsegf3qmdjkoo5n
NEXT_PUBLIC_API_BASE=https://YOUR_API_ID.execute-api.us-east-2.amazonaws.com
```

### NextAuth Configuration
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

export const authOptions = {
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: "",
      issuer: process.env.COGNITO_ISSUER!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) token.accessToken = account.access_token;
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
};
```

### API Route Example
```typescript
// app/api/employees/route.ts
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession();
  const access = (session as any)?.accessToken;
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/employees`, {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });
  
  return new Response(await response.text(), { status: response.status });
}
```

## Troubleshooting

- **403 Forbidden**: Check JWT token validity and Cognito configuration
- **401 Unauthorized**: Ensure Authorization header is present and valid
- **Handler not found**: Verify `dist/handlers/http.handler` exists after build
- **Region mismatch**: Ensure all resources are in us-east-2
- **Table access**: Verify DynamoDB permissions and table name

## Production Considerations
- Restrict CORS origins to your domain
- Use GSI for better query performance
- Implement rate limiting
- Add input validation and sanitization
- Set up CloudWatch alarms and monitoring
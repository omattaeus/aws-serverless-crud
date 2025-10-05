# Employee Management API

[![AWS](https://img.shields.io/badge/AWS-Serverless-orange?logo=amazon-aws)](https://aws.amazon.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-ready serverless employee management system built with AWS services, featuring JWT authentication, user isolation, and comprehensive CRUD operations.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Gateway   │────│   Lambda (Node)  │────│   DynamoDB      │
│   HTTP API      │    │   TypeScript     │    │   employee      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │                       │
┌─────────────────┐    ┌──────────────────┐
│   Cognito JWT   │    │   X-Ray Tracing  │
│   Authorizer    │    │   CloudWatch     │
└─────────────────┘    └──────────────────┘
```

## 🚀 Features

- **🔐 JWT Authentication**: Secure API access via AWS Cognito
- **👤 User Isolation**: Each user manages only their own employees
- **⚡ Serverless**: Auto-scaling Lambda functions with ARM64 architecture
- **📊 Structured Logging**: Comprehensive logging with X-Ray tracing
- **🔄 Idempotent Operations**: Safe retry mechanisms with client tokens
- **🌐 CORS Support**: Cross-origin requests for web applications
- **📱 RESTful API**: Standard HTTP methods and status codes

## 📋 Prerequisites

Before deploying this application, ensure you have:

- **AWS CLI** configured with appropriate permissions
- **SAM CLI** (Serverless Application Model) installed
- **Node.js 22+** for local development
- **Existing DynamoDB table** named `employee` in `us-east-2` region
- **AWS Cognito User Pool** with App Client configured

### Required AWS Resources

1. **DynamoDB Table**: `employee` with `employee_id` as primary key (String)
2. **Cognito User Pool**: With OAuth 2.0 flows enabled
3. **Cognito App Client**: Configured for your application

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd aws-serverless-crud
npm install
```

### 2. Build the Application

```bash
npm run build
```

This command:
- Compiles TypeScript to JavaScript
- Bundles dependencies with esbuild
- Generates optimized Lambda package

### 3. Deploy with SAM

```bash
sam deploy --guided
```

**Deployment Parameters:**
- **Stack Name**: `employees-api`
- **Region**: `us-east-2`
- **ExistingTableName**: `employee`
- **JwtIssuer**: `https://cognito-idp.us-east-2.amazonaws.com/us-east-2_XXXXXXX`
- **JwtAudience**: Your Cognito App Client ID
- **Confirm changes**: `yes`
- **Save arguments**: `yes`

## 📚 API Documentation

### Base URL
```
https://{api-id}.execute-api.us-east-2.amazonaws.com
```

### Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Create Employee
```http
POST /employees
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "John Doe",
  "role": "Software Engineer",
  "clientToken": "optional-idempotency-token"
}
```

**Response:**
```json
{
  "employee_id": "01HXYZ123ABC",
  "name": "John Doe",
  "role": "Software Engineer",
  "ownerId": "cognito-user-id",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### List Employees
```http
GET /employees
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "employee_id": "01HXYZ123ABC",
    "name": "John Doe",
    "role": "Software Engineer",
    "ownerId": "cognito-user-id",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

#### Get Employee by ID
```http
GET /employees/{employee_id}
Authorization: Bearer <token>
```

#### Update Employee
```http
PUT /employees/{employee_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "John Smith",
  "role": "Senior Software Engineer"
}
```

#### Delete Employee
```http
DELETE /employees/{employee_id}
Authorization: Bearer <token>
```

### Data Model

```typescript
interface Employee {
  employee_id: string;        // Primary key (ULID)
  name: string;              // Required: Employee name
  role?: string;             // Optional: Job role
  ownerId: string;           // Cognito user ID (auto-populated)
  createdAt: string;         // ISO timestamp (auto-populated)
  updatedAt: string;         // ISO timestamp (auto-updated)
}
```

## 🧪 Testing

### 1. Get Access Token

Use the Cognito Hosted UI to obtain a JWT token:

```
https://{your-domain}.auth.us-east-2.amazoncognito.com/login
  ?client_id={your-client-id}
  &response_type=code
  &scope=openid+email+profile
  &redirect_uri={your-redirect-uri}
```

### 2. Test with cURL

```bash
# Set your API endpoint and token
export API_URL="https://your-api-id.execute-api.us-east-2.amazonaws.com"
export TOKEN="your-jwt-token"

# List employees
curl -H "Authorization: Bearer $TOKEN" "$API_URL/employees"

# Create employee
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "role": "Product Manager"}' \
  "$API_URL/employees"

# Get specific employee
curl -H "Authorization: Bearer $TOKEN" "$API_URL/employees/01HXYZ123ABC"

# Update employee
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Smith", "role": "Senior Product Manager"}' \
  "$API_URL/employees/01HXYZ123ABC"

# Delete employee
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/employees/01HXYZ123ABC"
```

### 3. Test with Postman

Import the following collection or create requests manually:

```json
{
  "info": {
    "name": "Employee Management API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "https://your-api-id.execute-api.us-east-2.amazonaws.com"
    }
  ]
}
```

## 🔗 Frontend Integration

### Next.js with NextAuth

#### Environment Variables (.env.local)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
COGNITO_ISSUER=https://cognito-idp.us-east-2.amazonaws.com/us-east-2_XXXXXXX
COGNITO_CLIENT_ID=your-cognito-client-id
NEXT_PUBLIC_API_BASE=https://your-api-id.execute-api.us-east-2.amazonaws.com
```

#### NextAuth Configuration
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

export const authOptions = {
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: "", // SPA doesn't need secret
      issuer: process.env.COGNITO_ISSUER!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

#### API Route Example
```typescript
// app/api/employees/route.ts
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession();
  const accessToken = (session as any)?.accessToken;
  
  if (!accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/employees`, {
    headers: { 
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    cache: "no-store",
  });
  
  const data = await response.json();
  return Response.json(data, { status: response.status });
}
```

### React with Axios

```typescript
// utils/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE,
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const employeeAPI = {
  list: () => api.get('/employees'),
  create: (data: { name: string; role?: string }) => api.post('/employees', data),
  get: (id: string) => api.get(`/employees/${id}`),
  update: (id: string, data: { name?: string; role?: string }) => 
    api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
};
```

## 🔧 Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run watch

# Build for production
npm run build

# Run SAM build
npm run sam:build
```

### Project Structure

```
aws-serverless-crud/
├── src/
│   ├── handlers/
│   │   └── http.ts          # Main Lambda handler
│   ├── lib/
│   │   ├── db.ts            # DynamoDB client
│   │   ├── logger.ts        # Logging utilities
│   │   └── validation.ts    # Input validation
│   └── router.ts            # Route matching logic
├── template.yaml            # SAM template
├── package.json             # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

### Available Scripts

- `npm run build` - Build the application
- `npm run watch` - Build with file watching
- `npm run sam:build` - Build with SAM
- `npm run sam:deploy` - Deploy with SAM

## 🚨 Troubleshooting

### Common Issues

#### 401 Unauthorized
- **Cause**: Missing or invalid JWT token
- **Solution**: Ensure Authorization header is present and token is valid

#### 403 Forbidden
- **Cause**: User trying to access another user's data
- **Solution**: Verify user isolation is working correctly

#### 404 Not Found
- **Cause**: Employee doesn't exist or doesn't belong to user
- **Solution**: Check employee_id and user permissions

#### Handler Not Found
- **Cause**: Lambda function can't find the handler
- **Solution**: Verify build process and SAM deployment

#### Region Mismatch
- **Cause**: Resources in different regions
- **Solution**: Ensure all resources are in us-east-2

### Debugging

#### View Logs
```bash
sam logs --stack-name employees-api --region us-east-2 --tail
```

#### Test Locally
```bash
sam local start-api
```

#### Validate Template
```bash
sam validate
```

## 🔒 Security Considerations

- **JWT Validation**: All requests are validated against Cognito
- **User Isolation**: Users can only access their own data
- **Input Validation**: All inputs are validated and sanitized
- **CORS Configuration**: Restrict origins in production
- **Least Privilege**: IAM policies follow least privilege principle

## 📈 Performance & Monitoring

- **X-Ray Tracing**: Enabled for request tracing
- **CloudWatch Logs**: Structured logging for debugging
- **ARM64 Architecture**: Cost-optimized Lambda runtime
- **Connection Reuse**: AWS SDK connection reuse enabled

## 🚀 Production Deployment

### Environment Setup

1. **CORS Configuration**: Update template.yaml to restrict origins
2. **Environment Variables**: Set production-specific values
3. **Monitoring**: Set up CloudWatch alarms
4. **Backup**: Configure DynamoDB point-in-time recovery

### Scaling Considerations

- **DynamoDB**: Configure auto-scaling for read/write capacity
- **Lambda**: Monitor concurrency limits
- **API Gateway**: Consider throttling for rate limiting

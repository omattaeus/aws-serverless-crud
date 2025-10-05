# Employee Management API

Serverless employee management system built with AWS services.

Stack: **Lambda (Node/TS)**, **API Gateway HTTP API**, **DynamoDB**, **SAM**.

## API Endpoints
- `POST /employees` – create employee
- `GET /employees` – list employees
- `GET /employees/{id}` – get employee by ID
- `PUT /employees/{id}` – update employee
- `DELETE /employees/{id}` – delete employee

## Setup
```bash
npm install
npm run build
sam deploy --guided
```

Choose **us-east-2** region during deployment to match the existing DynamoDB table.

## Features
- Uses existing DynamoDB table with `employee_id` as primary key
- Structured logging with X-Ray tracing
- CORS enabled for development
- Idempotent create operations with optional `clientToken`
- Least privilege IAM policies

## Employee Data Model
```json
{
  "employee_id": "string",
  "name": "string",
  "role": "string (optional)",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

## Future Improvements
- Authentication with Cognito
- Query optimization with GSI
- CI/CD pipeline
- Custom metrics and monitoring
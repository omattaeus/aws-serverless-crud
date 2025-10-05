import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../lib/db.js";
import { validateCreate } from "../lib/validation.js";
import { log } from "../lib/logger.js";
import { ulid } from "ulid";
import { matchRoute, Route } from "../router.js";

const json = (statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  },
  body: JSON.stringify(body)
});

const routes: Route[] = [
  // CREATE
  { method: "POST", path: /^\/employees$/, handler: async (_params, body, userId) => {
      const payload = validateCreate(body);
      const now = new Date().toISOString();
      const employee_id = body?.clientToken || ulid();
      const item = { employee_id, name: payload.name, role: payload.role, ownerId: userId, createdAt: now, updatedAt: now };
      await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item, ConditionExpression: "attribute_not_exists(employee_id)" }));
      return { statusCode: 201, body: item };
    }},

  // LIST
  { method: "GET", path: /^\/employees$/, handler: async (_params, _body, userId) => {
      const out = await ddb.send(new ScanCommand({ 
        TableName: TABLE_NAME, 
        FilterExpression: "ownerId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
        Limit: 100 
      }));
      return { statusCode: 200, body: out.Items ?? [] };
    }},

  // GET BY ID
  { method: "GET", path: /^\/employees\/(?<id>[^/]+)$/, handler: async (params, _body, userId) => {
      const out = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { employee_id: params.id } }));
      if (!out.Item) return { statusCode: 404, body: { message: "Employee not found" } };
      if (out.Item.ownerId !== userId) return { statusCode: 403, body: { message: "Access denied" } };
      return { statusCode: 200, body: out.Item };
    }},

  // UPDATE
  { method: "PUT", path: /^\/employees\/(?<id>[^/]+)$/, handler: async (params, body, userId) => {
      if (!body || (!body.name && !body.role)) return { statusCode: 400, body: { message: "No fields to update" } };
      
      // First check if employee exists and belongs to user
      const existing = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { employee_id: params.id } }));
      if (!existing.Item) return { statusCode: 404, body: { message: "Employee not found" } };
      if (existing.Item.ownerId !== userId) return { statusCode: 403, body: { message: "Access denied" } };

      const now = new Date().toISOString();
      const exp: string[] = [];
      const names: Record<string,string> = {};
      const values: Record<string,any> = { ":updatedAt": now };

      if (typeof body.name === "string") { names["#n"] = "name"; values[":name"] = body.name; exp.push("#n = :name"); }
      if (typeof body.role === "string") { names["#r"] = "role"; values[":role"] = body.role; exp.push("#r = :role"); }
      exp.push("updatedAt = :updatedAt");

      const out = await ddb.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { employee_id: params.id },
        UpdateExpression: "SET " + exp.join(", "),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: { ...values, ":userId": userId },
        ConditionExpression: "attribute_exists(employee_id) AND ownerId = :userId",
        ReturnValues: "ALL_NEW"
      }));
      return { statusCode: 200, body: out.Attributes };
    }},

  // DELETE
  { method: "DELETE", path: /^\/employees\/(?<id>[^/]+)$/, handler: async (params, _body, userId) => {
      await ddb.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { employee_id: params.id },
        ConditionExpression: "attribute_exists(employee_id) AND ownerId = :userId",
        ExpressionAttributeValues: { ":userId": userId }
      }));
      return { statusCode: 204, body: {} };
    }},
];

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    if (event.requestContext.http.method === "OPTIONS") return json(204, {});
    
    const claims = (event.requestContext as any)?.authorizer?.jwt?.claims || {};
    const userId = claims.sub;
    
    if (!userId) return json(401, { message: "Unauthorized" });

    const method = event.requestContext.http.method;
    const path = event.rawPath;
    const body = event.body ? JSON.parse(event.body) : undefined;

    const match = matchRoute(method, path, routes);
    if (!match) return json(404, { message: "Endpoint not found" });

    const res = await match.route.handler(match.params, body, userId);
    log("info", "request_ok", { method, path, status: res.statusCode, userId });
    return json(res.statusCode, res.body);
  } catch (err: any) {
    log("error", "request_error", { message: err?.message, stack: err?.stack });
    const code = String(err?.message || "").includes("ConditionalCheckFailedException") ? 409 : 500;
    return json(code, { message: code === 409 ? "Employee already exists" : "Server error" });
  }
};

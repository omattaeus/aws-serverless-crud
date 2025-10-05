export type Employee = {
  employee_id: string;
  name: string;
  role?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export function validateCreate(body: any): { name: string; role?: string } {
  if (!body || typeof body.name !== "string" || body.name.trim().length < 1) throw new Error("Employee name is required");
  return { name: body.name.trim(), role: body.role };
}
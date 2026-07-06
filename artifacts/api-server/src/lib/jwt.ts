import jwt from "jsonwebtoken";

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set to sign authentication tokens.");
}

export interface JwtPayload {
  employeeId: number;
  role: "employee" | "hr" | "admin";
}

const secret: string = SESSION_SECRET;

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, secret) as unknown as JwtPayload;
  } catch {
    return null;
  }
}

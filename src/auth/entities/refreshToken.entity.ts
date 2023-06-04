import { sign } from "jsonwebtoken";

class RefreshToken {
  constructor(init?: Partial<RefreshToken>) {
    Object.assign(this, init);
  }

  id: number;
  userId: number;
  userAgent: string;
  ipAddress: string;
  role: any;

  sign(): string {
    return sign({ ...this }, process.env.REFRESH_SECRET);
  }
}

export default RefreshToken;
import { sign } from "jsonwebtoken";

class RefreshToken {
  constructor(init?: Partial<RefreshToken>) {
    Object.assign(this, init);
  }

  id: number;
  userId: string;
  userAgent: string;
  ipAddress: string;
  role: any;

  sign(): string {
    return sign({ ...this }, process.env.REFRESH_SECRET, {expiresIn: "1d"});
  }
}

export default RefreshToken;
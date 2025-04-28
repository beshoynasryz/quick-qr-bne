
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface QrCode {
  id: string;
  userId: string;
  content: string;
  color: string;
  size: number;
  createdAt: string;
  imageUrl: string;
}

export interface QrCodeInput {
  content: string;
  color: string;
  size: number;
  createdAt: string;
}


import axios from "axios";
import { QrCode, QrCodeInput } from "@/types";

// For demo purposes, we will mock the API calls
// In a real app, replace with actual API endpoints
export const api = axios.create({
  baseURL: "/api",
});

// Mock data
let mockUser = null;
let mockQrCodes: QrCode[] = [];
let mockQrIdCounter = 1;

// Mock API functions 
export const login = async (email: string, password: string) => {
  // This would normally validate against a database
  if (email === "demo@example.com" && password === "password") {
    const user = { id: "1", name: "Demo User", email };
    const token = "mock-jwt-token";
    mockUser = user;
    return { user, token };
  }
  throw new Error("Invalid credentials");
};

export const register = async (name: string, email: string, password: string) => {
  // This would normally create a user in a database
  const user = { id: Date.now().toString(), name, email };
  const token = "mock-jwt-token";
  mockUser = user;
  return { user, token };
};

export const getCurrentUser = async () => {
  if (!mockUser) throw new Error("Not authenticated");
  return mockUser;
};

// QR code functions
export const saveQrCode = async (input: QrCodeInput) => {
  // In a real app, this would save to a database
  const qrCode: QrCode = {
    id: mockQrIdCounter.toString(),
    userId: mockUser?.id || "1",
    content: input.content,
    color: input.color,
    size: input.size,
    createdAt: input.createdAt,
    imageUrl: await generateMockQrDataUrl(input.content, input.color, input.size)
  };
  
  mockQrIdCounter++;
  mockQrCodes.push(qrCode);
  return qrCode;
};

export const fetchQrCodes = async (): Promise<QrCode[]> => {
  // In a real app, this would fetch from a database
  return [...mockQrCodes].reverse();
};

export const deleteQrCode = async (id: string) => {
  // In a real app, this would delete from a database
  mockQrCodes = mockQrCodes.filter(qr => qr.id !== id);
  return { success: true };
};

// Helper to generate a mock QR code data URL for the demo
const generateMockQrDataUrl = async (
  content: string,
  color: string,
  size: number
) => {
  // In a real app with an API, we wouldn't need this
  // The server would generate and store the image
  try {
    const QRCode = (await import("qrcode")).default;
    return QRCode.toDataURL(content, {
      width: size,
      margin: 1,
      color: {
        dark: color,
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("Error generating mock QR data URL", error);
    return "";
  }
};

// Intercept requests to simulate backend API for demo
api.interceptors.request.use(
  async (config) => {
    // Add this check to avoid intercepting axios imports in generateMockQrDataUrl
    if (config.url?.includes("/qrcode.js")) {
      return config;
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return config;
  },
  (error) => Promise.reject(error)
);

// Mock API responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.config) return Promise.reject(error);
    
    const { method, url, data } = error.config;
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch {
      parsedData = {};
    }
    
    // Handle mock authentication
    if (method === "post" && url === "/auth/login") {
      try {
        const { email, password } = parsedData;
        const result = await login(email, password);
        return { data: result };
      } catch (e) {
        return Promise.reject({ response: { status: 401, data: { message: "Invalid credentials" } } });
      }
    }
    
    if (method === "post" && url === "/auth/register") {
      try {
        const { name, email, password } = parsedData;
        const result = await register(name, email, password);
        return { data: result };
      } catch (e) {
        return Promise.reject({ response: { status: 400, data: { message: "Registration failed" } } });
      }
    }
    
    if (method === "get" && url === "/auth/me") {
      try {
        const user = await getCurrentUser();
        return { data: user };
      } catch (e) {
        return Promise.reject({ response: { status: 401, data: { message: "Not authenticated" } } });
      }
    }
    
    return Promise.reject(error);
  }
);

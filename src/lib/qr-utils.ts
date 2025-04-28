
import { QrDataType } from "@/types";

type QrDataInput = {
  type: QrDataType;
  url: string;
  email: {
    address: string;
    subject: string;
    body: string;
  };
  phone: string;
  wifi: {
    ssid: string;
    password: string;
    encryption: string;
  };
  vcard: {
    name: string;
    phone: string;
    email: string;
    org: string;
    title: string;
  };
};

export function generateQrData(input: QrDataInput): string | null {
  switch (input.type) {
    case "url":
      return input.url.trim() ? input.url.trim() : null;
      
    case "email": {
      if (!input.email.address.trim()) return null;
      
      let emailData = `mailto:${input.email.address.trim()}`;
      const params = [];
      
      if (input.email.subject) params.push(`subject=${encodeURIComponent(input.email.subject)}`);
      if (input.email.body) params.push(`body=${encodeURIComponent(input.email.body)}`);
      
      if (params.length) emailData += `?${params.join('&')}`;
      return emailData;
    }
      
    case "phone":
      return input.phone.trim() ? `tel:${input.phone.trim()}` : null;
      
    case "wifi": {
      if (!input.wifi.ssid) return null;
      
      let wifiData = `WIFI:S:${input.wifi.ssid};`;
      if (input.wifi.encryption !== "nopass") {
        wifiData += `T:${input.wifi.encryption};`;
        if (input.wifi.password) {
          wifiData += `P:${input.wifi.password};`;
        }
      } else {
        wifiData += `T:;`;
      }
      wifiData += `;`;
      return wifiData;
    }
      
    case "vcard": {
      if (!input.vcard.name) return null;
      
      let vcardData = "BEGIN:VCARD\nVERSION:3.0\n";
      vcardData += `FN:${input.vcard.name}\n`;
      
      if (input.vcard.org) vcardData += `ORG:${input.vcard.org}\n`;
      if (input.vcard.title) vcardData += `TITLE:${input.vcard.title}\n`;
      if (input.vcard.phone) vcardData += `TEL:${input.vcard.phone}\n`;
      if (input.vcard.email) vcardData += `EMAIL:${input.vcard.email}\n`;
      
      vcardData += "END:VCARD";
      return vcardData;
    }
      
    default:
      return null;
  }
}

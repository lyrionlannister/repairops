export interface WhatsappAccountStatus {
  status: "connected" | "disconnected";
  phoneNumberId: string;
  ownedByPlatform: boolean;
}

export interface ConnectWhatsappAccountInput {
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
}

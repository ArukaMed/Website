export interface VCardOptions {
  firstName: string;
  lastName: string;
  prefix?: string;
  orgName: string;
  division?: string;
  title: string;
  phoneNumber: string;
  whatsappNumber?: string;
  email: string;
  address?: {
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  website?: string;
  linkedinUrl?: string;
  note?: string;
}

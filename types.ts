
export enum AlertCategory {
  ACCIDENT = 'Accidente',
  CRIME = 'Seguridad/Robo',
  TRAFFIC = 'Tránsito',
  FIRE = 'Incendio',
  SERVICE = 'Corte de Servicio',
  BROKEN_ASPHALT = 'Asfalto Roto'
}

// Added email property to User interface to fix AuthContext.tsx errors
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  reputation: number;
  isAnonymous: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface Alert {
  id: string;
  userId: string;
  userName: string;
  userReputation: number;
  category: AlertCategory;
  description: string;
  image?: string; // Base64 image data
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  timestamp: number;
  upvotes: number;
  downvotes: number;
  status: 'active' | 'resolved' | 'verified';
  comments?: Comment[];
}

export interface NotificationSettings {
  enabled: boolean;
  radiusKm: number;
  categories: AlertCategory[];
}

export interface NewsUpdate {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

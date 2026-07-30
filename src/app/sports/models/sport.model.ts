export interface Sport {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
  updatedAt?: string;
  organisations: number;
  participants: number;
  governingBodies: GoverningBody[];
}

export interface GoverningBody {
  id: string;
  name: string;
  logo?: string;
  createdAt: string;
  updatedAt?: string;
  onboardedAt?: string;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
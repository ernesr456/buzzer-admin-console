export interface Sport {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
  updatedAt?: string;
  governingBodies: Entity[];
}

export interface Entity {
  id: string;
  name: string;
  logo?: string;
  createdAt: string;
  updatedAt?: string;
  onboardedAt?: string;
  organizations: Organization[];
}

export interface Organization{
  id: string;
  name: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  onboardedAt?: string;
}

export interface Participant{
  id: string;
  name: string;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
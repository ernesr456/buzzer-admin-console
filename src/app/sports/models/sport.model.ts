export interface Sport {
  id: string;
  name: string;
  emoji: string;
  color: string;
  governingBodies: number;
  organisations: number;
  participants: number;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
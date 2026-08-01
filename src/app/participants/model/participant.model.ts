export interface ParticipantModel {
  id: string;
  organizationId?: string;
  name: string;
  role?: string;
  logo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
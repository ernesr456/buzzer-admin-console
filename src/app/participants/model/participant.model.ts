export interface ParticipantModel {
  id: string;
  organisationId: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt?: Date;
}
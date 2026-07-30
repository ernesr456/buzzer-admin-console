import { ParticipantModel } from "../../participants/model/participant.model";

export interface OrganizationModel{
  id: string;
  name: string;
  participants: ParticipantModel[];
  createdAt: string;
  updatedAt: string;
  onboardedAt?: string;
}
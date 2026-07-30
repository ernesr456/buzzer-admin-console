import { ParticipantModel } from "../../participants/model/participant.model";

export interface OrganizationModel{
  id: string;
  name: string;
  logo?: string;
  participants: ParticipantModel[];
  createdAt: string;
  updatedAt: string;
  onboardedAt?: string;
}
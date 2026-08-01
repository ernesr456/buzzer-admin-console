import { ParticipantModel } from "../../participants/model/participant.model";

export interface OrganizationModel {
  id: string;
  name: string;
  type?: string;
  crestUrl?:string;
  country?: string;
  governingBodyId?:string;
  logo?: string;
  participants: ParticipantModel[];
  createdAt: Date;
  updatedAt: Date;
  onboardedAt?: Date;
}
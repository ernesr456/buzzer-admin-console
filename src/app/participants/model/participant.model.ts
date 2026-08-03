import { SquadModel } from "../../squad/models/squad.model";
import { StaffModel } from "../../staff/mode/staff.model";

export interface ParticipantModel {
  id: string;
  organisationId: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt?: Date;
  squads: SquadModel[]
  staff: StaffModel[]
}
import { StaffModel } from "../../staff/mode/staff.model";

export interface SquadModel {
  id: string;
  organizationId: string;
  userId: string;
  position: string;
  agreementEnd: string;
  displayName?:string;
  age?:string;
  photoUrl?:string;
  createdAt: Date;
  updatedAt: Date;
}
export interface StaffModel {
  id: string;
  organisationId?: string;
  name: string;
  roleTitle: string;
  category:string;
  nationality: string;
  photoUrl: string;
  role: string;
  createdAt: Date;
  updatedAt?: Date;
}
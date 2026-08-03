import { OrganizationModel } from '../../organizations/model/organization.model';

export interface EntityModel {
  id: string;
  sportId: string;
  name: string;
  country:string;
  createdAt: Date;
  updatedAt?: Date;
  counts?:{
    governingBodies: number,
    organisations: number,
    participants: number,
  }
  onboardedAt?: Date;
  organizations?: OrganizationModel[];
}
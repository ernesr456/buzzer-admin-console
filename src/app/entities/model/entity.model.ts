import { OrganizationModel } from '../../organizations/model/organization.model';

export interface EntityModel {
  id: string;
  sportId?: string;
  name: string;
  country?:string;
  logo?: string;
  createdAt: Date;
  updatedAt?: Date;
  onboardedAt?: Date;
  organizations?: OrganizationModel[];
}
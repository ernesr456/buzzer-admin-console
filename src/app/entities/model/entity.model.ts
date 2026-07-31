import { OrganizationModel } from '../../organizations/model/organization.model';

export interface EntityModel {
  id: string;
  name: string;
  logo?: string;
  createdAt: Date;
  updatedAt?: Date;
  onboardedAt?: Date;
  organizations: OrganizationModel[];
}
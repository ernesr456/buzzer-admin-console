import { OrganizationModel } from "../../organizations/model/organization.model";

export interface EntityModel {
  id: string;
  name: string;
  logo?: string;
  createdAt: string;
  updatedAt?: string;
  onboardedAt?: string;
  organizations: OrganizationModel[];
}
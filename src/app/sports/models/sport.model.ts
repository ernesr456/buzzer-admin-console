import { EntityModel } from "../../entities/model/entity.model";

export interface SportModel {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
  entities: EntityModel[];
}

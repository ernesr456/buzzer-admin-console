import { EntityModel } from "../../entities/model/entity.model";

export interface SportModel {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: Date;
  updatedAt?: Date;
  entities: EntityModel[];
}

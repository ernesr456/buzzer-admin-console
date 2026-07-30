import { EntityModel } from "../../entities/model/entity.model";

export interface SportModel {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
  updatedAt?: string;
  governingBodies: EntityModel[];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
"use client";

import { CategoryManager } from "./category-manager";
import {
  createGameCategory,
  updateGameCategory,
  deleteGameCategory,
} from "@/actions/settings";

interface Category {
  id:            string;
  name:          string;
  incomePerGame: string | null;
  count:         number;
}

interface Props {
  academyId:  string;
  categories: Category[];
}

export function GameCategoriesPanel({ academyId, categories }: Props) {
  return (
    <CategoryManager
      categories={categories}
      showIncome
      onAdd={(fd)        => createGameCategory(academyId, fd)}
      onUpdate={(id, fd) => updateGameCategory(academyId, id, fd)}
      onDelete={(id)     => deleteGameCategory(academyId, id)}
    />
  );
}

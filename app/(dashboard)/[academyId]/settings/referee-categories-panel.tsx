"use client";

import { CategoryManager } from "./category-manager";
import {
  createRefereeCategory,
  updateRefereeCategory,
  deleteRefereeCategory,
} from "@/actions/settings";

interface Category {
  id:          string;
  name:        string;
  ratePerGame: string | null;
  count:       number;
}

interface Props {
  academyId:  string;
  categories: Category[];
}

export function RefereeCategoriesPanel({ academyId, categories }: Props) {
  return (
    <CategoryManager
      categories={categories.map((c) => ({ ...c, incomePerGame: c.ratePerGame }))}
      showIncome
      incomeLabel="Tarifa por juego (COP)"
      onAdd={(fd)       => createRefereeCategory(academyId, fd)}
      onUpdate={(id, fd) => updateRefereeCategory(academyId, id, fd)}
      onDelete={(id)    => deleteRefereeCategory(academyId, id)}
    />
  );
}

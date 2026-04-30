"use client";

import { CategoryManager } from "./category-manager";
import {
  createGamePhase,
  updateGamePhase,
  deleteGamePhase,
} from "@/actions/settings";

interface Phase {
  id:    string;
  name:  string;
  count: number;
}

interface Props {
  academyId: string;
  phases:    Phase[];
}

export function GamePhasesPanel({ academyId, phases }: Props) {
  return (
    <CategoryManager
      categories={phases.map((p) => ({ id: p.id, name: p.name, count: p.count }))}
      onAdd={(fd)        => createGamePhase(academyId, fd)}
      onUpdate={(id, fd) => updateGamePhase(academyId, id, fd)}
      onDelete={(id)     => deleteGamePhase(academyId, id)}
    />
  );
}

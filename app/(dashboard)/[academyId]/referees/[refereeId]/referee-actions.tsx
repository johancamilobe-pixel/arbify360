"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deactivateReferee, reactivateReferee } from "@/actions/referees";
import { RefereeForm } from "../referee-form";
import { Loader2, Edit, UserX, UserCheck } from "lucide-react";

interface Category { id: string; name: string }

interface Props {
  academyId:  string;
  userId:     string;
  isActive:   boolean;
  categories: Category[];
  defaults: {
    email:              string;
    firstName:          string;
    lastName:           string;
    documentType?:      string;
    documentNumber?:    string;
    birthDate?:         string;
    phone?:             string;
    phone2?:            string;
    licenseNumber?:     string;
    refereeCategoryId?: string;
    };
}

export function RefereeActions({ academyId, userId, isActive, categories, defaults }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showEditForm, setShowEditForm] = useState(false);

  function handleToggleActive() {
    startTransition(async () => {
      if (isActive) {
        await deactivateReferee(academyId, userId);
      } else {
        await reactivateReferee(academyId, userId);
      }
      router.refresh();
    });
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <h2 className="font-semibold text-foreground">Acciones</h2>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowEditForm(!showEditForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground/80 bg-muted hover:bg-muted rounded-lg transition-colors"
        >
          <Edit className="w-4 h-4" />
          {showEditForm ? "Cancelar edición" : "Editar datos"}
        </button>

        <button
          onClick={handleToggleActive}
          disabled={isPending}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-70 ${
            isActive
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isActive ? (
            <UserX className="w-4 h-4" />
          ) : (
            <UserCheck className="w-4 h-4" />
          )}
          {isActive ? "Desactivar árbitro" : "Reactivar árbitro"}
        </button>
      </div>

      {showEditForm && (
        <div className="pt-4 border-t border-border/50">
          <RefereeForm
            academyId={academyId}
            categories={categories}
            mode="edit"
            userId={userId}
            defaults={defaults}
            onSuccess={() => setShowEditForm(false)}
          />
        </div>
      )}
    </div>
  );
}

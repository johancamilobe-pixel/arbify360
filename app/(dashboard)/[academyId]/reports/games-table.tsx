import { formatDate, formatCurrency, cn, GAME_STATUS_LABELS, getGameStatusColor } from "@/lib/utils";
import type { GameFinancialRow } from "@/actions/reports";
import Link from "next/link";

interface GamesFinancialTableProps {
  games: GameFinancialRow[];
  academyId: string;
}

export function GamesFinancialTable({ games, academyId }: GamesFinancialTableProps) {
  if (games.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground/70">No hay juegos en este período</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground">
          Desglose por juego
        </h3>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          {games.length} juego{games.length !== 1 ? "s" : ""} en el período
        </p>
      </div>

      {/* Vista desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background text-left">
              <th className="px-5 py-3 font-medium text-muted-foreground">Juego</th>
              <th className="px-5 py-3 font-medium text-muted-foreground">Fecha</th>
              <th className="px-5 py-3 font-medium text-muted-foreground">Categoría</th>
              <th className="px-5 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="px-5 py-3 font-medium text-muted-foreground text-right">Ingreso</th>
              <th className="px-5 py-3 font-medium text-muted-foreground text-right">Egresos</th>
              <th className="px-5 py-3 font-medium text-muted-foreground text-right">Ganancia</th>
              <th className="px-5 py-3 font-medium text-muted-foreground text-center">Planillas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {games.map((game) => (
              <tr key={game.id} className="hover:bg-background transition-colors">
                <td className="px-5 py-3">
                  <Link
                    href={`/${academyId}/games/${game.id}`}
                    className="font-medium text-foreground hover:text-brand-600 transition-colors"
                  >
                    {game.homeTeam} vs {game.awayTeam}
                  </Link>
                  <p className="text-xs text-muted-foreground/70">{game.venue}</p>
                </td>
                <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDate(game.startTime)}
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {game.categoryName}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    getGameStatusColor(game.status)
                  )}>
                    {GAME_STATUS_LABELS[game.status]}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-medium text-foreground whitespace-nowrap">
                  {formatCurrency(game.incomeAmount)}
                </td>
                <td className="px-5 py-3 text-right text-red-600 whitespace-nowrap">
                  {game.totalExpenses > 0 ? `−${formatCurrency(game.totalExpenses)}` : "$0"}
                </td>
                <td className={cn(
                  "px-5 py-3 text-right font-semibold whitespace-nowrap",
                  game.netProfit >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(game.netProfit)}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={cn(
                    "text-xs font-medium",
                    game.approvedCount === game.totalAssignments && game.totalAssignments > 0
                      ? "text-green-600"
                      : "text-muted-foreground/70"
                  )}>
                    {game.approvedCount}/{game.totalAssignments}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista mobile */}
      <div className="md:hidden divide-y divide-border/50">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/${academyId}/games/${game.id}`}
            className="block p-4 hover:bg-background transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">
                  {game.homeTeam} vs {game.awayTeam}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  {formatDate(game.startTime)} · {game.venue}
                </p>
              </div>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                getGameStatusColor(game.status)
              )}>
                {GAME_STATUS_LABELS[game.status]}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border/50">
              <div>
                <p className="text-xs text-muted-foreground/70">Ingreso</p>
                <p className="text-sm font-medium text-foreground">{formatCurrency(game.incomeAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground/70">Egresos</p>
                <p className="text-sm font-medium text-red-600">
                  {game.totalExpenses > 0 ? formatCurrency(game.totalExpenses) : "$0"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground/70">Ganancia</p>
                <p className={cn(
                  "text-sm font-semibold",
                  game.netProfit >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(game.netProfit)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

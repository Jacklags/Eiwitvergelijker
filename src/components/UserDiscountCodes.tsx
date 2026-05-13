import { Plus, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

export interface UserCode {
  id: string;
  shop: string;
  pct: number;
}

interface Props {
  shops: readonly string[];
  codes: UserCode[];
  onChange: (codes: UserCode[]) => void;
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function UserDiscountCodes({ shops, codes, onChange }: Props) {
  const activeCount = codes.filter((c) => c.shop && c.pct > 0).length;

  const addCode = () => onChange([...codes, { id: newId(), shop: "", pct: 0 }]);

  const removeCode = (id: string) => onChange(codes.filter((c) => c.id !== id));

  const updateCode = (id: string, patch: Partial<UserCode>) =>
    onChange(codes.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const rows = codes.length > 0 ? codes : [{ id: "__placeholder", shop: "", pct: 0 }];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <Ticket className="h-4 w-4" />
          Mijn kortingscode
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center rounded bg-accent text-accent-foreground text-[10px] h-4 px-1.5 font-mono">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <div className="px-4 py-2.5 border-b border-border">
          <p className="text-sm font-semibold">Mijn kortingscode</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Eigen code? Voeg ‘m toe en zie meteen wat dat doet met de prijs per gram eiwit. Wij
            passen je code niet zelf toe — gebruik ‘m bij de webshop zelf.
          </p>
        </div>

        <div className="p-4 space-y-3">
          {rows.map((c) => {
            const isPlaceholder = c.id === "__placeholder";
            return (
              <div key={c.id} className="grid grid-cols-[1fr_84px_32px] gap-2 items-end">
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground tracking-wider">
                    Winkel
                  </Label>
                  <select
                    value={c.shop}
                    onChange={(e) => {
                      if (isPlaceholder) {
                        onChange([...codes, { id: newId(), shop: e.target.value, pct: c.pct }]);
                      } else {
                        updateCode(c.id, { shop: e.target.value });
                      }
                    }}
                    className="mt-1 h-8 w-full px-2 text-sm rounded-md border border-input bg-background"
                  >
                    <option value="">Kies winkel…</option>
                    {shops.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground tracking-wider">
                    Korting %
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={c.pct || ""}
                    placeholder="0"
                    onChange={(e) => {
                      const next = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      if (isPlaceholder) {
                        if (next > 0) {
                          onChange([...codes, { id: newId(), shop: c.shop, pct: next }]);
                        }
                      } else {
                        updateCode(c.id, { pct: next });
                      }
                    }}
                    className="mt-1 h-8 text-xs font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => !isPlaceholder && removeCode(c.id)}
                  disabled={isPlaceholder}
                  aria-label="Verwijder"
                  className="h-8 w-8 mb-[1px] inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          <Separator />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCode}
            className="h-8 w-full gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Voeg winkel toe
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

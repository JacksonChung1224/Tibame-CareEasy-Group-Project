export default function MoneyRow({ label, total, gov, self, identity, note }) {
  return (
    <div className="rounded-2xl ring-1 ring-border bg-card p-5 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-foreground">{label}</span>
        {note && <span className="text-sm text-muted-foreground">{note}</span>}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-amber-50 ring-1 ring-amber-200/60 rounded-xl p-3">
          <div className="text-xs text-muted-foreground mb-1 font-medium">補助上限</div>
          <div className="text-base font-bold text-foreground">${total.toLocaleString()}</div>
        </div>
        <div className="bg-teal-50 ring-1 ring-teal-200/60 rounded-xl p-3">
          <div className="text-xs text-primary mb-1 font-medium">政府補助</div>
          <div className="text-base font-bold text-primary">${gov.toLocaleString()}</div>
        </div>
        <div className="bg-stone-100 ring-1 ring-stone-200/60 rounded-xl p-3">
          <div className="text-xs text-muted-foreground mb-1 font-medium">自付額</div>
          <div className="text-base font-bold text-foreground">
            {identity === "low" ? "免費" : `$${self.toLocaleString()}`}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MoneyRow({ label, total, gov, self, identity, note }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-stone-700">{label}</span>
        {note && <span className="text-xs text-stone-400">{note}</span>}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-stone-50 rounded-lg p-2">
          <div className="text-xs text-stone-400 mb-0.5">補助上限</div>
          <div className="text-base font-bold text-stone-800">${total.toLocaleString()}</div>
        </div>
        <div className="bg-teal-50 rounded-lg p-2">
          <div className="text-xs text-teal-600 mb-0.5">政府補助</div>
          <div className="text-base font-bold text-teal-700">${gov.toLocaleString()}</div>
        </div>
        <div className="bg-rose-50 rounded-lg p-2">
          <div className="text-xs text-rose-500 mb-0.5">自付額</div>
          <div className="text-base font-bold text-rose-600">
            {identity === "low" ? "免費" : `$${self.toLocaleString()}`}
          </div>
        </div>
      </div>
    </div>
  );
}

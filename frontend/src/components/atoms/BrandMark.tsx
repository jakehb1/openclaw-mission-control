export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#0071e3] to-[#5856d6] text-lg shadow-lg shadow-blue-500/20">
        <span className="text-white">🤖</span>
      </div>
      <div className="leading-tight">
        <div className="font-heading text-[15px] font-semibold tracking-tight text-strong">
          Clawdbot
        </div>
        <div className="text-[11px] font-medium text-quiet">
          Mission Control
        </div>
      </div>
    </div>
  );
}

export function BrandMarkCompact() {
  return (
    <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#0071e3] to-[#5856d6] text-base shadow-lg shadow-blue-500/20">
      <span className="text-white">🤖</span>
    </div>
  );
}

import type { LandingAudience } from "./landingData";
import { landingAudiences } from "./landingData";

export function PersonaToggle({
  selected,
  onSelect
}: {
  selected: LandingAudience;
  onSelect: (audience: LandingAudience) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white/95 p-1.5 shadow-panel backdrop-blur">
      <div className="grid grid-cols-2 gap-1">
        {landingAudiences.map((audience) => {
          const active = selected === audience.id;

          return (
            <button
              key={audience.id}
              type="button"
              onClick={() => onSelect(audience.id)}
              className={`min-w-32 rounded-xl px-4 py-3 text-left transition-all ${
                active ? "bg-ink text-white shadow-sm" : "text-gray-500 hover:bg-gray-50 hover:text-ink"
              }`}
              aria-pressed={active}
            >
              <span className="block text-micro font-black uppercase tracking-widest opacity-60">
                {audience.eyebrow}
              </span>
              <span className="block text-body font-black">{audience.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

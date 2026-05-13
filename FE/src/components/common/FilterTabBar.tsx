interface FilterOption {
  id: string;
  label: string;
}

interface FilterTabBarProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterTabBar({ options, value, onChange }: FilterTabBarProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`px-6 py-2 rounded-full whitespace-nowrap transition-colors capitalize ${
            value === option.id
              ? "bg-primary text-primary-foreground"
              : "bg-card text-foreground border border-border hover:bg-muted"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export const TABS = [
  { key: 'terminal', label: 'Terminal' },
  { key: 'historia', label: 'Historia' },
  { key: 'poziomy', label: 'Poziomy' },
  { key: 'kalendarz', label: 'Kalendarz' },
  { key: 'research', label: 'Research' },
  { key: 'dziennik', label: 'Dziennik' },
];

export function TermTabs({ activeTab, onChange }) {
  return (
    <nav className="term-tabs">
      <div className="term-tabs-in" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} className="term-tab" role="tab" aria-selected={activeTab === t.key} onClick={() => onChange(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function MobileNav({ activeTab, onChange }) {
  return (
    <nav className="mobile-nav" role="tablist">
      {TABS.map((t) => (
        <button key={t.key} aria-selected={activeTab === t.key} onClick={() => onChange(t.key)}>{t.label}</button>
      ))}
    </nav>
  );
}

interface HeaderProps {
  projectName?: string;
}

export default function Header({ projectName = "Commodities Tracker" }: HeaderProps) {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <h1 className="text-xl font-bold text-neutral-100 tracking-tight">
          {projectName}
        </h1>
      </div>
    </header>
  );
}

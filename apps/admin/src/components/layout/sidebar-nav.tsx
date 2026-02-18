import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';

const links = [
  { to: '/', label: 'Overview', short: 'OV' },
  { to: '/analytics', label: 'Analytics', short: 'AN' },
  { to: '/applications', label: 'Applications', short: 'AP' },
  { to: '/disputes', label: 'Disputes', short: 'DP' },
  { to: '/reports', label: 'Reports', short: 'RP' },
  { to: '/refunds', label: 'Refunds', short: 'RF' },
  { to: '/users', label: 'Users', short: 'US' },
  { to: '/activity', label: 'Activity', short: 'AL' },
  { to: '/activity-feed', label: 'Live Feed', short: 'LF' },
  { to: '/system-health', label: 'System Health', short: 'SH' },
];

export function SidebarNav() {
  return (
    <aside className="sticky top-0 h-screen border-r border-border/70 bg-card/80 backdrop-blur">
      <div className="flex h-full w-72 flex-col p-5">
        <div className="mb-10">
          <p className="font-display text-lg uppercase tracking-[0.2em] text-primary">
            BarterDash
          </p>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Admin Console
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Live moderation and operational controls
          </p>
        </div>

        <nav className="space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-foreground/80 hover:bg-secondary hover:text-foreground',
                )
              }
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-current/30 text-[11px] font-bold">
                {link.short}
              </span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground">
          Admin actions are enforced by backend role checks.
        </div>
      </div>
    </aside>
  );
}

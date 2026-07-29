import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
function initials(name) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "EU"
  );
}
export function UserMenu({ compact = false, className }) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const name = profile?.name || user?.displayName || "Estudante";
  const email = profile?.email || user?.email || "";
  const avatarUrl = profile?.avatarUrl || user?.photoURL || "";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Abrir menu de ${name}`}
        className={cn(
          "flex items-center gap-3 rounded-xl text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          compact ? "size-10 justify-center" : "w-full px-2 py-2",
          className,
        )}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="size-9 shrink-0 rounded-full object-cover ring-1 ring-border"
          />
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary ring-1 ring-primary/30">
            {initials(name)}
          </span>
        )}
        {!compact ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {profile?.turma || email}
            </span>
          </span>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={compact ? "end" : "start"}
        side={compact ? "bottom" : "top"}
        className="w-64"
      >
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block truncate text-xs text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await logout();
            await navigate({ to: "/" });
          }}
        >
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

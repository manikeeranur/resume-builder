"use client";

// Exact port of platform-fe's components/common/custom-threedot-menu.tsx —
// TypeScript interfaces stripped, structure/behavior unchanged. Now backed
// by the real Radix DropdownMenu (components/components/ui/dropdown-menu.jsx)
// instead of a hand-rolled click-outside div.
import { Fragment } from "react";
import { MoreHorizontal } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/components/ui/dropdown-menu";
import { Button } from "@/components/components/ui/button";

export default function CustomThreeDotMenu({ actions, trigger }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button type="button" variant="ghost" size="icon" aria-label="Open actions menu" className="rounded-md hover:bg-gray-100">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <Fragment key={action.label}>
            {action.separatorBefore && <DropdownMenuSeparator />}

            <DropdownMenuItem
              disabled={action.disabled}
              className={`${
                action.disabled ? "cursor-not-allowed text-gray-400 opacity-50 focus:text-gray-400" : "cursor-pointer"
              } ${action.destructive && !action.disabled ? "text-red-600 focus:text-red-600" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                if (action.disabled) {
                  e.preventDefault();
                  return;
                }

                action.onClick();
              }}
            >
              {action.icon}
              <span>{action.label}</span>
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";

function Pending({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return <span className="vv-navigation-feedback" data-pending={pending || undefined}>
    <span aria-hidden="true" className="vv-navigation-dot" />
    <span role="status" className="sr-only">{pending ? `Opening ${label}…` : ""}</span>
  </span>;
}

// Let Link own the transition, cancellation and modified-click semantics.
export default function NavigationLink({ children, pendingLabel, ...props }:
  ComponentProps<typeof Link> & { pendingLabel: string }) {
  return <Link {...props}>{children}<Pending label={pendingLabel} /></Link>;
}

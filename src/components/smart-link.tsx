import * as React from "react";
import { Link } from "@tanstack/react-router";
import { rewriteHref } from "@/lib/link-rewrite";

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
};

/**
 * Drop-in replacement for <a href="...">. Automatically:
 * - Rewrites Sharetribe-owned paths (/s, /l/*, /signup, /login, /profile, ...)
 *   to absolute production URLs so preview hosts never trap the user.
 * - Opens external/marketplace links in a new tab with rel=noopener.
 * - Uses TanStack <Link> for in-app navigation when the target is a
 *   known local route (root-relative, non-Sharetribe).
 *
 * Use this anywhere you'd write a raw <a href="/something">.
 */
export function SmartLink({ href, children, target, rel, ...rest }: Props) {
  const { href: finalHref, external } = rewriteHref(href);

  if (external) {
    return (
      <a
        href={finalHref}
        target={target ?? "_blank"}
        rel={rel ?? "noopener noreferrer"}
        {...rest}
      >
        {children}
      </a>
    );
  }

  // Internal — use TanStack Link for client-side navigation.
  return (
    <Link to={finalHref} {...(rest as any)}>
      {children}
    </Link>
  );
}

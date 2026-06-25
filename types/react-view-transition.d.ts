import "react";

// React's <ViewTransition> is still experimental and not yet in @types/react.
// Next 16's `experimental.viewTransition` enables it at runtime; this module
// augmentation makes `import { ViewTransition } from "react"` typecheck.
declare module "react" {
  export function ViewTransition(props: {
    children: React.ReactNode;
    name?: string;
    share?: string;
    enter?: string | Record<string, string>;
    exit?: string | Record<string, string>;
    default?: string;
    key?: string;
  }): React.ReactElement;
}

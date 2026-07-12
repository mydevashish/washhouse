# Components

Atomic-ish structure inside a feature-first codebase.

## Tiers

```
components/
├── ui/         ← atoms (shadcn/ui primitives, Button, Input, Badge, Card)
├── layout/     ← shells (Header, Footer, Container, PageHeader, Sidebar)
├── data/       ← data display (DataTable, EmptyState, StatCard)
├── form/       ← form building blocks (FormField, FormError, FieldHint)
└── feedback/   ← Toast, Alert, Skeleton, Spinner
```

Feature-specific components live under `features/<feature>/components/`.

## Rules

- **Server by default.** Add `"use client"` only when you need state, effects, refs, or browser APIs.
- **Props discipline.** Strict types. No `any`. No prop drilling > 2 levels — lift state or use context.
- **Composition > inheritance.** Expose slots via `children` or named slots, not boolean flags.
- **Variants via `cva`.** Use `class-variance-authority` for component variants. No ad-hoc `if (variant === ...)`.
- **`cn()` everywhere.** Merge classes with `cn()` from `lib/utils.ts`.
- **Accessible by default.** Every interactive element has an accessible name, focus state, and keyboard support.
- **Mobile-first.** Build at 375px width first; enhance up.

## Naming

| What                        | Casing            |
| --------------------------- | ----------------- |
| Component file              | `PascalCase.tsx`  |
| Hook file                   | `use-<name>.ts`   |
| Type-only file              | `types.ts`        |
| Style tokens                | `tokens.css`      |

## Example shell

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        ghost:   "hover:bg-accent hover:text-accent-foreground",
        outline: "border border-input bg-background hover:bg-accent",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-11 px-6",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
```

## Where to put it

| Reused across features? | Where                                          |
| ----------------------- | ---------------------------------------------- |
| Yes, generic            | `components/ui` / `components/layout`          |
| Yes, domain             | `components/data` / `components/form`          |
| No, single feature      | `features/<feature>/components/`               |

## Anti-patterns

- Giant `<div>` soups with no semantic tags
- "God" components doing fetching + state + layout + rendering
- Reaching into another feature's components directly
- Inline `style={{}}` for anything beyond dynamic values
- Animating layout properties (use `transform` / `opacity`)

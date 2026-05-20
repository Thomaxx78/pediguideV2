import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

/**
 * Pediguide button — design overhaul.
 *
 * The DEFAULT button matches the parent-flow design: 52px tall, generous padding,
 * 16px text, medical-blue fill, soft shadow, 140ms transitions, subtle 1px Y press.
 * The previous shadcn-vue `h-9` shape lives on as size="sm" for tables/toolbars.
 *
 * Size scale: xl (52px, design default) / lg (48px) / md (40px) / sm (36px) /
 *             icon-* (square variants).
 */
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer",
    "font-medium select-none border border-transparent tracking-[-0.005em]",
    "transition-[background-color,color,border-color,box-shadow,transform] duration-[120ms] ease-[cubic-bezier(.2,.7,.2,1)]",
    "active:translate-y-px active:duration-[80ms]",
    "disabled:pointer-events-none disabled:opacity-60",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
    "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45",
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary medical-blue button (design default) — subtle inset top
        // highlight + soft drop shadow give it the slightly-raised feel.
        default:
          "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-button-primary)] hover:bg-[color-mix(in_oklab,var(--color-primary-base)_92%,black)] hover:border-[color-mix(in_oklab,var(--color-primary-base)_92%,black)]",
        primary:
          "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-button-primary)] hover:bg-[color-mix(in_oklab,var(--color-primary-base)_92%,black)] hover:border-[color-mix(in_oklab,var(--color-primary-base)_92%,black)]",
        // Surface button — white/light fill with ink text and a hairline border.
        secondary:
          "bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-line-2)] shadow-[var(--shadow-button)] hover:bg-[var(--color-surface-2)]",
        // Transparent ghost.
        ghost:
          "bg-transparent text-[var(--color-ink-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]",
        outline:
          "border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground",
        destructive:
          "bg-destructive text-white border-destructive shadow-[var(--shadow-button-primary)] hover:bg-[color-mix(in_oklab,var(--color-error)_92%,black)] hover:border-[color-mix(in_oklab,var(--color-error)_92%,black)] focus-visible:ring-destructive/30",
        link:
          "text-primary underline-offset-4 hover:underline shadow-none active:translate-y-0",
      },
      size: {
        // Design default — 52px tall, generous padding, 16px text, medium radius.
        default: "h-[52px] rounded-[var(--r-md)] px-[22px] text-base has-[>svg]:px-5",
        xl: "h-[52px] rounded-[var(--r-md)] px-[22px] text-base has-[>svg]:px-5",
        lg: "h-12 rounded-[var(--r-md)] px-5 text-[15px] has-[>svg]:px-4",
        md: "h-10 rounded-[var(--r-sm)] px-4 text-sm has-[>svg]:px-3",
        // Compact — old shadcn h-9 shape, for dense doctor-side contexts.
        sm: "h-9 rounded-[var(--r-sm)] px-3.5 text-sm gap-1.5 has-[>svg]:px-3",
        xs: "h-8 rounded-[var(--r-sm)] px-3 text-xs gap-1.5 has-[>svg]:px-2.5",
        icon: "size-[52px] rounded-[var(--r-md)]",
        "icon-lg": "size-12 rounded-[var(--r-md)]",
        "icon-md": "size-10 rounded-[var(--r-sm)]",
        "icon-sm": "size-9 rounded-[var(--r-sm)]",
        "icon-xs": "size-8 rounded-[var(--r-sm)]",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      block: false,
    },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>

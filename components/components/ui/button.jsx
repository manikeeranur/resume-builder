// Exact structural port of platform-fe's components/components/ui/button.tsx
// (cva variant map + forwardRef) — TypeScript types stripped. Only the
// *class-name tokens* are remapped from platform-fe's brand palette
// (brand-green-*, neutrals-*, negative-*) to resume-builder's own existing
// theme tokens (primary, bg, border, text...), per the "same code, our
// colors" call — everything else (variant/size names, structure, cva usage)
// is unchanged, so CustomTable/CustomThreeDotMenu's `<Button variant="secondary" size="sm">`
// usage works exactly as in the source.
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/components/lib/utils";

const buttonVariants = cva(
  "rounded-[32px] inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 disabled:bg-bg disabled:text-text-secondary",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-hover focus:bg-primary-hover active:bg-primary-hover",
        primary: "bg-primary text-white hover:bg-primary-hover focus:bg-primary-hover active:bg-primary-hover",
        dark: "bg-text text-white",
        secondary:
          "border border-border text-text hover:bg-bg focus:bg-bg focus:border-primary active:text-primary active:bg-primary-light",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:bg-red-700 active:bg-red-800",
        ghostPrimary:
          "bg-none text-primary hover:text-primary-hover focus:text-primary focus:border-[1px] focus:border-primary active:text-primary-hover",
        destructive: "bg-red-600 text-white hover:bg-red-600/90 disabled:bg-bg disabled:text-text-secondary disabled:opacity-50",
        outline: "border border-border text-text hover:bg-bg hover:text-text disabled:bg-bg disabled:text-text-secondary disabled:opacity-50",
        ghost: "hover:bg-none hover:text-text disabled:bg-bg disabled:text-text-secondary disabled:opacity-50",
        link: "text-primary underline-offset-4 hover:underline disabled:text-text-secondary disabled:opacity-50",
      },
      size: {
        default: "h-[44px] px-4 py-2 font-[14px] tracking-[1px]",
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-3 text-xs",
        lg: "h-10 px-8",
        xl: "h-13 px-10",
        xxl: "h-16 px-10",
        icon: "h-9 w-9",
        xs: "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, bgColor, textColor, borderColor, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn("font-bold cursor-pointer tracking-[0.3px]", buttonVariants({ variant, size, className }))}
        style={{
          backgroundColor: bgColor,
          color: textColor,
          borderColor: borderColor,
          ...style,
        }}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };

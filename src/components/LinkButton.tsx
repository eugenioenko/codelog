import type { ReactNode } from "react";

type LinkButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
};

export default function LinkButton({ children, className, ...props }: LinkButtonProps) {
  return (
    <a className={`group inline-block hover:text-theme-accent hover:underline  underline-offset-8 ${className}`} {...props}>
      {children}
    </a>
  );
}

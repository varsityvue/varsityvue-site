import type { ReactNode } from "react";

type FormspreeFormProps = {
  children: ReactNode;
  successPath: string;
  className?: string;
};

export default function FormspreeForm({
  children,
  successPath,
  className,
}: FormspreeFormProps) {
  return (
    <form action="/api/form-submit" method="POST" className={className}>
      <input type="hidden" name="_success_path" value={successPath} />
      {children}
    </form>
  );
}

"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mpqnjqen";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = event.currentTarget;

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: new FormData(form),
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Form submission failed");
      }

      window.location.assign(successPath);
    } catch {
      setError(
        "We couldn't send your submission. Please try again, or email info@varsityvue.com if the problem continues."
      );
      setSubmitting(false);
    }
  }

  return (
    <form
      action={FORMSPREE_ENDPOINT}
      method="POST"
      onSubmit={handleSubmit}
      className={className}
      aria-busy={submitting}
    >
      {children}

      {submitting && (
        <p role="status" className="text-center text-sm text-white/55">
          Sending your submission…
        </p>
      )}

      {error && (
        <p role="alert" className="text-center text-sm text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}

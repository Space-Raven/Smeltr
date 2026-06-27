"use client";
import { useEffect } from "react";

interface ModuleFormProps {
  onChange: (params: unknown, isValid: boolean) => void;
}

/** No configurable parameters — reports an empty, always-valid config. */
export function NonTransferableConfigForm({ onChange }: ModuleFormProps) {
  useEffect(() => {
    onChange({}, true);
  }, [onChange]);

  return (
    <p className="pl-4 text-sm text-gray-600 border-l-2 border-gray-200">
      No additional configuration needed — this token will be permanently
      non-transferable once created.
    </p>
  );
}

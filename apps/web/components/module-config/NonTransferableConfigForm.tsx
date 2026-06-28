"use client";
import { useEffect, useRef } from "react";

interface ModuleFormProps {
  onChange: (params: unknown, isValid: boolean) => void;
}

/** No configurable parameters — reports an empty, always-valid config. */
export function NonTransferableConfigForm({ onChange }: ModuleFormProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Emit once on mount. Keep `onChange` out of the dep array — a non-memoized
  // parent callback would otherwise re-fire this every render (re-render loop).
  useEffect(() => {
    onChangeRef.current({}, true);
  }, []);

  return (
    <p className="pl-4 text-sm text-gray-600 border-l-2 border-gray-200">
      No additional configuration needed — this token will be permanently
      non-transferable once created.
    </p>
  );
}

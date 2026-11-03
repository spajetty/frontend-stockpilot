import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function SignOutOverlay() {
  useEffect(() => {
    const root = document.getElementById("root");
    root?.setAttribute("inert", ""); 
    return () => root?.removeAttribute("inert");
  }, []);

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label="Signing out"
      className="fixed inset-0 z-[100] flex cursor-wait items-center justify-center bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-10 py-8 shadow-xl">
        <i className="ri-loader-4-line animate-spin text-4xl text-[#5b44d6]" />
        <div className="text-center">
          <p className="text-base font-semibold text-slate-900">Signing out</p>
          <p className="mt-1 text-sm text-slate-500">Please wait a moment...</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
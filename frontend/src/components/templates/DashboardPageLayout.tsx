import type { ReactNode, Ref } from "react";

import { SignedIn, SignedOut } from "@/auth/clerk";

import { AdminOnlyNotice } from "@/components/auth/AdminOnlyNotice";
import { SignedOutPanel } from "@/components/auth/SignedOutPanel";
import { DashboardSidebar } from "@/components/organisms/DashboardSidebar";
import { cn } from "@/lib/utils";

import { DashboardShell } from "./DashboardShell";

type SignedOutConfig = {
  message: string;
  forceRedirectUrl: string;
  signUpForceRedirectUrl?: string;
  mode?: "modal" | "redirect";
  buttonLabel?: string;
  buttonTestId?: string;
};

type DashboardPageLayoutProps = {
  signedOut: SignedOutConfig;
  title: ReactNode;
  description?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  isAdmin?: boolean;
  adminOnlyMessage?: string;
  stickyHeader?: boolean;
  mainClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  mainRef?: Ref<HTMLElement>;
};

export function DashboardPageLayout({
  signedOut,
  title,
  description,
  headerActions,
  children,
  isAdmin,
  adminOnlyMessage,
  stickyHeader = false,
  mainClassName,
  headerClassName,
  contentClassName,
  mainRef,
}: DashboardPageLayoutProps) {
  const showAdminOnlyNotice =
    typeof isAdmin === "boolean" && Boolean(adminOnlyMessage) && !isAdmin;

  return (
    <DashboardShell>
      <SignedOut>
        <SignedOutPanel
          message={signedOut.message}
          forceRedirectUrl={signedOut.forceRedirectUrl}
          signUpForceRedirectUrl={signedOut.signUpForceRedirectUrl}
          mode={signedOut.mode}
          buttonLabel={signedOut.buttonLabel}
          buttonTestId={signedOut.buttonTestId}
        />
      </SignedOut>
      <SignedIn>
        <DashboardSidebar />
        <main
          ref={mainRef}
          className={cn("flex-1 overflow-y-auto bg-slate-50", mainClassName)}
        >
          <div
            className={cn(
              "border-b border-slate-200 bg-white",
              stickyHeader && "sticky top-0 z-30",
              headerClassName,
            )}
          >
            <div className="px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
              {headerActions ? (
                <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <h1 className="font-heading text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                      {title}
                    </h1>
                    {description ? (
                      <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                        {description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex-shrink-0">{headerActions}</div>
                </div>
              ) : (
                <div>
                  <h1 className="font-heading text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                    {title}
                  </h1>
                  {description ? (
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">{description}</p>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className={cn("p-4 sm:p-6 md:p-8", contentClassName)}>
            {showAdminOnlyNotice ? (
              <AdminOnlyNotice message={adminOnlyMessage ?? ""} />
            ) : (
              children
            )}
          </div>
        </main>
      </SignedIn>
    </DashboardShell>
  );
}

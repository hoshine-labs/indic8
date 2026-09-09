"use client";

import React from "react";
import { useIndic8Store } from "@/lib/indic8Store";
import { BrandIcon } from "@/lib/brandLogos";
import { Card, Badge } from "@/components/ui";
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  PaintBrushIcon,
  ArrowRightIcon,
  ClockIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";

export const ActivityView: React.FC = () => {
  const {
    activities,
    loadMilestoneIntoStudio,
    markActivityShared,
    setIsOnboardingOpen,
    providers,
  } = useIndic8Store();

  const hasConnectedProviders = providers.length > 0;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-20 select-none">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-brand-primary tracking-tight">
          Verified Activity Feed
        </h2>
        <p className="text-xs text-brand-secondary mt-0.5">
          Chronological audit log of genuine milestones and sales inflection points from payment gateways.
        </p>
      </div>

      {activities.length === 0 ? (
        <Card className="p-12 border border-dashed border-border-default rounded-2xl text-center flex flex-col items-center justify-center bg-surface-subtle/20 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-surface-base border border-border-default flex items-center justify-center text-brand-muted">
            <ClockIcon className="w-6 h-6" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-brand-primary">No activity yet</h3>
            <p className="text-xs text-brand-secondary">
              Your verified payment events, daily high-water marks, and milestone thresholds will appear here once connected.
            </p>
          </div>
          {!hasConnectedProviders && (
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="mt-2 h-9 px-4 rounded-full bg-brand-primary text-surface-canvas text-xs font-semibold hover:opacity-90 transition inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98] shadow-xs"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Connect Provider</span>
            </button>
          )}
        </Card>
      ) : (
        /* Activities List */
        <div className="space-y-3">
          {activities.map((event) => {
            const isShared = event.hasShared;
            const eventDate = new Date(event.timestamp);

            return (
              <Card
                key={event.id}
                className="p-5 rounded-2xl border border-border-default bg-surface-base hover:border-brand-primary/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-surface-subtle border border-border-default flex items-center justify-center shrink-0 shadow-2xs">
                    <BrandIcon provider={event.provider} className="w-4 h-4" colored={true} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-brand-primary">
                        {event.title}
                      </h4>
                      <Badge variant="neutral" className="rounded-full">{event.type.replace("_", " ")}</Badge>
                      {isShared ? (
                        <span className="flex items-center gap-1 text-[11px] text-status-success font-medium">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          <span>Shared</span>
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-brand-primary">
                          Unshared
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-brand-secondary max-w-xl">
                      {event.description}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-brand-muted pt-0.5">
                      <span className="flex items-center gap-1">
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-status-success" />
                        <span>{event.provider.toUpperCase()} Cryptographic Seal</span>
                      </span>
                      <span>•</span>
                      <span>
                        {eventDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-end md:self-center">
                  <button
                    onClick={() => {
                      markActivityShared(event.id);
                      loadMilestoneIntoStudio({
                        numericValue: event.metricValue,
                        metricLabel: event.title,
                        subtext: event.description,
                        verifiedSource: event.provider,
                      });
                    }}
                    className="h-9 px-4 rounded-full bg-brand-primary text-surface-canvas font-semibold text-xs hover:opacity-90 active:scale-[0.98] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <PaintBrushIcon className="w-4 h-4" />
                    <span>Create Graphic</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

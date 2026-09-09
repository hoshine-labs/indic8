"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "@/lib/auth/client";
import { useIndic8Store } from "@/lib/indic8Store";
import { BrandIcon } from "@/lib/brandLogos";
import { AuthModal } from "@/components/auth/AuthModal";
import { SyncedAvatar } from "@/components/ui/SyncedAvatar";
import {
  UserIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
  ArrowPathIcon,
  CircleStackIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";

export const ProfileView: React.FC = () => {
  const { data: session, isPending, refetch } = useSession();
  const { providers, setActiveTab } = useIndic8Store();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      setIsConfirmLogoutOpen(false);
      if (refetch) await refetch();
      setActiveTab("dashboard");
    } catch (err) {
      console.warn("[Profile] Error signing out:", err);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isPending) {
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-10 space-y-8 animate-pulse select-none">
        <div className="flex items-center gap-6">
          <div className="w-22 h-22 rounded-full bg-surface-subtle" />
          <div className="space-y-2.5 flex-1">
            <div className="h-7 w-56 bg-surface-subtle rounded-lg" />
            <div className="h-4 w-40 bg-surface-subtle rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-28 bg-surface-subtle rounded-2xl" />
          <div className="h-28 bg-surface-subtle rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="w-full max-w-3xl mx-auto px-6 py-16 select-none">
        <div className="p-10 border border-dashed border-border-default rounded-3xl text-center flex flex-col items-center justify-center bg-surface-subtle/20 space-y-5">
          <div className="w-16 h-16 rounded-full bg-surface-base border border-border-default flex items-center justify-center text-brand-muted shadow-xs">
            <UserIcon className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold text-brand-primary">Account &amp; Profile</h3>
            <p className="text-xs text-brand-secondary leading-relaxed">
              Sign in to manage your account details, sync payment providers, and customize your workspace.
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="h-10 px-6 rounded-full bg-brand-primary text-surface-canvas text-xs font-semibold hover:opacity-90 transition inline-flex items-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <span>Sign In to Continue</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => {
          setIsAuthModalOpen(false);
          if (refetch) refetch();
        }} />
      </div>
    );
  }

  const user = session.user;
  const userInitials = (user.name || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Active Member";

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-10 space-y-10 select-none pb-28">
      {/* 1. Profile Hero Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-border-default">
        <div className="flex items-center gap-5">
          {/* Round Profile Picture (Synchronized Master GIF playback) */}
          <div className="w-20 h-20 md:w-22 md:h-22 rounded-full overflow-hidden border-2 border-border-default shadow-sm shrink-0">
            <SyncedAvatar
              src={user.image}
              alt={user.name || "Profile"}
              fallbackText={userInitials}
              className="w-full h-full"
              fallbackClassName="w-full h-full bg-surface-subtle flex items-center justify-center text-brand-primary font-bold text-2xl"
            />
          </div>

          {/* Name & Email */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-brand-primary tracking-tight">
              {user.name || "User"}
            </h1>
            <p className="text-xs text-brand-secondary font-mono">{user.email}</p>
          </div>
        </div>

        {/* Top Action: Log Out Trigger */}
        <button
          type="button"
          onClick={() => setIsConfirmLogoutOpen(true)}
          className="self-start sm:self-center px-4 py-2 rounded-full text-xs font-semibold text-status-danger bg-status-danger-subtle hover:bg-status-danger-light transition flex items-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>

      {/* 2. Account Details Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-muted font-mono">
          Account Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-surface-base border border-border-default flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-border-default flex items-center justify-center text-brand-secondary shrink-0">
              <EnvelopeIcon className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <span className="text-[11px] font-medium text-brand-muted">Email Address</span>
              <p className="text-xs font-semibold text-brand-primary font-mono truncate">
                {user.email}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-base border border-border-default flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-border-default flex items-center justify-center text-brand-secondary shrink-0">
              <CalendarDaysIcon className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <span className="text-[11px] font-medium text-brand-muted">Member Since</span>
              <p className="text-xs font-semibold text-brand-primary">
                {formattedDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Connected Payment Gateways */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-muted font-mono">
            Connected Gateways ({providers.length})
          </h2>
          <button
            onClick={() => setActiveTab("providers")}
            className="text-xs font-medium text-brand-secondary hover:text-brand-primary transition flex items-center gap-1 cursor-pointer"
          >
            <span>Manage Providers</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {providers.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface-base border border-border-default flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-border-default flex items-center justify-center text-brand-muted">
                <CircleStackIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-primary">No Gateways Connected</p>
                <p className="text-[11px] text-brand-secondary">
                  Connect Stripe, Polar, RevenueCat or Lemon Squeezy to aggregate revenue.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("providers")}
              className="h-8 px-3 rounded-full bg-surface-subtle border border-border-default hover:bg-surface-base text-xs font-medium text-brand-primary transition cursor-pointer"
            >
              Connect Gateway
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {providers.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-surface-base border border-border-default flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-surface-subtle border border-border-default flex items-center justify-center shrink-0">
                  <BrandIcon provider={p.provider} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-brand-primary truncate">{p.accountName}</p>
                  <p className="text-[10px] text-brand-muted capitalize">{p.provider}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Session & Security Details */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-muted font-mono">
          Security &amp; Session
        </h2>

        <div className="p-5 rounded-2xl bg-surface-base border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-border-default flex items-center justify-center text-brand-secondary shrink-0">
              <DevicePhoneMobileIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-primary">Active Web Session</p>
              <p className="text-[11px] text-brand-secondary font-mono">
                Authenticated via secure session token
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-brand-secondary self-end sm:self-auto">
            <ShieldCheckIcon className="w-4 h-4 text-brand-primary" />
            <span>Encrypted Session</span>
          </div>
        </div>
      </div>

      {/* Confirmation Logout Modal Dialog */}
      <AnimatePresence>
        {isConfirmLogoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
              onClick={() => setIsConfirmLogoutOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border-default bg-surface-canvas shadow-2xl z-10 select-none text-brand-primary p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-status-danger">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  <h3 className="text-sm font-bold text-brand-primary">Confirm Log Out</h3>
                </div>
                <button
                  onClick={() => setIsConfirmLogoutOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-brand-secondary hover:bg-surface-subtle hover:text-brand-primary transition-colors cursor-pointer"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-brand-secondary leading-relaxed">
                Are you sure you want to log out of your session on <span className="font-semibold text-brand-primary">{user.email}</span>?
              </p>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmLogoutOpen(false)}
                  className="flex-1 h-9 rounded-full border border-border-default bg-surface-base hover:bg-surface-subtle text-xs font-semibold text-brand-primary transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSignOut}
                  disabled={isSigningOut}
                  className="flex-1 h-9 rounded-full bg-status-danger text-white hover:opacity-90 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSigningOut ? (
                    <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Log Out</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIndic8Store } from "@/lib/indic8Store";
import { ProviderId } from "@/lib/domain/types";
import { BrandIcon } from "@/lib/brandLogos";
import { Dropdown } from "@/components/ui";
import {
  XMarkIcon,
  QuestionMarkCircleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/20/solid";

interface InstructionStep {
  title: string;
  description: string;
  linkText?: string;
  linkUrl?: string;
  bulletPoints?: string[];
}

interface ProviderSpec {
  id: ProviderId;
  name: string;
  category: string;
  fieldLabel: string;
  fieldPlaceholder: string;
  fieldHelp?: string;
  secondaryFieldLabel?: string;
  secondaryFieldPlaceholder?: string;
  isJsonUpload?: boolean;
  whereToFind: {
    title: string;
    subtitle?: string;
    steps: InstructionStep[];
    scopeNote?: string;
  };
  securityNote: string;
}

const ALL_PROVIDER_SPECS: ProviderSpec[] = [
  {
    id: "stripe",
    name: "Stripe",
    category: "Payment Processing & Subscriptions",
    fieldLabel: "Restricted API Key",
    fieldPlaceholder: "rk_live_...",
    whereToFind: {
      title: "How to create a Stripe Restricted Key",
      steps: [
        {
          title: "Go to Stripe Dashboard",
          description: "Open API keys under Developers.",
          linkText: "Stripe API Keys",
          linkUrl: "https://dashboard.stripe.com/apikeys",
        },
        {
          title: "Create Restricted Key",
          description: "Under Restricted keys, click 'Create restricted key'.",
        },
        {
          title: "Grant Read Permissions",
          description: "Grant Read permissions for Charges, Customers, and Subscriptions.",
        },
        {
          title: "Save Key",
          description: "Name your key 'indic8 Read-Only' and copy the token starting with rk_live_.",
        },
      ],
      scopeNote: "Read-only access. Never grant Write or Refund capabilities.",
    },
    securityNote: "Used to query read-only Stripe balance, charges, and subscription telemetry directly in your session.",
  },
  {
    id: "google_play",
    name: "Google Play",
    category: "Android Apps & In-App Purchases",
    fieldLabel: "Google Service-Account JSON Key",
    fieldPlaceholder: "Upload your .json service account key file",
    fieldHelp: "Connects via Google Play Developer API & Google Cloud Storage financial reports.",
    secondaryFieldLabel: "Financial Reports Bucket ID (e.g. pubsite_prod_...)",
    secondaryFieldPlaceholder: "e.g. pubsite_prod_7441605368747305270 (found in Play Console > Download reports > Financial)",
    isJsonUpload: true,
    whereToFind: {
      title: "Connect Google Play Developer Console",
      subtitle: "Connect your Play Console via Google Cloud Service Account & Cloud Storage Financial Reports.",
      steps: [
        {
          title: "Open Play Console API Access",
          description: "Open Google Play Console and navigate to Setup > API access.",
          linkText: "Play Console API Access",
          linkUrl: "https://play.google.com/console/developers/api-access",
        },
        {
          title: "Create Service Account",
          description: "Click 'Create new service account' (or link your Google Cloud project) and navigate to Google Cloud Console.",
          linkText: "Google Cloud IAM",
          linkUrl: "https://console.cloud.google.com/iam-admin/serviceaccounts",
        },
        {
          title: "Download JSON Key",
          description: "In Google Cloud IAM, open the service account, go to Keys > Add key > Create new key, choose JSON, and download the file.",
          linkText: "Google Key Creation Guide",
          linkUrl: "https://docs.cloud.google.com/iam/docs/keys-create-delete#creating",
        },
        {
          title: "Grant Play Console Permissions",
          description: "Back in Google Play Console > Users and permissions, grant the service account permissions:",
          bulletPoints: [
            "View app information (read-only)",
            "View financial data, orders, and subscriptions",
          ],
          linkText: "Users & Permissions",
          linkUrl: "https://play.google.com/console/developers/users-and-permissions",
        },
        {
          title: "Upload JSON Key",
          description: "Upload your JSON key file below. indic8 will auto-discover all your Android apps, fetch high-res app icons, and aggregate total & app-specific finances.",
        },
      ],
      scopeNote: "Read-only access via Google Play Developer API (Android Publisher).",
    },
    securityNote: "Ingests Google Play developer sales reports, subscription status, and buyer metrics.",
  },
  {
    id: "polar",
    name: "Polar.sh",
    category: "Open Source & Developer Products",
    fieldLabel: "Organization Access Token",
    fieldPlaceholder: "polar_oat_...",
    whereToFind: {
      title: "How to create a Polar Organization Token",
      steps: [
        {
          title: "Sign in to Polar.sh",
          description: "Log in to Polar.sh and select your Organization.",
          linkText: "Polar Developer Settings",
          linkUrl: "https://polar.sh/settings/developers",
        },
        {
          title: "Create Token",
          description: "Navigate to Settings > Developers > Access Tokens, and create a token.",
        },
        {
          title: "Copy Token",
          description: "Copy your token starting with polar_oat_.",
        },
      ],
      scopeNote: "Organization Access Tokens are scoped to a single organization.",
    },
    securityNote: "Used to query verified developer tier and sponsorship revenue directly from Polar REST v1.",
  },
  {
    id: "revenuecat",
    name: "RevenueCat",
    category: "Mobile & Web Subscriptions",
    fieldLabel: "Secret API Key",
    fieldPlaceholder: "sk_... or V2 API Token",
    secondaryFieldLabel: "Project ID (Optional)",
    secondaryFieldPlaceholder: "e.g. proj_... (found in Project Settings)",
    whereToFind: {
      title: "How to find your RevenueCat Secret API Key",
      steps: [
        {
          title: "Open API Keys Settings",
          description: "Open RevenueCat Dashboard > Project Settings > API Keys.",
          linkText: "RevenueCat API Keys",
          linkUrl: "https://app.revenuecat.com/settings/api-keys",
        },
        {
          title: "Copy Secret Key",
          description: "Under Secret API Keys, copy your Secret Key (starts with sk_).",
        },
      ],
      scopeNote: "Read-only access to customer subscriber summaries, product catalog, and cross-platform MRR.",
    },
    securityNote: "Normalizes Apple App Store, Google Play, and Stripe mobile MRR and subscriber cohorts.",
  },
  {
    id: "lemonsqueezy",
    name: "Lemon Squeezy",
    category: "Digital Products & Merchant of Record",
    fieldLabel: "API Key",
    fieldPlaceholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    whereToFind: {
      title: "How to generate a Lemon Squeezy API Key",
      steps: [
        {
          title: "API Settings",
          description: "Sign in to Lemon Squeezy > Settings > API.",
          linkText: "Lemon Squeezy API",
          linkUrl: "https://app.lemonsqueezy.com/settings/api",
        },
        {
          title: "Generate Key",
          description: "Click '+' to generate a new API key named 'indic8'.",
        },
      ],
      scopeNote: "Used to fetch stores, orders, products, and subscriptions.",
    },
    securityNote: "Used to normalize merchant of record revenue, payouts, and customer purchases.",
  },
  {
    id: "app_store",
    name: "Apple App Store",
    category: "iOS & macOS In-App Purchases",
    fieldLabel: "Key ID (10 Characters)",
    fieldPlaceholder: "e.g. 2X9R4HX443",
    secondaryFieldLabel: "Issuer ID (UUID)",
    secondaryFieldPlaceholder: "57246542-96fe-1a63-e053-0824d011007a",
    whereToFind: {
      title: "How to generate an App Store Connect API Key",
      steps: [
        {
          title: "App Store Connect API",
          description: "Go to App Store Connect > Users and Access > Integrations > App Store Connect API.",
          linkText: "App Store Connect API",
          linkUrl: "https://appstoreconnect.apple.com/access/api",
        },
        {
          title: "Generate Key",
          description: "Click '+' with 'Finance' or 'Sales and Reports' role and download the .p8 file.",
        },
      ],
      scopeNote: "Finance or Sales and Reports read role only.",
    },
    securityNote: "Authenticates with Apple App Store Connect API to ingest daily sales and subscriber reports.",
  },
  {
    id: "dodopayments",
    name: "Dodo Payments",
    category: "Global Merchant of Record & Subscriptions",
    fieldLabel: "Secret API Key",
    fieldPlaceholder: "dodo_sk_live_... or test key",
    whereToFind: {
      title: "How to find your Dodo Payments API Key",
      steps: [
        {
          title: "Sign in to Dodo Payments",
          description: "Log in to your Dodo Payments Dashboard.",
          linkText: "Dodo Developer Dashboard",
          linkUrl: "https://app.dodopayments.com/developer/api-keys",
        },
        {
          title: "Generate API Key",
          description: "Navigate to Developer > API Keys and click 'Create New Secret Key'.",
        },
        {
          title: "Copy Key",
          description: "Copy your Secret Key starting with dodo_sk_.",
        },
      ],
      scopeNote: "Read-only access to products, payments, subscriptions, and customer metrics.",
    },
    securityNote: "Ingests global Dodo Payments revenue, MOR tax calculations, and recurring subscriptions.",
  },
  {
    id: "paddle",
    name: "Paddle",
    category: "Global Merchant of Record & SaaS",
    fieldLabel: "API Key",
    fieldPlaceholder: "paddledemo_... or live api key",
    whereToFind: {
      title: "How to generate a Paddle API Key",
      steps: [
        {
          title: "Sign in to Paddle",
          description: "Open Paddle Dashboard > Developer Tools > Authentication.",
          linkText: "Paddle Developer Tools",
          linkUrl: "https://vendors.paddle.com/authentication",
        },
        {
          title: "Generate API Key",
          description: "Click 'Generate API Key' with read permissions for products and transactions.",
        },
      ],
      scopeNote: "Read-only access to products, transactions, subscriptions, and customers.",
    },
    securityNote: "Used to normalize Paddle Billing merchant of record sales, EU VAT, and recurring MRR.",
  },
  {
    id: "creem",
    name: "Creem",
    category: "Digital Products & Subscriptions",
    fieldLabel: "API Key",
    fieldPlaceholder: "creem_live_... or test api key",
    whereToFind: {
      title: "How to find your Creem API Key",
      steps: [
        {
          title: "Sign in to Creem",
          description: "Open your Creem.io Dashboard > Developer Settings.",
          linkText: "Creem Dashboard",
          linkUrl: "https://creem.io",
        },
        {
          title: "Copy API Key",
          description: "Under API Keys, create or copy your API Key.",
        },
      ],
      scopeNote: "Read-only access to products, orders, subscriptions, and customer spend.",
    },
    securityNote: "Connects directly to Creem checkout records to normalize products and subscription cohorts.",
  },
];

type SyncState = "idle" | "validating" | "syncing" | "complete" | "failed";

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, providers, addProviderConnection } =
    useIndic8Store();

  const [selectedProviderId, setSelectedProviderId] = useState<ProviderId | null>("stripe");
  const [apiKey, setApiKey] = useState("");
  const [secondaryValue, setSecondaryValue] = useState("");
  const [accountLabel, setAccountLabel] = useState("");
  const [gplayBucket, setGplayBucket] = useState("");
  const [gplayPackage, setGplayPackage] = useState("");
  const [showAdvancedPlayOptions, setShowAdvancedPlayOptions] = useState(false);
  const [uploadedJsonName, setUploadedJsonName] = useState<string | null>(null);
  const [isWhereToFindOpen, setIsWhereToFindOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const connectedProviderIds = providers.map((p) => p.provider);
  const availableProviders = ALL_PROVIDER_SPECS.filter(
    (p) => !connectedProviderIds.includes(p.id)
  );

  const selectedSpec =
    ALL_PROVIDER_SPECS.find((p) => p.id === selectedProviderId) || availableProviders[0] || null;

  const handleClose = () => {
    setIsOnboardingOpen(false);
    setIsWhereToFindOpen(false);
    setApiKey("");
    setSecondaryValue("");
    setAccountLabel("");
    setUploadedJsonName(null);
    setGplayBucket("");
    setGplayPackage("");
    setShowAdvancedPlayOptions(false);
    setSyncState("idle");
    setErrorMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedJsonName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || "";
      setSecondaryValue(content);
      setApiKey(content);
      try {
        const parsed = JSON.parse(content);
        if (parsed.project_id && !accountLabel) {
          setAccountLabel(`Google Play (${parsed.project_id})`);
        }
      } catch {}
    };
    reader.readAsText(file);
  };

  const handleVerifyAndConnect = async () => {
    if (!selectedProviderId) return;

    const keyToUse = selectedSpec?.isJsonUpload
      ? (secondaryValue.trim() || apiKey.trim())
      : apiKey.trim();

    if (!keyToUse) {
      setErrorMessage(
        selectedSpec?.isJsonUpload
          ? "Please upload your Google service-account JSON key file."
          : "Please fill in the required credential field."
      );
      return;
    }

    setSyncState("validating");
    setErrorMessage(null);

    try {
      // 1. Server validation & encryption & initial sync
      const res = await fetch("/api/providers/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProviderId,
          credentials: {
            apiKey: keyToUse,
            serviceAccountJson: keyToUse,
            bucketUri: gplayBucket.trim() || undefined,
            bucketId: gplayBucket.trim() || undefined,
            packageName: gplayPackage.trim() || undefined,
            secondaryValue: selectedSpec?.isJsonUpload ? (gplayBucket.trim() || apiKey.trim()) : secondaryValue.trim(),
            accountName: accountLabel.trim(),
          },
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setSyncState("failed");
        setErrorMessage(
          data.error ||
          `Connection error (${res.status}): ${selectedSpec?.name || "Provider"} rejected the credentials. Verify permissions and try again.`
        );
        return;
      }

      setSyncState("syncing");

      // Register connection in store
      await addProviderConnection(data.connection);

      setSyncState("complete");
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err: unknown) {
      setSyncState("failed");
      setErrorMessage(err instanceof Error ? err.message : "Network error contacting server.");
    }
  };

  if (!isOnboardingOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative w-full max-w-xl h-[580px] flex flex-col rounded-3xl border border-border-default bg-surface-canvas shadow-2xl z-10 select-none text-brand-primary overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default px-6 py-4 bg-surface-base/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-subtle border border-border-default shadow-2xs">
              <ShieldCheckIcon className="w-4 h-4 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-brand-primary">
                {selectedSpec?.id === "google_play" ? "Connect Google Play" : "Connect a Provider"}
              </h2>
              <p className="text-[11px] text-brand-secondary">
                {selectedSpec?.id === "google_play"
                  ? "Invite a service account with report & financial access, then upload JSON key"
                  : "Authentic read-only financial telemetry & milestone verification"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-brand-secondary hover:bg-surface-subtle hover:text-brand-primary transition-colors cursor-pointer border border-border-default shadow-2xs"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          {/* 1. Provider Selector */}
          <div className="relative z-30">
            <label className="block text-xs font-semibold text-brand-secondary mb-1.5">
              Payment Provider
            </label>

            {availableProviders.length === 0 ? (
              <div className="p-3 rounded-2xl border border-border-default bg-surface-subtle text-xs text-brand-secondary text-center">
                All available payment providers are connected.
              </div>
            ) : (
              <Dropdown
                options={availableProviders.map((p) => ({
                  id: p.id,
                  label: p.name,
                  sublabel: p.category,
                  icon: <BrandIcon provider={p.id} className="w-4 h-4 shrink-0" colored={true} />,
                }))}
                value={selectedProviderId || undefined}
                onChange={(id: string) => {
                  setSelectedProviderId(id as ProviderId);
                  setErrorMessage(null);
                  setApiKey("");
                  setSecondaryValue("");
                  setUploadedJsonName(null);
                }}
                placeholder="Select payment provider..."
                size="lg"
                width="100%"
                className="w-full"
                triggerClassName="w-full h-11 px-4 text-xs font-semibold shadow-xs"
              />
            )}
          </div>

          {/* 2. Provider-Specific Form */}
          <AnimatePresence mode="wait">
            {selectedSpec && (
              <motion.div
                key={selectedSpec.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="space-y-4 pt-1"
              >
                {/* Credential Inputs */}
                {selectedSpec.isJsonUpload ? (
                  /* Google Play: ONLY require the JSON File Upload */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-brand-primary">
                        Google Service-Account JSON Key
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsWhereToFindOpen((prev) => !prev)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-secondary hover:text-brand-primary transition-colors cursor-pointer"
                      >
                        <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
                        <span>{isWhereToFindOpen ? "Hide instructions" : "See instructions"}</span>
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-6 px-4 rounded-2xl border-2 border-dashed border-border-default hover:border-brand-primary/50 bg-surface-base/80 hover:bg-surface-subtle flex flex-col items-center justify-center gap-2 text-xs text-brand-secondary hover:text-brand-primary transition cursor-pointer shadow-2xs group"
                      >
                        <div className="w-10 h-10 rounded-full bg-surface-subtle border border-border-default flex items-center justify-center text-brand-primary shadow-2xs group-hover:scale-105 transition-transform">
                          <ArrowUpTrayIcon className="w-4 h-4" />
                        </div>
                        <div className="text-center">
                          <span className="font-semibold text-brand-primary block text-xs">
                            {uploadedJsonName ? uploadedJsonName : "Upload Google service-account JSON"}
                          </span>
                          <span className="text-[11px] text-brand-muted">
                            {uploadedJsonName ? "Click to replace file" : "Choose a file from your computer or drag and drop"}
                          </span>
                        </div>
                      </button>

                      {uploadedJsonName && (
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-subtle border border-border-default text-[11px]">
                          <div className="flex items-center gap-2.5 text-brand-primary font-mono truncate">
                            <DocumentTextIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="truncate font-semibold">{uploadedJsonName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedJsonName(null);
                              setSecondaryValue("");
                              setApiKey("");
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="text-brand-muted hover:text-status-danger transition"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      {/* Optional Developer ID / Bucket ID & App Package Filter */}
                      {uploadedJsonName && (
                        <div className="pt-1 space-y-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-brand-secondary mb-1">
                              Financial Reports Bucket ID (Optional)
                            </label>
                            <input
                              type="text"
                              value={gplayBucket}
                              onChange={(e) => setGplayBucket(e.target.value)}
                              placeholder="e.g. pubsite_prod_rev_... or Developer ID"
                              className="w-full h-9 px-3 rounded-xl border border-border-default bg-surface-base text-brand-primary placeholder:text-brand-muted text-xs font-mono focus:outline-hidden focus:border-brand-primary transition-colors shadow-2xs"
                            />
                            <p className="text-[10px] text-brand-muted mt-0.5">Found in Play Console &gt; Download reports &gt; Financial. Leave empty to auto-discover.</p>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-brand-secondary mb-1">
                              Filter Specific App Package (Optional)
                            </label>
                            <input
                              type="text"
                              value={gplayPackage}
                              onChange={(e) => setGplayPackage(e.target.value)}
                              placeholder="com.yourcompany.app"
                              className="w-full h-9 px-3 rounded-xl border border-border-default bg-surface-base text-brand-primary placeholder:text-brand-muted text-xs font-mono focus:outline-hidden focus:border-brand-primary transition-colors shadow-2xs"
                            />
                            <p className="text-[10px] text-brand-muted mt-0.5">Leave empty to auto-discover all accessible apps.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Standard API Key Providers (Stripe, Polar, RevenueCat, Lemon Squeezy, App Store) */
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-brand-primary">
                          {selectedSpec.fieldLabel}
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsWhereToFindOpen((prev) => !prev)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-secondary hover:text-brand-primary transition-colors cursor-pointer"
                        >
                          <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
                          <span>{isWhereToFindOpen ? "Hide instructions" : "See instructions"}</span>
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={selectedSpec.fieldPlaceholder}
                          className="w-full h-10 px-3.5 rounded-full border border-border-default bg-surface-base text-brand-primary placeholder:text-brand-muted text-xs font-mono focus:outline-hidden focus:border-brand-primary transition-colors shadow-2xs"
                        />
                      </div>
                      {selectedSpec.fieldHelp && (
                        <p className="text-[10px] text-brand-muted mt-1 px-1">{selectedSpec.fieldHelp}</p>
                      )}
                    </div>

                    {/* Optional Secondary Credential Input */}
                    {selectedSpec.secondaryFieldLabel && (
                      <div>
                        <label className="block text-xs font-semibold text-brand-primary mb-1.5">
                          {selectedSpec.secondaryFieldLabel}
                        </label>
                        <input
                          type="text"
                          value={secondaryValue}
                          onChange={(e) => setSecondaryValue(e.target.value)}
                          placeholder={selectedSpec.secondaryFieldPlaceholder}
                          className="w-full h-10 px-3.5 rounded-full border border-border-default bg-surface-base text-brand-primary placeholder:text-brand-muted text-xs font-mono focus:outline-hidden focus:border-brand-primary transition-colors shadow-2xs"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Step-by-Step Instructions Drawer (Matching Grew It Specs) */}
                <AnimatePresence>
                  {isWhereToFindOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-2xl border border-border-default bg-surface-subtle p-4 text-xs text-brand-secondary space-y-3 overflow-hidden shadow-xs"
                    >
                      <div className="border-b border-border-default pb-2">
                        <h4 className="font-bold text-brand-primary text-xs">
                          {selectedSpec.whereToFind.title}
                        </h4>
                        {selectedSpec.whereToFind.subtitle && (
                          <p className="text-[11px] text-brand-muted mt-0.5">
                            {selectedSpec.whereToFind.subtitle}
                          </p>
                        )}
                      </div>

                      <ol className="space-y-3.5">
                        {selectedSpec.whereToFind.steps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="flex w-5 h-5 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-surface-canvas shadow-2xs">
                              {idx + 1}
                            </span>
                            <div className="space-y-1 flex-1 min-w-0 pt-0.5">
                              <div className="font-semibold text-brand-primary text-xs">{step.title}</div>
                              <p className="text-[11px] text-brand-secondary leading-relaxed">{step.description}</p>
                              {step.bulletPoints && (
                                <ul className="list-disc list-inside space-y-0.5 text-[10px] text-brand-muted pl-1 pt-0.5">
                                  {step.bulletPoints.map((bp, bidx) => (
                                    <li key={bidx}>{bp}</li>
                                  ))}
                                </ul>
                              )}
                              {step.linkUrl && (
                                <a
                                  href={step.linkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary underline underline-offset-3 hover:opacity-80 transition"
                                >
                                  <span>{step.linkText || "Open link"}</span>
                                  <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>

                      {selectedSpec.whereToFind.scopeNote && (
                        <div className="pt-2 text-[10px] text-brand-muted border-t border-border-default">
                          {selectedSpec.whereToFind.scopeNote}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Security Note */}
                <div className="flex items-start gap-2 rounded-2xl bg-surface-subtle/50 p-3 border border-border-default text-[11px] text-brand-secondary">
                  <LockClosedIcon className="w-3.5 h-3.5 text-brand-muted shrink-0 mt-0.5" />
                  <span>
                    Credentials and service-account keys are encrypted with AES-256-GCM.
                    Never exposed to client browsers.
                  </span>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400"
                  >
                    <ExclamationCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border-default px-6 py-4 bg-surface-base/50 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={syncState === "validating" || syncState === "syncing"}
            className="h-9 px-4 rounded-full text-xs font-medium text-brand-secondary hover:text-brand-primary hover:bg-surface-subtle transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleVerifyAndConnect}
            disabled={
              !selectedProviderId ||
              (selectedSpec?.isJsonUpload ? !secondaryValue.trim() && !apiKey.trim() : !apiKey.trim()) ||
              syncState === "validating" ||
              syncState === "syncing"
            }
            className="h-9 px-5 rounded-full bg-brand-primary hover:bg-brand-darker text-surface-canvas text-xs font-semibold shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {syncState === "validating" && (
              <>
                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                <span>Validating with {selectedSpec?.name || "Provider"}...</span>
              </>
            )}
            {syncState === "syncing" && (
              <>
                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                <span>Importing Data...</span>
              </>
            )}
            {syncState === "complete" && (
              <>
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Connected &amp; Synced!</span>
              </>
            )}
            {(syncState === "idle" || syncState === "failed") && (
              <>
                <span>{selectedSpec?.id === "google_play" ? "Connect Google Play" : "Verify Connection"}</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

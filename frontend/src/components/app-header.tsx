"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, HelpCircle, Brain, BarChart3, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { api, HealthResponse } from "@/lib/api";

type ActivePanel = "predict" | "historical" | null;

interface AppHeaderProps {
  activePanel?: ActivePanel;
  onPanelChange?: (panel: ActivePanel) => void;
}


function HealthBadge({ health, error }: { health: HealthResponse | null; error: boolean }) {
  if (error) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
        <AlertTriangle className="h-3 w-3" />
        Offline
      </span>
    );
  }
  if (!health) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-white/5 px-2 py-0.5 rounded">
        Connecting...
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
      <CheckCircle className="h-3 w-3" />
      {health.model_loaded ? "Ready" : "Loading"}
    </span>
  );
}

export function AppHeader({ activePanel, onPanelChange }: AppHeaderProps) {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState(false);

  useEffect(() => {
    async function checkHealth() {
      try {
        const h = await api.health();
        setHealth(h);
        setHealthError(false);
      } catch {
        setHealthError(true);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // On the map page, primary items toggle panels. On other pages, they navigate.
  const isMapPage = onPanelChange != null;

  function toggle(panel: "predict" | "historical") {
    onPanelChange?.(activePanel === panel ? null : panel);
  }

  const primaryItemClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
      active
        ? "text-white bg-white/[0.09] font-medium"
        : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
    }`;

  return (
    <header
      className="h-14 flex-shrink-0 flex items-center justify-between px-6 sticky top-0 z-[1002]"
      style={{ background: "#0c0d12", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Left: Logo + primary nav group */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="text-lg font-bold text-white tracking-tight hover:text-gray-300 transition-colors"
          >
            PRO-TEST
          </Link>
          <span className="hidden sm:inline text-[10px] text-gray-600 font-mono">v2.0</span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/[0.08]" />

        {/* Primary group: Map · Predict · Historical */}
        <div className="flex items-center gap-0.5">
          {/* Map */}
          {isMapPage ? (
            <button
              onClick={() => onPanelChange?.(null)}
              className={primaryItemClass(activePanel === null)}
            >
              <Map className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Map</span>
            </button>
          ) : (
            <Link href="/" className={primaryItemClass(pathname === "/")}>
              <Map className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Map</span>
            </Link>
          )}

          {/* Predict */}
          {isMapPage ? (
            <button
              onClick={() => toggle("predict")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
                activePanel === "predict"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 border-blue-600/30"
                  : "text-gray-300 hover:text-white bg-white/[0.05] border-white/[0.1] hover:border-white/[0.16] hover:bg-white/[0.08]"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Predict
            </button>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-gray-300 hover:text-white bg-white/[0.05] border border-white/[0.1] hover:border-white/[0.16] hover:bg-white/[0.08] transition-all"
            >
              <Zap className="h-3.5 w-3.5" />
              Predict
            </Link>
          )}

          {/* Historical Analysis */}
          {isMapPage ? (
            <button
              onClick={() => toggle("historical")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
                activePanel === "historical"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 border-blue-600/30"
                  : "text-gray-300 hover:text-white bg-white/[0.05] border-white/[0.1] hover:border-white/[0.16] hover:bg-white/[0.08]"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Historical Analysis</span>
            </button>
          ) : (
            <Link
              href="/historical"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-gray-300 hover:text-white bg-white/[0.05] border border-white/[0.1] hover:border-white/[0.16] hover:bg-white/[0.08] transition-all"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Historical Analysis</span>
            </Link>
          )}
        </div>
      </div>

      {/* Right: secondary nav + health */}
      <div className="flex items-center gap-0.5">
        <Link
          href="/about"
          className={primaryItemClass(pathname === "/about")}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Guide</span>
        </Link>
        <Link
          href="/model"
          className={primaryItemClass(pathname === "/model")}
        >
          <Brain className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Model</span>
        </Link>
        <div className="ml-3">
          <HealthBadge health={health} error={healthError} />
        </div>
      </div>
    </header>
  );
}

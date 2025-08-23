"use client";

import React, { useEffect, useRef, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ASSET_CONFIG } from "@/config/assets";

interface CoinGeckoWidgetProps {
  assetId: string;
  theme?: "light" | "dark";
  heightPx?: number;
  showHeader?: boolean;
  className?: string;
}

function TradingViewWidget({
  assetId,
  theme = "light",
  heightPx = 500,
  showHeader = true,
  className = "",
}: CoinGeckoWidgetProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);

  const assetConfig = ASSET_CONFIG[assetId];

  const contentHeight = showHeader ? heightPx - 80 : heightPx;
  useEffect(() => {
    if (!slotRef.current || !assetConfig) return;

    const script = document.createElement("script");
    script.src =
      "https://widgets.coingecko.com/gecko-coin-price-chart-widget.js";
    script.async = true;
    script.onload = () => {
      if (slotRef.current) {
        slotRef.current.innerHTML = `
          <gecko-coin-price-chart-widget
            locale="en"
            outlined="false"
            height="${contentHeight}"
            width="100%"
            dark-mode="${theme === "dark"}"
            transparent-background="true"
            coin-id="${assetConfig.coinId}"
            initial-currency="usd"
          ></gecko-coin-price-chart-widget>
        `;
      }
    };
    slotRef.current.innerHTML = "";
    slotRef.current.appendChild(script);

    return () => {
      if (slotRef.current) slotRef.current.innerHTML = "";
    };
  }, [assetId, contentHeight, theme, assetConfig]);

  if (!assetConfig) {
    return (
      <Card
        className={`${className} border-destructive`}
        style={{ height: `${heightPx}px` }}
      >
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="text-center text-destructive">
            <p className="font-medium">Invalid Asset ID : {assetId}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Asset ID not found in configuration
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      ref={shellRef}
      className={`${className} overflow-hidden`}
      style={{ height: `${heightPx}px` }}
    >
      <CardContent className="p-0" style={{ height: `${contentHeight}px` }}>
        <div
          ref={slotRef}
          className="w-full h-full"
          style={{ minHeight: `${contentHeight}px` }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(TradingViewWidget);
export type { CoinGeckoWidgetProps };

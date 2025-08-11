/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useRef, memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Asset configuration interface
interface AssetConfig {
  symbol: string;
  name: string;
  color: string;
}

// Component props interface
interface TradingViewWidgetProps {
  assetId: string;
  theme?: "light" | "dark";
  height?: string;
  width?: string;
  showHeader?: boolean;
  className?: string;
}

// Asset mapping configuration
const ASSET_CONFIG: Record<string, AssetConfig> = {
  "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b": {
    symbol: "OKX:BTCUSD",
    name: "BTC/USD",
    color: "#f7931a",
  },
  "0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6": {
    symbol: "BITSTAMP:ETHUSD",
    name: "ETH/USD",
    color: "#627eea",
  },
  "0x73dc009953c83c944690037ea477df627657f45c14f16ad3a61089c5a3f9f4f2": {
    symbol: "COINBASE:ADAUSD",
    name: "ADA/USD",
    color: "#0033ad",
  },
};

interface TradingViewConfig {
  lineWidth: number;
  lineType: number;
  chartType: string;
  fontColor: string;
  gridLineColor: string;
  volumeUpColor: string;
  volumeDownColor: string;
  backgroundColor: string;
  widgetFontColor: string;
  upColor: string;
  downColor: string;
  borderUpColor: string;
  borderDownColor: string;
  wickUpColor: string;
  wickDownColor: string;
  colorTheme: string;
  isTransparent: boolean;
  locale: string;
  chartOnly: boolean;
  scalePosition: string;
  scaleMode: string;
  fontFamily: string;
  valuesTracking: string;
  changeMode: string;
  symbols: string[][];
  dateRanges: string[];
  fontSize: string;
  headerFontSize: string;
  autosize: boolean;
  width: string;
  height: string;
  noTimeScale: boolean;
  hideDateRanges: boolean;
  hideMarketStatus: boolean;
  hideSymbolLogo: boolean;
}

function TradingViewWidget({
  assetId,
  theme = "light",
  height = "400px",
  showHeader = true,
  className = "",
}: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  const assetConfig: AssetConfig | undefined = ASSET_CONFIG[assetId];

  if (!assetConfig) {
    return (
      <Card className={`${className} border-destructive`}>
        <CardContent className="p-6">
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

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted || !container.current) return;

    container.current.innerHTML = "";

    const script: HTMLScriptElement = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;

    const isDark: boolean = theme === "dark";

    const config: TradingViewConfig = {
      lineWidth: 2,
      lineType: 0,
      chartType: "area",
      fontColor: isDark ? "rgb(148, 163, 184)" : "rgb(106, 109, 120)",
      gridLineColor: isDark
        ? "rgba(148, 163, 184, 0.1)"
        : "rgba(46, 46, 46, 0.06)",
      volumeUpColor: "rgba(34, 197, 94, 0.5)",
      volumeDownColor: "rgba(239, 68, 68, 0.5)",
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
      widgetFontColor: isDark ? "#f8fafc" : "#0F0F0F",
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      colorTheme: isDark ? "dark" : "light",
      isTransparent: false,
      locale: "en",
      chartOnly: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      valuesTracking: "1",
      changeMode: "price-and-percent",
      symbols: [[`${assetConfig.symbol}|1D`]],
      dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
      fontSize: "10",
      headerFontSize: "medium",
      autosize: true,
      width: "100%",
      height: "100%",
      noTimeScale: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
    };

    script.innerHTML = JSON.stringify(config);

    const widgetDiv: HTMLDivElement = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";

    container.current.appendChild(widgetDiv);
    container.current.appendChild(script);
  }, [assetId, theme, mounted, assetConfig.symbol]);

  const contentHeight = showHeader
    ? `calc(${height} - 60px)` 
    : height;

  return (
    <Card className={`${className} h-full flex flex-col`} style={{ height }}>
      {showHeader && (
        <CardHeader className="pb-2 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: assetConfig.color }}
            />
            {assetConfig.name}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <div
          className="tradingview-widget-container flex-1 w-full"
          style={{
            height: contentHeight,
            minHeight: contentHeight,
          }}
          ref={container}
        >
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(TradingViewWidget);
export type { TradingViewWidgetProps, AssetConfig };

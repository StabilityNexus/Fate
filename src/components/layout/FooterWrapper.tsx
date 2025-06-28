'use client'

import React from "react";
import Footer from "./Footer";

export default function FooterWrapper() {
  return (
    <div 
      className="relative h-[800px]" 
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <div className="relative h-[calc(100vh+800px)] -top-[100vh]">
        <div className="h-[800px] sticky top-[calc(100vh-800px)]">
          <Footer />
        </div>
      </div>
    </div>
  );
}

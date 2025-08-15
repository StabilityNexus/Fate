"use client";
import CreateFatePoolForm from "@/components/Forms/CreateFatePool";
import Navbar from "@/components/layout/Navbar";
import StickyCursor from "@/components/StickyCursor";
import { useRef } from "react";

export default function CreateFatePoolPage() {
  const stickyRef = useRef<HTMLElement | null>(null);
  return (
    <>
      <Navbar />
      <StickyCursor stickyRef={stickyRef} />
      <div className="dark:bg-black bg-white">
        <CreateFatePoolForm />
      </div>
      <div className="h-[30vh] dark:bg-black bg-white"></div>
    </>
  );
}

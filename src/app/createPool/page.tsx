"use client";
import CreateFatePoolForm from "@/components/Forms/CreateFatePool";
import Navbar from "@/components/layout/Navbar";

export default function CreateFatePoolPage() {
  return (
    <>
      <Navbar />
      <div className="dark:bg-black bg-white" >
        <CreateFatePoolForm />
      </div>
      <div className="h-[30vh] dark:bg-black bg-white"></div>
    </>
  );
}

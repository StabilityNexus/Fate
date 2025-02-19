"use client";
import CreateFatePoolForm from "@/components/Forms/CreateFatePool";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function CreateFatePoolPage() {
  return (
    <>
      <Navbar />
      <div className="bg-green-50">
        <CreateFatePoolForm />
      </div>
      <Footer/>
    </>
  );
}

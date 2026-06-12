"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";

export default function DashboardClient() {
  const searchParams = useSearchParams();
  const githubStatus = searchParams.get("githubStatus");
  const router = useRouter();
  const { userId } = useAuth();

  useEffect(() => {
    if (githubStatus === "success") {
      toast.success("GitHub Connected!");
      router.push("/dashboard/repos");
    } else if (githubStatus === "failed") {
      toast.error("❌ GitHub Connection Failed");
    }
  }, [githubStatus, router]);

  return (
    <div className="p-[80px] text-white h-screen flex flex-col items-center justify-center">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold">🚀 My App</h1>

      <button
        onClick={() => {
          if (userId) {
            window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/github?userId=${userId}`;
          } else {
            toast.error("Please log in first");
          }
        }}
        className="px-4 py-2 bg-gray-700 rounded mt-4"
      >
        Connect GitHub
      </button>
    </div>
  );
}

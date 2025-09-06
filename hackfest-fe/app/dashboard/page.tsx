"use client";
import { useEffect } from "react";
import { redirect, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { useState } from "react";
import { isArgumentsObject } from "util/types";
import { UserDetails } from "../_components/Auth";


export default function Dashboard() {
    const searchParams = useSearchParams();
    const githubStatus = searchParams.get("githubStatus");

    useEffect(() => {
        if (githubStatus === "success") {
            toast.success("GitHub Connected!");
            redirect("/dashboard/repos")
        } else if (githubStatus === "failed") {
            toast.error("❌ GitHub Connection Failed");
        }
    }, [githubStatus]);

    return (
        <div className="p-[80px] text-white h-screen flex flex-col items-center justify-center">
            <Toaster />
            <h1 className="text-2xl font-bold">🚀 My App</h1>

            <button
                onClick={() => {
                    window.location.href = "http://localhost:3001/auth/github";
                }}
                className="px-4 py-2 bg-gray-700 rounded mt-4"
            >
                Connect GitHub
            </button>
        </div>
    );
}

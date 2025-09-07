import { Suspense } from "react";
import DashboardClient from "./_component/DashboardClient";

export default function DashboardPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DashboardClient />
        </Suspense>
    );
}
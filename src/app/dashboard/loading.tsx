export default function DashboardLoading() {
    return (
        <div className="p-4 lg:p-6 space-y-6 animate-pulse">
            {/* Page title bar */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-[#334155]" />
                <div className="space-y-2">
                    <div className="h-6 w-48 rounded-lg bg-gray-200 dark:bg-[#334155]" />
                    <div className="h-3 w-32 rounded bg-gray-100 dark:bg-[#2D3F55]" />
                </div>
            </div>

            {/* Stat cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-28 rounded-2xl bg-gray-200 dark:bg-[#334155]" />
                ))}
            </div>

            {/* Main content block */}
            <div className="h-64 rounded-2xl bg-gray-200 dark:bg-[#334155]" />

            {/* Secondary row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 h-48 rounded-2xl bg-gray-200 dark:bg-[#334155]" />
                <div className="h-48 rounded-2xl bg-gray-200 dark:bg-[#334155]" />
            </div>
        </div>
    );
}

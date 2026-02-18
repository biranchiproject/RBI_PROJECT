import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
    const { user, loading } = useAuth();
    const [, setLocation] = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0B0F14]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        // Redirect to login if not authenticated
        setLocation("/login");
        return null;
    }

    return <Component />;
}

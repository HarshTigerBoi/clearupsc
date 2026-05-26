import BadgeUnlock from "@/components/gamification/BadgeUnlock";
import XPFloat from "@/components/gamification/XPFloat";
import BottomNav from "@/components/product/BottomNav";
import ProductRail from "@/components/product/ProductRail";

export default function ProductShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="product-dark flex min-h-screen overflow-x-hidden bg-[#0a0a0a] text-zinc-100">
      <ProductRail />
      <div className="min-w-0 flex-1 overflow-x-hidden pb-24 md:pb-0">{children}</div>
      <BottomNav />
      <XPFloat />
      <BadgeUnlock />
    </div>
  );
}

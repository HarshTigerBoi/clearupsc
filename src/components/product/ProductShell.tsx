import ProductRail from "@/components/product/ProductRail";

export default function ProductShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <ProductRail />
      <div className="min-w-0 flex-1 overflow-x-hidden pb-20 md:pb-0">{children}</div>
    </div>
  );
}

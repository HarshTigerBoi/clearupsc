import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { productModules } from "@/data/blueprint";

export function FeatureCards() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {productModules.map((feature) => {
        const Icon = feature.icon;
        return (
          <Card key={feature.title} className="overflow-hidden">
            <CardContent>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-[#f97316]">
                <Icon size={22} />
              </div>
              <div className="mt-5 flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-[#1a2744]">{feature.title}</h3>
                <span className="rounded-full bg-[#1a2744] px-2.5 py-1 text-xs font-bold text-white">{feature.label}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{feature.detail}</p>
              <Link href={feature.href} className="mt-5 inline-flex text-sm font-bold text-[#f97316] hover:text-[#ea580c]">
                Open module
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

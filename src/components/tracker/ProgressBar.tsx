import { Progress } from "@/components/ui/progress";

export function ProgressBar({ value }: { value: number }) {
  return <Progress value={value} />;
}

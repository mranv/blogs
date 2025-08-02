import { Separator } from "./ui/separator";
import { cn } from "@utils/cn";

export interface Props {
  noPadding?: boolean;
  ariaHidden?: boolean;
}

export default function Hr({ noPadding = false, ariaHidden = true }: Props) {
  return (
    <div className={cn(noPadding ? "" : "my-12")} aria-hidden={ariaHidden}>
      <Separator className="bg-border opacity-30" />
    </div>
  );
}

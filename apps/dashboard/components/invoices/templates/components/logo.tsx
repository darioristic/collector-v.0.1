type Props = {
  logo: string;
  customerName: string;
};

export function Logo({ logo, customerName }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <Image src={logo} alt="Logo" width={120} height={48} className="h-12 w-auto" />
      <div className="text-sm text-muted-foreground font-mono">{customerName}</div>
    </div>
  );
}
import Image from "next/image";


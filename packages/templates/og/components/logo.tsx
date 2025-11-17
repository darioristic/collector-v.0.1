export function Logo({
  src,
  customerName,
}: { src: string; customerName: string }) {
  if (!src) return null;
  return <Image src={src} alt={customerName} width={112} height={112} />;
}
import Image from "next/image";

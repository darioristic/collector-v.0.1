type Props = {
  customerName?: string;
  logoUrl?: string;
  isValidLogo: boolean;
};

export function Avatar({ logoUrl, isValidLogo, customerName }: Props) {
  if (isValidLogo) {
    return (
      <Image
        src={logoUrl ?? ""}
        alt="Avatar"
        width={40}
        height={40}
        style={{
          objectFit: "contain",
          borderRadius: "9999px",
          border: "0.5px solid #2D2D2D",
          overflow: "hidden",
        }}
      />
    );
  }

  return (
    <div tw="w-10 h-10 rounded-full border-[0.5px] border-[#2D2D2D] bg-[#1C1C1C] text-[#F2F2F2] flex items-center justify-center">
      {customerName?.[0]}
    </div>
  );
}
import Image from "next/image";

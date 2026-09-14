import Image from "next/image";

const sizeMap = {
  sm: { width: 120, height: 72, className: "h-6 sm:h-8" },
  md: { width: 160, height: 96, className: "h-10 sm:h-12" },
  lg: { width: 200, height: 120, className: "h-14 sm:h-20" },
};

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BrandLogo({ size = "md", className = "" }: BrandLogoProps) {
  const { width, height, className: sizeClass } = sizeMap[size];

  return (
    <div className={`relative ${sizeClass} ${className} w-auto flex items-center justify-center`}>
      {/* Light Mode Logo (Original Blue) */}
      <Image
        src="/logo.png"
        alt="The Catalysts Group"
        width={width}
        height={height}
        className={`object-contain w-full h-full block dark:hidden`}
        priority
      />
      {/* Dark Mode Logo (White silhouette) */}
      <Image
        src="/logo-white.png"
        alt="The Catalysts Group"
        width={width}
        height={height}
        className={`object-contain w-full h-full hidden dark:block`}
        priority
      />
    </div>
  );
}

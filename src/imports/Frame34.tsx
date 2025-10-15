import imgLogoLiga from "figma:asset/logo-liga-sec.png";
import imgSomosLocalesLogo from "figma:asset/logo-somos-locales.png";

function Frame32() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[222px]">
      <div className="h-[66px] relative shrink-0 w-[343px]" data-name="logo liga">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgLogoLiga} />
      </div>
      <div className="flex flex-col font-['Albert_Sans:Bold',_sans-serif] font-bold h-[13px] justify-center leading-[0] relative shrink-0 text-[18px] text-white uppercase w-full">
        <p className="leading-[normal]">Apertura 2025</p>
      </div>
    </div>
  );
}

function Frame33() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[272px]">
      <Frame32 />
      <div className="flex flex-col font-['Adirek_Sans:SemiBold',_sans-serif] h-[50px] justify-center leading-[0] not-italic relative shrink-0 text-[#222222] text-[48px] tracking-[1.92px] uppercase w-full">
        <p className="leading-[normal]">JORNADA 14</p>
      </div>
    </div>
  );
}

export default function Frame34() {
  return (
    <div className="relative size-full">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center justify-between px-[32px] py-0 relative size-full">
          <Frame33 />
          <div className="h-[78px] relative shrink-0 w-[138px]" data-name="somos locales logo">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgSomosLocalesLogo} />
          </div>
        </div>
      </div>
    </div>
  );
}

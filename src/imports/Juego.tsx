import imgTijuana from "figma:asset/bfcd42b510b890edc41631fab3d2ac8f984d1684.png";
import imgQueretaro from "figma:asset/3bf9523da2b028168e26c4774584c76a97dc34f4.png";
import imgEstadioIcono from "figma:asset/icono-estadio.png";
import imgTransmisionIcono from "../Icon/tv.svg";

function DiaYHora() {
  return (
    <div className="bg-[#f766a1] box-border content-stretch flex font-['Antonio:Regular',_sans-serif] font-normal gap-[10px] items-center leading-[0] overflow-clip p-[12px] relative rounded-[8px] shrink-0 text-[29px] tracking-[-1.015px] uppercase" data-name="Día y hora">
      <div className="flex flex-col justify-center relative shrink-0 text-[#222222] w-[108px]">
        <p className="leading-[normal]">JUEVES</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-black w-[75px]">
        <p className="leading-[normal]">25 sep</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-black w-[10px]">
        <p className="leading-[normal]">-</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-black w-[98px]">
        <p className="leading-[normal]">20:00 HRS</p>
      </div>
    </div>
  );
}

function EquiposLocal() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos local">
      <div className="h-[67px] relative shrink-0 w-[75px]" data-name="tijuana">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgTijuana} />
      </div>
    </div>
  );
}

function Local() {
  return (
    <div className="bg-[#f8d95b] box-border content-stretch flex flex-col gap-[10px] items-center justify-center overflow-clip pb-[4px] pt-0 px-[16px] relative shrink-0 size-[48px]" data-name="local">
      <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal h-[29px] justify-center leading-[0] relative shrink-0 text-[#222222] text-[29px] tracking-[-1.015px] uppercase w-full">
        <p className="leading-[normal]">l</p>
      </div>
    </div>
  );
}

function Empate() {
  return (
    <div className="bg-[#f8d95b] box-border content-stretch flex flex-col gap-[10px] items-center justify-center overflow-clip pb-[4px] pt-0 px-[16px] relative shrink-0 size-[48px]" data-name="Empate">
      <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal h-[29px] justify-center leading-[0] relative shrink-0 text-[#222222] text-[29px] tracking-[-1.015px] uppercase w-full">
        <p className="leading-[normal]">e</p>
      </div>
    </div>
  );
}

function Visita() {
  return (
    <div className="bg-[#f8d95b] box-border content-stretch flex flex-col gap-[10px] items-center justify-center overflow-clip pb-[4px] pt-0 px-[16px] relative shrink-0 size-[48px]" data-name="visita">
      <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal h-[29px] justify-center leading-[0] relative shrink-0 text-[#222222] text-[29px] tracking-[-1.015px] uppercase w-full">
        <p className="leading-[normal]">v</p>
      </div>
    </div>
  );
}

function Puntaje() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-[198px]" data-name="Puntaje">
      <Local />
      <Empate />
      <Visita />
    </div>
  );
}

function EquiposVisita() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos visita">
      <div className="relative shrink-0 size-[67px]" data-name="queretaro">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgQueretaro} />
      </div>
    </div>
  );
}

function Estadio() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Estadio">
      <div className="relative shrink-0 size-[32px]" data-name="Estadio icono">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgEstadioIcono} />
        </div>
      </div>
      <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal h-full justify-center leading-[0] relative shrink-0 text-[21px] text-black tracking-[-0.735px] uppercase w-[183px]">
        <p className="leading-[normal]">ESTADIO CALIENTE</p>
      </div>
    </div>
  );
}

function Transimision() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="transimision">
      <div className="relative shrink-0 size-[32px]" data-name="transmision icono">
        <img alt="Transmisión" className="absolute inset-0 max-w-none object-center object-contain pointer-events-none size-full opacity-50" src={imgTransmisionIcono} />
      </div>
      <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal h-[32px] justify-center leading-[0] relative shrink-0 text-[21px] text-black tracking-[-0.735px] uppercase w-[183px]">
        <p className="leading-[normal]">TUBI</p>
      </div>
    </div>
  );
}

function Detalles() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0" data-name="detalles">
      <Estadio />
      <Transimision />
    </div>
  );
}

export default function Juego() {
  return (
    <div className="bg-white relative rounded-[8px] size-full" data-name="Juego">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[25px] items-center pl-0 pr-[8px] py-[4px] relative size-full">
          <DiaYHora />
          <EquiposLocal />
          <Puntaje />
          <EquiposVisita />
          <Detalles />
        </div>
      </div>
    </div>
  );
}

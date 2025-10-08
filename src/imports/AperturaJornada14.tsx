import { memo } from 'react';

// Importaciones principales optimizadas
import logoLigaBBVA from 'figma:asset/282fbfddfb13edc69252a49f15e9f9646a1d8ece.png';
import logoSomosLocales from 'figma:asset/930d5de55d9fd27c0951aa3f3d28301d6e434476.png';
import iconoEstadio from 'figma:asset/86e9cc8c38c10cd6e63afb3b899c4213d74da2b3.png';
import iconoTV from 'figma:asset/e9ea8e4f142524f4ed30284ac75cceb1a6c7262b.png';
import backgroundImage from 'figma:asset/8f36f96feea030035ed7a4c3868a81ffe20a24c2.png';

// Importaciones de logos de equipos
import logoQueretaro from 'figma:asset/3bf9523da2b028168e26c4774584c76a97dc34f4.png';
import logoPumas from 'figma:asset/e9105a3003b724d13cd04d16998f3f326dc6ede9.png';
import logoJuarez from 'figma:asset/fdb12a073ccb4f9bae15eca8b74b33c19c06f67f.png';
import logoTigres from 'figma:asset/45f08e41601121e0e833e07668ebd0f9e273d1ad.png';
import logoTijuana from 'figma:asset/6bc6df4b362edc78070ba17c0d454fbd3897dc56.png';
import logoToluca from 'figma:asset/e43cb135d15b47d08326dba23786233526c5396b.png';
import logoAmerica from 'figma:asset/126f151340ec7816752f2253594d661b12ed0b20.png';
import logoAtlas from 'figma:asset/63a990b2bf67cdc008cb463d6c036c2a03d4638f.png';
import logoChivas from 'figma:asset/f5eeeaecc04c1098606abf832674806d283fc46a.png';
import logoCruzAzul from 'figma:asset/30a1817f405754b1a9f0cea4450f771d653655e2.png';
import logoLeon from 'figma:asset/5dd78c7f0aa3afce7b664e7e2d78dc30d26f7cd1.png';
import logoMazatlan from 'figma:asset/3598835611a3f006d2ae95201055cf0551a91b8b.png';
import logoNecaxa from 'figma:asset/4699fcc7d43d0d0918f17d6596dad6d8995f572e.png';
import logoPachuca from 'figma:asset/73eaa3628b7059fc9979d741913bd96516feb34a.png';
import logoPuebla from 'figma:asset/9ce063fc8d79c9b2ccd776183115bc3f1d5c25cf.png';
import logoRayadas from 'figma:asset/c811f5ddc0575eba11c0b97d6cc20e4870d7edf0.png';
import logoSanLuis from 'figma:asset/f85cfbab493437f594dfc6f886252c0de830e6f9.png';
import logoSantos from 'figma:asset/61cb24a2d36cb4e747ba5da4a26f82714694d300.png';

// Componentes de iconos simples para reemplazar las imágenes
// Componentes optimizados con lazy loading
const LogoLigaBBVA = memo(() => (
  <img alt="Liga BBVA MX Femenil" className="h-full w-auto object-contain" src={logoLigaBBVA} loading="eager" />
));

const LogoSomosLocales = memo(() => (
  <img alt="Somos Locales" className="w-full h-full object-contain" src={logoSomosLocales} loading="eager" />
));

const IconoEstadio = memo(() => (
  <img alt="Estadio" className="w-8 h-8 object-contain opacity-50" src={iconoEstadio} loading="lazy" />
));

const IconoTV = memo(() => (
  <img alt="Transmisión TV" className="w-8 h-8 object-contain opacity-50" src={iconoTV} loading="lazy" />
));

// Mapeo de logos optimizado fuera del componente
const TEAM_LOGOS = {
  'QRO': logoQueretaro,  'PUM': logoPumas,      'JUA': logoJuarez,     'TIG': logoTigres,
  'NEC': logoNecaxa,     'ATL': logoAtlas,      'PUE': logoPuebla,     'CRU': logoCruzAzul,
  'SLU': logoSanLuis,    'MAZ': logoMazatlan,   'TOL': logoToluca,     'AME': logoAmerica,
  'LEO': logoLeon,       'SAN': logoSantos,     'MON': logoRayadas,    'PAC': logoPachuca,
  'CHI': logoChivas,     'TIJ': logoTijuana,
} as const;

// Componente optimizado para logos de equipos
const TeamLogo = memo(({ teamName }: { teamName: string }) => {
  const logoSrc = TEAM_LOGOS[teamName as keyof typeof TEAM_LOGOS];
  
  if (logoSrc) {
    return (
      <img 
        alt={`Logo ${teamName}`}
        className="w-full h-full object-contain"
        src={logoSrc}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center border border-gray-300">
      <span className="text-xs font-bold text-gray-600 uppercase">
        {teamName}
      </span>
    </div>
  );
});

function Frame33() {
  return (
    <div className="content-stretch flex items-center justify-start relative shrink-0 w-[280px] h-full">
      <div className="h-[108px] relative shrink-0 w-[220px] flex items-center justify-center" data-name="liga bbva mx femenil">
        <img alt="Liga BBVA MX Femenil" className="w-full h-full object-contain" src={logoLigaBBVA} />
      </div>
    </div>
  );
}

function JornadaCenter() {
  // Se centra respecto al ancho del encabezado.
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center justify-center leading-[0] text-center">
        {/* APERTURA 2025 arriba */}
        <p className="leading-[normal] text-[24px] font-['Antonio'] font-bold text-white uppercase mb-[4px] tracking-[2px]">APERTURA 2025</p>
        {/* JORNADA 15 abajo más grande */}
        <p className="leading-[normal] text-[40px] font-['Antonio'] font-bold text-[rgba(63,63,63,1)] uppercase tracking-[1px]">JORNADA 15</p>
      </div>
    </div>
  );
}

function Frame34() {
  return (
    <div className="content-stretch flex h-[130px] items-end relative shrink-0 w-full" data-name="Header">
      <div className="flex flex-row items-center size-full">
        {/* Columna Izquierda - Liga BBVA */}
        <div className="box-border content-stretch flex items-center pb-[15px] pl-[32px] pr-0 pt-0 relative shrink-0 w-[280px]">
          <Frame33 />
        </div>
        
        {/* Columna Central - Títulos */}
        <div className="flex-1 flex items-center justify-center pb-[15px]">
          <JornadaCenter />
        </div>
        
        {/* Columna Derecha - Somos Locales */}
        <div className="box-border content-stretch flex items-center justify-end pb-[15px] pl-0 pr-[32px] pt-0 relative shrink-0 w-[280px]">
          <div className="h-[88px] relative shrink-0 w-[132px] flex items-center justify-center" data-name="somos locales logo">
            <LogoSomosLocales />
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente Puntaje con medidas exactas (52px cada L/E/V)
function Puntaje() {
  return (
    <div className="flex items-center gap-[8px] relative shrink-0" data-name="Puntaje">
      <div className="bg-[#f8d95b] box-border flex items-center justify-center relative shrink-0 size-[52px] rounded">
        <span className="font-['Antonio:Regular',_sans-serif] font-normal text-[#222222] text-[29px] tracking-[-0.56px] uppercase">L</span>
      </div>
      <div className="bg-[#f8d95b] box-border flex items-center justify-center relative shrink-0 size-[52px] rounded">
        <span className="font-['Antonio:Regular',_sans-serif] font-normal text-[#222222] text-[29px] tracking-[-0.56px] uppercase">E</span>
      </div>
      <div className="bg-[#f8d95b] box-border flex items-center justify-center relative shrink-0 size-[52px] rounded">
        <span className="font-['Antonio:Regular',_sans-serif] font-normal text-[#222222] text-[29px] tracking-[-0.56px] uppercase">V</span>
      </div>
    </div>
  );
}

// PARTIDO 1: 10 OCT – 17:00 HRS | León VS Pachuca | ESTADIO NOU CAMP | Tubi
function DiaYHora() {
  return (
    <div className="bg-[#f766a1] box-border flex gap-[10px] items-center overflow-clip p-[12px] relative rounded-[8px] shrink-0 w-[345px]" data-name="Día y hora">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
        <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[108px]">
          <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Dias">
            <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#222222] text-[29px] tracking-[-1.015px] uppercase w-[67px]">
              <p className="leading-[normal]">JUEVES</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[75px]">
          <p className="leading-[normal]">10 oct</p>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[10px]">
          <p className="leading-[normal]">-</p>
        </div>
        <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[94px]">
          <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[98px]">
            <p className="leading-[normal]">17:00 HRS</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Equipos() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="leon">
        <TeamLogo teamName="LEO" />
      </div>
    </div>
  );
}

function Equipos2() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="pachuca">
        <TeamLogo teamName="PAC" />
      </div>
    </div>
  );
}

function Estadios() {
  return (
    <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0" data-name="Estadios">
      <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black text-nowrap tracking-[-0.735px] uppercase">
        <p className="leading-[normal] whitespace-pre"></p>
      </div>
    </div>
  );
}

function Transmision() {
  return (
    <div className="absolute flex flex-col gap-[4px] items-start right-[24px] top-1/2 -translate-y-1/2 w-[223px]" data-name="TRANSMISIÓN">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]">
          <IconoEstadio />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">ESTADIO NOU CAMP</p>
        </div>
      </div>
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]" data-name="tele">
          <IconoTV />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">TUBI</p>
        </div>
      </div>
    </div>
  );
}

function Juego() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full h-[79px]" data-name="Juego">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[25px] items-center pl-0 pr-[8px] py-[4px] relative w-full">
          <DiaYHora />
          <Equipos />
          <Puntaje />
          <Equipos2 />
          <div className="flex-1 min-w-0">
            <Estadios />
          </div>
          <div className="flex-1 min-w-0">
            <Transmision />
          </div>
        </div>
      </div>
    </div>
  );
}

// PARTIDO 2: 10 OCT – 19:00 HRS | América VS Tigres UANL | CIUDAD DE LOS DEPORTES | LMXF YouTube / ViX
function JuegoG1_DiaYHora() {
  return (
    <div className="bg-[#f766a1] box-border flex gap-[10px] items-center overflow-clip p-[12px] relative rounded-[8px] shrink-0 w-[345px]" data-name="Día y hora">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
        <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[108px]">
          <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Dias">
            <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#222222] text-[29px] tracking-[-1.015px] uppercase w-[67px]">
              <p className="leading-[normal]">JUEVES</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[75px]">
          <p className="leading-[normal]">10 oct</p>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[10px]">
          <p className="leading-[normal]">-</p>
        </div>
        <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[94px]">
          <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[98px]">
            <p className="leading-[normal]">19:00 HRS</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function JuegoG1_Equipo1() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="america">
        <TeamLogo teamName="AME" />
      </div>
    </div>
  );
}

function JuegoG1_Equipo2() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="tigres">
        <TeamLogo teamName="TIG" />
      </div>
    </div>
  );
}

function JuegoG1_Transmision() {
  return (
    <div className="absolute flex flex-col gap-[4px] items-start right-[24px] top-1/2 -translate-y-1/2 w-[223px]" data-name="TRANSMISIÓN">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]">
          <IconoEstadio />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">CIUDAD DE LOS DEPORTES</p>
        </div>
      </div>
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]" data-name="tele">
          <IconoTV />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">LMXF YOUTUBE / VIX</p>
        </div>
      </div>
    </div>
  );
}

function Juego1() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full h-[79px]" data-name="Juego">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[25px] items-center pl-0 pr-[8px] py-[4px] relative w-full">
          <JuegoG1_DiaYHora />
          <JuegoG1_Equipo1 />
          <Puntaje />
          <JuegoG1_Equipo2 />
          <div className="flex-1 min-w-0">
            <Estadios />
          </div>
          <div className="flex-1 min-w-0">
            <JuegoG1_Transmision />
          </div>
        </div>
      </div>
    </div>
  );
}

// PARTIDO 3: 10 OCT – 21:00 HRS | Tijuana VS Monterrey | ESTADIO CALIENTE | Tubi
function JuegoG2_DiaYHora() {
  return (
    <div className="bg-[#f766a1] box-border flex gap-[10px] items-center overflow-clip p-[12px] relative rounded-[8px] shrink-0 w-[345px]" data-name="Día y hora">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
        <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[108px]">
          <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Dias">
            <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#222222] text-[29px] tracking-[-1.015px] uppercase w-[67px]">
              <p className="leading-[normal]">JUEVES</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[75px]">
          <p className="leading-[normal]">10 oct</p>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[10px]">
          <p className="leading-[normal]">-</p>
        </div>
        <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[94px]">
          <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[98px]">
            <p className="leading-[normal]">21:00 HRS</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function JuegoG2_Equipo1() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="tijuana">
        <TeamLogo teamName="TIJ" />
      </div>
    </div>
  );
}

function JuegoG2_Equipo2() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="monterrey">
        <TeamLogo teamName="MON" />
      </div>
    </div>
  );
}

function JuegoG2_Transmision() {
  return (
    <div className="absolute flex flex-col gap-[4px] items-start right-[24px] top-1/2 -translate-y-1/2 w-[223px]" data-name="TRANSMISIÓN">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]">
          <IconoEstadio />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">ESTADIO CALIENTE</p>
        </div>
      </div>
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]" data-name="tele">
          <IconoTV />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">TUBI</p>
        </div>
      </div>
    </div>
  );
}

function Juego2() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full h-[79px]" data-name="Juego">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[25px] items-center pl-0 pr-[8px] py-[4px] relative w-full">
          <JuegoG2_DiaYHora />
          <JuegoG2_Equipo1 />
          <Puntaje />
          <JuegoG2_Equipo2 />
          <div className="flex-1 min-w-0">
            <Estadios />
          </div>
          <div className="flex-1 min-w-0">
            <JuegoG2_Transmision />
          </div>
        </div>
      </div>
    </div>
  );
}

// PARTIDO 4: 11 OCT – 12:00 HRS | Pumas VS Atlas | OLÍMPICO UNIVERSITARIO | LMXF YouTube / ViX
function JuegoG3_DiaYHora() {
  return (
    <div className="bg-[#f766a1] box-border flex gap-[10px] items-center overflow-clip p-[12px] relative rounded-[8px] shrink-0 w-[345px]" data-name="Día y hora">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
        <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[108px]">
          <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Dias">
            <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#222222] text-[29px] tracking-[-1.015px] uppercase w-[67px]">
              <p className="leading-[normal]">VIERNES</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[75px]">
          <p className="leading-[normal]">11 oct</p>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[10px]">
          <p className="leading-[normal]">-</p>
        </div>
        <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[94px]">
          <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[98px]">
            <p className="leading-[normal]">12:00 HRS</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function JuegoG3_Equipo1() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="pumas">
        <TeamLogo teamName="PUM" />
      </div>
    </div>
  );
}

function JuegoG3_Equipo2() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="atlas">
        <TeamLogo teamName="ATL" />
      </div>
    </div>
  );
}

function JuegoG3_Transmision() {
  return (
    <div className="absolute flex flex-col gap-[4px] items-start right-[24px] top-1/2 -translate-y-1/2 w-[223px]" data-name="TRANSMISIÓN">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]">
          <IconoEstadio />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">OLÍMPICO UNIVERSITARIO</p>
        </div>
      </div>
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]" data-name="tele">
          <IconoTV />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">LMXF YOUTUBE / VIX</p>
        </div>
      </div>
    </div>
  );
}

function Juego3() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full h-[79px]" data-name="Juego">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[25px] items-center pl-0 pr-[8px] py-[4px] relative w-full">
          <JuegoG3_DiaYHora />
          <JuegoG3_Equipo1 />
          <Puntaje />
          <JuegoG3_Equipo2 />
          <div className="flex-1 min-w-0">
            <Estadios />
          </div>
          <div className="flex-1 min-w-0">
            <JuegoG3_Transmision />
          </div>
        </div>
      </div>
    </div>
  );
}

// PARTIDO 5: 11 OCT – 15:45 HRS | Cruz Azul VS Santos Laguna | NORIA CANCHA 1 | LMXF YouTube / ViX
function JuegoG4_DiaYHora() {
  return (
    <div className="bg-[#f766a1] box-border flex gap-[10px] items-center overflow-clip p-[12px] relative rounded-[8px] shrink-0 w-[345px]" data-name="Día y hora">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
        <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[108px]">
          <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Dias">
            <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#222222] text-[29px] tracking-[-1.015px] uppercase w-[67px]">
              <p className="leading-[normal]">VIERNES</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[75px]">
          <p className="leading-[normal]">11 oct</p>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[10px]">
          <p className="leading-[normal]">-</p>
        </div>
        <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[94px]">
          <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[98px]">
            <p className="leading-[normal]">15:45 HRS</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function JuegoG4_Equipo1() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="cruz-azul">
        <TeamLogo teamName="CRU" />
      </div>
    </div>
  );
}

function JuegoG4_Equipo2() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="santos">
        <TeamLogo teamName="SAN" />
      </div>
    </div>
  );
}

function JuegoG4_Transmision() {
  return (
    <div className="absolute flex flex-col gap-[4px] items-start right-[24px] top-1/2 -translate-y-1/2 w-[223px]" data-name="TRANSMISIÓN">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]">
          <IconoEstadio />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">NORIA CANCHA 1</p>
        </div>
      </div>
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]" data-name="tele">
          <IconoTV />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">LMXF YOUTUBE / VIX</p>
        </div>
      </div>
    </div>
  );
}

function Juego4() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full h-[79px]" data-name="Juego">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[25px] items-center pl-0 pr-[8px] py-[4px] relative w-full">
          <JuegoG4_DiaYHora />
          <JuegoG4_Equipo1 />
          <Puntaje />
          <JuegoG4_Equipo2 />
          <div className="flex-1 min-w-0">
            <Estadios />
          </div>
          <div className="flex-1 min-w-0">
            <JuegoG4_Transmision />
          </div>
        </div>
      </div>
    </div>
  );
}

// PARTIDO 6: 11 OCT – 19:00 HRS | Juárez VS Necaxa | ESTADIO O. BENITO JUÁREZ | Tubi
function JuegoG5_DiaYHora() {
  return (
    <div className="bg-[#f766a1] box-border flex gap-[10px] items-center overflow-clip p-[12px] relative rounded-[8px] shrink-0 w-[345px]" data-name="Día y hora">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
        <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[108px]">
          <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Dias">
            <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#222222] text-[29px] tracking-[-1.015px] uppercase w-[67px]">
              <p className="leading-[normal]">VIERNES</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[75px]">
          <p className="leading-[normal]">11 oct</p>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[10px]">
          <p className="leading-[normal]">-</p>
        </div>
        <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[94px]">
          <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[98px]">
            <p className="leading-[normal]">19:00 HRS</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function JuegoG5_Equipo1() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="juarez">
        <TeamLogo teamName="JUA" />
      </div>
    </div>
  );
}

function JuegoG5_Equipo2() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="necaxa">
        <TeamLogo teamName="NEC" />
      </div>
    </div>
  );
}

function JuegoG5_Transmision() {
  return (
    <div className="absolute flex flex-col gap-[4px] items-start right-[24px] top-1/2 -translate-y-1/2 w-[223px]" data-name="TRANSMISIÓN">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]">
          <IconoEstadio />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">ESTADIO O. BENITO JUÁREZ</p>
        </div>
      </div>
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]" data-name="tele">
          <IconoTV />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">TUBI</p>
        </div>
      </div>
    </div>
  );
}

function Juego5() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full h-[79px]" data-name="Juego">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[25px] items-center pl-0 pr-[8px] py-[4px] relative w-full">
          <JuegoG5_DiaYHora />
          <JuegoG5_Equipo1 />
          <Puntaje />
          <JuegoG5_Equipo2 />
          <div className="flex-1 min-w-0">
            <Estadios />
          </div>
          <div className="flex-1 min-w-0">
            <JuegoG5_Transmision />
          </div>
        </div>
      </div>
    </div>
  );
}

// PARTIDO 7: 11 OCT – 21:00 HRS | Mazatlán VS Querétaro | ESTADIO EL ENCANTO | Tubi
function JuegoG6_DiaYHora() {
  return (
    <div className="bg-[#f766a1] box-border flex gap-[10px] items-center overflow-clip p-[12px] relative rounded-[8px] shrink-0 w-[345px]" data-name="Día y hora">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
        <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[108px]">
          <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Dias">
            <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#222222] text-[29px] tracking-[-1.015px] uppercase w-[67px]">
              <p className="leading-[normal]">VIERNES</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[75px]">
          <p className="leading-[normal]">11 oct</p>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[10px]">
          <p className="leading-[normal]">-</p>
        </div>
        <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[94px]">
          <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[98px]">
            <p className="leading-[normal]">21:00 HRS</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function JuegoG6_Equipo1() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="mazatlan">
        <TeamLogo teamName="MAZ" />
      </div>
    </div>
  );
}

function JuegoG6_Equipo2() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="queretaro">
        <TeamLogo teamName="QRO" />
      </div>
    </div>
  );
}

function JuegoG6_Transmision() {
  return (
    <div className="absolute flex flex-col gap-[4px] items-start right-[24px] top-1/2 -translate-y-1/2 w-[223px]" data-name="TRANSMISIÓN">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]">
          <IconoEstadio />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">ESTADIO EL ENCANTO</p>
        </div>
      </div>
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]" data-name="tele">
          <IconoTV />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">TUBI</p>
        </div>
      </div>
    </div>
  );
}

function Juego6() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full h-[79px]" data-name="Juego">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[25px] items-center pl-0 pr-[8px] py-[4px] relative w-full">
          <JuegoG6_DiaYHora />
          <JuegoG6_Equipo1 />
          <Puntaje />
          <JuegoG6_Equipo2 />
          <div className="flex-1 min-w-0">
            <Estadios />
          </div>
          <div className="flex-1 min-w-0">
            <JuegoG6_Transmision />
          </div>
        </div>
      </div>
    </div>
  );
}

// PARTIDO 8: 12 OCT – 11:00 HRS | Chivas VS Puebla | ESTADIO AKRON | Tubi
function JuegoG7_DiaYHora() {
  return (
    <div className="bg-[#f766a1] box-border flex gap-[10px] items-center overflow-clip p-[12px] relative rounded-[8px] shrink-0 w-[345px]" data-name="Día y hora">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
        <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[108px]">
          <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Dias">
            <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#222222] text-[29px] tracking-[-1.015px] uppercase w-[67px]">
              <p className="leading-[normal]">SÁBADO</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[75px]">
          <p className="leading-[normal]">12 oct</p>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[10px]">
          <p className="leading-[normal]">-</p>
        </div>
        <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[94px]">
          <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[98px]">
            <p className="leading-[normal]">11:00 HRS</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function JuegoG7_Equipo1() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="chivas">
        <TeamLogo teamName="CHI" />
      </div>
    </div>
  );
}

function JuegoG7_Equipo2() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="puebla">
        <TeamLogo teamName="PUE" />
      </div>
    </div>
  );
}

function JuegoG7_Transmision() {
  return (
    <div className="absolute flex flex-col gap-[4px] items-start right-[24px] top-1/2 -translate-y-1/2 w-[223px]" data-name="TRANSMISIÓN">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]">
          <IconoEstadio />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">ESTADIO AKRON</p>
        </div>
      </div>
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]" data-name="tele">
          <IconoTV />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">TUBI</p>
        </div>
      </div>
    </div>
  );
}

function Juego7() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full h-[79px]" data-name="Juego">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[25px] items-center pl-0 pr-[8px] py-[4px] relative w-full">
          <JuegoG7_DiaYHora />
          <JuegoG7_Equipo1 />
          <Puntaje />
          <JuegoG7_Equipo2 />
          <div className="flex-1 min-w-0">
            <Estadios />
          </div>
          <div className="flex-1 min-w-0">
            <JuegoG7_Transmision />
          </div>
        </div>
      </div>
    </div>
  );
}

// PARTIDO 9: 12 OCT – 17:00 HRS | Atlético San Luis VS Toluca | ESTADIO ALFONSO LASTRAS | ESPN / Disney
function JuegoG8_DiaYHora() {
  return (
    <div className="bg-[#f766a1] box-border flex gap-[10px] items-center overflow-clip p-[12px] relative rounded-[8px] shrink-0 w-[345px]" data-name="Día y hora">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
        <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[108px]">
          <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Dias">
            <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#222222] text-[29px] tracking-[-1.015px] uppercase w-[67px]">
              <p className="leading-[normal]">SÁBADO</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[75px]">
          <p className="leading-[normal]">12 oct</p>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[10px]">
          <p className="leading-[normal]">-</p>
        </div>
        <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[94px]">
          <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[29px] text-black tracking-[-1.015px] uppercase w-[98px]">
            <p className="leading-[normal]">17:00 HRS</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function JuegoG8_Equipo1() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="san-luis">
        <TeamLogo teamName="SLU" />
      </div>
    </div>
  );
}

function JuegoG8_Equipo2() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]" data-name="Equipos">
      <div className="h-[67px] relative shrink-0 w-[58px]" data-name="toluca">
        <TeamLogo teamName="TOL" />
      </div>
    </div>
  );
}

function JuegoG8_Transmision() {
  return (
    <div className="absolute flex flex-col gap-[4px] items-start right-[24px] top-1/2 -translate-y-1/2 w-[223px]" data-name="TRANSMISIÓN">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]">
          <IconoEstadio />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">ESTADIO ALFONSO LASTRAS</p>
        </div>
      </div>
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]" data-name="tele">
          <IconoTV />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">ESPN / DISNEY</p>
        </div>
      </div>
    </div>
  );
}

function Juego8() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full h-[79px]" data-name="Juego">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[25px] items-center pl-0 pr-[8px] py-[4px] relative w-full">
          <JuegoG8_DiaYHora />
          <JuegoG8_Equipo1 />
          <Puntaje />
          <JuegoG8_Equipo2 />
          <div className="flex-1 min-w-0">
            <Estadios />
          </div>
          <div className="flex-1 min-w-0">
            <JuegoG8_Transmision />
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame26() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start px-[32px] py-[10px] relative w-full">
          <Juego />
          <Juego1 />
          <Juego2 />
          <Juego3 />
          <Juego4 />
          <Juego5 />
          <Juego6 />
          <Juego7 />
          <Juego8 />
        </div>
      </div>
    </div>
  );
}

function PieDePagina() {
  return (
    <div className="basis-0 grow min-h-px min-w-px opacity-[0.64] relative shrink-0 w-full" data-name="Pie de página">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex font-['Barlow_Condensed:Bold',_sans-serif] items-center justify-between leading-[0] not-italic px-[32px] py-0 relative size-full text-[#222222] text-[28px] text-nowrap tracking-[1.68px]">
          <div className="flex flex-col justify-center lowercase relative shrink-0">
            <p className="leading-[normal] text-nowrap whitespace-pre">@somoslocalesfemx</p>
          </div>
          <div className="capitalize flex flex-col justify-center relative shrink-0">
            <p className="leading-[normal] text-nowrap whitespace-pre">#tienesQueVivirlo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame35() {
  return (
    <div className="absolute box-border content-stretch flex flex-col gap-[16px] items-start left-0 px-0 py-[32px] size-[1080px] top-0">
      <Frame34 />
      <Frame26 />
      <PieDePagina />
    </div>
  );
}

// Componente principal optimizado
export default function AperturaJornada14() {
  return (
    <div className="relative size-full" data-name="Apertura / JORNADA 15">
      <img 
        alt="Fondo Liga MX Femenil" 
        className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" 
        src={backgroundImage} 
        loading="eager"
        decoding="async"
      />
      <Frame35 />
    </div>
  );
}

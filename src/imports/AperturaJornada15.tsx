import { memo, useCallback, useState } from 'react';

import logoLigaBBVA from 'figma:asset/282fbfddfb13edc69252a49f15e9f9646a1d8ece.png';
import logoSomosLocales from 'figma:asset/930d5de55d9fd27c0951aa3f3d28301d6e434476.png';
import iconoEstadio from 'figma:asset/86e9cc8c38c10cd6e63afb3b899c4213d74da2b3.png';
import iconoTV from 'figma:asset/e9ea8e4f142524f4ed30284ac75cceb1a6c7262b.png';
import backgroundImage from 'figma:asset/8f36f96feea030035ed7a4c3868a81ffe20a24c2.png';

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
import logoPuebla from 'figma:asset/9ce063fc8d79c9b2ccd776183115bc3f1d5c25cf.png';
import logoRayadas from 'figma:asset/c811f5ddc0575eba11c0b97d6cc20e4870d7edf0.png';
import logoSanLuis from 'figma:asset/f85cfbab493437f594dfc6f886252c0de830e6f9.png';
import logoSantos from 'figma:asset/61cb24a2d36cb4e747ba5da4a26f82714694d300.png';
import pachucaLogo from '../assets/pachuca.png';

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

const TEAM_LOGOS = {
  QRO: logoQueretaro,
  PUM: logoPumas,
  JUA: logoJuarez,
  TIG: logoTigres,
  NEC: logoNecaxa,
  ATL: logoAtlas,
  PUE: logoPuebla,
  CRU: logoCruzAzul,
  SLU: logoSanLuis,
  MAZ: logoMazatlan,
  TOL: logoToluca,
  AME: logoAmerica,
  LEO: logoLeon,
  SAN: logoSantos,
  MON: logoRayadas,
  PAC: pachucaLogo,
  CHI: logoChivas,
  TIJ: logoTijuana,
} as const;

type TeamCode = keyof typeof TEAM_LOGOS;

type MatchInfo = {
  id: string;
  day: 'VIERNES' | 'SÁBADO' | 'DOMINGO';
  dateLabel: string;
  time: string;
  home: TeamCode;
  away: TeamCode;
  stadium: string;
  broadcast: string;
};

type Selection = 'L' | 'E' | 'V';

const MATCHES: MatchInfo[] = [
  {
    id: 'leo-pac',
    day: 'VIERNES',
    dateLabel: '10 OCT',
    time: '17:00 HRS',
    home: 'LEO',
    away: 'PAC',
    stadium: 'ESTADIO NOU CAMP',
    broadcast: 'TUBI',
  },
  {
    id: 'ame-tig',
    day: 'VIERNES',
    dateLabel: '10 OCT',
    time: '19:00 HRS',
    home: 'AME',
    away: 'TIG',
    stadium: 'CIUDAD DE LOS DEPORTES',
    broadcast: 'LMXF YOUTUBE / VIX',
  },
  {
    id: 'tij-mon',
    day: 'VIERNES',
    dateLabel: '10 OCT',
    time: '21:00 HRS',
    home: 'TIJ',
    away: 'MON',
    stadium: 'ESTADIO CALIENTE',
    broadcast: 'TUBI',
  },
  {
    id: 'pum-atl',
    day: 'SÁBADO',
    dateLabel: '11 OCT',
    time: '12:00 HRS',
    home: 'PUM',
    away: 'ATL',
    stadium: 'OLÍMPICO UNIVERSITARIO',
    broadcast: 'LMXF YOUTUBE / VIX',
  },
  {
    id: 'cru-san',
    day: 'SÁBADO',
    dateLabel: '11 OCT',
    time: '15:45 HRS',
    home: 'CRU',
    away: 'SAN',
    stadium: 'NORIA CANCHA 1',
    broadcast: 'LMXF YOUTUBE / VIX',
  },
  {
    id: 'nec-jua',
    day: 'SÁBADO',
    dateLabel: '11 OCT',
    time: '19:00 HRS',
    home: 'NEC',
    away: 'JUA',
    stadium: 'ESTADIO VICTORIA',
    broadcast: 'LMXF YOUTUBE / VIX',
  },
  {
    id: 'maz-qro',
    day: 'SÁBADO',
    dateLabel: '11 OCT',
    time: '21:00 HRS',
    home: 'MAZ',
    away: 'QRO',
    stadium: 'ESTADIO EL ENCANTO',
    broadcast: 'TUBI',
  },
  {
    id: 'pue-chi',
    day: 'DOMINGO',
    dateLabel: '12 OCT',
    time: '11:00 HRS',
    home: 'PUE',
    away: 'CHI',
    stadium: 'ESTADIO CUAUHTÉMOC',
    broadcast: 'TUBI',
  },
  {
    id: 'slu-tol',
    day: 'DOMINGO',
    dateLabel: '12 OCT',
    time: '17:00 HRS',
    home: 'SLU',
    away: 'TOL',
    stadium: 'ESTADIO ALFONSO LASTRAS',
    broadcast: 'ESPN / DISNEY',
  },
];

const TeamLogo = memo(({ teamName }: { teamName: TeamCode }) => {
  const logoSrc = TEAM_LOGOS[teamName];

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
      <span className="text-xs font-bold text-gray-600 uppercase">{teamName}</span>
    </div>
  );
});

function TeamSlot({ team }: { team: TeamCode }) {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]">
      <div className="h-[67px] relative shrink-0 w-[58px]">
        <TeamLogo teamName={team} />
      </div>
    </div>
  );
}

function Puntaje({ selected, onSelect }: { selected: Selection | null; onSelect: (value: Selection) => void }) {
  return (
    <div className="flex items-center gap-[8px] relative shrink-0">
      {(['L', 'E', 'V'] as Selection[]).map((label) => {
        const isSelected = selected === label;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            aria-pressed={isSelected}
            data-selected={isSelected ? 'true' : undefined}
            className="puntaje-button"
          >
            <span className="puntaje-button__label font-['Antonio:Regular',_sans-serif] font-normal text-[29px] tracking-[-0.56px] uppercase">
              {label}
            </span>
            {isSelected ? (
              <span className="puntaje-button__badge">
                ✓
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function MatchTime({ day, dateLabel, time }: Pick<MatchInfo, 'day' | 'dateLabel' | 'time'>) {
  return (
    <div className="bg-[#f766a1] box-border flex gap-[10px] items-center overflow-clip p-[12px] relative rounded-[8px] shrink-0 w-[345px]">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
        <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[108px]">
          <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
            <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[#222222] text-[29px] tracking-[-1.015px] uppercase w-[67px]">
              <p className="leading-[normal]">{day}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[29px] text-black tracking-[-1.015px] uppercase w-[75px]">
          <p className="leading-[normal]">{dateLabel}</p>
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[29px] text-black tracking-[-1.015px] uppercase w-[10px]">
          <p className="leading-[normal]">-</p>
        </div>
        <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[94px]">
          <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[29px] text-black tracking-[-1.015px] uppercase w-[98px]">
            <p className="leading-[normal]">{time}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchMeta({ stadium, broadcast }: Pick<MatchInfo, 'stadium' | 'broadcast'>) {
  return (
    <div className="absolute flex flex-col gap-[4px] items-start right-[24px] top-1/2 -translate-y-1/2 w-[223px]">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]">
          <IconoEstadio />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">{stadium}</p>
        </div>
      </div>
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]">
          <IconoTV />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">{broadcast}</p>
        </div>
      </div>
    </div>
  );
}

function MatchRow({ match, selected, onSelect }: { match: MatchInfo; selected: Selection | null; onSelect: (value: Selection) => void }) {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full h-[79px]">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[25px] items-center pl-0 pr-[8px] py-[4px] relative w-full">
          <MatchTime day={match.day} dateLabel={match.dateLabel} time={match.time} />
          <TeamSlot team={match.home} />
          <Puntaje selected={selected} onSelect={onSelect} />
          <TeamSlot team={match.away} />
          <div className="flex-1 min-w-0" />
          <div className="flex-1 min-w-0">
            <MatchMeta stadium={match.stadium} broadcast={match.broadcast} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame33() {
  return (
    <div className="content-stretch flex items-center justify-start relative shrink-0 w-[280px] h-full">
      <div className="h-[113px] relative shrink-0 w-[280px] flex items-center justify-center" data-name="liga bbva mx femenil">
        <LogoLigaBBVA />
      </div>
    </div>
  );
}

function JornadaCenter() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center justify-center leading-[0] text-center">
        <p className="leading-[normal] text-[24px] font-['Antonio'] font-bold text-white uppercase mb-[4px] tracking-[2px]">APERTURA 2025</p>
        <p className="leading-[normal] text-[40px] font-['Antonio'] font-bold text-[rgba(63,63,63,1)] uppercase tracking-[1px]">JORNADA 15</p>
      </div>
    </div>
  );
}

function Frame34() {
  return (
    <div className="content-stretch flex h-[130px] items-end relative shrink-0 w-full" data-name="Header">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center pb-[15px] pl-[32px] pr-0 pt-0 relative shrink-0 w-[280px]">
          <Frame33 />
        </div>
        <div
          className="flex-1 flex items-center justify-center pb-[15px]"
          style={{ paddingLeft: '90px' }}
        >
          <JornadaCenter />
        </div>
        <div className="box-border content-stretch flex items-center justify-end pb-[15px] pl-0 pr-[32px] pt-0 relative shrink-0 w-[280px]">
          <div className="h-[88px] relative shrink-0 w-[132px] flex items-center justify-center" data-name="somos locales logo">
            <LogoSomosLocales />
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame26({ selections, onSelect }: { selections: Record<string, Selection | null>; onSelect: (matchId: string, value: Selection) => void }) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start px-[32px] py-[10px] relative w-full">
          {MATCHES.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              selected={selections[match.id] ?? null}
              onSelect={(value) => onSelect(match.id, value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PieDePagina() {
  return (
    <div className="basis-0 grow min-h-px min-w-px opacity-[0.64] relative shrink-0 w-full">
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

function Frame35({ selections, onSelect }: { selections: Record<string, Selection | null>; onSelect: (matchId: string, value: Selection) => void }) {
  return (
    <div className="absolute box-border content-stretch flex flex-col gap-[16px] items-start left-0 px-0 py-[32px] size-[1080px] top-0">
      <Frame34 />
      <Frame26 selections={selections} onSelect={onSelect} />
      <PieDePagina />
    </div>
  );
}

export default function AperturaJornada15() {
  const [selections, setSelections] = useState<Record<string, Selection | null>>(() =>
    MATCHES.reduce<Record<string, Selection | null>>((acc, match) => {
      acc[match.id] = null;
      return acc;
    }, {})
  );

  const handleSelect = useCallback((matchId: string, value: Selection) => {
    setSelections((prev) => ({ ...prev, [matchId]: value }));
  }, []);

  return (
    <div className="relative size-full" data-name="Apertura / JORNADA 15">
      <img
        alt="Fondo Liga MX Femenil"
        className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
        src={backgroundImage}
        loading="eager"
        decoding="async"
      />
      <Frame35 selections={selections} onSelect={handleSelect} />
    </div>
  );
}

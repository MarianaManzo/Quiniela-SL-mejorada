import { memo, useCallback, useEffect } from 'react';

import {
  MATCHES,
  type MatchInfo,
  type QuinielaSelections,
  type Selection,
  type TeamCode,
} from '../quiniela/config';
import {
  DEFAULT_QUINIELA_ASSETS,
  type QuinielaAssetBundle,
} from '../quiniela/assets';
import { formatParticipantName } from '../utils/formatParticipantName';

type LayoutVariant = 'default' | 'export';

const LogoLigaBBVA = memo(({ assets }: { assets: QuinielaAssetBundle }) => (
  <img alt="Liga BBVA MX Femenil" className="h-full w-auto object-contain" src={assets.logos.ligaBBVA} loading="eager" />
));

const LogoSomosLocales = memo(({ assets }: { assets: QuinielaAssetBundle }) => (
  <img alt="Somos Locales" className="w-full h-full object-contain" src={assets.logos.somosLocales} loading="eager" />
));

const IconoEstadio = memo(({ assets }: { assets: QuinielaAssetBundle }) => (
  <img alt="Estadio" className="w-8 h-8 object-contain opacity-50" src={assets.icons.estadio} loading="eager" />
));

const IconoTVImg = memo(({ assets }: { assets: QuinielaAssetBundle }) => (
  <img alt="Transmisión TV" className="w-8 h-8 object-contain opacity-50" src={assets.icons.tv} loading="eager" />
));

const TeamLogo = memo(({ teamName, assets }: { teamName: TeamCode; assets: QuinielaAssetBundle }) => {
  const logoSrc = assets.teamLogos[teamName];

  if (logoSrc) {
    return (
      <img
        alt={`Logo ${teamName}`}
        className="team-logo-image w-full h-full object-contain"
        src={logoSrc}
        loading="eager"
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

function TeamSlot({ team, assets }: { team: TeamCode; assets: QuinielaAssetBundle }) {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] items-center justify-center px-0 py-[2px] relative shrink-0 size-[71px]">
      <div className="team-slot-logo h-[67px] relative shrink-0 w-[58px]">
        <TeamLogo teamName={team} assets={assets} />
      </div>
    </div>
  );
}

function Puntaje({
  selected,
  onSelect,
  readOnly,
  showValidation,
}: {
  selected: Selection | null;
  onSelect: (value: Selection) => void;
  readOnly: boolean;
  showValidation: boolean;
}) {
  const isInvalid = showValidation && selected === null;

  return (
    <div
      className="puntaje-group flex items-center gap-[8px] relative shrink-0"
      data-invalid={isInvalid ? 'true' : undefined}
      aria-invalid={isInvalid}
    >
            {(['L', 'E', 'V'] as Selection[]).map((label) => {
              const isSelected = selected === label;
              return (
                <button
                  key={label}
            type="button"
            onClick={() => {
              if (!readOnly) {
                onSelect(label);
              }
            }}
            disabled={readOnly}
            aria-pressed={isSelected}
            data-selected={isSelected ? 'true' : undefined}
            className="puntaje-button"
          >
            <span
              className="puntaje-button__label font-['Antonio:Regular',_sans-serif] font-normal text-[29px] tracking-[-0.56px] uppercase"
            >
              {label}
            </span>
            {isSelected ? (
              <span className="puntaje-button__badge">
                <span className="puntaje-badge-inner">✓</span>
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
    <div className="match-time bg-[#f766a1] box-border flex gap-[10px] items-center overflow-clip p-[12px] relative rounded-[8px] shrink-0 w-[345px]">
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

function MatchMeta({
  stadium,
  broadcast,
  assets,
}: Pick<MatchInfo, 'stadium' | 'broadcast'> & { assets: QuinielaAssetBundle }) {
  return (
    <div className="match-meta absolute flex flex-col gap-[4px] items-start right-[24px] top-1/2 -translate-y-1/2 w-[223px]">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]" data-icon-type="stadium">
          <IconoEstadio assets={assets} />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">{stadium}</p>
        </div>
      </div>
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div className="relative shrink-0 size-[32px]" data-icon-type="broadcast">
          <IconoTVImg assets={assets} />
        </div>
        <div className="flex flex-col font-['Antonio:Regular',_sans-serif] font-normal justify-center leading-[0] text-[21px] text-black tracking-[-0.735px] uppercase">
          <p className="leading-[normal]">{broadcast}</p>
        </div>
      </div>
    </div>
  );
}

function MatchRow({
  match,
  selected,
  onSelect,
  readOnly,
  showValidation,
  assets,
}: {
  match: MatchInfo;
  selected: Selection | null;
  onSelect: (value: Selection) => void;
  readOnly: boolean;
  showValidation: boolean;
  assets: QuinielaAssetBundle;
}) {
  return (
    <div className="match-row bg-white relative rounded-[8px] shrink-0 w-full h-[79px]">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[25px] items-center pl-0 pr-[8px] py-[4px] relative w-full">
          <MatchTime day={match.day} dateLabel={match.dateLabel} time={match.time} />
          <TeamSlot team={match.home} assets={assets} />
          <Puntaje selected={selected} onSelect={onSelect} readOnly={readOnly} showValidation={showValidation} />
          <TeamSlot team={match.away} assets={assets} />
          <div className="flex-1 min-w-0" />
          <div className="flex-1 min-w-0">
            <MatchMeta stadium={match.stadium} broadcast={match.broadcast} assets={assets} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame33({ assets }: { assets: QuinielaAssetBundle }) {
  return (
    <div className="content-stretch flex items-center justify-start relative shrink-0 w-[280px] h-full">
      <div className="h-[113px] relative shrink-0 w-[280px] flex items-center justify-center" data-name="liga bbva mx femenil">
        <LogoLigaBBVA assets={assets} />
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

function Frame34({ assets }: { assets: QuinielaAssetBundle }) {
  return (
    <div className="content-stretch flex h-[130px] items-end relative shrink-0 w-full" data-name="Header">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center pb-[15px] pl-[32px] pr-0 pt-0 relative shrink-0 w-[280px]">
          <Frame33 assets={assets} />
        </div>
        <div
          className="flex-1 flex items-center justify-center pb-[15px]"
          style={{ paddingLeft: '90px' }}
        >
          <JornadaCenter />
        </div>
        <div className="box-border content-stretch flex items-center justify-end pb-[15px] pl-0 pr-[32px] pt-0 relative shrink-0 w-[280px]">
          <div className="h-[88px] relative shrink-0 w-[132px] flex items-center justify-center" data-name="somos locales logo">
            <LogoSomosLocales assets={assets} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame26({
  selections,
  onSelect,
  readOnly,
  showValidation,
  assets,
}: {
  selections: QuinielaSelections;
  onSelect: (matchId: string, value: Selection) => void;
  readOnly: boolean;
  showValidation: boolean;
  assets: QuinielaAssetBundle;
}) {
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
              readOnly={readOnly}
              showValidation={showValidation}
              assets={assets}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PieDePagina({ participantName }: { participantName?: string | null }) {
  const displayName =
    formatParticipantName(participantName ?? null, undefined) ?? 'JUEGA LA QUINIELA';

  return (
    <div className="basis-0 grow min-h-px min-w-px opacity-[0.64] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex font-['Barlow_Condensed:Bold',_sans-serif] items-center justify-between leading-[0] not-italic px-[32px] py-0 relative size-full text-[#222222] text-[28px] text-nowrap tracking-[1.68px]">
          <div className="flex flex-col justify-center lowercase relative shrink-0">
            <p className="leading-[normal] text-nowrap whitespace-pre">@somoslocalesfemx</p>
          </div>
          <div className="flex flex-col justify-center items-center flex-1">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '34px',
                padding: '5px 26px',
                borderRadius: '999px',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                background: '#0a0a0a',
                boxShadow: '0 20px 40px -24px rgba(0, 0, 0, 0.6)',
                maxWidth: '90%',
              }}
            >
              <span
                className="participant-name-text"
                style={{
                  fontFamily: 'Antonio, sans-serif',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  fontSize: '30px',
                  lineHeight: 1,
                  color: '#fdfdfd',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="capitalize flex flex-col justify-center relative shrink-0 text-right">
            <p className="leading-[normal] text-nowrap whitespace-pre">#tienesQueVivirlo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame35({
  selections,
  onSelect,
  readOnly,
  showValidation,
  participantName,
  assets,
  contentOffsetY = 0,
  variant,
  showGrid = false,
}: {
  selections: QuinielaSelections;
  onSelect: (matchId: string, value: Selection) => void;
  readOnly: boolean;
  showValidation: boolean;
  participantName?: string | null;
  assets: QuinielaAssetBundle;
  contentOffsetY?: number;
  variant: LayoutVariant;
  showGrid?: boolean;
}) {
  return (
    <div
      className="absolute box-border content-stretch flex flex-col gap-[16px] items-start left-0 px-0 py-[32px] size-[1080px] top-0"
      style={contentOffsetY !== 0 ? { transform: `translateY(${contentOffsetY}px)` } : undefined}
      data-layout-variant={variant}
      data-debug-grid={showGrid ? 'true' : undefined}
    >
      <Frame34 assets={assets} />
      <Frame26 selections={selections} onSelect={onSelect} readOnly={readOnly} showValidation={showValidation} assets={assets} />
      <PieDePagina participantName={participantName} />
    </div>
  );
}

interface AperturaJornada15Props {
  selections: QuinielaSelections;
  onSelect: (matchId: string, value: Selection) => void;
  isReadOnly?: boolean;
  showSelectionErrors?: boolean;
  participantName?: string | null;
  assets?: QuinielaAssetBundle;
  contentOffsetY?: number;
  layoutVariant?: LayoutVariant;
  showGrid?: boolean;
}

export default function AperturaJornada15({
  selections,
  onSelect,
  isReadOnly = false,
  showSelectionErrors = false,
  participantName,
  assets = DEFAULT_QUINIELA_ASSETS,
  contentOffsetY = 0,
  layoutVariant = 'default',
  showGrid = false,
}: AperturaJornada15Props) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    Object.values(assets.teamLogos).forEach((src) => {
      const preloader = new Image();
      preloader.decoding = 'async';
      preloader.src = src;
    });
  }, [assets]);

  const handleSelect = useCallback(
    (matchId: string, value: Selection) => {
      if (isReadOnly) {
        return;
      }

      onSelect(matchId, value);
    },
    [onSelect, isReadOnly]
  );

  return (
    <div className="relative size-full" data-name="Apertura / JORNADA 15">
      <img
        alt="Fondo Liga MX Femenil"
        className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
        src={assets.backgroundImage}
        loading="eager"
        decoding="async"
      />
      <Frame35
        selections={selections}
        onSelect={handleSelect}
        readOnly={isReadOnly}
        showValidation={showSelectionErrors}
        participantName={participantName}
        assets={assets}
        contentOffsetY={contentOffsetY}
        variant={layoutVariant}
        showGrid={showGrid}
      />
    </div>
  );
}

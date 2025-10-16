import backgroundImage from 'figma:asset/background.jpg';
import backgroundImageInline from '../assets/background.jpg?inline';
import logoLigaBBVA from 'figma:asset/logo-liga-bbva.png';
import logoLigaBBVAInline from '../assets/logo-liga-bbva.png?inline';
import logoSomosLocales from 'figma:asset/logo-somos-locales.png';
import logoSomosLocalesInline from '../assets/logo-somos-locales.png?inline';
import iconoEstadio from 'figma:asset/icono-estadio.png';
import iconoEstadioInline from '../assets/icono-estadio.png?inline';
import iconoTV from '../Icon/tv.svg';
import iconoTVInlineRaw from '../Icon/tv.svg?raw';
import logoAmerica from 'figma:asset/logo-america.png';
import logoAmericaInline from '../assets/logo-america.png?inline';
import logoAtlas from 'figma:asset/logo-atlas.png';
import logoAtlasInline from '../assets/logo-atlas.png?inline';
import logoChivas from 'figma:asset/logo-chivas.png';
import logoChivasInline from '../assets/logo-chivas.png?inline';
import logoCruzAzul from 'figma:asset/logo-cruz-azul.png';
import logoCruzAzulInline from '../assets/logo-cruz-azul.png?inline';
import logoJuarez from 'figma:asset/logo-juarez.png';
import logoJuarezInline from '../assets/logo-juarez.png?inline';
import logoLeon from 'figma:asset/logo-leon.png';
import logoLeonInline from '../assets/logo-leon.png?inline';
import logoMazatlan from 'figma:asset/logo-mazatlan.png';
import logoMazatlanInline from '../assets/logo-mazatlan.png?inline';
import logoNecaxa from 'figma:asset/logo-necaxa.png';
import logoNecaxaInline from '../assets/logo-necaxa.png?inline';
import logoPachuca from '../assets/logo-pachuca.png';
import logoPachucaInline from '../assets/logo-pachuca.png?inline';
import logoPuebla from 'figma:asset/logo-puebla.png';
import logoPueblaInline from '../assets/logo-puebla.png?inline';
import logoPumas from 'figma:asset/logo-pumas.png';
import logoPumasInline from '../assets/logo-pumas.png?inline';
import logoQueretaro from 'figma:asset/logo-queretaro.png';
import logoQueretaroInline from '../assets/logo-queretaro.png?inline';
import logoRayadas from 'figma:asset/logo-rayadas.png';
import logoRayadasInline from '../assets/logo-rayadas.png?inline';
import logoSanLuis from 'figma:asset/logo-san-luis.png';
import logoSanLuisInline from '../assets/logo-san-luis.png?inline';
import logoSantos from 'figma:asset/logo-santos.png';
import logoSantosInline from '../assets/logo-santos.png?inline';
import logoTigres from 'figma:asset/logo-tigres.png';
import logoTigresInline from '../assets/logo-tigres.png?inline';
import logoTijuana from 'figma:asset/logo-tijuana.png';
import logoTijuanaInline from '../assets/logo-tijuana.png?inline';
import logoToluca from 'figma:asset/logo-toluca.png';
import logoTolucaInline from '../assets/logo-toluca.png?inline';
import type { TeamCode } from './config';

const toSvgDataUri = (raw: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(raw)}`;

export type QuinielaAssetBundle = {
  backgroundImage: string;
  logos: {
    ligaBBVA: string;
    somosLocales: string;
  };
  icons: {
    estadio: string;
    tv: string;
  };
  teamLogos: Record<TeamCode, string>;
};

const buildTeamLogos = (values: Record<TeamCode, string>): Record<TeamCode, string> => values;

export const DEFAULT_QUINIELA_ASSETS: QuinielaAssetBundle = {
  backgroundImage,
  logos: {
    ligaBBVA: logoLigaBBVA,
    somosLocales: logoSomosLocales,
  },
  icons: {
    estadio: iconoEstadio,
    tv: iconoTV,
  },
  teamLogos: buildTeamLogos({
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
    PAC: logoPachuca,
    CHI: logoChivas,
    TIJ: logoTijuana,
  }),
};

export const INLINE_QUINIELA_ASSETS: QuinielaAssetBundle = {
  backgroundImage: backgroundImageInline,
  logos: {
    ligaBBVA: logoLigaBBVAInline,
    somosLocales: logoSomosLocalesInline,
  },
  icons: {
    estadio: iconoEstadioInline,
    tv: toSvgDataUri(iconoTVInlineRaw),
  },
  teamLogos: buildTeamLogos({
    QRO: logoQueretaroInline,
    PUM: logoPumasInline,
    JUA: logoJuarezInline,
    TIG: logoTigresInline,
    NEC: logoNecaxaInline,
    ATL: logoAtlasInline,
    PUE: logoPueblaInline,
    CRU: logoCruzAzulInline,
    SLU: logoSanLuisInline,
    MAZ: logoMazatlanInline,
    TOL: logoTolucaInline,
    AME: logoAmericaInline,
    LEO: logoLeonInline,
    SAN: logoSantosInline,
    MON: logoRayadasInline,
    PAC: logoPachucaInline,
    CHI: logoChivasInline,
    TIJ: logoTijuanaInline,
  }),
};

import imgTijuana from "../assets/logo-tijuana.png";
import imgToluca from "../assets/logo-toluca.png";
import imgAmerica from "../assets/logo-america.png";
import imgAtlas from "../assets/logo-atlas.png";
import imgChivas from "../assets/logo-chivas.png";
import imgCruzAzul from "../assets/logo-cruz-azul.png";
import imgLeon from "../assets/logo-leon.png";
import imgMazatlan from "../assets/logo-mazatlan.png";
import imgNecaxa from "../assets/logo-necaxa.png";
import imgPachuca from "../assets/logo-pachuca.png";
import imgPuebla from "../assets/logo-puebla.png";
import imgRayadas from "../assets/logo-rayadas.png";
import imgSanLuis from "../assets/logo-san-luis.png";
import imgSantos from "../assets/logo-santos.png";

export default function Equipos() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative size-full" data-name="equipos">
      <div className="aspect-[1320/1319] relative shrink-0 w-full" data-name="tijuana">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgTijuana} />
      </div>
      <div className="aspect-[1320/1319] relative shrink-0 w-full" data-name="toluca">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgToluca} />
      </div>
      <div className="aspect-[1320/1319] relative shrink-0 w-full" data-name="america">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgAmerica} />
      </div>
      <div className="aspect-[1320/1319] relative shrink-0 w-full" data-name="atlas">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgAtlas} />
      </div>
      <div className="aspect-[1320/1319] relative shrink-0 w-full" data-name="chivas">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgChivas} />
      </div>
      <div className="aspect-[1320/1319] relative shrink-0 w-full" data-name="cruz azul">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgCruzAzul} />
      </div>
      <div className="aspect-[1320/1319] relative shrink-0 w-full" data-name="leon">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgLeon} />
      </div>
      <div className="aspect-[1320/1319] relative shrink-0 w-full" data-name="mazatlan">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgMazatlan} />
      </div>
      <div className="aspect-[1320/1319] relative shrink-0 w-full" data-name="necaxa">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgNecaxa} />
      </div>
      <div className="aspect-[1320/1319] relative shrink-0 w-full" data-name="pachuca">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgPachuca} />
      </div>
      <div className="aspect-[1320/1319] relative shrink-0 w-full" data-name="puebla">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgPuebla} />
      </div>
      <div className="aspect-[1320/1319] relative shrink-0 w-full" data-name="rayadas">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgRayadas} />
      </div>
      <div className="aspect-[1320/1319] relative shrink-0 w-full" data-name="san luis">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgSanLuis} />
      </div>
      <div className="aspect-[1320/1319] relative shrink-0 w-full" data-name="santos">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgSantos} />
      </div>
    </div>
  );
}

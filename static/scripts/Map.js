import Map from 'https://cdn.skypack.dev/ol/Map.js';
import View from 'https://cdn.skypack.dev/ol/View.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM.js';
import TileWMS from 'https://cdn.skypack.dev/ol/source/TileWMS.js';
import Projection from 'https://cdn.skypack.dev/ol/proj/Projection.js';
import ImageLayer from 'https://cdn.skypack.dev/ol/layer/Image.js';
import ImageWMS from 'https://cdn.skypack.dev/ol/source/TileWMS.js';

//const serverURL="https://multipeat.insight-centre.org/geoserver/wms";
const serverURL="http://140.203.155.66:8080/geoserver/wms";
//const serverURL="https://test-multipeat.insight-centre.org/geoserver/wms";


const mapProjection=new Projection({
    code:'EPSG:3857',
    units:'m',
    axisOrientation:'neu',
    global:false
});

// Project Sites Resource
const PSSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:proj_sites", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const PSLayer= new TileLayer({
    source:PSSource,
    // @ts-ignore
    name:'Project_Sites',
    display: 'Project Sites',
    region: 'International'
});

// Irish Peat Classes
const ieSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:dipm", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ieLayer= new TileLayer({
    source:ieSource,
    // @ts-ignore
    name:'IE_dipm',
    display: 'Irish Peat Map',
    region: 'Ireland'
});

const ie_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:dipm_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ie_s1Layer= new TileLayer({
    source:ie_s1Source,
    // @ts-ignore
    name:null,
    display: 'Irish Peat Map s1'
});

const ie_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:dipm_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ie_s2Layer= new TileLayer({
    source:ie_s2Source,
    // @ts-ignore
    name:null,
    display: 'Irish Peat Map s2'
});

// Countries
const ctrySource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:countries", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ctryLayer= new TileLayer({
    source:ctrySource,
    // @ts-ignore
    name:null,
    display: 'Countries'
});

// Policies
const ipolSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:geo_pol", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ipolLayer= new TileLayer({
    source:ipolSource,
    // @ts-ignore
    name:null,
    display: 'Policies'
});

// Polish Alkaline Fens
const alkFenSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:pl_alk_fen", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const alkFenLayer= new TileLayer({
    source:alkFenSource,
    // @ts-ignore
    name:'PL_Alk_Fens',
    display: 'Alkaline Fen Map',
    region: 'Poland'
});

const alkFen_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:pl_alk_fen_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const alkFen_s1Layer= new TileLayer({
    source:alkFen_s1Source,
    // @ts-ignore
    name:null,
    display: 'Alkaline Fen Map s1'
});

const alkFen_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:pl_alk_fen_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const alkFen_s2Layer= new TileLayer({
    source:alkFen_s2Source,
    // @ts-ignore
    name:null,
    display: 'Alkaline Fen Map s2'
});

// Polish Torfowiska
const pltSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:pl_peat", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const pltLayer= new TileLayer({
    source:pltSource,
    // @ts-ignore
    name:'PL_Torf',
    display: 'Peatland Map',
    region: 'Poland'
});

const plt_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:pl_peat_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const plt_s1Layer= new TileLayer({
    source:plt_s1Source,
    // @ts-ignore
    name:null,
    display: 'Peatland Map s1'
});

const plt_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:pl_peat_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const plt_s2Layer= new TileLayer({
    source:plt_s2Source,
    // @ts-ignore
    name:null,
    display: 'Peatland Map s2'
});

// Dutch Peat Soils
const nlSoilSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:nl_peatsoils", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const nlSoilLayer= new TileLayer({
    source:nlSoilSource,
    // @ts-ignore
    name:'NL_Peat_Soils',
    display: 'Dutch Soil Map',
    region: 'Netherlands'
});

const nlSoil_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:nl_peatsoils_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const nlSoil_s1Layer= new TileLayer({
    source:nlSoil_s1Source,
    // @ts-ignore
    name:null,
    display: 'Dutch Soil Map s1'
});

const nlSoil_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:nl_peatsoils_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const nlSoil_s2Layer= new TileLayer({
    source:nlSoil_s2Source,
    // @ts-ignore
    name:null,
    display: 'Dutch Soil Map s2'
});

// German Peatlands
const detSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:thuenen", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const detLayer= new TileLayer({
    source:detSource,
    // @ts-ignore
    name:'DE_Peatlands',
    display: 'Thuenen Soil Map',
    region: 'Germany'
});

const det_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:thuenen_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const det_s1Layer= new TileLayer({
    source:det_s1Source,
    // @ts-ignore
    name:null,
    display: 'Thuenen Soil Map s1'
});

const det_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:thuenen_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const det_s2Layer= new TileLayer({
    source:det_s2Source,
    // @ts-ignore
    name:null,
    display: 'Thuenen Soil Map s2'
});

// Belgian Peatlands
const befSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:be_fland_peatsurf", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const befLayer= new TileLayer({
    source:befSource,
    // @ts-ignore
    name:'BE_Fland_Peatlands',
    display: 'Flanders Surface Peat',
    region: 'Belgium'
});

const bef_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:be_fland_peatsurf_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const bef_s1Layer= new TileLayer({
    source:bef_s1Source,
    // @ts-ignore
    name:null,
    display: 'Flanders Surface Peat s1'
});

const bef_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:be_fland_peatsurf_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const bef_s2Layer= new TileLayer({
    source:bef_s2Source,
    // @ts-ignore
    name:null,
    display: 'Flanders Surface Peat s2'
});

const bewSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:be_wallon_peat", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const bewLayer= new TileLayer({
    source:bewSource,
    // @ts-ignore
    name:'BE_Wallo_Peatlands',
    display: 'Wallonia Eco Soils',
    region: 'Belgium'
});

const bew_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:be_wallon_peat_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const bew_s1Layer= new TileLayer({
    source:bew_s1Source,
    // @ts-ignore
    name:null,
    display: 'Wallonia Eco Soils s1'
});

const bew_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:be_wallon_peat_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const bew_s2Layer= new TileLayer({
    source:bew_s2Source,
    // @ts-ignore
    name:null,
    display: 'Wallonia Eco Soils s2'
});

const eeSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:peat_ee", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const eeLayer= new TileLayer({
    source:eeSource,
    // @ts-ignore
    name:'EE_Peatlands',
    display: 'Estonian Bogs',
    region: 'Estonia'
});

const ee_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:peat_ee_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ee_s1Layer= new TileLayer({
    source:ee_s1Source,
    // @ts-ignore
    name:null,
    display: 'Estonian Bogs s1'
});

const ee_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:peat_ee_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ee_s2Layer= new TileLayer({
    source:ee_s2Source,
    // @ts-ignore
    name:null,
    display: 'Estonian Bogs s2'
});

const fiSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:peat_fi", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const fiLayer= new TileLayer({
    source:fiSource,
    // @ts-ignore
    name:'FI_Peatlands',
    display: 'Finnish Bogs',
    region: 'Finland'
});

const fi_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:peat_fi_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const fi_s1Layer= new TileLayer({
    source:fi_s1Source,
    // @ts-ignore
    name:null,
    display: 'Finnish Bogs s1'
});

const fi_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:peat_fi_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const fi_s2Layer= new TileLayer({
    source:fi_s2Source,
    // @ts-ignore
    name:null,
    display: 'Finnish Bogs s2'
});

// EWM Peatlands
//albania
const alSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:albania", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const alLayer= new TileLayer({
    source:alSource,
    // @ts-ignore
    name:'AL_Peatlands',
    display: 'Albanian Bogs',
    region: 'Albania'
});

const al_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:albania_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const al_s1Layer= new TileLayer({
    source:al_s1Source,
    // @ts-ignore
    name:null,
    display: 'Albanian Bogs s1'
});

const al_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:albania_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const al_s2Layer= new TileLayer({
    source:al_s2Source,
    // @ts-ignore
    name:null,
    display: 'Albanian Bogs s2'
});


//andorra
const anSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:andorra", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const anLayer= new TileLayer({
    source:anSource,
    // @ts-ignore
    name:'AN_Peatlands',
    display: 'Andorran Bogs',
    region: 'Andorra'
});

const an_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:andorra_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const an_s1Layer= new TileLayer({
    source:an_s1Source,
    // @ts-ignore
    name:null,
    display: 'Andorran Bogs s1'
});

const an_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:andorra_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const an_s2Layer= new TileLayer({
    source:an_s2Source,
    // @ts-ignore
    name:null,
    display: 'Andorran Bogs s2'
});

//austria
const auSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:austria", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const auLayer= new TileLayer({
    source:auSource,
    // @ts-ignore
    name:'AU_Peatlands',
    display: 'Austrian Bogs',
    region: 'Austria'
});

const au_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:austria_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const au_s1Layer= new TileLayer({
    source:au_s1Source,
    // @ts-ignore
    name:null,
    display: 'Austrian Bogs s1'
});

const au_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:austria_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const au_s2Layer= new TileLayer({
    source:au_s2Source,
    // @ts-ignore
    name:null,
    display: 'Austrian Bogs s2'
});

//belgium
const beSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:belgium", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const beLayer= new TileLayer({
    source:beSource,
    // @ts-ignore
    name:null,
    display: 'Belgian Bogs',
});

const be_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:belgium_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const be_s1Layer= new TileLayer({
    source:be_s1Source,
    // @ts-ignore
    name:null,
    display: 'Belgian Bogs s1'
});

const be_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:belgium_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const be_s2Layer= new TileLayer({
    source:be_s2Source,
    // @ts-ignore
    name:null,
    display: 'Belgian Bogs s2'
});

//bosnia
const boSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:bosnia", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const boLayer= new TileLayer({
    source:boSource,
    // @ts-ignore
    name:'BO_Peatlands',
    display: 'Bosnian Bogs',
    region: 'Bosnia'
});

const bo_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:bosnia_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const bo_s1Layer= new TileLayer({
    source:bo_s1Source,
    // @ts-ignore
    name:null,
    display: 'Bosnian Bogs s1'
});

const bo_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:bosnia_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const bo_s2Layer= new TileLayer({
    source:bo_s2Source,
    // @ts-ignore
    name:null,
    display: 'Bosnian Bogs s2'
});

//bulgaria
const buSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:bulgaria", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const buLayer= new TileLayer({
    source:buSource,
    // @ts-ignore
    name:null,
    display: 'Bulgarian Bogs',
});

const bu_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:bulgaria_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const bu_s1Layer= new TileLayer({
    source:bu_s1Source,
    // @ts-ignore
    name:null,
    display: 'Bulgarian Bogs s1'
});

const bu_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:bulgaria_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const bu_s2Layer= new TileLayer({
    source:bu_s2Source,
    // @ts-ignore
    name:null,
    display: 'Bulgarian Bogs s2'
});

//croatia
const crSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:croatia", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const crLayer= new TileLayer({
    source:crSource,
    // @ts-ignore
    name:'CR_Peatlands',
    display: 'Croatian Bogs',
    region: 'Croatia'
});

const cr_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:croatia_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const cr_s1Layer= new TileLayer({
    source:cr_s1Source,
    // @ts-ignore
    name:null,
    display: 'Croatian Bogs s1'
});

const cr_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:croatia_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const cr_s2Layer= new TileLayer({
    source:cr_s2Source,
    // @ts-ignore
    name:null,
    display: 'Croatian Bogs s2'
});

//czech
const czSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:czech", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const czLayer= new TileLayer({
    source:czSource,
    // @ts-ignore
    name:'CZ_Peatlands',
    display: 'Czech Bogs',
    region: 'Czech'
});

const cz_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:czech_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const cz_s1Layer= new TileLayer({
    source:cz_s1Source,
    // @ts-ignore
    name:null,
    display: 'Czech Bogs s1'
});

const cz_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:czech_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const cz_s2Layer= new TileLayer({
    source:cz_s2Source,
    // @ts-ignore
    name:null,
    display: 'Czech Bogs s2'
});

//denmark
const dn_ewmSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:denmark", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const dn_ewmLayer= new TileLayer({
    source:dn_ewmSource,
    // @ts-ignore
    name:'DN_EWM_Peatlands',
    display: 'Danish Bogs',
    region: 'Denmark'
});

const dn_ewm_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:denmark_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const dn_ewm_s1Layer= new TileLayer({
    source:dn_ewm_s1Source,
    // @ts-ignore
    name:null,
    display: 'Danish Bogs s1'
});

const dn_ewm_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:denmark_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const dn_ewm_s2Layer= new TileLayer({
    source:dn_ewm_s2Source,
    // @ts-ignore
    name:null,
    display: 'Danish Bogs s2'
});

//france
const frSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:france", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const frLayer= new TileLayer({
    source:frSource,
    // @ts-ignore
    name:'FR_Peatlands',
    display: 'French Bogs',
    region: 'France'
});

const fr_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:france_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const fr_s1Layer= new TileLayer({
    source:fr_s1Source,
    // @ts-ignore
    name:null,
    display: 'French Bogs s1'
});

const fr_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:france_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const fr_s2Layer= new TileLayer({
    source:fr_s2Source,
    // @ts-ignore
    name:null,
    display: 'French Bogs s2'
});

//germany
const geSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:germany", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const geLayer= new TileLayer({
    source:geSource,
    // @ts-ignore
    name:'DE_EWM_Peatlands',
    display: 'German Bogs',
    region: 'Germany'
});

const ge_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:germany_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ge_s1Layer= new TileLayer({
    source:ge_s1Source,
    // @ts-ignore
    name:null,
    display: 'German Bogs s1'
});

const ge_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:germany_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ge_s2Layer= new TileLayer({
    source:ge_s2Source,
    // @ts-ignore
    name:null,
    display: 'German Bogs s2'
});

//greece
const grSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:greece", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const grLayer= new TileLayer({
    source:grSource,
    // @ts-ignore
    name:'GR_Peatlands',
    display: 'Greek Bogs',
    region: 'Greece'
});

const gr_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:greece_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const gr_s1Layer= new TileLayer({
    source:gr_s1Source,
    // @ts-ignore
    name:null,
    display: 'Greek Bogs s1'
});

const gr_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:greece_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const gr_s2Layer= new TileLayer({
    source:gr_s2Source,
    // @ts-ignore
    name:null,
    display: 'Greek Bogs s2'
});

//hungary
const huSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:hungary", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const huLayer= new TileLayer({
    source:huSource,
    // @ts-ignore
    name:'HU_Peatlands',
    display: 'Hungarian Bogs',
    region: 'Hungary'
});

const hu_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:hungary_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const hu_s1Layer= new TileLayer({
    source:hu_s1Source,
    // @ts-ignore
    name:null,
    display: 'Hungarian Bogs s1'
});

const hu_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:hungary_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const hu_s2Layer= new TileLayer({
    source:hu_s2Source,
    // @ts-ignore
    name:null,
    display: 'Hungarian Bogs s2'
});

// iceland
const icSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:iceland", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const icLayer= new TileLayer({
    source:icSource,
    // @ts-ignore
    name:'IC_Peatlands',
    display: 'Icelandic Bogs',
    region: 'Iceland'
});

const ic_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:iceland_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ic_s1Layer= new TileLayer({
    source:ic_s1Source,
    // @ts-ignore
    name:null,
    display: 'Icelandic Bogs s1'
});

const ic_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:iceland_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ic_s2Layer= new TileLayer({
    source:ic_s2Source,
    // @ts-ignore
    name:null,
    display: 'Icelandic Bogs s2'
});

//ireland
const irSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:ireland", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const irLayer= new TileLayer({
    source:irSource,
    // @ts-ignore
    name:'IR_Peatlands',
    display: 'Irish Bogs',
    region: 'Ireland'
});

const ir_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:ireland_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ir_s1Layer= new TileLayer({
    source:ir_s1Source,
    // @ts-ignore
    name:null,
    display: 'Irish Bogs s1'
});

const ir_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:ireland_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ir_s2Layer= new TileLayer({
    source:ir_s2Source,
    // @ts-ignore
    name:null,
    display: 'Irish Bogs s2'
});

//italy
const itSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:italy", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const itLayer= new TileLayer({
    source:itSource,
    // @ts-ignore
    name:'IT_Peatlands',
    display: 'Italian Bogs',
    region: 'Italy'
});

const it_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:italy_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const it_s1Layer= new TileLayer({
    source:it_s1Source,
    // @ts-ignore
    name:null,
    display: 'Italian Bogs s1'
});

const it_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:italy_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const it_s2Layer= new TileLayer({
    source:it_s2Source,
    // @ts-ignore
    name:null,
    display: 'Italian Bogs s2'
});

//latvia
const laSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:latvia", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const laLayer= new TileLayer({
    source:laSource,
    // @ts-ignore
    name:'LA_Peatlands',
    display: 'Latvian Bogs',
    region: 'Latvia'
});

const la_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:latvia_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const la_s1Layer= new TileLayer({
    source:la_s1Source,
    // @ts-ignore
    name:null,
    display: 'Latvian Bogs s1'
});

const la_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:latvia_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const la_s2Layer= new TileLayer({
    source:la_s2Source,
    // @ts-ignore
    name:null,
    display: 'Latvian Bogs s2'
});

//liechtenstein
const lieSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:liechtenstein", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const lieLayer= new TileLayer({
    source:lieSource,
    // @ts-ignore
    name:'LIE_Peatlands',
    display: 'Liechtenstein Bogs',
    region: 'Liechtenstein'
});

const lie_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:liechtenstein_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const lie_s1Layer= new TileLayer({
    source:lie_s1Source,
    // @ts-ignore
    name:null,
    display: 'Liechtenstein Bogs s1'
});

const lie_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:liechtenstein_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const lie_s2Layer= new TileLayer({
    source:lie_s2Source,
    // @ts-ignore
    name:null,
    display: 'Liechtenstein Bogs s2'
});

//lithuania
const litSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:lithuania", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const litLayer= new TileLayer({
    source:litSource,
    // @ts-ignore
    name:'LIT_Peatlands',
    display: 'Lithuanian Bogs',
    region: 'Lithuania'
});

const lit_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:lithuania_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const lit_s1Layer= new TileLayer({
    source:lit_s1Source,
    // @ts-ignore
    name:null,
    display: 'Lithuanian Bogs s1'
});

const lit_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:lithuania_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const lit_s2Layer= new TileLayer({
    source:lit_s2Source,
    // @ts-ignore
    name:null,
    display: 'Lithuanian Bogs s2'
});

//luxembourg
const luSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:luxembourg", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const luLayer= new TileLayer({
    source:luSource,
    // @ts-ignore
    name:'LU_Peatlands',
    display: 'Luxembourg Bogs',
    region: 'Luxembourg'
});

const lu_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:luxembourg_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const lu_s1Layer= new TileLayer({
    source:lu_s1Source,
    // @ts-ignore
    name:null,
    display: 'Luxembourg Bogs s1'
});

const lu_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:luxembourg_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const lu_s2Layer= new TileLayer({
    source:lu_s2Source,
    // @ts-ignore
    name:null,
    display: 'Luxembourg Bogs s2'
});

//macedonia
const maSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:macedonia", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const maLayer= new TileLayer({
    source:maSource,
    // @ts-ignore
    name:'MA_Peatlands',
    display: 'Macedonian Bogs',
    region: 'Macedonia'
});

const ma_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:macedonia_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ma_s1Layer= new TileLayer({
    source:ma_s1Source,
    // @ts-ignore
    name:null,
    display: 'Macedonian Bogs s1'
});

const ma_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:macedonia_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ma_s2Layer= new TileLayer({
    source:ma_s2Source,
    // @ts-ignore
    name:null,
    display: 'Macedonian Bogs s2'
});

//montenegro
const moSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:montenegro", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const moLayer= new TileLayer({
    source:moSource,
    // @ts-ignore
    name:'MO_Peatlands',
    display: 'Montenegrin Bogs',
    region: 'Montenegro'
});

const mo_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:montenegro_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const mo_s1Layer= new TileLayer({
    source:mo_s1Source,
    // @ts-ignore
    name:null,
    display: 'Montenegrin Bogs s1'
});

const mo_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:montenegro_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const mo_s2Layer= new TileLayer({
    source:mo_s2Source,
    // @ts-ignore
    name:null,
    display: 'Montenegrin Bogs s2'
});

//netherlands
const neSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:netherland", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const neLayer= new TileLayer({
    source:neSource,
    // @ts-ignore
    name:'NE_Peatlands',
    display: 'Dutch Bogs',
    region: 'Netherlands'
});

const ne_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:netherland_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ne_s1Layer= new TileLayer({
    source:ne_s1Source,
    // @ts-ignore
    name:null,
    display: 'Dutch Bogs s1'
});

const ne_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:netherland_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ne_s2Layer= new TileLayer({
    source:ne_s2Source,
    // @ts-ignore
    name:null,
    display: 'Dutch Bogs s2'
});

//poland
const polSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:poland", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const polLayer= new TileLayer({
    source:polSource,
    // @ts-ignore
    name:'POL_Peatlands',
    display: 'Polish Bogs',
    region: 'Poland'
});

const pol_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:poland_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const pol_s1Layer= new TileLayer({
    source:pol_s1Source,
    // @ts-ignore
    name:null,
    display: 'Polish Bogs s1'
});

const pol_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:poland_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const pol_s2Layer= new TileLayer({
    source:pol_s2Source,
    // @ts-ignore
    name:null,
    display: 'Polish Bogs s2'
});

//portugal
const porSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:portugal", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const porLayer= new TileLayer({
    source:porSource,
    // @ts-ignore
    name:'POR_Peatlands',
    display: 'Portuguese Bogs',
    region: 'Portugal'
});

const por_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:portugal_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const por_s1Layer= new TileLayer({
    source:por_s1Source,
    // @ts-ignore
    name:null,
    display: 'Portuguese Bogs s1'
});

const por_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:portugal_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const por_s2Layer= new TileLayer({
    source:por_s2Source,
    // @ts-ignore
    name:null,
    display: 'Portuguese Bogs s2'
});

//romania
const roSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:romania", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const roLayer= new TileLayer({
    source:roSource,
    // @ts-ignore
    name:'RO_Peatlands',
    display: 'Romanian Bogs',
    region: 'Romania'
});

const ro_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:romania_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ro_s1Layer= new TileLayer({
    source:ro_s1Source,
    // @ts-ignore
    name:null,
    display: 'Romanian Bogs s1'
});

const ro_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:romania_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ro_s2Layer= new TileLayer({
    source:ro_s2Source,
    // @ts-ignore
    name:null,
    display: 'Romanian Bogs s2'
});

//serbia
const seSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:serbia", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const seLayer= new TileLayer({
    source:seSource,
    // @ts-ignore
    name:'SE_Peatlands',
    display: 'Serbian Bogs',
    region: 'Serbia'
});

const se_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:serbia_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const se_s1Layer= new TileLayer({
    source:se_s1Source,
    // @ts-ignore
    name:null,
    display: 'Serbian Bogs s1'
});

const se_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:serbia_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const se_s2Layer= new TileLayer({
    source:se_s2Source,
    // @ts-ignore
    name:null,
    display: 'Serbian Bogs s2'
});

//slovakia
const slkSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:slovekia", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const slkLayer= new TileLayer({
    source:slkSource,
    // @ts-ignore
    name:'SLK_Peatlands',
    display: 'Slovak Bogs',
    region: 'Slovekia'
});

const slk_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:slovekia_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const slk_s1Layer= new TileLayer({
    source:slk_s1Source,
    // @ts-ignore
    name:null,
    display: 'Slovak Bogs s1'
});

const slk_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:slovekia_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const slk_s2Layer= new TileLayer({
    source:slk_s2Source,
    // @ts-ignore
    name:null,
    display: 'Slovak Bogs s2'
});

//slovenia
const slvSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:slovenia", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const slvLayer= new TileLayer({
    source:slvSource,
    // @ts-ignore
    name:'SLV_Peatlands',
    display: 'Slovenian Bogs',
    region: 'Slovenia'
});

const slv_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:slovenia_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const slv_s1Layer= new TileLayer({
    source:slv_s1Source,
    // @ts-ignore
    name:null,
    display: 'Slovenian Bogs s1'
});

const slv_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:slovenia_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const slv_s2Layer= new TileLayer({
    source:slv_s2Source,
    // @ts-ignore
    name:null,
    display: 'Slovenian Bogs s2'
});

//spain
const spSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:spain", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const spLayer= new TileLayer({
    source:spSource,
    // @ts-ignore
    name:null,
    display: 'Spanish Bogs',
});

const sp_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:spain_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const sp_s1Layer= new TileLayer({
    source:sp_s1Source,
    // @ts-ignore
    name:null,
    display: 'Spanish Bogs s1'
});

const sp_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:spain_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const sp_s2Layer= new TileLayer({
    source:sp_s2Source,
    // @ts-ignore
    name:null,
    display: 'Spanish Bogs s2'
});

//sweden
const sweSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:sweden", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const sweLayer= new TileLayer({
    source:sweSource,
    // @ts-ignore
    name:'SWE_Peatlands',
    display: 'Swedish Bogs',
    region: 'Sweden'
});

const swe_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:sweden_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const swe_s1Layer= new TileLayer({
    source:swe_s1Source,
    // @ts-ignore
    name:null,
    display: 'Swedish Bogs s1'
});

const swe_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:sweden_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const swe_s2Layer= new TileLayer({
    source:swe_s2Source,
    // @ts-ignore
    name:null,
    display: 'Swedish Bogs s2'
});

//switzerland
const swiSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:switzerland", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const swiLayer= new TileLayer({
    source:swiSource,
    // @ts-ignore
    name:'SWI_Peatlands',
    display: 'Swiss Bogs',
    region: 'Switzerland'
});

const swi_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:switzerland_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const swi_s1Layer= new TileLayer({
    source:swi_s1Source,
    // @ts-ignore
    name:null,
    display: 'Swiss Bogs s1'
});

const swi_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:switzerland_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const swi_s2Layer= new TileLayer({
    source:swi_s2Source,
    // @ts-ignore
    name:null,
    display: 'Swiss Bogs s2'
});

// CORINE-18 
const corineSource=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:corine18", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const corineLayer= new TileLayer({
    source:corineSource,
    // @ts-ignore
    name:'Corine18',
    display: 'CORINE',
    region: 'International'
});

const corine_s1Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:corine18_s1", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const corine_s1Layer= new TileLayer({
    source:corine_s1Source,
    // @ts-ignore
    name:null,
    display: 'CORINE s1'
});

const corine_s2Source=new TileWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:corine18_s2", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const corine_s2Layer= new TileLayer({
    source:corine_s2Source,
    // @ts-ignore
    name:null,
    display: 'CORINE s2'
});

const osmLayer=new TileLayer({
    source:new OSM(),
    // @ts-ignore
    name: null,
    display: 'Basemap'
});

const view=new View({
    //extent:[-1189593, 6692152.5, -665102.8125, 7450535], // ireland
    //extent:[-2005155, 3723095, 3711745, 8600839], // europe
    extent:[-2050000, 3500000, 8000000, 15000000], // europe and EEA countries
    center:[2000000,7500000],
    zoom:5,
    projection: mapProjection
});

const map=new Map({
    target:"map",
    layers:[osmLayer, ctryLayer, corineLayer, corine_s1Layer, corine_s2Layer, ieLayer, ie_s1Layer, ie_s2Layer, 
        nlSoilLayer, nlSoil_s1Layer, nlSoil_s2Layer, detLayer, det_s1Layer, det_s2Layer, pltLayer, plt_s1Layer, 
        plt_s2Layer, alkFenLayer, alkFen_s1Layer, alkFen_s2Layer, befLayer, bef_s1Layer, bef_s2Layer, bewLayer, 
        bew_s1Layer, bew_s2Layer, eeLayer, ee_s1Layer, ee_s2Layer, fiLayer, fi_s1Layer, fi_s2Layer, alLayer, 
        al_s1Layer, al_s2Layer, anLayer, an_s1Layer, an_s2Layer, auLayer, au_s1Layer, au_s2Layer, beLayer, 
        be_s1Layer, be_s2Layer, boLayer, bo_s1Layer, bo_s2Layer, buLayer, bu_s1Layer, bu_s2Layer, crLayer, 
        cr_s1Layer, cr_s2Layer, czLayer, cz_s1Layer, cz_s2Layer, dn_ewmLayer, dn_ewm_s1Layer, dn_ewm_s2Layer, 
        frLayer, fr_s1Layer, fr_s2Layer, geLayer, ge_s1Layer, ge_s2Layer, grLayer, gr_s1Layer, gr_s2Layer, 
        huLayer, hu_s1Layer, hu_s2Layer, icLayer, ic_s1Layer, ic_s2Layer, irLayer, ir_s1Layer, ir_s2Layer, 
        itLayer, it_s1Layer, it_s2Layer, laLayer, la_s1Layer, la_s2Layer, lieLayer, lie_s1Layer, lie_s2Layer, 
        litLayer, lit_s1Layer, lit_s2Layer, luLayer, lu_s1Layer, lu_s2Layer, maLayer, ma_s1Layer, ma_s2Layer,
        moLayer, mo_s1Layer, mo_s2Layer, neLayer, ne_s1Layer, ne_s2Layer, polLayer, pol_s1Layer, pol_s2Layer,
        porLayer, por_s1Layer, por_s2Layer, roLayer, ro_s1Layer, ro_s2Layer, seLayer, se_s1Layer, se_s2Layer, 
        slkLayer, slk_s1Layer, slk_s2Layer, slvLayer, slv_s1Layer, slv_s2Layer, spLayer, sp_s1Layer, sp_s2Layer,
        sweLayer, swe_s1Layer, swe_s2Layer, swiLayer, swi_s1Layer, swi_s2Layer, PSLayer, ipolLayer],
    view:view
});

$('#map').data('map',map);


import Map from 'https://cdn.skypack.dev/ol/Map.js';
import View from 'https://cdn.skypack.dev/ol/View.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM.js';
import ImageLayer from 'https://cdn.skypack.dev/ol/layer/Image.js';
import ImageWMS from 'https://cdn.skypack.dev/ol/source/ImageWMS.js';
import Projection from 'https://cdn.skypack.dev/ol/proj/Projection.js';

//const serverURL="https://multipeat.insight-centre.org/geoserver/wms";
const serverURL="https://test-multipeat.insight-centre.org/geoserver/wms";

const mapProjection=new Projection({
    code:'EPSG:3857',
    units:'m',
    axisOrientation:'neu',
    global:false
});

// Project Sites Resource
const PSSource=new ImageWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:proj_sites", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const PSLayer= new ImageLayer({
    source:PSSource,
    // @ts-ignore
    name:'Project_Sites',
    display: 'Project Sites',
    region: 'International'
});

// Irish Peat Classes
const ieSource=new ImageWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:dipm", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ieLayer= new ImageLayer({
    source:ieSource,
    // @ts-ignore
    name:'IE_dipm',
    display: 'Irish Peat Map',
    region: 'Ireland'
});

// Countries
const ctrySource=new ImageWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:countries", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ctryLayer= new ImageLayer({
    source:ctrySource,
    // @ts-ignore
    name:null,
    display: 'Countries'
});

// Policies
const ipolSource=new ImageWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:geo_pol", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const ipolLayer= new ImageLayer({
    source:ipolSource,
    // @ts-ignore
    name:null,
    display: 'Policies'
});

// Polish Alkaline Fens
const alkFenSource=new ImageWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:pl_alk_fen", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const alkFenLayer= new ImageLayer({
    source:alkFenSource,
    // @ts-ignore
    name:'PL_Alk_Fens',
    display: 'Alkaline Fen Map',
    region: 'Poland'
});

// Dutch Peat Soils
const nlSoilSource=new ImageWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:nl_peatsoils", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const nlSoilLayer= new ImageLayer({
    source:nlSoilSource,
    // @ts-ignore
    name:'NL_Peat_Soils',
    display: 'Dutch Soil Map',
    region: 'Netherlands'
});

// German Peatlands
const detSource=new ImageWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:thuenen", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const detLayer= new ImageLayer({
    source:detSource,
    // @ts-ignore
    name:'DE_Peatlands',
    display: 'Thuenen Soil Map',
    region: 'Germany'
});

// Belgian Peatlands
const befSource=new ImageWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:be_fland_peatsurf", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const befLayer= new ImageLayer({
    source:befSource,
    // @ts-ignore
    name:'BE_Fland_Peatlands',
    display: 'Flanders Surface Peat',
    region: 'Belgium'
});

const bewSource=new ImageWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:be_wallon_peat", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const bewLayer= new ImageLayer({
    source:bewSource,
    // @ts-ignore
    name:'BE_Wallo_Peatlands',
    display: 'Wallonia Eco Soils',
    region: 'Belgium'
});

// CORINE-18 
const corineSource=new ImageWMS({
    url:serverURL,
    params:{"LAYERS":"multipeat:corine18", "VERSION":"1.1.1", "FORMAT":"image/png"}
});

const corineLayer= new ImageLayer({
    source:corineSource,
    // @ts-ignore
    name:'Corine18',
    display: 'CORINE',
    region: 'International'
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
    extent:[-2850000, 3700000, 4000000, 11600000], // europe and EEA countries
    center:[-816308.25,7051300.85],
    zoom:7.5,
    projection: mapProjection
});

const map=new Map({
    target:"map",
    layers:[osmLayer, corineLayer, ieLayer, nlSoilLayer, 
        detLayer, alkFenLayer, befLayer, bewLayer, PSLayer, ctryLayer, ipolLayer],
    view:view
});

$('#map').data('map',map);
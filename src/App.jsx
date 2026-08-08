import { useEffect, useLayoutEffect, useState, useMemo, useCallback, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MapControls, Html, useGLTF, Clone } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import "./App.css";

const LAT_TO_METERS = 111320;
const API_POLL_INTERVAL = 5000;
const AUTO_GATE_LANES = [
  [
    [28.508427948546363, 77.2880108044327],
    [28.5083636926974, 77.28807163128876]
  ],
  [
    [28.508367817419842, 77.2880790073632],
    [28.508293600438243, 77.28813686825025]
  ]
];
const QR_SCANNER_COORDS = [
  [28.50849576249886, 77.28823060798541],
  [28.508414361828752, 77.2883066991218]
];

const BOOM_BARRIER_COORDS = [
  { lat: 28.508367522796796, lng: 77.28795227299241, face: "right" },
  { lat: 28.50829504550769, lng: 77.28803072760286, face: "right" },
  { lat: 28.508509843538203, lng: 77.28824335942097, face: "left" },
  { lat: 28.508426170678735, lng: 77.28831644961306, face: "left" }
];

const FLAG_COORDS = [
  [28.50846966825246, 77.28762198229133],
  [28.508491996866137, 77.28773679612478],
  [28.508437415802142, 77.28774620709473],
  [28.508410125259562, 77.28772079747586],
  [28.50839193156058, 77.28763798094025]
];

const BOUNDARY_WALL_COORDS = [
  [28.509232156091905, 77.28673914153669], [28.507338363972515, 77.28681925162508], [28.507388828969987, 77.28606886193224], [28.50887879022288, 77.2859366508579], [28.51513425216102, 77.28564939396986], [28.516105514074273, 77.28547565477994], [28.516569229877188, 77.28572424373732], [28.519108244303233, 77.28737110435144], [28.518904866086185, 77.28783919110512], [28.51575709433006, 77.2879127514761], [28.513909516566425, 77.28816611690752], [28.512519973456563, 77.288917375412553], [28.511527065899788, 77.2916025673494], [28.511463318732737, 77.29165396139055], [28.50789733914065, 77.29234998557078], [28.507746261322207, 77.29159098816812], [28.508096634293402, 77.29150477910063], [28.507860108269256, 77.2895383393366], [28.50753021124347, 77.28907320258013], [28.507735618945745, 77.2888276481522], [28.507837285240317, 77.28887014795086], [28.508468029022872, 77.28865764891665], [28.50848670230088, 77.28872612082445], [28.508866391577477, 77.28877806502395], [28.5093041736862, 77.28877806502247], [28.509233630723408, 77.28674043541311],
];
const INGATE_POLYGON = [[28.508862180540508, 77.2887146535867], [28.508862180540508, 77.28884621675807], [28.508489551776456, 77.28886578813892], [28.508504839136275, 77.28873313766863]];
const OUTGATE_POLYGON = [[28.507732029353566, 77.2888193076692], [28.507533460460987, 77.28906833200674], [28.507458085232486, 77.28903697338644], [28.50768988415047, 77.28876396892754]];
const PARKING_COORDS = [[28.508913326434662, 77.28874674032724], [28.509292656765698, 77.28875681637923], [28.509269676368607, 77.28798769296093], [28.508928505264922, 77.28800848008274], [28.50872698399292, 77.28802926720272], [28.50872698399292, 77.28818751752696], [28.50880240720342, 77.28841215252098], [28.50884247576206, 77.28858984885952]];

const GREENERY_COORDS = [
  [28.50845790390383, 77.28776841227777], [28.50845246317079, 77.28711093642693], [28.508468912519486, 77.28678841362725], [28.508432379293147, 77.28678573141838], [28.508873091198694, 77.28774949751877], [28.508745814583012, 77.28775620304648], [28.50868689017281, 77.28775754415094], [28.50913471486485, 77.28773474537542], [28.509178318746454, 77.28772669874877], [28.509104074288622, 77.28773340427098], [28.509257277080785, 77.28786349140184], [28.507810249414163, 77.2868081762356], [28.507707720008348, 77.28681219954821], [28.507365339995083, 77.28682358116212], [28.507355987855256, 77.28682022830765], [28.50896276885772, 77.28954984856144], [28.509007590876884, 77.28953760687853], [28.50914743545424, 77.28953046589682], [28.509148331893247, 77.28944579425661], [28.50904882711768, 77.28945293523832], [28.508963665298303, 77.28946823734196], [28.509558071785413, 77.28947346894472], [28.509536859164868, 77.28951504318144], [28.50955630406798, 77.28968134014144], [28.509534502207543, 77.28966055302307]
];

const PARKING_WALL_LINES = [
  [[28.50841287, 77.28683277], [28.50841017, 77.28683290], [28.50842367, 77.28711828], [28.50842096, 77.28711841], [28.50842426, 77.28713398], [28.50842155, 77.28713411], [28.50843481, 77.28716283], [28.50843282, 77.28716490], [28.50845930, 77.28717719], [28.50845895, 77.28718023], [28.50848212, 77.28717663], [28.50848258, 77.28717964], [28.50849182, 77.28717129], [28.50849395, 77.28717323], [28.50849753, 77.28716095], [28.50850037, 77.28716082]],
  [[28.50745665, 77.28685560], [28.50745700, 77.28686683], [28.50776926, 77.28684301], [28.50776963, 77.28685423], [28.50815798, 77.28682583], [28.50815836, 77.28683705], [28.50825327, 77.28682175], [28.50825272, 77.28683302], [28.50826627, 77.28682396], [28.50826399, 77.28683493], [28.50828316, 77.28683015], [28.50827936, 77.28684057], [28.50830085, 77.28684036], [28.50829554, 77.28684990], [28.50831987, 77.28685684], [28.50831307, 77.28686510], [28.50833799, 77.28688009], [28.50832981, 77.28688658], [28.50835173, 77.28690867], [28.50834282, 77.28691363], [28.50835853, 77.28692611], [28.50834911, 77.28692978], [28.50836195, 77.28694130], [28.50835233, 77.28694407], [28.50836601, 77.28695940], [28.50835613, 77.28696098], [28.50836784, 77.28702376], [28.50835792, 77.28702412], [28.50836924, 77.28707306], [28.50835932, 77.28707342], [28.50837152, 77.28715385], [28.50836161, 77.28715428], [28.50837650, 77.28728266], [28.50836659, 77.28728315], [28.50838082, 77.28739454], [28.50837091, 77.28739495], [28.50838434, 77.28753068], [28.50837443, 77.28753120], [28.50838986, 77.28762965], [28.50837996, 77.28763035], [28.50840149, 77.28770010], [28.50839206, 77.28770415], [28.50840547, 77.28771103], [28.50839937, 77.28771807], [28.50841461, 77.28772263], [28.50840782, 77.28773118], [28.50843607, 77.28773652], [28.50843169, 77.28774663], [28.50845013, 77.28774311], [28.50844756, 77.28775407], [28.50846801, 77.28774567], [28.50846764, 77.28775694], [28.50854645, 77.28774106], [28.50855200, 77.28774634], [28.50854696, 77.28775225]],
  [[28.50738435, 77.28693478], [28.50738471, 77.28694396], [28.50742922, 77.28693250], [28.50742959, 77.28694168], [28.50747410, 77.28693021], [28.50747447, 77.28693939], [28.50757119, 77.28692527], [28.50757158, 77.28693445], [28.50768114, 77.28691872], [28.50768155, 77.28692790], [28.50800061, 77.28690062], [28.50800103, 77.28690980], [28.50814364, 77.28689194], [28.50814349, 77.28690115], [28.50815747, 77.28689440], [28.50815785, 77.28690342], [28.50817267, 77.28690268], [28.50817219, 77.28690569], [28.50819777, 77.28690775], [28.50819704, 77.28691072], [28.50821598, 77.28691570], [28.50821491, 77.28691851], [28.50823859, 77.28692807], [28.50823709, 77.28693063], [28.50826032, 77.28694905], [28.50825834, 77.28695116], [28.50828233, 77.28698244], [28.50827997, 77.28698398], [28.50829369, 77.28701246], [28.50829109, 77.28701337], [28.50829823, 77.28703863], [28.50829554, 77.28703900], [28.50830355, 77.28716959], [28.50830085, 77.28716971], [28.50831106, 77.28741785], [28.50830835, 77.28741796], [28.50831909, 77.28763684], [28.50831638, 77.28763698], [28.50832310, 77.28773527], [28.50832040, 77.28773567], [28.50833537, 77.28779762], [28.50833282, 77.28779872], [28.50838824, 77.28790532], [28.50838591, 77.28790686], [28.50844939, 77.28801780], [28.50844711, 77.28801945], [28.50852654, 77.28814953], [28.50852428, 77.28815123], [28.50858785, 77.28825399], [28.50858559, 77.28825566], [28.50864825, 77.28836076], [28.50864597, 77.28836239], [28.50870000, 77.28845529], [28.50870767, 77.28845686], [28.50873030, 77.28851500], [28.50872793, 77.28851648], [28.50874580, 77.28854811], [28.50874335, 77.28854939], [28.50875691, 77.28857963], [28.50875432, 77.28858052], [28.50876107, 77.28860219], [28.50875842, 77.28860281]],
  [[28.50738878, 77.28704649], [28.50738918, 77.28705669], [28.50788437, 77.28702188], [28.50788473, 77.28703208], [28.50805594, 77.28701484], [28.50805607, 77.28702506], [28.50811192, 77.28701624], [28.50811063, 77.28702637], [28.50814067, 77.28702495], [28.50813698, 77.28703436], [28.50815897, 77.28703762], [28.50815296, 77.28704543], [28.50817314, 77.28705728], [28.50816582, 77.28706328], [28.50818467, 77.28707774], [28.50817672, 77.28708262], [28.50819395, 77.28710086], [28.50818541, 77.28710428], [28.50820036, 77.28712890], [28.50819146, 77.28713074], [28.50820306, 77.28715725], [28.50819406, 77.28715800], [28.50820706, 77.28727008], [28.50819804, 77.28727042], [28.50820900, 77.28735239], [28.50819998, 77.28735266], [28.50821204, 77.28748137], [28.50820302, 77.28748174], [28.50821671, 77.28759245], [28.50820769, 77.28759294], [28.50821986, 77.28766760], [28.50821086, 77.28766818], [28.50822503, 77.28775453], [28.50821604, 77.28775542], [28.50823055, 77.28781318], [28.50822158, 77.28781425], [28.50823765, 77.28789074], [28.50822868, 77.28789180]],
  [[28.50751034, 77.28715322], [28.50751046, 77.28715628], [28.50775249, 77.28714178], [28.50775259, 77.28714484], [28.50798434, 77.28713386], [28.50798429, 77.28713693], [28.50803569, 77.28713382], [28.50803542, 77.28713688], [28.50805798, 77.28713884], [28.50805697, 77.28714173], [28.50807837, 77.28715338], [28.50807666, 77.28715577], [28.50809480, 77.28717263], [28.50809239, 77.28717422], [28.50810296, 77.28720340], [28.50810028, 77.28720396], [28.50810817, 77.28734771], [28.50810546, 77.28734782], [28.50811162, 77.28745975], [28.50810892, 77.28745986], [28.50811579, 77.28758711], [28.50811308, 77.28758740], [28.50812054, 77.28762125], [28.50811787, 77.28762173]],
  [[28.50757042, 77.28724855], [28.50757039, 77.28725315], [28.50762186, 77.28724895], [28.50762188, 77.28725355], [28.50778140, 77.28724615], [28.50778149, 77.28725075], [28.50791556, 77.28724211], [28.50791569, 77.28724670], [28.50794736, 77.28724075], [28.50794685, 77.28724537], [28.50796926, 77.28724812], [28.50796750, 77.28725232], [28.50798869, 77.28726306], [28.50798580, 77.28726640], [28.50800230, 77.28728466], [28.50799847, 77.28728652], [28.50800371, 77.28729282], [28.50799968, 77.28729346], [28.50802145, 77.28752652], [28.50801740, 77.28752691]],
  [[28.50743315, 77.28738498], [28.50743044, 77.28738510], [28.50744362, 77.28768006], [28.50744091, 77.28768024], [28.50744656, 77.28772379], [28.50744385, 77.28772402], [28.50746062, 77.28778128], [28.50745820, 77.28778265], [28.50748725, 77.28781698], [28.50748596, 77.28781971], [28.50750826, 77.28782588], [28.50750753, 77.28782885], [28.50753187, 77.28783082], [28.50753156, 77.28783387], [28.50756302, 77.28783232], [28.50756311, 77.28783539], [28.50767817, 77.28781910], [28.50767847, 77.28782215], [28.50792680, 77.28778607], [28.50792712, 77.28778911]],
  [[28.50733802, 77.28738878], [28.50733532, 77.28738891], [28.50735642, 77.28787227], [28.50735371, 77.28787240]],
  [[28.50723846, 77.28706541], [28.50722765, 77.28706588], [28.50726937, 77.28797764], [28.50725855, 77.28797811]],
  [[28.50738178, 77.28796368], [28.50738299, 77.28797492], [28.50751295, 77.28794561], [28.50751410, 77.28795686], [28.50760229, 77.28793465], [28.50760348, 77.28794589], [28.50766320, 77.28792561], [28.50766446, 77.28793684], [28.50779667, 77.28790733], [28.50779772, 77.28791859], [28.50786711, 77.28790014], [28.50786779, 77.28791144], [28.50808966, 77.28788879], [28.50809011, 77.28790010]],
  [[28.50738178, 77.28809550], [28.50738197, 77.28809804], [28.50753669, 77.28808108], [28.50753688, 77.28808362], [28.50775683, 77.28805710], [28.50775706, 77.28805964], [28.50785624, 77.28804483], [28.50785646, 77.28804737], [28.50793241, 77.28803714], [28.50793261, 77.28803968], [28.50809412, 77.28802080], [28.50809398, 77.28802337], [28.50811725, 77.28802644], [28.50811661, 77.28802889], [28.50814961, 77.28804010], [28.50814867, 77.28804243], [28.50817846, 77.28805748], [28.50817721, 77.28805963], [28.50821950, 77.28809690], [28.50821815, 77.28809897], [28.50824348, 77.28811261], [28.50824209, 77.28811465], [28.50825905, 77.28813055], [28.50825736, 77.28813224], [28.50830099, 77.28819028], [28.50829921, 77.28819185], [28.50833291, 77.28823755], [28.50833109, 77.28823906], [28.50836567, 77.28829029], [28.50836378, 77.28829169], [28.50839835, 77.28835108], [28.50839639, 77.28835234], [28.50841797, 77.28839303], [28.50841596, 77.28839419], [28.50843551, 77.28843396], [28.50843341, 77.28843490], [28.50844989, 77.28848605], [28.50844773, 77.28848677], [28.50848221, 77.28862020], [28.50847996, 77.28862056], [28.50848250, 77.28863943], [28.50848024, 77.28863938]],
  [[28.50826223, 77.28804702], [28.50825657, 77.28805208], [28.50832817, 77.28815478]],
  [[28.50829211, 77.28801925], [28.50828643, 77.28802430], [28.50835861, 77.28812820]],
  [[28.50833339, 77.28798058], [28.50832774, 77.28798567], [28.50840153, 77.28809067]],
  [[28.50836627, 77.28794931], [28.50836057, 77.28795432], [28.50843402, 77.28806154]],
  [[28.50832534, 77.28802193], [28.50831847, 77.28802856], [28.50837353, 77.28808589], [28.50836646, 77.28809225], [28.50840213, 77.28812953], [28.50839482, 77.28813550], [28.50844372, 77.28819684], [28.50843621, 77.28820249], [28.50846435, 77.28823377], [28.50845657, 77.28823896], [28.50848729, 77.28828111], [28.50847945, 77.28828617], [28.50853502, 77.28837221], [28.50852737, 77.28837763], [28.50856327, 77.28842054], [28.50855563, 77.28842598], [28.50861808, 77.28852432], [28.50861018, 77.28852927], [28.50863670, 77.28856557], [28.50862842, 77.28856966], [28.50865055, 77.28860865], [28.50864207, 77.28861214]],
  [[28.50726157, 77.28821645], [28.50725959, 77.28821854], [28.50748677, 77.28848896], [28.50748480, 77.28849106]],
  [[28.50756080, 77.28857644], [28.50755883, 77.28857855], [28.50767952, 77.28871894], [28.50767763, 77.28872114]],
  [[28.50710974, 77.28701699], [28.50710661, 77.28701723], [28.50712149, 77.28720899], [28.50711837, 77.28720923], [28.50712753, 77.28731690], [28.50712440, 77.28731714], [28.50713419, 77.28741785], [28.50713106, 77.28741812], [28.50714026, 77.28750991], [28.50713714, 77.28751014], [28.50714357, 77.28758019], [28.50714044, 77.28758043], [28.50714837, 77.28764592], [28.50714525, 77.28764620], [28.50715633, 77.28776620], [28.50715320, 77.28776647], [28.50716312, 77.28786877], [28.50715999, 77.28786900], [28.50716741, 77.28795643], [28.50716427, 77.28795662], [28.50715866, 77.28795709], [28.50717000, 77.28800039], [28.50716123, 77.28800064], [28.50716903, 77.28807311], [28.50716029, 77.28807239], [28.50716616, 77.28809796], [28.50715748, 77.28809668]],
  [[28.50703816, 77.28822309], [28.50703884, 77.28822606], [28.50671509, 77.28831828], [28.50671562, 77.28832129]],
  [[28.50803638, 77.28930444], [28.50803431, 77.28930465], [28.50804888, 77.28946521], [28.50804681, 77.28946540], [28.50805947, 77.28962580], [28.50805740, 77.28962598], [28.50808288, 77.28996369], [28.50808082, 77.28996388]]
];

const WAREHOUSE_DATA = [
  { id: "Warehouse 1", polygon: [[28.51143341203824, 77.29014792543707], [28.511447553531475, 77.29061060646951], [28.50887469321554, 77.29073212892841], [28.50886142486985, 77.29025147014725], [28.51143341203824, 77.29014792543707]] },
  { id: "Warehouse 2", polygon: [[28.51112807640633, 77.28930776832516], [28.51114576715341, 77.2897859105682], [28.50960493713407, 77.28986465016293], [28.509580039693272, 77.28937354130709], [28.51112807640633, 77.28930776832516]] },
  { id: "Warehouse 3", polygon: [[28.50948198269312, 77.29158820098095], [28.509540076766502, 77.2919518104223], [28.508237102003246, 77.29219264264968], [28.508187306470095, 77.29182903320833], [28.50948198269312, 77.29158820098095]] },
  { id: "Warehouse 4", polygon: [[28.516129077394567, 77.28667217921567], [28.51617385678954, 77.28779736584238], [28.51584625972401, 77.28780541246903], [28.515805015417023, 77.28667754363342], [28.516129077394567, 77.28667217921567]] },
];

const TRACK_COORDS = [
  [28.50798029741757, 77.2861993278382], [28.511441251081667, 77.28608144845934], [28.513226522607233, 77.28598437130985], [28.514676652635337, 77.28588036009819], [28.516528890591463, 77.28581795337986],
  [28.517899769428844, 77.28680259289459], [28.519014737755104, 77.28747519872812], [28.52097656595973, 77.28848757455816], [28.5227129362258, 77.28815473873708], [28.520793788465724, 77.28893135584076], [28.51889897656675, 77.28863319036364], [28.516778696540648, 77.28838356336682], [28.51356888196852, 77.289624505065]
];

const IMPORT_BUILDING_POLYGON = [
  [28.509186204290152, 77.28962077506394], [28.50920112087663, 77.2898341745694], [28.509013597921708, 77.28984387454693], [28.509005074143122, 77.28981477461436],
  [28.508921967265703, 77.28982689958627], [28.508892134011685, 77.28962805004707], [28.50917554958423, 77.28960622509764], [28.509186204290152, 77.28962077506394],
];
const EXPORT_BUILDING_POLYGON = [
  [28.508630027202305, 77.2908259972853], [28.50865346767512, 77.29136677103212], [28.5086023248186, 77.29137889600403], [28.50857462242765, 77.29135222106585],
  [28.508508562850583, 77.29134737107708], [28.508504300940974, 77.29082842227967], [28.508630027202305, 77.2908259972853],
];

const WORKSHOP1_POLYGON = [
  [28.508307466702206, 77.29030385925134], [28.508333381786564, 77.29079930674955], [28.50813988233628, 77.29081503524155], [28.50810705650144, 77.29033531623536], [28.508307466702206, 77.29030385925134],
];
const WORKSHOP2_POLYGON = [
  [28.508355841521226, 77.29102540383263], [28.50838693960744, 77.29136356641077], [28.508196895604073, 77.29138519308727], [28.508160614437223, 77.29104309838614], [28.508355841521226, 77.29102540383263],
];

const HEAD_OFFICE_POLYGON = [
  [28.50921721347462, 77.2876475691699], [28.509125822340106, 77.28766336700072], [28.509129292890968, 77.28761334053647], [28.509039058531517, 77.28761860648007], [28.509036744828975, 77.28754751624142], [28.508996255026346, 77.2875448832696], [28.508995098174594, 77.28756989650174], [28.508910647963845, 77.28757252947354], [28.508902549994893, 77.28748432491817], [28.50884470734014, 77.28748300843061], [28.508676963465497, 77.28731844769297], [28.508670022332243, 77.28724209150724], [28.50859714042292, 77.28723945853544], [28.508587885573693, 77.28714467155055], [28.508600610991166, 77.28709727805813], [28.508543925028732, 77.28709332860042], [28.508541611315344, 77.28699854161553], [28.50849070960772, 77.28699590864375], [28.508488395893163, 77.28689453922934], [28.50902401946127, 77.28687215896902], [28.509030960569564, 77.28697616135523], [28.508850491605273, 77.28698406027061], [28.50885743272499, 77.28722497719053], [28.508907177402953, 77.28726973771117], [28.509207958676942, 77.28725788933805],
];

// Points reordered to walk around the rectangle perimeter (west edge, then east edge)
// instead of zig-zagging corner-to-corner, which was crossing the shape into a bowtie.
const GARDEN_PATH_COORDS = [
  [28.508629238165717, 77.28775429210175], // south-west
  [28.509214111453613, 77.28771051706273], // north-west
  [28.509215859948863, 77.28774135856749], // north-east
  [28.508625741155715, 77.28778214894476], // south-east
];

const DOMESTIC_FENCE_COORDS = [
  [28.50957760, 77.28654766],
  [28.50944139, 77.28655315],
  [28.50945883, 77.28694747],
  [28.51357455, 77.28674464],
  [28.51356438, 77.28636305],
  [28.51343122, 77.28636901],
];

// New small yellow-black wall markers, connected as one straight-through polyline
// in the exact order given.
const SMALL_WALL_COORDS = [
  [28.507433282004676, 77.28899181219803],
  [28.506913285650974, 77.28829882331989],
  [28.50718415859611, 77.2881368259198],
];

// Second batch: three separate small yellow-black walls, each made from its own
// 3-point group (point1 -> point2 -> point3). The three groups are NOT connected
// to each other — each is its own independent little wall.
const SMALL_WALL_LINES_2 = [
  [
    [28.50803723877893, 77.28952979922991],
    [28.508004849255023, 77.28944379578691],
    [28.50796646165828, 77.2893236639935],
  ],
  [
    [28.50798925429552, 77.289537990034],
    [28.507960463595012, 77.28944243065288],
    [28.507924475208345, 77.28933458506563],
  ],
  [
    [28.50791367868994, 77.28951751302378],
    [28.507889686422867, 77.2894601773951],
    [28.507866893764103, 77.28937826935413],
  ],
  [
    [28.508614592359354, 77.28774104319079],
    [28.508601628975807, 77.28759553336224],
    [28.508612235380628, 77.28757474624386],
    [28.5086269664967, 77.28756938182623]
  ],
  [
    [28.508622841784412, 77.28769343398422],
    [28.508727138031375, 77.28768337570115],
    [28.50883850509648, 77.28767063520924],
    [28.508832612662125, 77.28749830329247]
  ],
  [
    [28.508635215923, 77.28781949781437],
    [28.508645822324468, 77.2878858824827],
    [28.508657607213728, 77.28796970150836],
    [28.508672927567808, 77.28801194629729],
    [28.508698265071576, 77.28802938065462]
  ],
  [
    [28.509576744045436, 77.28943053610028],
    [28.509551012279246, 77.28943471933658],
    [28.509526015700352, 77.2894506156345],
    [28.509515722989693, 77.28948240823034],
    [28.50950776602468, 77.28955153572998],
    [28.509511890702363, 77.28963602530786],
    [28.50952249701569, 77.28972185599014],
    [28.50954429887859, 77.28978757010626],
    [28.509566689976346, 77.28982914434299],
    [28.50958849183012, 77.28984724925253]
  ]

];

const CGO_GATE_LANES = [
  [
    [28.509355477586595, 77.28664647916409],
    [28.509288893385484, 77.28663977364205]
  ]
];
const CGO_BOOM_BARRIER_COORDS = [
  { lat: 28.50929635342298, lng: 77.28661289559709, face: "left" }
];

const CGI_GATE_LANES = [
  [
    [28.513628109980527, 77.28633842854047],
    [28.51356732118828, 77.28638662530103]
  ]
];
const CGI_BOOM_BARRIER_COORDS = [
  { lat: 28.51363246593446, lng: 77.28635825754232, face: "right" }
];

// OCR gate: pole-gantry (like AutomationGate3D) walking through 3 given points as
// 2 back-to-back lane segments (point1->point2, then point2->point3), same pole
// style repeated for both segments.
const OCR_GATE_LANES = [
  [
    [28.50799885119397, 77.28941785824061],
    [28.507960463595012, 77.28944243065288],
  ],
  [
    [28.507960463595012, 77.28944243065288],
    [28.507889686422867, 77.2894601773951],
  ],
];

// Two boom barriers (one right-facing, one left-facing) placed a little ahead of
// the last point of SMALL_WALL_LINES_2's second wall ([28.507924475208345, 77.28933458506563]),
// continuing in the same direction that wall was heading.
const OCR_BOOM_LANE = [
  [28.50796646165828, 77.2893236639935],
  [28.507924475208345, 77.28933458506563],
];
const OCR_BOOM_BARRIER_COORDS = [
  { lat: 28.507924475208345, lng: 77.28933458506563, face: "left" },
  { lat: 28.50787376941233, lng: 77.28937769306339, face: "left" },
];


const GUARD_ROOM_COORDS = { lat: 28.507842974160386, lng: 77.28684990563461 };
const GUARD_ROOM_SCALE = 1.2; // tweak this to resize (0.2 - 0.5 range is "small")

const CISF_BUILDING_POLYGON = [
  [28.507694261747336, 77.28886187419316],
  [28.50777793518737, 77.28895239874089],
  [28.507757900707762, 77.28898123248571],
  [28.507678352001236, 77.28888735517697],
];

useGLTF.preload("/acacia_tree.glb");
useGLTF.preload("/crane.glb");
useGLTF.preload("/container_loader.glb");
useGLTF.preload("/train.glb");
useGLTF.preload("/wagon.glb");
useGLTF.preload("/cell_tower_skyward.glb");
useGLTF.preload("/guardRoom.glb");

const TREE_MODELS = [
  "/acacia_tree.glb"
];

const SLINE_COLORS = {
  ONEPL: "#22C55E",
  MSC: "#3B82F6",
  default: "#EF4444",
};


const GATE_TOUCH_LINES = [
  ...AUTO_GATE_LANES,   // main automation lane gantry
  ...CGO_GATE_LANES,    // domestic gate 1 (CGO)
  ...CGI_GATE_LANES,    // domestic gate 2 (CGI)
  ...OCR_GATE_LANES,    // OCR gate
];



const GATE_FILL_POLYGONS = [INGATE_POLYGON, OUTGATE_POLYGON];




const EMPTY_SLOT_COLOR = "#9CA3AF";

function getContainerColor(container) {
  if (container.isEmpty) return EMPTY_SLOT_COLOR;
  const line = container.originalData?.SLINECODE?.trim().toUpperCase() || "";
  return SLINE_COLORS[line] || SLINE_COLORS.default;
}

function createContainerTexture(baseColor, isDark) {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const color = new THREE.Color(baseColor);
  ctx.fillStyle = color.getStyle(); ctx.fillRect(0, 0, 512, 512);

  const darkColor = color.clone().multiplyScalar(0.7);
  ctx.fillStyle = darkColor.getStyle();
  for (let x = 0; x < 512; x += 12) ctx.fillRect(x, 0, 2, 512);

  ctx.fillStyle = darkColor.getStyle();
  ctx.fillRect(0, 0, 512, 30); ctx.fillRect(0, 482, 512, 30);
  ctx.strokeStyle = darkColor.getStyle(); ctx.lineWidth = 4; ctx.strokeRect(380, 50, 120, 412);

  ctx.fillStyle = darkColor.getStyle();
  for (let y = 60; y < 450; y += 40) {
    ctx.beginPath(); ctx.arc(390, y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(490, y, 4, 0, Math.PI * 2); ctx.fill();
  }

  ctx.fillStyle = "#FFFFFF"; ctx.globalAlpha = 0.3;
  ctx.fillRect(50, 460, 200, 20); ctx.globalAlpha = 1.0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(1, 1);
  return texture;
}

function createWarningStripeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FACC15"; ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = "#111827"; ctx.beginPath();
  for (let i = -512; i < 1024; i += 128) {
    ctx.moveTo(i, 0); ctx.lineTo(i + 64, 0); ctx.lineTo(i + 64 - 512, 512); ctx.lineTo(i - 512, 512);
  }
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(2, 1);
  return texture;
}

function createRedWhiteStripeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, 1024, 64);
  ctx.fillStyle = "#EF4444";
  ctx.beginPath();
  for (let i = -1024; i < 2048; i += 128) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 64, 0);
    ctx.lineTo(i + 64 + 64, 64);
    ctx.lineTo(i + 64, 64);
  }
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

function createOrangeBlackStripeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#F97316"; ctx.fillRect(0, 0, 128, 512);
  ctx.fillStyle = "#111827";
  for (let i = -128; i < 1024; i += 64) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(128, i + 32);
    ctx.lineTo(128, i + 64);
    ctx.lineTo(0, i + 32);
    ctx.closePath();
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 3);
  return texture;
}

function isPointInPolygon(point, vs) {
  let x = point[0], z = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][0], zi = vs[i][1]; let xj = vs[j][0], zj = vs[j][1];
    let intersect = ((zi > z) != (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function formatSlotId(rawId) {
  if (!rawId) return rawId;
  const parts = rawId.split(":");
  if (parts.length >= 3) { parts[1] = parts[1].padStart(3, "0"); parts[2] = parts[2].padStart(3, "0"); }
  return parts.join(":");
}

function calculateCenter(slots, warehouses) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  slots.forEach((slot) => { slot.polygon.forEach(([lat, lng]) => { minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat); minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng); }); });
  warehouses.forEach((wh) => { wh.polygon.forEach(([lat, lng]) => { minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat); minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng); }); });
  if (minLat === Infinity) return { lat: 28.510, lng: 77.290 };
  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
}

function getOrientedFootprint(polygon, center) {
  const lngScale = Math.cos((center.lat * Math.PI) / 180);
  const points2D = polygon.map(([lat, lng]) => ({
    wx: (lng - center.lng) * LAT_TO_METERS * lngScale,
    wz: -(lat - center.lat) * LAT_TO_METERS,
  }));
  let centerX = 0, centerZ = 0;
  points2D.forEach((p) => { centerX += p.wx; centerZ += p.wz; });
  centerX /= points2D.length; centerZ /= points2D.length;

  let maxDist = 0, localAngle = 0;
  for (let i = 0; i < points2D.length - 1; i++) {
    const p1 = points2D[i]; const p2 = points2D[i + 1];
    const dx = p2.wx - p1.wx; const dz = p2.wz - p1.wz;
    const dist = Math.hypot(dx, dz);
    if (dist > maxDist) { maxDist = dist; localAngle = Math.atan2(dz, dx); }
  }
  const cosA = Math.cos(localAngle), sinA = Math.sin(localAngle);
  let minW = Infinity, maxW = -Infinity, minD = Infinity, maxD = -Infinity;
  points2D.forEach((p) => {
    const relX = p.wx - centerX, relZ = p.wz - centerZ;
    const w = relX * cosA + relZ * sinA;
    const d = -relX * sinA + relZ * cosA;
    minW = Math.min(minW, w); maxW = Math.max(maxW, w);
    minD = Math.min(minD, d); maxD = Math.max(maxD, d);
  });
  return { cx: centerX, cz: centerZ, angle: localAngle, width: maxW - minW, depth: maxD - minD };
}

const _instParent = new THREE.Object3D();
const _instChild = new THREE.Object3D();
_instParent.add(_instChild);
function composeWorldMatrix(parentPos, parentRotY, childPos, childScale, childRot = [0, 0, 0]) {
  _instParent.position.set(parentPos[0], parentPos[1], parentPos[2]);
  _instParent.rotation.set(0, parentRotY, 0);
  _instChild.position.set(childPos[0], childPos[1], childPos[2]);
  _instChild.scale.set(childScale[0], childScale[1], childScale[2]);
  _instChild.rotation.set(childRot[0], childRot[1], childRot[2]);
  _instParent.updateMatrixWorld(true);
  return _instChild.matrixWorld.clone();
}

const InstancedStatic = ({ geometry, material, matrices, castShadow = false, receiveShadow = false }) => {
  const meshRef = useRef(null);
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);
  if (!matrices.length) return null;
  return <instancedMesh ref={meshRef} args={[geometry, undefined, matrices.length]} material={material} castShadow={castShadow} receiveShadow={receiveShadow} />;
};

const PAN_BOUNDS_CENTER_X = -120;
const PAN_BOUNDS_CENTER_Z = 150;
const PAN_BOUNDS_RADIUS = 900;

const PanBoundsClamp = ({ controlsRef }) => {
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const target = controls.target;
    const dx = target.x - PAN_BOUNDS_CENTER_X;
    const dz = target.z - PAN_BOUNDS_CENTER_Z;
    const dist = Math.hypot(dx, dz);
    if (dist <= PAN_BOUNDS_RADIUS) return;
    const scale = PAN_BOUNDS_RADIUS / dist;
    const newX = PAN_BOUNDS_CENTER_X + dx * scale;
    const newZ = PAN_BOUNDS_CENTER_Z + dz * scale;
    controls.object.position.x += newX - target.x;
    controls.object.position.z += newZ - target.z;
    target.x = newX;
    target.z = newZ;
  });
  return null;
};

const bbCabinetGeo = new THREE.BoxGeometry(0.6, 1.1, 0.5);
const bbPivotGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16);
const bbArmGeo = new THREE.BoxGeometry(4.0, 0.15, 0.05);
const bbLedGeo = new THREE.BoxGeometry(0.2, 0.05, 0.2);

const BoomBarrier3D = ({ center, isDark, coords = BOOM_BARRIER_COORDS, label = "Access Control Boom Barrier", lane = null }) => {
  const [hovered, setHovered] = useState(false);
  const stripeTexture = useMemo(() => createRedWhiteStripeTexture(), []);

  const { cabinetM, pivotM, armM, ledM, bounds } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const cab = [], piv = [], arm = [], led = [];
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;

    let laneBaseAngle = -Math.PI / 4;
    if (lane) {
      const lp1 = { x: (lane[0][1] - center.lng) * LAT_TO_METERS * lngScale, z: -(lane[0][0] - center.lat) * LAT_TO_METERS };
      const lp2 = { x: (lane[1][1] - center.lng) * LAT_TO_METERS * lngScale, z: -(lane[1][0] - center.lat) * LAT_TO_METERS };
      laneBaseAngle = -Math.atan2(lp2.z - lp1.z, lp2.x - lp1.x);
    }

    coords.forEach((coord) => {
      const x = (coord.lng - center.lng) * LAT_TO_METERS * lngScale;
      const z = -(coord.lat - center.lat) * LAT_TO_METERS;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);

      const rotY = (coord.face === "right" ? laneBaseAngle : laneBaseAngle + Math.PI) + (coord.rotationOffset || 0);

      cab.push(composeWorldMatrix([x, 0.55, z], rotY, [0, 0, 0], [1, 1, 1]));
      led.push(composeWorldMatrix([x, 1.125, z], rotY, [0, 0, 0], [1, 1, 1]));
      piv.push(composeWorldMatrix([x, 0.9, z + 0.3], rotY, [0, 0, 0], [1, 1, 1], [Math.PI / 2, 0, 0]));
      arm.push(composeWorldMatrix([x, 0.9, z + 0.3], rotY, [2.0, 0, 0], [1, 1, 1]));
    });

    const cx = (minX + maxX) / 2 || 0;
    const cz = (minZ + maxZ) / 2 || 0;

    return { cabinetM: cab, pivotM: piv, armM: arm, ledM: led, bounds: { cx, cz } };
  }, [center, coords, lane]);

  const cabMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#F97316", roughness: 0.4, metalness: 0.2 }), []);
  const pivMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#374151", roughness: 0.6, metalness: 0.8 }), []);
  const armMat = useMemo(() => new THREE.MeshStandardMaterial({ map: stripeTexture, roughness: 0.7 }), [stripeTexture]);
  const ledMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#EF4444", emissive: "#EF4444", emissiveIntensity: 2.0 }), []);

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
    >
      <InstancedStatic geometry={bbCabinetGeo} material={cabMat} matrices={cabinetM} castShadow receiveShadow />
      <InstancedStatic geometry={bbPivotGeo} material={pivMat} matrices={pivotM} castShadow receiveShadow />
      <InstancedStatic geometry={bbArmGeo} material={armMat} matrices={armM} castShadow receiveShadow />
      <InstancedStatic geometry={bbLedGeo} material={ledMat} matrices={ledM} />

      {hovered && (
        <Html position={[bounds.cx, 4, bounds.cz]} center style={{ pointerEvents: "none", zIndex: 100 }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: "bold", fontSize: "14px", background: "#EF4444", color: "#fff", border: "2px solid #fff", padding: "8px 14px", borderRadius: "6px", boxShadow: "0 6px 10px rgba(0,0,0,0.4)" }}>
            <span>🚧</span> {label}
          </div>
        </Html>
      )}
    </group>
  );
};

const gantryPoleGeo = new THREE.BoxGeometry(0.15, 4.5, 0.15);
const gantryBeamGeo = new THREE.BoxGeometry(1, 0.15, 0.15);
const orangeCabinetGeo = new THREE.BoxGeometry(0.6, 1.2, 0.6);
const cameraBoxGeo = new THREE.BoxGeometry(0.15, 0.15, 0.3);
const greenLightBoxGeo = new THREE.BoxGeometry(0.4, 0.4, 0.05);

const AutomationGate3D = ({ center, isDark, lanes = AUTO_GATE_LANES, label = "Automation Lane Gantry", stripedPoles = false, poleColor = null }) => {
  const [hovered, setHovered] = useState(false);

  const { poleM, beamM, cabinetM, cameraM, lightM } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const poles = [], beams = [], cabinets = [], cameras = [], lights = [];

    lanes.forEach((lane) => {
      const p1 = {
        x: (lane[0][1] - center.lng) * LAT_TO_METERS * lngScale,
        z: -(lane[0][0] - center.lat) * LAT_TO_METERS,
      };
      const p2 = {
        x: (lane[1][1] - center.lng) * LAT_TO_METERS * lngScale,
        z: -(lane[1][0] - center.lat) * LAT_TO_METERS,
      };

      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const width = Math.hypot(dx, dz);
      const cx = (p1.x + p2.x) / 2;
      const cz = (p1.z + p2.z) / 2;
      const angle = Math.atan2(dz, dx);

      const parentPos = [cx, 0, cz];
      const rotY = -angle;

      poles.push(composeWorldMatrix(parentPos, rotY, [-width / 2, 2.25, 0], [1, 1, 1]));
      poles.push(composeWorldMatrix(parentPos, rotY, [width / 2, 2.25, 0], [1, 1, 1]));

      beams.push(composeWorldMatrix(parentPos, rotY, [0, 4.5, 0], [width, 1, 1]));

      cabinets.push(composeWorldMatrix(parentPos, rotY, [-width / 2 - 0.4, 0.6, 0.2], [1, 1, 1]));

      cameras.push(composeWorldMatrix(parentPos, rotY, [-width / 2 + 0.3, 3.5, 0.2], [1, 1, 1], [-0.5, 0.3, 0]));
      cameras.push(composeWorldMatrix(parentPos, rotY, [width / 2 - 0.3, 3.5, 0.2], [1, 1, 1], [-0.5, -0.3, 0]));

      lights.push(composeWorldMatrix(parentPos, rotY, [0, 4.5, 0.1], [1, 1, 1]));
    });

    return { poleM: poles, beamM: beams, cabinetM: cabinets, cameraM: cameras, lightM: lights };
  }, [center, lanes]);

  const stripeTexture = useMemo(() => (stripedPoles ? createOrangeBlackStripeTexture() : null), [stripedPoles]);
  const gantryMaterial = useMemo(() => (
    poleColor
      ? new THREE.MeshStandardMaterial({ color: poleColor, roughness: 0.6, metalness: 0.4 })
      : stripedPoles
        ? new THREE.MeshStandardMaterial({ map: stripeTexture, roughness: 0.6, metalness: 0.3 })
        : new THREE.MeshStandardMaterial({ color: isDark ? "#4B5563" : "#f47349", roughness: 0.6, metalness: 0.4 })
  ), [isDark, stripedPoles, stripeTexture, poleColor]);
  const cabinetMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#EA580C", roughness: 0.5 }), []);
  const cameraMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: isDark ? "#1F2937" : "#E5E7EB", roughness: 0.3 }), [isDark]);
  const greenLightMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#22C55E", emissive: "#22C55E", emissiveIntensity: 2.5 }), []);

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
    >
      <InstancedStatic geometry={gantryPoleGeo} material={gantryMaterial} matrices={poleM} castShadow receiveShadow />
      <InstancedStatic geometry={gantryBeamGeo} material={gantryMaterial} matrices={beamM} castShadow receiveShadow />
      <InstancedStatic geometry={orangeCabinetGeo} material={cabinetMaterial} matrices={cabinetM} castShadow />
      <InstancedStatic geometry={cameraBoxGeo} material={cameraMaterial} matrices={cameraM} castShadow />
      <InstancedStatic geometry={greenLightBoxGeo} material={greenLightMaterial} matrices={lightM} />

      {hovered && (
        <Html position={[poleM[0]?.elements[12] || 0, 6, poleM[0]?.elements[14] || 0]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: "bold", fontSize: "14px", background: "#EA580C", color: "#fff", border: "2px solid #fff", padding: "8px 14px", borderRadius: "6px", boxShadow: "0 6px 10px rgba(0,0,0,0.4)" }}>
            <span>📹</span> {label}
          </div>
        </Html>
      )}
    </group>
  );
};

const qrBaseGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.2, 32);
const qrPoleGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.0, 32);
const qrBodyGeo = new THREE.BoxGeometry(0.7, 1.1, 0.25);
const qrHoodGeo = new THREE.BoxGeometry(0.75, 0.08, 0.35);
const qrScreenGeo = new THREE.PlaneGeometry(0.5, 0.5);
const qrScannerWindowGeo = new THREE.BoxGeometry(0.4, 0.2, 0.05);
const qrLaserGeo = new THREE.BoxGeometry(0.35, 0.01, 0.06);

const QRCodeScanner3D = ({ center, isDark }) => {
  const [hovered, setHovered] = useState(false);

  const { baseM, poleM, bodyM, hoodM, screenM, scannerM, laserM, positions } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const bases = [], poles = [], bodies = [], hoods = [], screens = [], scanners = [], lasers = [];
    const posList = [];

    QR_SCANNER_COORDS.forEach((coord) => {
      const x = (coord[1] - center.lng) * LAT_TO_METERS * lngScale;
      const z = -(coord[0] - center.lat) * LAT_TO_METERS;
      const parentPos = [x, 0, z];

      const rotY = Math.PI / 4 + Math.PI;
      const tiltX = -Math.PI / 12;

      bases.push(composeWorldMatrix(parentPos, rotY, [0, 0.1, 0], [1, 1, 1]));
      poles.push(composeWorldMatrix(parentPos, rotY, [0, 1.0, 0], [1, 1, 1]));

      bodies.push(composeWorldMatrix(parentPos, rotY, [0, 2.0, 0.1], [1, 1, 1], [tiltX, 0, 0]));
      hoods.push(composeWorldMatrix(parentPos, rotY, [0, 2.55, 0.12], [1, 1, 1], [tiltX, 0, 0]));

      screens.push(composeWorldMatrix(parentPos, rotY, [0, 2.15, 0.23], [1, 1, 1], [tiltX, 0, 0]));

      scanners.push(composeWorldMatrix(parentPos, rotY, [0, 1.7, 0.22], [1, 1, 1], [tiltX, 0, 0]));

      lasers.push(composeWorldMatrix(parentPos, rotY, [0, 1.7, 0.23], [1, 1, 1], [tiltX, 0, 0]));

      posList.push({ x, z });
    });
    return { baseM: bases, poleM: poles, bodyM: bodies, hoodM: hoods, screenM: screens, scannerM: scanners, laserM: lasers, positions: posList };
  }, [center]);

  const baseMat = useMemo(() => new THREE.MeshStandardMaterial({ color: isDark ? "#374151" : "#9CA3AF", roughness: 0.8, metalness: 0.2 }), [isDark]);
  const poleMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#F97316", roughness: 0.3, metalness: 0.6 }), []);
  const bodyMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#10B981", roughness: 0.1, metalness: 0.2, clearcoat: 1.0, clearcoatRoughness: 0.1 }), []);
  const hoodMat = useMemo(() => new THREE.MeshStandardMaterial({ color: isDark ? "#111827" : "#374151", roughness: 0.5, metalness: 0.5 }), [isDark]);
  const screenMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#38BDF8", emissive: "#0284C7", emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.8 }), []);
  const scannerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#000000", roughness: 0.0, metalness: 0.9, transparent: true, opacity: 0.8 }), []);
  const laserMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#EF4444", emissive: "#EF4444", emissiveIntensity: 3.0 }), []);

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
    >
      <InstancedStatic geometry={qrBaseGeo} material={baseMat} matrices={baseM} castShadow receiveShadow />
      <InstancedStatic geometry={qrPoleGeo} material={poleMat} matrices={poleM} castShadow receiveShadow />
      <InstancedStatic geometry={qrBodyGeo} material={bodyMat} matrices={bodyM} castShadow receiveShadow />
      <InstancedStatic geometry={qrHoodGeo} material={hoodMat} matrices={hoodM} castShadow />
      <InstancedStatic geometry={qrScreenGeo} material={screenMat} matrices={screenM} />
      <InstancedStatic geometry={qrScannerWindowGeo} material={scannerMat} matrices={scannerM} />
      <InstancedStatic geometry={qrLaserGeo} material={laserMat} matrices={laserM} />

      {hovered && positions[0] && (
        <Html position={[positions[0].x, 3.8, positions[0].z]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: "bold", fontSize: "14px", background: "#10B981", color: "#fff", border: "2px solid #fff", padding: "8px 14px", borderRadius: "6px", boxShadow: "0 6px 10px rgba(0,0,0,0.4)" }}>
            <span>📲</span> Auto QR Scanner
          </div>
        </Html>
      )}
    </group>
  );
};

function createIndianFlagTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#FF9933";
  ctx.fillRect(0, 0, 600, 133.33);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 133.33, 600, 133.33);
  ctx.fillStyle = "#138808";
  ctx.fillRect(0, 266.66, 600, 133.33);

  ctx.strokeStyle = "#000080";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(300, 200, 50, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 24; i++) {
    ctx.beginPath();
    ctx.moveTo(300, 200);
    ctx.lineTo(
      300 + 50 * Math.cos((i * Math.PI) / 12),
      200 + 50 * Math.sin((i * Math.PI) / 12)
    );
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const CustomAnimatedFlag = ({ position }) => {
  const meshRef = useRef();
  const texture = useMemo(() => createIndianFlagTexture(), []);
  const geometry = useMemo(() => new THREE.PlaneGeometry(6, 4, 32, 32), []);
  const initialPositions = useMemo(() => new Float32Array(geometry.attributes.position.array), [geometry]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const posAttr = geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = initialPositions[i * 3];
      const waveDist = x + 3;
      const z = Math.sin(waveDist * 1.5 - time * 5) * (waveDist * 0.2);
      posAttr.setZ(i, z);
    }
    posAttr.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} position={position} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial map={texture} side={THREE.DoubleSide} roughness={0.4} />
    </mesh>
  );
};

const flagPillarGeo = new THREE.CylinderGeometry(0.15, 0.1, 1.5, 12);

const FlagMemorial3D = ({ center, isDark }) => {
  const [hovered, setHovered] = useState(false);

  const { pillars, chainCurves, cx, cz } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const pts = FLAG_COORDS.map(c => [
      (c[1] - center.lng) * LAT_TO_METERS * lngScale,
      -(c[0] - center.lat) * LAT_TO_METERS
    ]);

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    pts.forEach(([x, z]) => {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    });

    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const generatedPillars = [];
    const PILLAR_SPACING = 2.0;

    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];

      const dx = p2[0] - p1[0];
      const dz = p2[1] - p1[1];
      const dist = Math.hypot(dx, dz);

      const count = Math.max(1, Math.ceil(dist / PILLAR_SPACING));

      for (let j = 0; j < count; j++) {
        const px = p1[0] + (dx / count) * j;
        const pz = p1[1] + (dz / count) * j;
        generatedPillars.push([px, 0, pz]);
      }
    }

    const curves = [];
    const chainHeight = 1.0;
    const droopAmount = 0.4;

    for (let i = 0; i < generatedPillars.length; i++) {
      const p1 = generatedPillars[i];
      const p2 = generatedPillars[(i + 1) % generatedPillars.length];

      const midX = (p1[0] + p2[0]) / 2;
      const midZ = (p1[2] + p2[2]) / 2;

      const v0 = new THREE.Vector3(p1[0], chainHeight, p1[2]);
      const v1 = new THREE.Vector3(midX, chainHeight - droopAmount, midZ);
      const v2 = new THREE.Vector3(p2[0], chainHeight, p2[2]);

      curves.push(new THREE.QuadraticBezierCurve3(v0, v1, v2));
    }

    return { pillars: generatedPillars, chainCurves: curves, cx: centerX, cz: centerZ };
  }, [center]);

  const pillarMatrices = useMemo(() => {
    return pillars.map(p => composeWorldMatrix([p[0], 0.6, p[2]], 0, [0, 0, 0], [1, 1, 1]));
  }, [pillars]);

  const pillarMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: isDark ? "#4B5563" : "#D1D5DB", roughness: 0.7, metalness: 0.2 }), [isDark]);
  const chainMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: isDark ? "#374151" : "#1F2937", roughness: 0.5, metalness: 0.8 }), [isDark]);
  const poleHeight = 15;

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
    >
      <InstancedStatic geometry={flagPillarGeo} material={pillarMaterial} matrices={pillarMatrices} castShadow receiveShadow />

      {chainCurves.map((curve, idx) => (
        <mesh key={`chain-${idx}`} castShadow receiveShadow>
          <tubeGeometry args={[curve, 16, 0.03, 8, false]} />
          <primitive object={chainMaterial} attach="material" />
        </mesh>
      ))}

      <group position={[cx, 0, cz]}>

        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[4, 0.4, 4]} />
          <meshStandardMaterial color={isDark ? "#374151" : "#D1D5DB"} roughness={0.8} />
        </mesh>

        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 0.4, 3]} />
          <meshStandardMaterial color={isDark ? "#4B5563" : "#E5E7EB"} roughness={0.8} />
        </mesh>

        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, 0.4, 2]} />
          <meshStandardMaterial color={isDark ? "#374151" : "#D1D5DB"} roughness={0.8} />
        </mesh>

        <mesh position={[0, poleHeight / 2 + 1.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.15, poleHeight, 16]} />
          <meshStandardMaterial color="#A1A1AA" metalness={0.8} roughness={0.2} />
        </mesh>

        <CustomAnimatedFlag position={[3.1, poleHeight + 0.1, 0]} />

      </group>

      {hovered && (
        <Html position={[cx, poleHeight + 4, cz]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: "bold", fontSize: "14px", background: "#F97316", color: "#fff", border: "2px solid #fff", padding: "8px 14px", borderRadius: "6px", boxShadow: "0 6px 10px rgba(0,0,0,0.4)" }}>
            <span>🇮🇳</span> National Flag
          </div>
        </Html>
      )}
    </group>
  );
};

const TreeModel = ({ url, position, scale, rotation }) => {
  const { scene } = useGLTF(url);
  return <Clone object={scene} position={position} scale={scale} rotation={rotation} castShadow receiveShadow />;
};

const GreeneryArea3D = ({ center, isDark }) => {
  const treePositions = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const pts = GREENERY_COORDS.map(c => [
      (c[1] - center.lng) * LAT_TO_METERS * lngScale,
      -(c[0] - center.lat) * LAT_TO_METERS
    ]);

    return pts.map(([x, z]) => ({
      x, z,
      type: TREE_MODELS[Math.floor(Math.random() * TREE_MODELS.length)],
      scale: 2,
      rot: Math.random() * Math.PI * 2
    }));
  }, [center]);

  return (
    <group>
      {/* Green background mesh yahan se hata diya hai */}
      <Suspense fallback={null}>
        {treePositions.map((t, i) => (
          <TreeModel
            key={i}
            url={t.type}
            position={[t.x, 0.06, t.z]}
            scale={[t.scale, t.scale, t.scale]}
            rotation={[0, t.rot, 0]}
          />
        ))}
      </Suspense>
    </group>
  );
};

const ROAD_GRID_STEP = 0.9;
const ROAD_WALL_CLEARANCE = 0.18;
const ROAD_MAX_REACH = 27.0;
const ROAD_BUCKET = ROAD_MAX_REACH;
const ROAD_HOLE_FILL_ITERATIONS = 3;

function pointSegDist(px, pz, x1, z1, x2, z2) {
  const dx = x2 - x1, dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  let t = lenSq > 1e-9 ? ((px - x1) * dx + (pz - z1) * dz) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + dx * t, cz = z1 + dz * t;
  return Math.hypot(px - cx, pz - cz);
}

function morphClose(mask, cols, rows, iterations) {
  let cur = mask;
  for (let pass = 0; pass < iterations; pass++) {
    const dilated = new Uint8Array(cur.length);
    for (let iz = 0; iz < rows; iz++) {
      for (let ix = 0; ix < cols; ix++) {
        let v = 0;
        for (let dz = -1; dz <= 1 && !v; dz++) {
          for (let dx = -1; dx <= 1 && !v; dx++) {
            const nx = ix + dx, nz = iz + dz;
            if (nx >= 0 && nx < cols && nz >= 0 && nz < rows && cur[nz * cols + nx]) v = 1;
          }
        }
        dilated[iz * cols + ix] = v;
      }
    }
    cur = dilated;
  }
  for (let pass = 0; pass < iterations; pass++) {
    const eroded = new Uint8Array(cur.length);
    for (let iz = 0; iz < rows; iz++) {
      for (let ix = 0; ix < cols; ix++) {
        let v = 1;
        for (let dz = -1; dz <= 1 && v; dz++) {
          for (let dx = -1; dx <= 1 && v; dx++) {
            const nx = ix + dx, nz = iz + dz;
            if (nx < 0 || nx >= cols || nz < 0 || nz >= rows || !cur[nz * cols + nx]) v = 0;
          }
        }
        eroded[iz * cols + ix] = v;
      }
    }
    cur = eroded;
  }
  return cur;
}

const roadDashMaterial = new THREE.MeshStandardMaterial({ color: "#F8FAFC", roughness: 0.5, emissive: "#F8FAFC", emissiveIntensity: 0.05 });

const roadArrowGeo = new THREE.BufferGeometry();
roadArrowGeo.setAttribute("position", new THREE.Float32BufferAttribute([
  0.55, 0.0, 0.0, 0.12, 0.0, 0.28, 0.12, 0.0, -0.28,
  0.12, 0.0, 0.12, -0.42, 0.0, 0.12, 0.12, 0.0, -0.12,
  -0.42, 0.0, -0.12,
], 3));
roadArrowGeo.setIndex([0, 1, 2, 3, 4, 5, 4, 6, 5]);
roadArrowGeo.computeVertexNormals();
const roadArrowMaterial = new THREE.MeshStandardMaterial({ color: "#F8FAFC", sroughness: 0.5, emissive: "#F8FAFC", emissiveIntensity: 0.08, side: THREE.DoubleSide });

function createAsphaltTexture(isDark) {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = isDark ? "#17171B" : "#2A2A30";
  ctx.fillRect(0, 0, 256, 256);
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 900; i++) {
    const shade = 60 + Math.random() * 40;
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    const s = Math.random() * 1.6 + 0.4;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, s, s);
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(18, 18);
  return texture;
}

const smallWallSkinGeo = new THREE.BoxGeometry(1, 0.8, 0.3);
const smallWallPostGeo = new THREE.BoxGeometry(0.2, 1.2, 0.2);
const smallWallBaseGeo = new THREE.BoxGeometry(1, 0.15, 0.4);

const ParkingWall3D = ({ center, isDark }) => {
  const [hovered, setHovered] = useState(false);
  const stripeTexture = useMemo(() => createWarningStripeTexture(), []);
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({ map: stripeTexture, roughness: 0.8, metalness: 0.1 }), [stripeTexture]);
  const postMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#4B5563", roughness: 0.7, metalness: 0.3 }), []);
  const baseMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: isDark ? "#374151" : "#9CA3AF", roughness: 0.9 }), [isDark]);

  const { wallMatrices, postMatrices, baseMatrices, bounds } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

    const wallM = [];
    const postM = [];
    const baseM = [];

    PARKING_WALL_LINES.forEach(line => {
      if (line.length < 2) return;

      const pts = line.map(c => ({
        x: (c[1] - center.lng) * LAT_TO_METERS * lngScale,
        z: -(c[0] - center.lat) * LAT_TO_METERS
      }));

      pts.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.z < minZ) minZ = p.z;
        if (p.z > maxZ) maxZ = p.z;
      });

      const smoothedPts = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const lastPt = smoothedPts[smoothedPts.length - 1];
        const dist = Math.hypot(pts[i].x - lastPt.x, pts[i].z - lastPt.z);
        if (dist > 2.0 || i === pts.length - 1) {
          smoothedPts.push(pts[i]);
        }
      }

      for (let i = 0; i < smoothedPts.length - 1; i++) {
        const p1 = smoothedPts[i];
        const p2 = smoothedPts[i + 1];

        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 0.01) continue;

        const angle = Math.atan2(dz, dx);
        const MAX_SEG_LEN = 2.0;
        const numBlocks = Math.ceil(dist / MAX_SEG_LEN);
        const blockLen = dist / numBlocks;

        for (let b = 0; b < numBlocks; b++) {
          const cx = p1.x + (dx / dist) * (b + 0.5) * blockLen;
          const cz = p1.z + (dz / dist) * (b + 0.5) * blockLen;

          wallM.push(composeWorldMatrix([cx, 0.4, cz], -angle, [0, 0, 0], [blockLen, 1, 1]));
          baseM.push(composeWorldMatrix([cx, 0.08, cz], -angle, [0, 0, 0], [blockLen, 1, 1]));
        }

        postM.push(composeWorldMatrix([p1.x, 0.6, p1.z], 0, [0, 0, 0], [1, 1, 1]));

        if (i === smoothedPts.length - 2) {
          postM.push(composeWorldMatrix([p2.x, 0.6, p2.z], 0, [0, 0, 0], [1, 1, 1]));
        }
      }
    });

    return {
      wallMatrices: wallM,
      postMatrices: postM,
      baseMatrices: baseM,
      bounds: { minX, maxX, minZ, maxZ }
    };
  }, [center]);

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
    >
      <InstancedStatic geometry={smallWallSkinGeo} material={wallMaterial} matrices={wallMatrices} castShadow receiveShadow />
      <InstancedStatic geometry={smallWallBaseGeo} material={baseMaterial} matrices={baseMatrices} castShadow receiveShadow />
      <InstancedStatic geometry={smallWallPostGeo} material={postMaterial} matrices={postMatrices} castShadow receiveShadow />

      {hovered && (
        <Html position={[bounds.minX + (bounds.maxX - bounds.minX) / 2, 3, bounds.minZ + (bounds.maxZ - bounds.minZ) / 2]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: "bold", fontSize: "14px", background: "#FACC15", color: "#111827", border: "2px solid #111827", padding: "8px 14px", borderRadius: "6px", boxShadow: "0 6px 10px rgba(0,0,0,0.4)" }}>
            <span>🅿️</span> Parking Wall Demarcations
          </div>
        </Html>
      )}
    </group>
  );
};


const SmallYellowBlackWall3D = ({ center, isDark, lines = [SMALL_WALL_COORDS] }) => {
  const [hovered, setHovered] = useState(false);
  const stripeTexture = useMemo(() => createWarningStripeTexture(), []);
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({ map: stripeTexture, roughness: 0.8, metalness: 0.1 }), [stripeTexture]);
  const postMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#4B5563", roughness: 0.7, metalness: 0.3 }), []);
  const baseMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: isDark ? "#374151" : "#9CA3AF", roughness: 0.9 }), [isDark]);

  const { wallMatrices, postMatrices, baseMatrices, bounds } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

    const wallM = [];
    const postM = [];
    const baseM = [];

    lines.forEach((line) => {
      if (line.length < 2) return;

      const pts = line.map((c) => ({
        x: (c[1] - center.lng) * LAT_TO_METERS * lngScale,
        z: -(c[0] - center.lat) * LAT_TO_METERS,
      }));

      pts.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.z < minZ) minZ = p.z;
        if (p.z > maxZ) maxZ = p.z;
      });

      // Walk straight through every consecutive pair of points, in the exact order
      // given — no smoothing/simplification, no reordering/pairing of points.
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];

        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.01) continue;

        const angle = Math.atan2(dz, dx);
        const MAX_SEG_LEN = 2.0;
        const numBlocks = Math.ceil(dist / MAX_SEG_LEN);
        const blockLen = dist / numBlocks;

        for (let b = 0; b < numBlocks; b++) {
          const cx = p1.x + (dx / dist) * (b + 0.5) * blockLen;
          const cz = p1.z + (dz / dist) * (b + 0.5) * blockLen;

          wallM.push(composeWorldMatrix([cx, 0.4, cz], -angle, [0, 0, 0], [blockLen, 1, 1]));
          baseM.push(composeWorldMatrix([cx, 0.08, cz], -angle, [0, 0, 0], [blockLen, 1, 1]));
        }

        postM.push(composeWorldMatrix([p1.x, 0.6, p1.z], 0, [0, 0, 0], [1, 1, 1]));
        if (i === pts.length - 2) {
          postM.push(composeWorldMatrix([p2.x, 0.6, p2.z], 0, [0, 0, 0], [1, 1, 1]));
        }
      }
    });

    return { wallMatrices: wallM, postMatrices: postM, baseMatrices: baseM, bounds: { minX, maxX, minZ, maxZ } };
  }, [center, lines]);

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
    >
      <InstancedStatic geometry={smallWallSkinGeo} material={wallMaterial} matrices={wallMatrices} castShadow receiveShadow />
      <InstancedStatic geometry={smallWallBaseGeo} material={baseMaterial} matrices={baseMatrices} castShadow receiveShadow />
      <InstancedStatic geometry={smallWallPostGeo} material={postMaterial} matrices={postMatrices} castShadow receiveShadow />

      {hovered && (
        <Html position={[bounds.minX + (bounds.maxX - bounds.minX) / 2, 3, bounds.minZ + (bounds.maxZ - bounds.minZ) / 2]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: "bold", fontSize: "14px", background: "#FACC15", color: "#111827", border: "2px solid #111827", padding: "8px 14px", borderRadius: "6px", boxShadow: "0 6px 10px rgba(0,0,0,0.4)" }}>
            <span>🚧</span> Boundary Wall Marking
          </div>
        </Html>
      )}
    </group>
  );
};

const parkingStripeGeo = new THREE.BoxGeometry(0.1, 0.02, 5);
const parkingCrossGeo = new THREE.BoxGeometry(2.6, 0.02, 0.1);
const parkingBarrierGeo = new THREE.BoxGeometry(1.7, 1, 0.6);
const parkingStripeMaterial = new THREE.MeshBasicMaterial({ color: "#FFFFFF" });

const ReachStackerField3D = ({ machines, center, isDark }) => {
  const { scene } = useGLTF("/container_loader.glb");
  const [hoverIndex, setHoverIndex] = useState(-1);

  const lngScale = useMemo(() => Math.cos((center.lat * Math.PI) / 180), [center]);

  return (
    <group>
      <Suspense fallback={null}>
        {machines.map((rst, idx) => {
          const x = (rst.lng - center.lng) * LAT_TO_METERS * lngScale;
          const z = -(rst.lat - center.lat) * LAT_TO_METERS;
          const angle = rst.angle || 0;

          return (
            <group key={`rst-${idx}`} position={[x, 0, z]} rotation={[0, angle, 0]}>
              <Clone
                object={scene}
                position={[0, 1.25, 0]}
                scale={[1, 1, 1]}
                castShadow
                receiveShadow
                onPointerMove={(e) => {
                  e.stopPropagation();
                  if (hoverIndex !== idx) {
                    setHoverIndex(idx);
                    document.body.style.cursor = "pointer";
                  }
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  setHoverIndex(-1);
                  document.body.style.cursor = "auto";
                }}
              />

              {hoverIndex === idx && (
                <Html position={[0, 10, 0]} center style={{ pointerEvents: "none" }}>
                  <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: "bold", fontSize: "14px", background: "#EA580C", color: "#fff", border: "2px solid #fff", padding: "8px 14px", borderRadius: "6px", boxShadow: "0 6px 10px rgba(0,0,0,0.4)" }}>
                    <span>🏗️</span> {rst.name || "Reach Stacker"}
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </Suspense>
    </group>
  );
};

const ParkingArea3D = ({ center, isDark }) => {
  const [hovered, setHovered] = useState(false);
  const stripeTexture = useMemo(() => createWarningStripeTexture(), []);
  const barrierMaterial = useMemo(() => new THREE.MeshStandardMaterial({ map: stripeTexture, roughness: 0.8 }), [stripeTexture]);

  const { shape, bounds, stripeMatrices, crossMatrices, barrierMatrices } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const pts = PARKING_COORDS.map(c => [
      (c[1] - center.lng) * LAT_TO_METERS * lngScale,
      -(c[0] - center.lat) * LAT_TO_METERS
    ]);

    const s = new THREE.Shape();
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

    pts.forEach(([x, z], i) => {
      if (i === 0) s.moveTo(x, z); else s.lineTo(x, z);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    });

    const bMatrices = [];
    const barrierLength = 1.8;
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const dx = p2[0] - p1[0]; const dz = p2[1] - p1[1];
      const dist = Math.hypot(dx, dz);
      const angle = Math.atan2(dz, dx);
      const numBarriers = Math.floor(dist / barrierLength);

      for (let b = 0; b < numBarriers; b++) {
        const bx = p1[0] + (dx / dist) * (b * barrierLength + barrierLength / 2);
        const bz = p1[1] + (dz / dist) * (b * barrierLength + barrierLength / 2);
        bMatrices.push(composeWorldMatrix([bx, 0.5, bz], -angle, [0, 0, 0], [1, 1, 1]));
      }
    }

    const stripeM = [];
    const crossM = [];
    const spotWidth = 2.6;
    const spotLength = 5.0;

    for (let x = minX; x < maxX; x += spotWidth) {
      for (let z = minZ; z < maxZ; z += spotLength * 1.5) {
        const spotCx = x + spotWidth / 2;
        const spotCz = z + spotLength / 2;
        if (isPointInPolygon([spotCx, spotCz], pts)) {
          const parentPos = [spotCx, 0.06, spotCz];
          stripeM.push(composeWorldMatrix(parentPos, 0, [-1.25, 0, 0], [1, 1, 1]));
          crossM.push(composeWorldMatrix(parentPos, 0, [0, 0, -2.5], [1, 1, 1]));
        }
      }
    }

    return { shape: s, bounds: { minX, maxX, minZ, maxZ }, stripeMatrices: stripeM, crossMatrices: crossM, barrierMatrices: bMatrices };
  }, [center, stripeTexture]);

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color={isDark ? "#3F3F46" : "#71717A"} roughness={0.9} />
      </mesh>
      <InstancedStatic geometry={parkingStripeGeo} material={parkingStripeMaterial} matrices={stripeMatrices} />
      <InstancedStatic geometry={parkingCrossGeo} material={parkingStripeMaterial} matrices={crossMatrices} />
      <InstancedStatic geometry={parkingBarrierGeo} material={barrierMaterial} matrices={barrierMatrices} castShadow receiveShadow />
      {hovered && (
        <Html position={[bounds.minX + (bounds.maxX - bounds.minX) / 2, 5, bounds.minZ + (bounds.maxZ - bounds.minZ) / 2]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: "bold", fontSize: "14px", background: "#FACC15", color: "#111827", border: "2px solid #111827", padding: "8px 14px", borderRadius: "6px", boxShadow: "0 6px 10px rgba(0,0,0,0.4)" }}>
            <span>🚗</span> Light Vehicle Parking Area
          </div>
        </Html>
      )}
    </group>
  );
};

const WALL_HEIGHT = 5.2;
const WALL_THICKNESS = 0.6;
const wallFoundationGeo = new THREE.BoxGeometry(1, 0.8, WALL_THICKNESS + 0.2);
const wallSkinGeo = new THREE.BoxGeometry(1, WALL_HEIGHT - 0.8, WALL_THICKNESS);
const wallPillarBodyGeo = new THREE.BoxGeometry(WALL_THICKNESS + 0.6, WALL_HEIGHT + 0.4, WALL_THICKNESS + 0.6);
const wallPillarCapGeo = new THREE.CylinderGeometry(0, WALL_THICKNESS + 0.5, 0.3, 4);
const wallTrimGeo = new THREE.BoxGeometry(1, 0.2, WALL_THICKNESS + 0.1);
const wallSkinMaterial = new THREE.MeshStandardMaterial({ color: "#E6C280", roughness: 0.8 });

const NEW_GATE_P1 = BOUNDARY_WALL_COORDS[1];
const NEW_GATE_P2 = BOUNDARY_WALL_COORDS[2];
const SIDE_GATE_SEGMENT_INDEX = 1;

// Only a small 2-leaf gate (3 pillars: start, middle divider, end) sits in the middle
// of this wall segment now — the rest of the segment is solid wall on both sides.
const SIDE_GATE_LEAF_WIDTH = 2.6;
const SIDE_GATE_NUM_LEAVES = 2;
const SIDE_GATE_TOTAL_WIDTH = SIDE_GATE_LEAF_WIDTH * SIDE_GATE_NUM_LEAVES;

const sideGatePillarGeo = new THREE.BoxGeometry(0.42, 2.9, 0.42);
const sideGatePillarCapGeo = new THREE.BoxGeometry(0.6, 0.18, 0.6);
const sideGatePillarCapTopGeo = new THREE.ConeGeometry(0.42, 0.35, 4);
const sideGatePanelGeo = new THREE.BoxGeometry(1, 1.35, 0.09);
const sideGateBarGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.15, 6);
const sideGateTopBeamGeo = new THREE.BoxGeometry(1, 0.09, 0.09);
const sideGateBottomBeamGeo = new THREE.BoxGeometry(1, 0.07, 0.07);
const sideGateWheelGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.1, 12);
const sideGateHingeGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);

const sideGatePillarMaterial = new THREE.MeshStandardMaterial({ color: "#EFE7D6", roughness: 0.85, metalness: 0.05 });
const sideGatePillarCapMaterial = new THREE.MeshStandardMaterial({ color: "#D8CDB2", roughness: 0.7 });
const sideGatePanelMaterial = new THREE.MeshStandardMaterial({ color: "#1C7FA0", roughness: 0.5, metalness: 0.3 });
const sideGateBarMaterial = new THREE.MeshStandardMaterial({ color: "#14607E", roughness: 0.4, metalness: 0.6 });
const sideGateWheelMaterial = new THREE.MeshStandardMaterial({ color: "#1F2937", roughness: 0.6, metalness: 0.4 });

const SideGate3D = ({ center, isDark }) => {
  const [hovered, setHovered] = useState(false);

  const { cx, cz, angle, length, leafWidth, numLeaves, dividerIndex } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const p1 = {
      x: (NEW_GATE_P1[1] - center.lng) * LAT_TO_METERS * lngScale,
      z: -(NEW_GATE_P1[0] - center.lat) * LAT_TO_METERS,
    };
    const p2 = {
      x: (NEW_GATE_P2[1] - center.lng) * LAT_TO_METERS * lngScale,
      z: -(NEW_GATE_P2[0] - center.lat) * LAT_TO_METERS,
    };
    const dx = p2.x - p1.x, dz = p2.z - p1.z;
    const ang = Math.atan2(dz, dx);
    // Fixed small gate: exactly SIDE_GATE_NUM_LEAVES (2) leaves, centered on the wall
    // segment's midpoint. This gives exactly 3 pillars (start, middle, end) and 2 leaves
    // (one to the left of the middle pillar, one to the right) — the rest of the wall
    // segment (handled in BoundaryWall3D) stays solid on both sides of this gate.
    const numL = SIDE_GATE_NUM_LEAVES;
    const actualLeafWidth = SIDE_GATE_LEAF_WIDTH;
    return {
      cx: (p1.x + p2.x) / 2,
      cz: (p1.z + p2.z) / 2,
      angle: ang,
      length: actualLeafWidth * numL,
      leafWidth: actualLeafWidth,
      numLeaves: numL,
      dividerIndex: Math.floor(numL / 2),
    };
  }, [center]);

  const { pillarM, capM, capTopM, panelM, barM, beamM, bottomBeamM, wheelM, hingeM } = useMemo(() => {
    const parentPos = [cx, 0, cz];
    const rotY = -angle;
    const pillars = [], caps = [], capTops = [], panels = [], bars = [], beams = [], bottomBeams = [], wheels = [], hinges = [];
    const startX = -length / 2;

    const pillarPositions = [0, dividerIndex, numLeaves];
    pillarPositions.forEach((li) => {
      const px = startX + li * leafWidth;
      pillars.push(composeWorldMatrix(parentPos, rotY, [px, 1.45, 0], [1, 1, 1]));
      caps.push(composeWorldMatrix(parentPos, rotY, [px, 2.99, 0], [1, 1, 1]));
      capTops.push(composeWorldMatrix(parentPos, rotY, [px, 3.25, 0], [1, 1, 1]));
      hinges.push(composeWorldMatrix(parentPos, rotY, [px + 0.22, 1.3, 0], [1, 1, 1]));
      hinges.push(composeWorldMatrix(parentPos, rotY, [px - 0.22, 1.3, 0], [1, 1, 1]));
    });

    for (let i = 0; i < numLeaves; i++) {
      const leafCx = startX + leafWidth * (i + 0.5);
      panels.push(composeWorldMatrix(parentPos, rotY, [leafCx, 0.78, 0], [leafWidth - 0.18, 1, 1]));
      beams.push(composeWorldMatrix(parentPos, rotY, [leafCx, 2.22, 0], [leafWidth - 0.18, 1, 1]));
      bottomBeams.push(composeWorldMatrix(parentPos, rotY, [leafCx, 1.48, 0], [leafWidth - 0.18, 1, 1]));
      const barCount = 6;
      for (let b = 1; b < barCount; b++) {
        const barX = startX + i * leafWidth + (leafWidth / barCount) * b;
        bars.push(composeWorldMatrix(parentPos, rotY, [barX, 1.85, 0], [1, 1, 1]));
      }
      wheels.push(composeWorldMatrix(parentPos, rotY, [leafCx - leafWidth / 2 + 0.18, 0.13, 0], [1, 1, 1]));
      wheels.push(composeWorldMatrix(parentPos, rotY, [leafCx + leafWidth / 2 - 0.18, 0.13, 0], [1, 1, 1]));
    }

    return { pillarM: pillars, capM: caps, capTopM: capTops, panelM: panels, barM: bars, beamM: beams, bottomBeamM: bottomBeams, wheelM: wheels, hingeM: hinges };
  }, [cx, cz, angle, length, leafWidth, numLeaves, dividerIndex]);

  const leftLabelPos = [cx - Math.cos(angle) * length * 0.24, 3.6, cz - Math.sin(angle) * length * 0.24];
  const rightLabelPos = [cx + Math.cos(angle) * length * 0.24, 3.6, cz + Math.sin(angle) * length * 0.24];

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
    >
      <InstancedStatic geometry={sideGatePillarGeo} material={sideGatePillarMaterial} matrices={pillarM} castShadow receiveShadow />
      <InstancedStatic geometry={sideGatePillarCapGeo} material={sideGatePillarCapMaterial} matrices={capM} castShadow />
      <InstancedStatic geometry={sideGatePillarCapTopGeo} material={sideGatePillarCapMaterial} matrices={capTopM} castShadow />
      <InstancedStatic geometry={sideGatePanelGeo} material={sideGatePanelMaterial} matrices={panelM} castShadow receiveShadow />
      <InstancedStatic geometry={sideGateTopBeamGeo} material={sideGateBarMaterial} matrices={beamM} castShadow />
      <InstancedStatic geometry={sideGateBottomBeamGeo} material={sideGateBarMaterial} matrices={bottomBeamM} castShadow />
      <InstancedStatic geometry={sideGateBarGeo} material={sideGateBarMaterial} matrices={barM} castShadow />
      <InstancedStatic geometry={sideGateWheelGeo} material={sideGateWheelMaterial} matrices={wheelM} />
      <InstancedStatic geometry={sideGateHingeGeo} material={sideGateWheelMaterial} matrices={hingeM} />

      <Html position={leftLabelPos} center style={{ pointerEvents: "none" }}>
        <div style={{ fontWeight: "bold", fontSize: "11px", color: "#fff", background: "#1C7FA0", padding: "3px 9px", borderRadius: "3px", whiteSpace: "nowrap", border: "1px solid #fff" }}>EXIT</div>
      </Html>
      <Html position={rightLabelPos} center style={{ pointerEvents: "none" }}>
        <div style={{ fontWeight: "bold", fontSize: "11px", color: "#fff", background: "#1C7FA0", padding: "3px 9px", borderRadius: "3px", whiteSpace: "nowrap", border: "1px solid #fff" }}>EXIT</div>
      </Html>

      {hovered && (
        <Html position={[cx, 4.6, cz]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: "bold", fontSize: "14px", background: "#1C7FA0", color: "#fff", border: "2px solid #fff", padding: "8px 14px", borderRadius: "6px", boxShadow: "0 6px 10px rgba(0,0,0,0.4)" }}>
            <span>🚪</span> Side Boundary Gate
          </div>
        </Html>
      )}
    </group>
  );
};


const GuardRoom3D = ({ center, isDark }) => {
  const { scene } = useGLTF("/guardRoom.glb");
  const [hovered, setHovered] = useState(false);

  const lngScale = Math.cos((center.lat * Math.PI) / 180);
  const x = (GUARD_ROOM_COORDS.lng - center.lng) * LAT_TO_METERS * lngScale;
  const z = -(GUARD_ROOM_COORDS.lat - center.lat) * LAT_TO_METERS;

  return (
    <group
      position={[x, 0, z]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
    >
      <Clone
        object={scene}
        scale={[GUARD_ROOM_SCALE, GUARD_ROOM_SCALE, GUARD_ROOM_SCALE]}
        castShadow
        receiveShadow
      />
      {hovered && (
        <Html position={[0, 3, 0]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: "bold", fontSize: "14px", background: "#374151", color: "#fff", border: "2px solid #fff", padding: "8px 14px", borderRadius: "6px", boxShadow: "0 6px 10px rgba(0,0,0,0.4)" }}>
            <span>🛡️</span> Parking ticket Room
          </div>
        </Html>
      )}
    </group>
  );
};


const BoundaryWall3D = ({ center, isDark }) => {
  const segments = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const pts = BOUNDARY_WALL_COORDS.map((coord) => ({
      x: (coord[1] - center.lng) * LAT_TO_METERS * lngScale,
      z: -(coord[0] - center.lat) * LAT_TO_METERS,
    }));

    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i]; const p2 = pts[i + 1];
      const dx = p2.x - p1.x; const dz = p2.z - p1.z;
      const len = Math.hypot(dx, dz);
      const cx = (p1.x + p2.x) / 2; const cz = (p1.z + p2.z) / 2;
      const angle = Math.atan2(dz, dx);
      const isOutGateGap = i === 18;
      const isInGateGap = i === 22;
      const isSideGateGap = i === SIDE_GATE_SEGMENT_INDEX;
      segs.push({ cx, cz, len, angle, p1, p2, isInGateGap, isOutGateGap, isSideGateGap, index: i });
    }
    return segs;
  }, [center]);

  const { foundationMatrices, skinMatrices, trimMatrices, pillarBodyMatrices, pillarCapMatrices } = useMemo(() => {
    const foundation = [], skin = [], trim = [], pillarBody = [], pillarCap = [];
    segments.forEach((seg) => {
      if (seg.isSideGateGap) {
        // Keep this segment mostly solid — only leave a small gap in the middle
        // (SIDE_GATE_TOTAL_WIDTH wide) for the 2-leaf gate that SideGate3D renders there.
        const dirX = seg.len > 0 ? (seg.p2.x - seg.p1.x) / seg.len : 0;
        const dirZ = seg.len > 0 ? (seg.p2.z - seg.p1.z) / seg.len : 0;
        const gateHalf = SIDE_GATE_TOTAL_WIDTH / 2;
        const gateStartX = seg.cx - dirX * gateHalf, gateStartZ = seg.cz - dirZ * gateHalf;
        const gateEndX = seg.cx + dirX * gateHalf, gateEndZ = seg.cz + dirZ * gateHalf;
        const beforeLen = Math.hypot(gateStartX - seg.p1.x, gateStartZ - seg.p1.z);
        const afterLen = Math.hypot(seg.p2.x - gateEndX, seg.p2.z - gateEndZ);
        const beforeCx = (seg.p1.x + gateStartX) / 2, beforeCz = (seg.p1.z + gateStartZ) / 2;
        const afterCx = (gateEndX + seg.p2.x) / 2, afterCz = (gateEndZ + seg.p2.z) / 2;
        const rotY = -seg.angle;

        if (beforeLen > 0.05) {
          foundation.push(composeWorldMatrix([beforeCx, 0, beforeCz], rotY, [0, 0.4, 0], [beforeLen, 1, 1]));
          skin.push(composeWorldMatrix([beforeCx, 0, beforeCz], rotY, [0, 0.8 + (WALL_HEIGHT - 0.8) / 2, 0], [beforeLen, 1, 1]));
          trim.push(composeWorldMatrix([beforeCx, 0, beforeCz], rotY, [0, WALL_HEIGHT + 0.1, 0], [beforeLen + 0.1, 1, 1]));
        }
        if (afterLen > 0.05) {
          foundation.push(composeWorldMatrix([afterCx, 0, afterCz], rotY, [0, 0.4, 0], [afterLen, 1, 1]));
          skin.push(composeWorldMatrix([afterCx, 0, afterCz], rotY, [0, 0.8 + (WALL_HEIGHT - 0.8) / 2, 0], [afterLen, 1, 1]));
          trim.push(composeWorldMatrix([afterCx, 0, afterCz], rotY, [0, WALL_HEIGHT + 0.1, 0], [afterLen + 0.1, 1, 1]));
        }
      } else if (!seg.isInGateGap && !seg.isOutGateGap) {
        const parentPos = [seg.cx, 0, seg.cz];
        const rotY = -seg.angle;
        foundation.push(composeWorldMatrix(parentPos, rotY, [0, 0.4, 0], [seg.len, 1, 1]));
        skin.push(composeWorldMatrix(parentPos, rotY, [0, 0.8 + (WALL_HEIGHT - 0.8) / 2, 0], [seg.len, 1, 1]));
        trim.push(composeWorldMatrix(parentPos, rotY, [0, WALL_HEIGHT + 0.1, 0], [seg.len + 0.1, 1, 1]));
      }
      const pillarPos = [seg.p1.x, 0, seg.p1.z];
      pillarBody.push(composeWorldMatrix(pillarPos, 0, [0, WALL_HEIGHT / 2, 0], [1, 1, 1]));
      pillarCap.push(composeWorldMatrix(pillarPos, 0, [0, WALL_HEIGHT + 0.4 + 0.15, 0], [1, 1, 1]));
    });
    return { foundationMatrices: foundation, skinMatrices: skin, trimMatrices: trim, pillarBodyMatrices: pillarBody, pillarCapMatrices: pillarCap };
  }, [segments]);

  const { foundationMaterial, trimMaterial, pillarMaterial } = useMemo(() => ({
    foundationMaterial: new THREE.MeshStandardMaterial({ color: isDark ? "#374151" : "#9CA3AF", roughness: 0.9 }),
    trimMaterial: new THREE.MeshStandardMaterial({ color: isDark ? "#1F2937" : "#4B5563", roughness: 0.7 }),
    pillarMaterial: new THREE.MeshStandardMaterial({ color: isDark ? "#4B5563" : "#6B7280", roughness: 0.8 }),
  }), [isDark]);

  return (
    <group>
      <InstancedStatic geometry={wallFoundationGeo} material={foundationMaterial} matrices={foundationMatrices} castShadow receiveShadow />
      <InstancedStatic geometry={wallSkinGeo} material={wallSkinMaterial} matrices={skinMatrices} castShadow receiveShadow />
      <InstancedStatic geometry={wallTrimGeo} material={trimMaterial} matrices={trimMatrices} castShadow receiveShadow />
      <InstancedStatic geometry={wallPillarBodyGeo} material={pillarMaterial} matrices={pillarBodyMatrices} castShadow receiveShadow />
      <InstancedStatic geometry={wallPillarCapGeo} material={trimMaterial} matrices={pillarCapMatrices} castShadow />
      <SideGate3D center={center} isDark={isDark} />
    </group>
  );
};

const gateIslandGeo = new THREE.BoxGeometry(2.2, 0.4, 6);
const gateBoothBoxGeo = new THREE.BoxGeometry(1.6, 3.6, 2.8);
const gateBoothTopGeo = new THREE.BoxGeometry(1.8, 0.2, 3);
const gateGlassFrontGeo = new THREE.BoxGeometry(1.4, 1.5, 0.05);
const gateGlassSideGeo = new THREE.BoxGeometry(0.05, 1.5, 2.6);
const gateBarrierBoxGeo = new THREE.BoxGeometry(0.5, 1.2, 0.6);
const gateBarrierBaseGeo = new THREE.BoxGeometry(0.7, 0.2, 0.8);
const gateBarrierLightGeo = new THREE.BoxGeometry(0.1, 0.05, 0.06);
const gateLightPoleCapGeo = new THREE.BoxGeometry(0.15, 0.2, 0.15);
const gateLightPoleCylGeo = new THREE.CylinderGeometry(0.08, 0.08, 1, 8);
const gateRailingBarGeo = new THREE.BoxGeometry(0.1, 0.05, 5.8);
const gateRailingPostGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6);

const gateSkinMaterial = new THREE.MeshStandardMaterial({ color: "#F5D0A9", roughness: 0.9 });
const gateGlassMaterial = new THREE.MeshStandardMaterial({ color: "#38BDF8", transparent: true, opacity: 0.6, metalness: 0.9, roughness: 0.1 });
const gateYellowWarningMaterial = new THREE.MeshStandardMaterial({ color: "#FACC15", metalness: 0.4, roughness: 0.6 });
const gateYellowWarningDefaultMaterial = new THREE.MeshStandardMaterial({ color: "#FACC15" });
const gateBarrierRedMaterial = new THREE.MeshStandardMaterial({ color: "#EF4444", roughness: 0.4 });
const gateBarrierWhiteMaterial = new THREE.MeshStandardMaterial({ color: "#FFFFFF", roughness: 0.4 });
const gateBarrierLightMaterial = new THREE.MeshStandardMaterial({ color: "#EF4444", emissive: "#EF4444", emissiveIntensity: 2 });

const InGate3D = ({ center, isDark }) => {
  const [hovered, setHovered] = useState(false);
  const islandColor = isDark ? "#4B5563" : "#D1D5DB";
  const metalColor = isDark ? "#374151" : "#64748B";
  const islandMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: islandColor, roughness: 0.9 }), [islandColor]);
  const poleMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: metalColor, metalness: 0.8, roughness: 0.3 }), [metalColor]);
  const boothTopMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: metalColor, roughness: 0.6 }), [metalColor]);
  const metalDefaultMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: metalColor }), [metalColor]);
  const roofMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#065F46", roughness: 0.7, metalness: 0.1 }), []);
  const roofAccentMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#047857", roughness: 0.6 }), []);

  const { cx, cz, angle, width, depth } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const points2D = [];
    INGATE_POLYGON.forEach((coord) => {
      const x = (coord[1] - center.lng) * LAT_TO_METERS * lngScale;
      const y = (coord[0] - center.lat) * LAT_TO_METERS;
      points2D.push({ wx: x, wz: -y });
    });

    let centerX = 0, centerZ = 0;
    points2D.forEach((p) => { centerX += p.wx; centerZ += p.wz; });
    centerX /= points2D.length; centerZ /= points2D.length;

    let maxDist = 0; let localAngle = 0;
    for (let i = 0; i < points2D.length; i++) {
      const p1 = points2D[i]; const p2 = points2D[(i + 1) % points2D.length];
      const dx = p2.wx - p1.wx; const dz = p2.wz - p1.wz;
      const dist = Math.hypot(dx, dz);
      if (dist > maxDist) { maxDist = dist; localAngle = Math.atan2(dz, dx); }
    }
    return { cx: centerX, cz: centerZ, angle: localAngle, width: maxDist, depth: 8 };
  }, [center]);

  const roofHeight = 6.5; const numLanes = 4; const numBooths = numLanes + 1;
  const laneSpacing = width / numLanes;
  const polePostGeo = useMemo(() => new THREE.CylinderGeometry(0.2, 0.2, roofHeight, 8), [roofHeight]);
  const armLength = laneSpacing - 1.2;
  const segCount = 8;
  const segLength = armLength / segCount;
  const barrierSegGeo = useMemo(() => new THREE.BoxGeometry(segLength, 0.15, 0.05), [segLength]);

  const matrices = useMemo(() => {
    const parentPos = [cx, 0, cz];
    const rotY = -angle;
    const island = [], pole = [], boothBox = [], boothTop = [], glassFront = [], glassSide = [];
    const barrierBox = [], barrierBase = [], barrierSegRed = [], barrierSegWhite = [], barrierLight = [];
    const lightCyl = [], lightCap = [];

    for (let i = 0; i < numBooths; i++) {
      const offsetX = -width / 2 + i * laneSpacing;
      island.push(composeWorldMatrix(parentPos, rotY, [offsetX, 0.2, 0], [1, 1, 1]));
      pole.push(composeWorldMatrix(parentPos, rotY, [offsetX, roofHeight / 2, -1.5], [1, 1, 1]));
      boothBox.push(composeWorldMatrix(parentPos, rotY, [offsetX, 2.2, 1], [1, 1, 1]));
      boothTop.push(composeWorldMatrix(parentPos, rotY, [offsetX, 4.05, 1], [1, 1, 1]));
      glassFront.push(composeWorldMatrix(parentPos, rotY, [offsetX, 2.5, 2.41], [1, 1, 1]));
      glassSide.push(composeWorldMatrix(parentPos, rotY, [offsetX - 0.81, 2.5, 1], [1, 1, 1]));
      glassSide.push(composeWorldMatrix(parentPos, rotY, [offsetX + 0.81, 2.5, 1], [1, 1, 1]));

      if (i < numLanes) {
        barrierBox.push(composeWorldMatrix(parentPos, rotY, [offsetX + 1.4, 0.9, 2], [1, 1, 1]));
        barrierBase.push(composeWorldMatrix(parentPos, rotY, [offsetX + 1.4, 0.4, 2], [1, 1, 1]));
        for (let s = 0; s < segCount; s++) {
          const segX = offsetX + 1.6 + s * segLength + segLength / 2;
          (s % 2 === 0 ? barrierSegRed : barrierSegWhite).push(composeWorldMatrix(parentPos, rotY, [segX, 1.3, 2], [1, 1, 1]));
        }
        barrierLight.push(composeWorldMatrix(parentPos, rotY, [offsetX + 1.6 + armLength, 1.4, 2], [1, 1, 1]));
      }
      if (i > 0) {
        lightCyl.push(composeWorldMatrix(parentPos, rotY, [offsetX - 1.4, 0.5, 2], [1, 1, 1]));
        lightCap.push(composeWorldMatrix(parentPos, rotY, [offsetX - 1.4, 1.0, 2], [1, 1, 1]));
      }
    }
    return { island, pole, boothBox, boothTop, glassFront, glassSide, barrierBox, barrierBase, barrierSegRed, barrierSegWhite, barrierLight, lightCyl, lightCap };
  }, [cx, cz, angle, width, laneSpacing, numBooths, numLanes, roofHeight, armLength, segLength]);

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
    >
      <group position={[cx, roofHeight, cz]} rotation={[0, -angle, 0]}>
        <mesh castShadow receiveShadow position={[0, 0, 0]} material={roofMaterial}><boxGeometry args={[width + 4, 0.8, depth]} /></mesh>
        <mesh position={[0, 0.2, 0]} material={roofAccentMaterial}><boxGeometry args={[width + 4.2, 1, depth + 0.2]} /></mesh>
      </group>
      <InstancedStatic geometry={gateIslandGeo} material={islandMaterial} matrices={matrices.island} castShadow receiveShadow />
      <InstancedStatic geometry={polePostGeo} material={poleMaterial} matrices={matrices.pole} castShadow />
      <InstancedStatic geometry={gateBoothBoxGeo} material={gateSkinMaterial} matrices={matrices.boothBox} castShadow receiveShadow />
      <InstancedStatic geometry={gateBoothTopGeo} material={boothTopMaterial} matrices={matrices.boothTop} castShadow />
      <InstancedStatic geometry={gateGlassFrontGeo} material={gateGlassMaterial} matrices={matrices.glassFront} castShadow />
      <InstancedStatic geometry={gateGlassSideGeo} material={gateGlassMaterial} matrices={matrices.glassSide} castShadow />
      <InstancedStatic geometry={gateBarrierBoxGeo} material={gateYellowWarningMaterial} matrices={matrices.barrierBox} castShadow />
      <InstancedStatic geometry={gateBarrierBaseGeo} material={metalDefaultMaterial} matrices={matrices.barrierBase} castShadow />
      <InstancedStatic geometry={barrierSegGeo} material={gateBarrierRedMaterial} matrices={matrices.barrierSegRed} castShadow />
      <InstancedStatic geometry={barrierSegGeo} material={gateBarrierWhiteMaterial} matrices={matrices.barrierSegWhite} castShadow />
      <InstancedStatic geometry={gateBarrierLightGeo} material={gateBarrierLightMaterial} matrices={matrices.barrierLight} />
      <InstancedStatic geometry={gateLightPoleCylGeo} material={gateYellowWarningDefaultMaterial} matrices={matrices.lightCyl} castShadow />
      <InstancedStatic geometry={gateLightPoleCapGeo} material={metalDefaultMaterial} matrices={matrices.lightCap} />
      {hovered && (
        <Html position={[cx, roofHeight + 3, cz]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: "bold", fontSize: "14px", background: "#065F46", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", boxShadow: "0 6px 10px rgba(0,0,0,0.4)" }}>
            <span>🚦</span> Main Terminal In-Gate
          </div>
        </Html>
      )}
    </group>
  );
};

function createChainLinkTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(156,163,175,0.55)";
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "rgba(75,85,99,0.9)";
  ctx.lineWidth = 2.4;
  for (let i = -128; i < 256; i += 16) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 128, 128); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 128); ctx.lineTo(i + 128, 0); ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
function createGreenLatticeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(6,95,70,0.6)";
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "rgba(4,120,87,0.95)";
  ctx.lineWidth = 2.4;
  for (let i = -128; i < 256; i += 16) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 128, 128); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 128); ctx.lineTo(i + 128, 0); ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

const meshGatePillarGeo = new THREE.BoxGeometry(0.36, 3.4, 0.36);
const meshGatePillarCapGeo = new THREE.BoxGeometry(0.46, 0.14, 0.46);
const meshGateBoomCabinetGeo = new THREE.BoxGeometry(0.72, 1.37, 0.59);
const meshGateBoomArmGeo = new THREE.BoxGeometry(3.1, 0.17, 0.08);
const meshGateBoomPivotGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.65, 12);

const GATE_HEIGHT = 2.6;
const PILLAR_HEIGHT = 3.8;
const NUM_GATE_LEAVES = 4;
const OPEN_LEAF_COUNT = 0;
const GATE_OPEN_ANGLE = (100 * Math.PI) / 180;

const TerminalMeshGate3D = ({ center, isDark, label = "Terminal Out-Gate" }) => {
  const [hovered, setHovered] = useState(false);
  const meshTexture = useMemo(() => createChainLinkTexture(), []);

  const { cx, cz, angle, width } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const points2D = [];
    OUTGATE_POLYGON.forEach((coord) => {
      const x = (coord[1] - center.lng) * LAT_TO_METERS * lngScale;
      const y = (coord[0] - center.lat) * LAT_TO_METERS;
      points2D.push({ wx: x, wz: -y });
    });

    let centerX = 0, centerZ = 0;
    points2D.forEach((p) => { centerX += p.wx; centerZ += p.wz; });
    centerX /= points2D.length; centerZ /= points2D.length;

    let maxDist = 0; let localAngle = 0;
    for (let i = 0; i < points2D.length; i++) {
      const p1 = points2D[i]; const p2 = points2D[(i + 1) % points2D.length];
      const dx = p2.wx - p1.wx; const dz = p2.wz - p1.wz;
      const dist = Math.hypot(dx, dz);
      if (dist > maxDist) { maxDist = dist; localAngle = Math.atan2(dz, dx); }
    }
    return { cx: centerX, cz: centerZ, angle: localAngle, width: maxDist };
  }, [center]);

  const leafWidth = width / NUM_GATE_LEAVES;
  const LEAF_GAP = 0.4;
  const leafFrameGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(leafWidth - LEAF_GAP, GATE_HEIGHT - 0.1, 0.08);
    g.translate(leafWidth / 2, (GATE_HEIGHT - 0.1) / 2 + 0.05, 0);
    return g;
  }, [leafWidth]);
  const leafMeshGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(leafWidth - LEAF_GAP - 0.14, GATE_HEIGHT - 0.34);
    g.translate(leafWidth / 2, (GATE_HEIGHT - 0.1) / 2 + 0.05, 0.001);
    return g;
  }, [leafWidth]);
  const leafTopBarGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(leafWidth - LEAF_GAP, 0.06, 0.1);
    g.translate(leafWidth / 2, GATE_HEIGHT - 0.05, 0);
    return g;
  }, [leafWidth]);
  const leafBottomBarGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(leafWidth - LEAF_GAP, 0.06, 0.1);
    g.translate(leafWidth / 2, 0.05, 0);
    return g;
  }, [leafWidth]);

  const { pillarM, pillarCapM, leafM, boomMatrix } = useMemo(() => {
    const parentPos = [cx, 0, cz];
    const rotY = -angle;
    const startX = -width / 2;

    const pillars = [], pillarCaps = [], leaves = [];

    for (let i = 0; i <= NUM_GATE_LEAVES; i++) {
      const px = startX + i * leafWidth;
      pillars.push(composeWorldMatrix(parentPos, rotY, [px, PILLAR_HEIGHT / 2, 0], [1, 1, 1]));
      pillarCaps.push(composeWorldMatrix(parentPos, rotY, [px, PILLAR_HEIGHT + 0.07, 0], [1, 1, 1]));
    }
    for (let i = 0; i < NUM_GATE_LEAVES; i++) {
      const hingeX = startX + i * leafWidth;
      const isOpen = i === 2;
      leaves.push(composeWorldMatrix(parentPos, rotY, [hingeX, 0, 0], [1, 1, 1], [0, isOpen ? GATE_OPEN_ANGLE : 0, 0]));
    }

    // BOOM_RIGHT_SHIFT: shifts the out-gate boom barrier further right along the gate
    // (increase/decrease this value to fine-tune the exact position).
    const BOOM_RIGHT_SHIFT = 18.2;
    const boomX = startX + OPEN_LEAF_COUNT * leafWidth + BOOM_RIGHT_SHIFT;
    const boom = composeWorldMatrix(parentPos, rotY, [boomX, 0, 3.4], [3, 1, 1]);

    return { pillarM: pillars, pillarCapM: pillarCaps, leafM: leaves, boomMatrix: boom };
  }, [cx, cz, angle, width, leafWidth]);

  const pillarMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#6B7280", roughness: 0.6, metalness: 0.4 }), []);
  const pillarCapMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#4B5563", roughness: 0.6, metalness: 0.4 }), []);
  const leafFrameMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#6B7280", roughness: 0.6, metalness: 0.4 }), []);
  const leafMeshMaterial = useMemo(() => new THREE.MeshBasicMaterial({ map: meshTexture, color: "#D1D5DB", transparent: true, opacity: 0.95, side: THREE.DoubleSide }), [meshTexture]);
  const boomCabinetMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#F97316", roughness: 0.4, metalness: 0.2 }), []);
  const boomPivotMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#374151", roughness: 0.6, metalness: 0.8 }), []);
  const boomStripeTexture = useMemo(() => createRedWhiteStripeTexture(), []);
  const boomArmMaterial = useMemo(() => new THREE.MeshStandardMaterial({ map: boomStripeTexture, roughness: 0.7 }), [boomStripeTexture]);
  const greenLatticeTexture = useMemo(() => createGreenLatticeTexture(), []);
  const roofMaterial = useMemo(() => new THREE.MeshBasicMaterial({ map: greenLatticeTexture, color: "#10B981", transparent: true, opacity: 0.95, side: THREE.DoubleSide }), [greenLatticeTexture]);
  const roofAccentMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#047857", roughness: 0.6 }), []);
  const roofHeight = GATE_HEIGHT + 1.7;
  const roofDepth = 4;
  const roofZOffset = -1.6;

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
    >
      <group position={[cx, roofHeight, cz]} rotation={[0, -angle, 0]}>
        <mesh castShadow receiveShadow position={[0, 0, roofZOffset]} rotation={[-Math.PI / 2, 0, 0]} material={roofMaterial}><planeGeometry args={[width + 3.6, roofDepth - 0.3]} /></mesh>
        <mesh position={[0, 0.15, roofZOffset]} material={roofAccentMaterial}><boxGeometry args={[width + 4.2, 0.15, roofDepth + 0.2]} /></mesh>
      </group>
      <InstancedStatic geometry={meshGatePillarGeo} material={pillarMaterial} matrices={pillarM} castShadow receiveShadow />
      <InstancedStatic geometry={meshGatePillarCapGeo} material={pillarCapMaterial} matrices={pillarCapM} castShadow />
      <InstancedStatic geometry={leafFrameGeo} material={leafFrameMaterial} matrices={leafM} castShadow receiveShadow />
      <InstancedStatic geometry={leafTopBarGeo} material={leafFrameMaterial} matrices={leafM} castShadow />
      <InstancedStatic geometry={leafBottomBarGeo} material={leafFrameMaterial} matrices={leafM} castShadow />
      <InstancedStatic geometry={leafMeshGeo} material={leafMeshMaterial} matrices={leafM} />

      <group matrix={boomMatrix} matrixAutoUpdate={false}>
        <mesh geometry={meshGateBoomCabinetGeo} material={boomCabinetMaterial} position={[0, 0.72, 0]} castShadow receiveShadow />
        <mesh geometry={meshGateBoomPivotGeo} material={boomPivotMaterial} position={[0, 1.3, 0.4]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow />
        <mesh geometry={meshGateBoomArmGeo} material={boomArmMaterial} position={[1.6, 1.3, 0.4]} castShadow receiveShadow />
      </group>

      {hovered && (
        <Html position={[cx, GATE_HEIGHT + 3, cz]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: "bold", fontSize: "14px", background: "#4B5563", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", boxShadow: "0 6px 10px rgba(0,0,0,0.4)" }}>
            <span>🚧</span> {label}
          </div>
        </Html>
      )}
    </group>
  );
};

const domesticFencePostGeo = new THREE.CylinderGeometry(0.055, 0.065, 2.25, 8);
const domesticFencePostBaseGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.18, 10);
const domesticFenceTopWireGeo = new THREE.CylinderGeometry(0.018, 0.018, 1, 6);
const DOMESTIC_FENCE_HEIGHT = 2.1;
const DOMESTIC_FENCE_POST_SPACING = 3;
const DOMESTIC_FENCE_CELL_SIZE = 0.35;

const DomesticFence3D = ({ center, isDark }) => {
  const { postMatrices, postBaseMatrices, topWireMatrices, bottomWireMatrices, panels } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const pts = DOMESTIC_FENCE_COORDS.map(([lat, lng]) => ({
      x: (lng - center.lng) * LAT_TO_METERS * lngScale,
      z: -(lat - center.lat) * LAT_TO_METERS,
    }));

    const posts = [], postBases = [], topWires = [], bottomWires = [], panelList = [];

    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i]; const p2 = pts[i + 1];
      const dx = p2.x - p1.x; const dz = p2.z - p1.z;
      const segLen = Math.hypot(dx, dz);
      if (segLen < 0.05) continue;
      const angle = Math.atan2(dz, dx);
      const rotY = -angle;

      const numPosts = Math.max(1, Math.round(segLen / DOMESTIC_FENCE_POST_SPACING));
      const postGap = segLen / numPosts;
      for (let p = 0; p <= numPosts; p++) {
        if (p === numPosts && i < pts.length - 2) continue;
        const px = p1.x + (dx / segLen) * p * postGap;
        const pz = p1.z + (dz / segLen) * p * postGap;
        posts.push(composeWorldMatrix([px, DOMESTIC_FENCE_HEIGHT / 2, pz], 0, [0, 0, 0], [1, 1, 1]));
        postBases.push(composeWorldMatrix([px, 0.09, pz], 0, [0, 0, 0], [1, 1, 1]));
      }

      const midX = (p1.x + p2.x) / 2; const midZ = (p1.z + p2.z) / 2;
      topWires.push(composeWorldMatrix([midX, DOMESTIC_FENCE_HEIGHT - 0.06, midZ], rotY, [0, 0, 0], [1, segLen, 1], [0, 0, Math.PI / 2]));
      bottomWires.push(composeWorldMatrix([midX, 0.1, midZ], rotY, [0, 0, 0], [1, segLen, 1], [0, 0, Math.PI / 2]));

      const cellsX = Math.max(1, Math.round(segLen / DOMESTIC_FENCE_CELL_SIZE));
      const cellsY = Math.max(1, Math.round((DOMESTIC_FENCE_HEIGHT - 0.3) / DOMESTIC_FENCE_CELL_SIZE));
      const segTexture = createChainLinkTexture();
      segTexture.repeat.set(cellsX, cellsY);

      panelList.push({
        geo: new THREE.PlaneGeometry(segLen, DOMESTIC_FENCE_HEIGHT - 0.3),
        cx: midX, cz: midZ, rotY, texture: segTexture,
      });
    }

    return { postMatrices: posts, postBaseMatrices: postBases, topWireMatrices: topWires, bottomWireMatrices: bottomWires, panels: panelList };
  }, [center]);

  const postMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#374151", roughness: 0.5, metalness: 0.6 }), []);
  const postBaseMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#78716C", roughness: 0.95 }), []);

  return (
    <group>
      <InstancedStatic geometry={domesticFencePostGeo} material={postMaterial} matrices={postMatrices} castShadow receiveShadow />
      <InstancedStatic geometry={domesticFencePostBaseGeo} material={postBaseMaterial} matrices={postBaseMatrices} castShadow receiveShadow />
      <InstancedStatic geometry={domesticFenceTopWireGeo} material={postMaterial} matrices={topWireMatrices} />
      <InstancedStatic geometry={domesticFenceTopWireGeo} material={postMaterial} matrices={bottomWireMatrices} />
      {panels.map((p, i) => (
        <mesh key={i} geometry={p.geo} position={[p.cx, DOMESTIC_FENCE_HEIGHT / 2, p.cz]} rotation={[0, p.rotY, 0]}>
          <meshBasicMaterial map={p.texture} color="#16A34A" transparent opacity={0.72} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

const geo40ft = new THREE.BoxGeometry(12.2, 2.6, 2.4);
const geo20ft = new THREE.BoxGeometry(6.1, 2.6, 2.4);
const containerVisualCache = new Map();
function getContainerVisual(color, isDark) {
  const key = `${color}|${isDark}`;
  let entry = containerVisualCache.get(key);
  if (!entry) {
    const texture = createContainerTexture(color, isDark);
    const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5, metalness: 0.3, color: new THREE.Color(color) });
    entry = { texture, material };
    containerVisualCache.set(key, entry);
  }
  return entry;
}

const _instMatrix = new THREE.Matrix4();
const _instColor = new THREE.Color();
// Reusable Object3D used to build per-instance matrices that include a non-uniform
// scale (needed so 40ft containers can be stretched/shrunk to exactly fit their
// real slot span instead of always rendering at a fixed 12.2m length).
const _instObj = new THREE.Object3D();
const CONTAINER_HOVER_BRIGHTEN = 1.35;

const InstancedContainerGroup = ({ items, geometry, material, onClick }) => {
  const meshRef = useRef(null);
  const hoverIdRef = useRef(-1);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    items.forEach((c, i) => {
      _instObj.position.set(c.x, c.y, c.z);
      _instObj.rotation.set(0, -c.angle, 0);
      _instObj.scale.set(c.lenScale || 1, 1, 1);
      _instObj.updateMatrix();
      mesh.setMatrixAt(i, _instObj.matrix);
      mesh.setColorAt(i, _instColor.setRGB(1, 1, 1));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    hoverIdRef.current = -1;
  }, [items]);

  const paintInstance = useCallback((id, rgb) => {
    const mesh = meshRef.current;
    if (!mesh || id < 0 || !mesh.instanceColor) return;
    mesh.setColorAt(id, _instColor.setRGB(rgb, rgb, rgb));
    mesh.instanceColor.needsUpdate = true;
  }, []);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, items.length]}
      receiveShadow
      castShadow
      onPointerMove={(e) => {
        e.stopPropagation();
        const id = e.instanceId;
        if (id === undefined || id === hoverIdRef.current) return;
        if (hoverIdRef.current >= 0) paintInstance(hoverIdRef.current, 1);
        paintInstance(id, CONTAINER_HOVER_BRIGHTEN);
        hoverIdRef.current = id;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (hoverIdRef.current >= 0) paintInstance(hoverIdRef.current, 1);
        hoverIdRef.current = -1;
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.instanceId === undefined) return;
        onClick(items[e.instanceId]);
      }}
    />
  );
};

const InstancedContainers = ({ containers, isDark, onClick }) => {
  const groups = useMemo(() => {
    const map = new Map();
    containers.forEach((c) => {
      const color = getContainerColor(c);
      const key = `${c.is40 ? 40 : 20}|${color}`;
      if (!map.has(key)) map.set(key, { is40: c.is40, color, items: [] });
      map.get(key).items.push(c);
    });
    return Array.from(map.entries());
  }, [containers]);

  return (
    <>
      {groups.map(([key, group]) => {
        const { material } = getContainerVisual(group.color, isDark);
        const geometry = group.is40 ? geo40ft : geo20ft;
        return (
          <InstancedContainerGroup
            key={`${key}|${isDark}`}
            items={group.items}
            geometry={geometry}
            material={material}
            onClick={onClick}
          />
        );
      })}
    </>
  );
};

const CraneField3D = ({ cranes, center, isDark }) => {
  const { scene } = useGLTF("/crane.glb");
  const [activeIndex, setActiveIndex] = useState(-1);

  const lngScale = useMemo(() => Math.cos((center.lat * Math.PI) / 180), [center]);
  const displayCranes = cranes.slice(0, 4);

  return (
    <group>
      <Suspense fallback={null}>
        {displayCranes.map((crane, idx) => {
          const x = (crane.lng - center.lng) * LAT_TO_METERS * lngScale;
          const z = -(crane.lat - center.lat) * LAT_TO_METERS;

          const rotationAngle = Math.PI / 2;

          return (
            <group key={`track-crane-${idx}`} position={[x, 0, z]}>
              <Clone
                object={scene}
                scale={[0.002, 0.001, 0.001]}
                rotation={[0, rotationAngle, 0]}
                castShadow
                receiveShadow
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev === idx ? -1 : idx));
                }}
                onPointerMove={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = "auto";
                }}
              />

              {activeIndex === idx && (
                <Html position={[0, 28, 0]} center style={{ pointerEvents: "none" }}>
                  <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: "bold", fontSize: "14px", background: "#1F2937", color: "#fff", border: "2px solid #fff", padding: "8px 14px", borderRadius: "6px", boxShadow: "0 6px 10px rgba(0,0,0,0.4)" }}>
                    <span>🏗️</span> {crane.name || "Track Crane"}
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </Suspense>
    </group>
  );
};

const TRACK_LANES = [
  { label: "A", offset: -6 },
  { label: "B", offset: -2 },
  { label: "C", offset: 2 },
  { label: "D", offset: 6 },
];
const TRACK_GAUGE_HALF = 1.676 / 2;
const TRACK_RAIL_W = 0.15;
const TRACK_POLE_SPACING = 55;
const TRACK_SLEEPER_SPACING = 0.65;
const TRACK_JOIN_OVERLAP = 0.5;

const railwayBallastGeo = new THREE.BoxGeometry(3.2, 0.35, 1);
const railwayRailGeo = new THREE.BoxGeometry(TRACK_RAIL_W, 0.14, 1);
const railwaySleeperGeo = new THREE.BoxGeometry(2.6, 0.16, 0.22);
// Trackside signal pole (stands beside the whole corridor, single head)
const railwaySignalPoleGeo = new THREE.CylinderGeometry(0.06, 0.08, 2.6, 8);
const railwaySignalBoxGeo = new THREE.BoxGeometry(0.42, 0.85, 0.3);
const railwaySignalLightGeo = new THREE.CircleGeometry(0.15, 16);
const railwayPointMachineGeo = new THREE.BoxGeometry(0.5, 0.3, 0.38);
const railwayPointLeverGeo = new THREE.BoxGeometry(0.07, 0.32, 0.07);

const railwaySleeperMaterial = new THREE.MeshStandardMaterial({ color: "#6B4A32", roughness: 0.92 });
const railwaySignalPoleMaterial = new THREE.MeshStandardMaterial({ color: "#52525B", metalness: 0.5, roughness: 0.5 });
const railwaySignalBoxMaterial = new THREE.MeshStandardMaterial({ color: "#111827" });
const railwayGreenMaterial = new THREE.MeshStandardMaterial({ color: "#10B981", emissive: "#10B981", emissiveIntensity: 3 });
const railwayRedMaterial = new THREE.MeshStandardMaterial({ color: "#EF4444", emissive: "#EF4444", emissiveIntensity: 3 });
const railwayPointMachineMaterial = new THREE.MeshStandardMaterial({ color: "#DC2626", roughness: 0.6, metalness: 0.3 });
const railwayPointLeverMaterial = new THREE.MeshStandardMaterial({ color: "#FACC15", metalness: 0.4, roughness: 0.5 });

const RAIL_Y = 0.61;      // rails sit on top of the sleepers
const SLEEPER_Y = 0.43;
const BALLAST_Y = 0.175;
const SIGNAL_SIDE_X = TRACK_LANES[TRACK_LANES.length - 1].offset + 2.3;
const POINT_SIDE_X = TRACK_LANES[0].offset - 2.0;

const Railway3D = ({ center, isDark }) => {
  const {
    ballastMatrices, railMatrices, sleeperMatrices,
    signalPoleMatrices, signalBoxMatrices,
    greenLightMatrices, redLightMatrices,
    pointMachineMatrices, pointLeverMatrices,
    laneLabels,
  } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const pts = TRACK_COORDS.map((c) => ({
      x: (c[1] - center.lng) * LAT_TO_METERS * lngScale, z: -(c[0] - center.lat) * LAT_TO_METERS,
    }));

    const ballast = [], rails = [], sleepers = [];
    const signalPoles = [], signalBoxes = [], greenLights = [], redLights = [];
    const pointMachines = [], pointLevers = [];

    let poleCounter = 0;

    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i]; const p2 = pts[i + 1];
      const rawLen = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      // Overlap each segment slightly at both ends so consecutive segments always fuse together
      // with no visible gap at the bends — the whole line reads as one continuous connected track.
      const len = rawLen + TRACK_JOIN_OVERLAP;
      const cx = (p1.x + p2.x) / 2; const cz = (p1.z + p2.z) / 2;
      const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z);
      const parentPos = [cx, 0.05, cz];

      TRACK_LANES.forEach((lane) => {
        ballast.push(composeWorldMatrix(parentPos, angle, [lane.offset, BALLAST_Y, 0], [1, 1, len]));
        rails.push(composeWorldMatrix(parentPos, angle, [lane.offset - TRACK_GAUGE_HALF, RAIL_Y, 0], [1, 1, len]));
        rails.push(composeWorldMatrix(parentPos, angle, [lane.offset + TRACK_GAUGE_HALF, RAIL_Y, 0], [1, 1, len]));

        // Dense wooden sleepers along this segment for this lane
        const numSleepers = Math.max(1, Math.floor(rawLen / TRACK_SLEEPER_SPACING));
        for (let s = 0; s <= numSleepers; s++) {
          const zOffset = -rawLen / 2 + s * TRACK_SLEEPER_SPACING;
          if (zOffset > rawLen / 2 + 0.01) break;
          sleepers.push(composeWorldMatrix(parentPos, angle, [lane.offset, SLEEPER_Y, zOffset], [1, 1, 1]));
        }
      });

      // One clean trackside signal per pole spacing (single head, beside the whole corridor)
      const numPoles = Math.floor(rawLen / TRACK_POLE_SPACING);
      for (let k = 0; k <= numPoles; k++) {
        const zOffset = -rawLen / 2 + k * TRACK_POLE_SPACING;
        signalPoles.push(composeWorldMatrix(parentPos, angle, [SIGNAL_SIDE_X, 1.3, zOffset], [1, 1, 1]));
        signalBoxes.push(composeWorldMatrix(parentPos, angle, [SIGNAL_SIDE_X, 2.5, zOffset], [1, 1, 1]));
        const lightMatrix = composeWorldMatrix(parentPos, angle, [SIGNAL_SIDE_X, 2.5, zOffset + 0.16], [1, 1, 1]);
        (poleCounter % 2 === 0 ? greenLights : redLights).push(lightMatrix);
        poleCounter++;
      }
    }

    // Point / switch machines at each interior junction (where the corridor changes direction)
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i];
      const prev = pts[i - 1];
      const inAngle = Math.atan2(p.x - prev.x, p.z - prev.z);
      const parentPos = [p.x, 0, p.z];
      pointMachines.push(composeWorldMatrix(parentPos, inAngle, [POINT_SIDE_X, 0.18, 0], [1, 1, 1]));
      pointLevers.push(composeWorldMatrix(parentPos, inAngle, [POINT_SIDE_X, 0.48, 0.05], [1, 1, 1]));
    }

    // Letter label ("A"/"B"/"C"/"D") standing beside the start of each lane
    const p0 = pts[0]; const p1 = pts[1];
    const startAngle = Math.atan2(p1.x - p0.x, p1.z - p0.z);
    const perpX = Math.cos(startAngle), perpZ = -Math.sin(startAngle);
    const labels = TRACK_LANES.map((lane) => ({
      label: lane.label,
      x: p0.x + perpX * lane.offset,
      z: p0.z + perpZ * lane.offset,
    }));

    return {
      ballastMatrices: ballast, railMatrices: rails, sleeperMatrices: sleepers,
      signalPoleMatrices: signalPoles, signalBoxMatrices: signalBoxes,
      greenLightMatrices: greenLights, redLightMatrices: redLights,
      pointMachineMatrices: pointMachines, pointLeverMatrices: pointLevers,
      laneLabels: labels,
    };
  }, [center]);

  const { ballastMaterial, railMaterial } = useMemo(() => ({
    ballastMaterial: new THREE.MeshStandardMaterial({ color: isDark ? "#3F3F46" : "#8B8680", roughness: 0.95 }),
    railMaterial: new THREE.MeshStandardMaterial({ color: isDark ? "#9CA3AF" : "#71717A", metalness: 0.85, roughness: 0.25 }),
  }), [isDark]);

  return (
    <group>
      <InstancedStatic geometry={railwayBallastGeo} material={ballastMaterial} matrices={ballastMatrices} castShadow receiveShadow />
      <InstancedStatic geometry={railwaySleeperGeo} material={railwaySleeperMaterial} matrices={sleeperMatrices} castShadow receiveShadow />
      <InstancedStatic geometry={railwayRailGeo} material={railMaterial} matrices={railMatrices} castShadow receiveShadow />
      <InstancedStatic geometry={railwaySignalPoleGeo} material={railwaySignalPoleMaterial} matrices={signalPoleMatrices} castShadow />
      <InstancedStatic geometry={railwaySignalBoxGeo} material={railwaySignalBoxMaterial} matrices={signalBoxMatrices} castShadow />
      <InstancedStatic geometry={railwaySignalLightGeo} material={railwayGreenMaterial} matrices={greenLightMatrices} />
      <InstancedStatic geometry={railwaySignalLightGeo} material={railwayRedMaterial} matrices={redLightMatrices} />
      <InstancedStatic geometry={railwayPointMachineGeo} material={railwayPointMachineMaterial} matrices={pointMachineMatrices} castShadow receiveShadow />
      <InstancedStatic geometry={railwayPointLeverGeo} material={railwayPointLeverMaterial} matrices={pointLeverMatrices} castShadow />
      {laneLabels.map((l) => (
        <Html key={l.label} position={[l.x, 1.4, l.z]} center style={{ pointerEvents: "none" }}>
          <div style={{ fontWeight: "bold", fontSize: "13px", color: "#fff", background: "#1F2937", border: "2px solid #fff", padding: "3px 10px", borderRadius: "4px", whiteSpace: "nowrap" }}>
            Track {l.label}
          </div>
        </Html>
      ))}
    </group>
  );
};


const shutterFrameGeo = new THREE.BoxGeometry(4, 8, 0.1);
const shutterHandleGeo = new THREE.BoxGeometry(1, 0.5, 0.05);
const shutterHingeGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 12);
const shutterExtraBoxGeo = new THREE.BoxGeometry(2, 5, 0.1);
const shutterFrameMaterial = new THREE.MeshStandardMaterial({ color: "#9CA3AF", roughness: 0.6, metalness: 0.5 });
const shutterHandleMaterial = new THREE.MeshStandardMaterial({ color: "#1F2937" });
const shutterHingeMaterial = new THREE.MeshStandardMaterial({ color: "#EAB308", roughness: 0.4 });
const shutterExtraBoxMaterial = new THREE.MeshStandardMaterial({ color: "#4B5563", roughness: 0.8 });

const Warehouse3D = ({ data, center, isDark }) => {
  const [hovered, setHovered] = useState(false);
  const [hoveredGateIndex, setHoveredGateIndex] = useState(null);

  // 1. Polygon shape and wall segments calculation
  const { shape, wallSegments } = useMemo(() => {
    const s = new THREE.Shape();
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const points2D = [];

    data.polygon.forEach((coord, i) => {
      const [lat, lng] = coord;
      const x = (lng - center.lng) * LAT_TO_METERS * lngScale;
      const y = (lat - center.lat) * LAT_TO_METERS;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
      points2D.push({ wx: x, wz: -y });
    });

    let cx = 0, cz = 0;
    points2D.forEach((p) => { cx += p.wx; cz += p.wz; });
    cx /= points2D.length;
    cz /= points2D.length;

    const segments = [];
    for (let i = 0; i < points2D.length - 1; i++) {
      const p1 = points2D[i];
      const p2 = points2D[i + 1];
      const dx = p2.wx - p1.wx;
      const dz = p2.wz - p1.wz;
      const len = Math.sqrt(dx * dx + dz * dz);
      const midX = (p1.wx + p2.wx) / 2;
      const midZ = (p1.wz + p2.wz) / 2;
      let nx = dz / len, nz = -dx / len;
      if (nx * (midX - cx) + nz * (midZ - cz) < 0) { nx = -nx; nz = -nz; }
      segments.push({ p1, p2, midX, midZ, nx, nz, len });
    }
    return { shape: s, wallSegments: segments };
  }, [data, center]);

  // 2. Flexible Gate Configuration & Generation for ANY Direction/Side
  const { frameM, handleM, hingeM, gateMeta } = useMemo(() => {
    if (!wallSegments || wallSegments.length === 0) {
      return { frameM: [], handleM: [], hingeM: [], gateMeta: [] };
    }

    // Classify wall segments by direction (Left, Right, Top, Bottom)
    let leftSeg = wallSegments[0];
    let rightSeg = wallSegments[0];
    let topSeg = wallSegments[0];
    let bottomSeg = wallSegments[0];

    wallSegments.forEach((seg) => {
      if (seg.midX < leftSeg.midX) leftSeg = seg;
      if (seg.midX > rightSeg.midX) rightSeg = seg;
      if (seg.midZ < topSeg.midZ) topSeg = seg;
      if (seg.midZ > bottomSeg.midZ) bottomSeg = seg;
    });

    const whIdStr = String(data.id || "").toLowerCase();
    const isWH1 = whIdStr.includes('1') || whIdStr === 'warehouse 1';
    const isWH2 = whIdStr.includes('2') || whIdStr === 'warehouse 2';
    const isWH3 = whIdStr.includes('3') || whIdStr === 'warehouse 3';
    const isWH4 = whIdStr.includes('4') || whIdStr === 'warehouse 4';

    const depthOffset = 0.15;
    const frame = [], handle = [], hinge = [], meta = [];

    // Helper function to add gates on any segment with custom positions (t: 0 to 1)
    const addGatesAlongSegment = (seg, count, sideName, customT = null) => {
      if (!seg || count === 0) return;
      const rotationY = Math.atan2(seg.nx, seg.nz);

      for (let i = 0; i < count; i++) {
        const t = customT ? customT[i] : (i + 0.5) / count;
        const x = seg.p1.wx + t * (seg.p2.wx - seg.p1.wx);
        const z = seg.p1.wz + t * (seg.p2.wz - seg.p1.wz);
        const parentPos = [x + seg.nx * depthOffset, 0, z + seg.nz * depthOffset];

        frame.push(composeWorldMatrix(parentPos, rotationY, [0, 4, 0], [1, 1, 1]));
        handle.push(composeWorldMatrix(parentPos, rotationY, [-1, 5.5, 0.06], [1, 1, 1]));
        handle.push(composeWorldMatrix(parentPos, rotationY, [1, 5.5, 0.06], [1, 1, 1]));
        hinge.push(composeWorldMatrix(parentPos, rotationY, [-2.5, 0.75, 0.5], [1, 1, 1]));
        hinge.push(composeWorldMatrix(parentPos, rotationY, [2.5, 0.75, 0.5], [1, 1, 1]));

        meta.push({
          id: `${sideName} Gate ${i + 1}`,
          position: [parentPos[0], 5, parentPos[2]]
        });
      }
    };

    // ==========================================
    // 💡 APNI MARZI SE YAHAN GATE CONFIG SET KAREIN:
    // ==========================================
    if (isWH1) {
      addGatesAlongSegment(leftSeg, 25, 'Left');
      addGatesAlongSegment(rightSeg, 13, 'Right');
    }
    else if (isWH2) {
      addGatesAlongSegment(leftSeg, 8, 'Left');
      addGatesAlongSegment(rightSeg, 15, 'Right');
    }
    else if (isWH3) {
      addGatesAlongSegment(leftSeg, 4, 'Left');
    }
    else if (isWH4) {
      // Warehouse 4: Top side ke opposite/right portion par 4 gates
      // Aap t values change karke position aur direction adjust kar sakte hain (0.0 se 1.0)
      addGatesAlongSegment(topSeg, 4, 'Top-Left', [0.55, 0.65, 0.75, 0.85]);
    }
    else {
      addGatesAlongSegment(leftSeg, 4, 'Right');
    }

    return { frameM: frame, handleM: handle, hingeM: hinge, gateMeta: meta };
  }, [wallSegments, data.id]);

  return (
    <group>
      {/* Warehouse Base Mesh */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
      >
        <extrudeGeometry args={[shape, { depth: 10, bevelEnabled: false }]} />
        <meshStandardMaterial attach="material-0" color={hovered ? (isDark ? "#94A3B8" : "#E2E8F0") : isDark ? "#475569" : "#94A3B8"} roughness={0.7} metalness={0.3} />
        <meshStandardMaterial attach="material-1" color={hovered ? (isDark ? "#94A3B8" : "#E2E8F0") : isDark ? "#64748B" : "#F1F5F9"} roughness={0.9} />
      </mesh>

      {/* Shutter Gates with Instance Hover Support */}
      <InstancedStatic
        geometry={shutterFrameGeo}
        material={shutterFrameMaterial}
        matrices={frameM}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) setHoveredGateIndex(e.instanceId);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredGateIndex(null);
          document.body.style.cursor = "auto";
        }}
      />
      <InstancedStatic geometry={shutterHandleGeo} material={shutterHandleMaterial} matrices={handleM} />
      <InstancedStatic geometry={shutterHingeGeo} material={shutterHingeMaterial} matrices={hingeM} castShadow />

      {/* Warehouse ID Tooltip */}
      {hovered && hoveredGateIndex === null && (
        <Html position={[0, 15, 0]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`}>{data.id}</div>
        </Html>
      )}

      {/* Gate Number Tooltip on Hover */}
      {hoveredGateIndex !== null && gateMeta[hoveredGateIndex] && (
        <Html position={gateMeta[hoveredGateIndex].position} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`}>
            {gateMeta[hoveredGateIndex].id}
          </div>
        </Html>
      )}
    </group>
  );
};

const officeBandGeo = new THREE.BoxGeometry(1, 0.4, 0.2);
const officeWindowFrameGeo = new THREE.BoxGeometry(2, 2.5, 0.1);
const officeWindowGlassGeo = new THREE.BoxGeometry(1.8, 2.3, 0.05);
const officeGateBoxGeo = new THREE.BoxGeometry(6, 4, 0.2);
const officeGateDoorGeo = new THREE.BoxGeometry(2.5, 3.5, 0.1);
const officeGateLintelGeo = new THREE.BoxGeometry(7, 0.4, 3);
const officeWindowGlassMaterial = new THREE.MeshStandardMaterial({ color: "#FFFFFF", metalness: 0.9, roughness: 0.1, emissive: "#FFFFFF", emissiveIntensity: 0.2 });
const officeGateDoorMaterial = new THREE.MeshStandardMaterial({ color: "#334155" });

const NetworkTower = ({ cx, cz }) => (
  <group position={[cx, 16, cz]}>
    <mesh position={[0, 3, 0]} castShadow><cylinderGeometry args={[0.6, 1.2, 6, 8]} /><meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.3} /></mesh>
    <mesh position={[0, 8.5, 0]} castShadow><cylinderGeometry args={[0.1, 0.1, 5, 8]} /><meshStandardMaterial color="#94A3B8" metalness={0.9} /></mesh>
    <mesh position={[0.7, 4.5, 0]} rotation={[0, 0, Math.PI / 3]}><sphereGeometry args={[0.8, 16, 16, 0, Math.PI]} /><meshStandardMaterial color="#F8FAFC" roughness={0.1} /></mesh>
    <mesh position={[0, 11, 0]}><sphereGeometry args={[0.2, 16, 16]} /><meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={3} /></mesh>
  </group>
);

const HeadOffice3D = ({ center, isDark }) => {
  const [hovered, setHovered] = useState(false);
  const BUILDING_HEIGHT = 16;
  const { shape, wallSegments, cx, cz } = useMemo(() => {
    const s = new THREE.Shape();
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const points2D = [];
    HEAD_OFFICE_POLYGON.forEach((coord, i) => {
      const [lat, lng] = coord;
      const x = (lng - center.lng) * LAT_TO_METERS * lngScale;
      const y = (lat - center.lat) * LAT_TO_METERS;
      if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
      points2D.push({ wx: x, wz: -y });
    });
    let centerX = 0, centerZ = 0;
    points2D.forEach((p) => { centerX += p.wx; centerZ += p.wz; });
    centerX /= points2D.length; centerZ /= points2D.length;
    const segments = [];
    for (let i = 0; i < points2D.length - 1; i++) {
      const p1 = points2D[i]; const p2 = points2D[i + 1];
      const dx = p2.wx - p1.wx; const dz = p2.wz - p1.wz;
      const len = Math.sqrt(dx * dx + dz * dz);
      const midX = (p1.wx + p2.wx) / 2; const midZ = (p1.wz + p2.wz) / 2;
      let nx = dz / len, nz = -dx / len;
      if (nx * (midX - centerX) + nz * (midZ - centerZ) < 0) { nx = -nx; nz = -nz; }
      segments.push({ midX, midZ, nx, nz, len });
    }
    return { shape: s, wallSegments: segments, cx: centerX, cz: centerZ };
  }, [center]);

  const buildingBaseColor = isDark ? "#334155" : "#E2E8F0";
  const hoverColor = isDark ? "#475569" : "#F8FAFC";
  const frameColor = isDark ? "#1E293B" : "#475569";
  const bandMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: frameColor, metalness: 0.5 }), [frameColor]);
  const windowFrameMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.8 }), [frameColor]);
  const gateFrameMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: frameColor }), [frameColor]);

  const { bandM, windowFrameM, windowGlassM, gateBoxM, gateDoorM, gateLintelM } = useMemo(() => {
    const band = [], windowFrame = [], windowGlass = [], gateBox = [], gateDoor = [], gateLintel = [];
    const depthOffset = 0.15;

    wallSegments.forEach((segment) => {
      const { midX, midZ, nx, nz, len } = segment;
      const rotationY = Math.atan2(nx, nz);
      const parentPos = [midX + nx * depthOffset, 0, midZ + nz * depthOffset];

      [4, 8, 12].forEach((y) => {
        band.push(composeWorldMatrix(parentPos, rotationY, [0, y, 0], [len, 1, 1]));
      });

      const windowWidth = 2; const padding = 1;
      const numWindows = Math.floor(len / (windowWidth + padding)) - 1;
      const startX = -(numWindows * (windowWidth + padding)) / 2 + windowWidth / 2;
      for (let i = 0; i < numWindows; i++) {
        const offsetX = startX + i * (windowWidth + padding);
        [2, 6, 10, 14].forEach((h) => {
          windowFrame.push(composeWorldMatrix(parentPos, rotationY, [offsetX, h, 0], [1, 1, 1]));
          windowGlass.push(composeWorldMatrix(parentPos, rotationY, [offsetX, h, 0.06], [1, 1, 1]));
        });
      }

      if (len > 15) {
        gateBox.push(composeWorldMatrix(parentPos, rotationY, [0, 2, 0.1], [1, 1, 1]));
        gateDoor.push(composeWorldMatrix(parentPos, rotationY, [-1.5, 2, 0.2], [1, 1, 1]));
        gateDoor.push(composeWorldMatrix(parentPos, rotationY, [1.5, 2, 0.2], [1, 1, 1]));
        gateLintel.push(composeWorldMatrix(parentPos, rotationY, [0, 4.2, 1.6], [1, 1, 1]));
      }
    });

    return { bandM: band, windowFrameM: windowFrame, windowGlassM: windowGlass, gateBoxM: gateBox, gateDoorM: gateDoor, gateLintelM: gateLintel };
  }, [wallSegments]);

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} castShadow receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
      >
        <extrudeGeometry args={[shape, { depth: BUILDING_HEIGHT, bevelEnabled: false }]} />
        <meshStandardMaterial attach="material-0" color={hovered ? hoverColor : buildingBaseColor} roughness={0.4} metalness={0.2} />
        <meshStandardMaterial attach="material-1" color={hovered ? hoverColor : buildingBaseColor} roughness={0.4} metalness={0.2} />
      </mesh>
      <InstancedStatic geometry={officeBandGeo} material={bandMaterial} matrices={bandM} castShadow />
      <InstancedStatic geometry={officeWindowFrameGeo} material={windowFrameMaterial} matrices={windowFrameM} castShadow />
      <InstancedStatic geometry={officeWindowGlassGeo} material={officeWindowGlassMaterial} matrices={windowGlassM} />
      <InstancedStatic geometry={officeGateBoxGeo} material={gateFrameMaterial} matrices={gateBoxM} castShadow />
      <InstancedStatic geometry={officeGateDoorGeo} material={officeGateDoorMaterial} matrices={gateDoorM} />
      <InstancedStatic geometry={officeGateLintelGeo} material={gateFrameMaterial} matrices={gateLintelM} castShadow />
      {hovered && (
        <Html position={[cx, BUILDING_HEIGHT + 10, cz]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ fontWeight: "bold", fontSize: "14px", background: "#38BDF8", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px" }}>
            Main Head Office
          </div>
        </Html>
      )}
    </group>
  );
};

function createGrayPanelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#A1A1AA"; ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = "#8A8A93"; for (let x = 0; x < 512; x += 16) ctx.fillRect(x, 0, 3, 512);
  ctx.fillStyle = "#C4C4CC"; for (let x = 6; x < 512; x += 16) ctx.fillRect(x, 0, 2, 512);
  ctx.fillStyle = "#6B6B74"; for (let y = 0; y < 512; y += 128) ctx.fillRect(0, y, 512, 2);
  ctx.globalAlpha = 0.08; ctx.fillStyle = "#3F3F46";
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * 512;
    ctx.fillRect(x, 0, 1.5, 512);
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

const GrayBuildingWallDetails = ({ segment, isDark, isEntranceWall }) => {
  const { midX, midZ, nx, nz, len } = segment;
  const rotationY = Math.atan2(nx, nz);
  const yRotation = [0, rotationY, 0];
  const depthOffset = 0.13;
  const pos = [midX + nx * depthOffset, 0, midZ + nz * depthOffset];

  const glassColor = "#CBD5E1";
  const frameColor = isDark ? "#27272A" : "#3F3F46";
  const trimColor = isDark ? "#71717A" : "#52525B";

  const windows = useMemo(() => {
    const items = [];
    const windowWidth = 1.5; const padding = 1.1;
    const numWindows = Math.max(0, Math.floor(len / (windowWidth + padding)) - 1);
    const startX = -(numWindows * (windowWidth + padding)) / 2 + windowWidth / 2;
    for (let i = 0; i < numWindows; i++) {
      const offsetX = startX + i * (windowWidth + padding);
      [2.6, 5.6].forEach((h) => {
        items.push(
          <group key={`gb-win-${i}-${h}`} position={[offsetX, h, 0]}>
            <mesh castShadow><boxGeometry args={[windowWidth, 1.5, 0.12]} /><meshStandardMaterial color={frameColor} roughness={0.6} metalness={0.2} /></mesh>
            <mesh position={[0, 0, 0.07]}><boxGeometry args={[windowWidth - 0.18, 1.3, 0.04]} /><meshStandardMaterial color={glassColor} metalness={0.6} roughness={0.1} transparent opacity={0.7} /></mesh>
            <mesh position={[0, 0, 0.09]}><boxGeometry args={[windowWidth - 0.2, 0.06, 0.02]} /><meshStandardMaterial color={frameColor} /></mesh>
          </group>
        );
      });
    }
    return items;
  }, [len, frameColor]);

  return (
    <group position={pos} rotation={yRotation}>
      <mesh position={[0, 2.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, 0.2, 0.18]} />
        <meshStandardMaterial color={trimColor} roughness={0.6} metalness={0.2} />
      </mesh>
      {windows}
      {isEntranceWall && (
        <group position={[0, 0, 0.05]}>
          <group position={[-len * 0.22, 1.5, 0]}>
            <mesh castShadow><boxGeometry args={[3.4, 3, 0.15]} /><meshStandardMaterial color={frameColor} metalness={0.4} roughness={0.5} /></mesh>
            {[...Array(6)].map((_, i) => (
              <mesh key={i} position={[0, -1.35 + i * 0.5, 0.09]}><boxGeometry args={[3.2, 0.42, 0.03]} /><meshStandardMaterial color={i % 2 === 0 ? "#D4D4D8" : "#A1A1AA"} metalness={0.5} roughness={0.4} /></mesh>
            ))}
          </group>
          <group position={[len * 0.18, 1.5, 0]}>
            <mesh castShadow><boxGeometry args={[1.8, 3, 0.12]} /><meshStandardMaterial color={frameColor} /></mesh>
            <mesh position={[0, 0, 0.06]}><boxGeometry args={[1.5, 2.7, 0.04]} /><meshStandardMaterial color={glassColor} transparent opacity={0.55} metalness={0.7} roughness={0.1} /></mesh>
            <mesh position={[0, 1.65, 0.5]} castShadow><boxGeometry args={[2.6, 0.12, 1]} /><meshStandardMaterial color={trimColor} metalness={0.4} roughness={0.5} /></mesh>
            <mesh position={[-1, 1.05, 0.5]}><cylinderGeometry args={[0.05, 0.05, 1.2, 6]} /><meshStandardMaterial color={trimColor} metalness={0.6} /></mesh>
            <mesh position={[1, 1.05, 0.5]}><cylinderGeometry args={[0.05, 0.05, 1.2, 6]} /><meshStandardMaterial color={trimColor} metalness={0.6} /></mesh>
          </group>
        </group>
      )}
    </group>
  );
};

const GrayBuilding3D = ({ polygon, center, isDark, label }) => {
  const [hovered, setHovered] = useState(false);
  const BUILDING_HEIGHT = 8.5;
  const panelTexture = useMemo(() => createGrayPanelTexture(), []);

  const { shape, wallSegments, cx, cz, entranceIdx } = useMemo(() => {
    const s = new THREE.Shape();
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const points2D = [];
    polygon.forEach((coord, i) => {
      const [lat, lng] = coord;
      const x = (lng - center.lng) * LAT_TO_METERS * lngScale;
      const y = (lat - center.lat) * LAT_TO_METERS;
      if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
      points2D.push({ wx: x, wz: -y });
    });
    let centerX = 0, centerZ = 0;
    points2D.forEach((p) => { centerX += p.wx; centerZ += p.wz; });
    centerX /= points2D.length; centerZ /= points2D.length;
    const segments = [];
    let longestIdx = 0, longestLen = 0;
    for (let i = 0; i < points2D.length - 1; i++) {
      const p1 = points2D[i]; const p2 = points2D[i + 1];
      const dx = p2.wx - p1.wx; const dz = p2.wz - p1.wz;
      const len = Math.sqrt(dx * dx + dz * dz);
      if (len < 0.5) continue;
      const midX = (p1.wx + p2.wx) / 2; const midZ = (p1.wz + p2.wz) / 2;
      let nx = dz / len, nz = -dx / len;
      if (nx * (midX - centerX) + nz * (midZ - centerZ) < 0) { nx = -nx; nz = -nz; }
      segments.push({ midX, midZ, nx, nz, len });
      if (len > longestLen) { longestLen = len; longestIdx = segments.length - 1; }
    }
    return { shape: s, wallSegments: segments, cx: centerX, cz: centerZ, entranceIdx: longestIdx };
  }, [polygon, center]);

  panelTexture.repeat.set(Math.max(1, (wallSegments[0]?.len || 10) / 4), BUILDING_HEIGHT / 4);

  const bodyColorFallback = isDark ? "#52525B" : "#A1A1AA";
  const hoverColor = isDark ? "#71717A" : "#D1D5DB";
  const roofColor = isDark ? "#27272A" : "#3F3F46";
  const plinthColor = isDark ? "#18181B" : "#3F3F46";

  return (
    <group>
      <mesh position={[cx, 0.3, cz]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[shape, { depth: 0.6, bevelEnabled: false }]} />
        <meshStandardMaterial color={plinthColor} roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.6, 0]} castShadow receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
      >
        <extrudeGeometry args={[shape, { depth: BUILDING_HEIGHT, bevelEnabled: false }]} />
        <meshStandardMaterial attach="material-0" map={panelTexture} color={hovered ? hoverColor : "#ffffff"} roughness={0.65} metalness={0.2} />
        <meshStandardMaterial attach="material-1" color={hovered ? hoverColor : bodyColorFallback} roughness={0.7} metalness={0.1} />
      </mesh>
      {wallSegments.map((segment, idx) => {
        const rotationY = Math.atan2(segment.nx, segment.nz);
        return (
          <mesh key={`gb-parapet-${idx}`} position={[segment.midX + segment.nx * 0.12, BUILDING_HEIGHT + 0.75, segment.midZ + segment.nz * 0.12]} rotation={[0, rotationY, 0]} castShadow receiveShadow>
            <boxGeometry args={[segment.len + 0.3, 0.5, 0.2]} />
            <meshStandardMaterial color={roofColor} roughness={0.7} metalness={0.15} />
          </mesh>
        );
      })}
      <mesh position={[cx, BUILDING_HEIGHT + 0.15, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <extrudeGeometry args={[shape, { depth: 0.3, bevelEnabled: false }]} />
        <meshStandardMaterial color={roofColor} roughness={0.85} metalness={0.1} />
      </mesh>
      <group position={[cx - 1.2, BUILDING_HEIGHT + 0.85, cz + 0.8]}>
        <mesh castShadow><boxGeometry args={[1.6, 0.9, 1.2]} /><meshStandardMaterial color={isDark ? "#4B5563" : "#71717A"} roughness={0.6} metalness={0.3} /></mesh>
        <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.35, 0.35, 0.1, 16]} /><meshStandardMaterial color="#27272A" /></mesh>
      </group>
      <group position={[cx + 1.4, BUILDING_HEIGHT + 0.7, cz - 0.6]}>
        <mesh castShadow><boxGeometry args={[1.1, 0.6, 1]} /><meshStandardMaterial color={isDark ? "#4B5563" : "#71717A"} roughness={0.6} metalness={0.3} /></mesh>
      </group>

      {wallSegments.map((segment, idx) => (
        <GrayBuildingWallDetails key={`gb-wall-${idx}`} segment={segment} isDark={isDark} isEntranceWall={idx === entranceIdx} />
      ))}

      <group position={[cx, BUILDING_HEIGHT + 1.55, cz]}>
        <mesh castShadow>
          <boxGeometry args={[Math.min(9, Math.max(5.5, (wallSegments[0]?.len || 8) * 0.55)), 1.3, 0.18]} />
          <meshStandardMaterial color={isDark ? "#18181B" : "#27272A"} roughness={0.5} metalness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.11]}>
          <boxGeometry args={[Math.min(8.6, Math.max(5.1, (wallSegments[0]?.len || 8) * 0.5)), 0.95, 0.03]} />
          <meshStandardMaterial color="#D4D4D8" roughness={0.4} metalness={0.4} />
        </mesh>
      </group>
      <Html position={[cx, BUILDING_HEIGHT + 1.55, cz + 0.15]} center style={{ pointerEvents: "none" }}>
        <div style={{ fontWeight: "bold", fontSize: "13px", color: "#27272A", whiteSpace: "nowrap", letterSpacing: "1.5px" }}>{label}</div>
      </Html>
      {hovered && (
        <Html position={[cx, BUILDING_HEIGHT + 4, cz]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ fontWeight: "bold", fontSize: "14px", background: "#3F3F46", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
};

const WorkshopShed3D = ({ polygon, center, isDark, label }) => {
  const [hovered, setHovered] = useState(false);
  const { cx, cz, angle, width, depth } = useMemo(() => getOrientedFootprint(polygon, center), [polygon, center]);

  const wallHeight = 4.6; const roofPitch = 2.1; const overhang = 0.5; const halfDepth = depth / 2;
  const roofAngle = Math.atan2(roofPitch, halfDepth + overhang);
  const slantLen = Math.hypot(roofPitch, halfDepth + overhang);

  const wallColor = isDark ? "#52525B" : "#A8A8B0";
  const wallColorHover = isDark ? "#71717A" : "#C4C4CC";
  const trimColor = isDark ? "#27272A" : "#3F3F46";
  const roofColor = isDark ? "#3F3F46" : "#71717A";
  const doorColor = "#27272A";

  const gableShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-halfDepth, 0); s.lineTo(halfDepth, 0); s.lineTo(halfDepth, wallHeight); s.lineTo(0, wallHeight + roofPitch); s.lineTo(-halfDepth, wallHeight); s.closePath();
    return s;
  }, [halfDepth, wallHeight, roofPitch]);

  return (
    <group position={[cx, 0, cz]} rotation={[0, -angle, 0]}>
      <group
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
      >
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[width + 0.5, 0.3, depth + 0.5]} />
          <meshStandardMaterial color={trimColor} roughness={0.9} />
        </mesh>
        {[-1, 1].map((sign) => (
          <mesh key={`ws-side-${sign}`} position={[0, 0.3 + wallHeight / 2, sign * (halfDepth + 0.05)]} castShadow receiveShadow>
            <boxGeometry args={[width, wallHeight, 0.15]} />
            <meshStandardMaterial color={hovered ? wallColorHover : wallColor} roughness={0.7} metalness={0.15} />
          </mesh>
        ))}
        {[-1, 1].map((sign) =>
          [1, 2, 3].map((r) => (
            <mesh key={`ws-rib-${sign}-${r}`} position={[0, 0.3 + (wallHeight / 4) * r, sign * (halfDepth + 0.13)]} castShadow>
              <boxGeometry args={[width - 0.2, 0.06, 0.03]} />
              <meshStandardMaterial color={trimColor} roughness={0.6} metalness={0.3} />
            </mesh>
          ))
        )}
        {[-1, 1].map((side) => (
          <mesh key={`ws-gable-${side}`} position={[side * (width / 2), 0.3, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
            <shapeGeometry args={[gableShape]} />
            <meshStandardMaterial color={hovered ? wallColorHover : wallColor} roughness={0.75} metalness={0.1} side={THREE.DoubleSide} />
          </mesh>
        ))}
        {[-1, 1].map((sign) => (
          <mesh key={`ws-roof-${sign}`} position={[0, 0.3 + wallHeight + roofPitch / 2, sign * ((halfDepth + overhang) / 2)]} rotation={[sign * roofAngle, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[width + overhang * 2, 0.18, slantLen]} />
            <meshStandardMaterial color={roofColor} roughness={0.8} metalness={0.15} />
          </mesh>
        ))}
        <mesh position={[0, 0.3 + wallHeight + roofPitch + 0.1, 0]} castShadow>
          <boxGeometry args={[width + overhang * 2 + 0.1, 0.22, 0.4]} />
          <meshStandardMaterial color={trimColor} roughness={0.6} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0.3 + wallHeight + roofPitch + 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.35, 0.6, 10]} />
          <meshStandardMaterial color={trimColor} metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.3 + wallHeight + roofPitch + 0.85, 0]} castShadow>
          <coneGeometry args={[0.42, 0.35, 10]} />
          <meshStandardMaterial color={roofColor} metalness={0.3} roughness={0.6} />
        </mesh>
        <group position={[-(width / 2) + 0.09, 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh castShadow><boxGeometry args={[Math.min(depth * 0.6, 3.2), wallHeight * 0.78, 0.12]} /><meshStandardMaterial color={doorColor} metalness={0.4} roughness={0.5} /></mesh>
          {[...Array(5)].map((_, i) => (
            <mesh key={i} position={[0, -wallHeight * 0.32 + i * (wallHeight * 0.78) / 5, 0.08]}>
              <boxGeometry args={[Math.min(depth * 0.6, 3.2) - 0.15, (wallHeight * 0.78) / 5 - 0.05, 0.03]} />
              <meshStandardMaterial color={i % 2 === 0 ? "#D4D4D8" : "#A1A1AA"} metalness={0.4} roughness={0.4} />
            </mesh>
          ))}
        </group>
        <group position={[width / 2 - 0.09, 0.3, halfDepth * 0.45]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh castShadow><boxGeometry args={[1, wallHeight * 0.55, 0.1]} /><meshStandardMaterial color={doorColor} metalness={0.3} roughness={0.6} /></mesh>
        </group>
        <Html position={[-(width / 2) + 0.2, 0.3 + wallHeight + 0.3, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ fontWeight: "bold", fontSize: "11px", color: isDark ? "#fff" : "#18181B", whiteSpace: "nowrap", letterSpacing: "1px", background: "rgba(212,212,216,0.85)", padding: "2px 6px", borderRadius: "3px" }}>{label}</div>
        </Html>
        {hovered && (
          <Html position={[0, 0.3 + wallHeight + roofPitch + 2, 0]} center style={{ pointerEvents: "none" }}>
            <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ fontWeight: "bold", fontSize: "14px", background: "#52525B", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }}>
              {label}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// === Small garden path/bed with yellow-black flower-pot-sized edging and reddish soil ===
const gardenCurbGeo = new THREE.BoxGeometry(1, 0.22, 0.28);
const gardenCurbYellowMaterial = new THREE.MeshStandardMaterial({ color: "#FACC15", roughness: 0.6 });
const gardenCurbBlackMaterial = new THREE.MeshStandardMaterial({ color: "#111827", roughness: 0.6 });

const GardenBed3D = ({ center, isDark }) => {
  const { shape, yellowMatrices, blackMatrices } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const pts = GARDEN_PATH_COORDS.map((c) => [
      (c[1] - center.lng) * LAT_TO_METERS * lngScale,
      -(c[0] - center.lat) * LAT_TO_METERS,
    ]);

    const s = new THREE.Shape();
    pts.forEach(([x, z], i) => { if (i === 0) s.moveTo(x, z); else s.lineTo(x, z); });
    s.closePath();

    const yellow = [], black = [];
    const CURB_SEG = 0.4; // small, flower-pot scale edging blocks
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const dx = p2[0] - p1[0], dz = p2[1] - p1[1];
      const dist = Math.hypot(dx, dz);
      if (dist < 0.01) continue;
      const angle = Math.atan2(dz, dx);
      const numSeg = Math.max(1, Math.round(dist / CURB_SEG));
      const segLen = dist / numSeg;
      for (let s2 = 0; s2 < numSeg; s2++) {
        const cx = p1[0] + (dx / dist) * (s2 + 0.5) * segLen;
        const cz = p1[1] + (dz / dist) * (s2 + 0.5) * segLen;
        const m = composeWorldMatrix([cx, 0.11, cz], -angle, [0, 0, 0], [segLen * 0.94, 1, 1]);
        (s2 % 2 === 0 ? yellow : black).push(m);
      }
    }

    return { shape: s, yellowMatrices: yellow, blackMatrices: black };
  }, [center]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color={isDark ? "#5C3A21" : "#8B5A2B"} roughness={1} />
      </mesh>
      <InstancedStatic geometry={gardenCurbGeo} material={gardenCurbYellowMaterial} matrices={yellowMatrices} castShadow receiveShadow />
      <InstancedStatic geometry={gardenCurbGeo} material={gardenCurbBlackMaterial} matrices={blackMatrices} castShadow receiveShadow />
    </group>
  );
};

// === Canteen building with an entrance parking apron sized like the yard's parking spots ===
const CANTEEN_WIDTH = 9;
const CANTEEN_DEPTH = 6;
const CANTEEN_WALL_H = 3.2;
const CANTEEN_ROOF_PITCH = 1.4;
const CANTEEN_SPOT_W = 2.6; // same width as a regular yard parking spot
const CANTEEN_SPOT_L = 5.0; // same length as a regular yard parking spot


const SLOT_BASE_LIGHT = new THREE.Color("#E5E7EB");
const SLOT_BASE_DARK = new THREE.Color("#374151");
const SLOT_HOVER_LIGHT = new THREE.Color("#F3F4F6");
const SLOT_HOVER_DARK = new THREE.Color("#4B5563");
const slotMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });

function findSlotRangeIndex(ranges, faceIndex) {
  let lo = 0, hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const r = ranges[mid];
    if (faceIndex < r.triStart) hi = mid - 1;
    else if (faceIndex >= r.triEnd) lo = mid + 1;
    else return mid;
  }
  return -1;
}

const MergedSlots = ({ slots, center, isDark, onClick }) => {
  const hoverIndexRef = useRef(-1);

  const { geometry, ranges } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const geometries = [];
    const slotRanges = [];
    let vertCursor = 0, triCursor = 0;

    slots.forEach((slot) => {
      const s = new THREE.Shape();
      slot.polygon.forEach((coord, i) => {
        const [lat, lng] = coord;
        const x = (lng - center.lng) * LAT_TO_METERS * lngScale;
        const z = (lat - center.lat) * LAT_TO_METERS;
        if (i === 0) s.moveTo(x, z); else s.lineTo(x, z);
      });
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false });
      geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
      const vertCount = geo.attributes.position.count;
      const triCount = vertCount / 3;
      slotRanges.push({ slot, vertStart: vertCursor, vertEnd: vertCursor + vertCount, triStart: triCursor, triEnd: triCursor + triCount });
      vertCursor += vertCount; triCursor += triCount;
      geometries.push(geo);
    });

    const merged = mergeGeometries(geometries, false);
    geometries.forEach((g) => g.dispose());
    if (merged) { merged.rotateX(-Math.PI / 2); merged.translate(0, 0.01, 0); }
    return { geometry: merged, ranges: slotRanges };
  }, [slots, center]);

  const paintSlot = useCallback((idx, color) => {
    if (idx < 0 || !geometry) return;
    const colorAttr = geometry.getAttribute("color");
    const { vertStart, vertEnd } = ranges[idx];
    for (let v = vertStart; v < vertEnd; v++) colorAttr.setXYZ(v, color.r, color.g, color.b);
    colorAttr.needsUpdate = true;
  }, [geometry, ranges]);

  useEffect(() => {
    if (!geometry) return;
    const base = isDark ? SLOT_BASE_DARK : SLOT_BASE_LIGHT;
    const colorAttr = geometry.getAttribute("color");
    for (let v = 0; v < colorAttr.count; v++) colorAttr.setXYZ(v, base.r, base.g, base.b);
    colorAttr.needsUpdate = true;
    hoverIndexRef.current = -1;
  }, [geometry, isDark]);

  if (!geometry) return null;

  return (
    <mesh
      geometry={geometry} material={slotMaterial} receiveShadow
      onPointerMove={(e) => {
        e.stopPropagation();
        if (e.faceIndex === undefined) return;
        const idx = findSlotRangeIndex(ranges, e.faceIndex);
        if (idx === hoverIndexRef.current) return;
        if (hoverIndexRef.current >= 0) paintSlot(hoverIndexRef.current, isDark ? SLOT_BASE_DARK : SLOT_BASE_LIGHT);
        if (idx >= 0) paintSlot(idx, isDark ? SLOT_HOVER_DARK : SLOT_HOVER_LIGHT);
        hoverIndexRef.current = idx;
        document.body.style.cursor = idx >= 0 ? "pointer" : "auto";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (hoverIndexRef.current >= 0) paintSlot(hoverIndexRef.current, isDark ? SLOT_BASE_DARK : SLOT_BASE_LIGHT);
        hoverIndexRef.current = -1;
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.faceIndex === undefined) return;
        const idx = findSlotRangeIndex(ranges, e.faceIndex);
        if (idx >= 0) onClick(ranges[idx].slot);
      }}
    />
  );
};

const CellTower3D = ({ center }) => {
  const { scene } = useGLTF("/cell_tower_skyward.glb");
  const lngScale = Math.cos((center.lat * Math.PI) / 180);

  // Array containing both tower coordinates
  const towers = [
    { lat: 28.509276057250666, lng: 77.28849757459123 }, // Original tower
    { lat: 28.509261536402185, lng: 77.28819871749869 }  // New tower
  ];

  return (
    <>
      {towers.map((tower, index) => {
        // Calculate X and Z positions for each tower independently
        const x = (tower.lng - center.lng) * LAT_TO_METERS * lngScale;
        const z = -(tower.lat - center.lat) * LAT_TO_METERS;

        return (
          <group key={index} position={[x, 0, z]}>
            <Clone object={scene} scale={[19, 30, 20]} castShadow receiveShadow />
          </group>
        );
      })}
    </>
  );
};

function getTrackPositionAndAngle(center, targetLat, targetLng, trackOffset) {
  const lngScale = Math.cos((center.lat * Math.PI) / 200);
  const x = (targetLng - center.lng) * LAT_TO_METERS * lngScale;
  const z = -(targetLat - center.lat) * LAT_TO_METERS;
  const trackPoints = TRACK_COORDS.map(c => ({
    lat: c[0],
    lng: c[1],
    x: (c[2] - center.lng) * LAT_TO_METERS * lngScale,
    z: -(c[0] - center.lat) * LAT_TO_METERS,
  }));

  let idx = -1;
  let minDist = Infinity;
  trackPoints.forEach((p, i) => {
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < minDist) { minDist = d; idx = i; }
  });

  let angle = 0;
  if (idx >= 0 && idx < trackPoints.length) {
    const pPrev = trackPoints[Math.max(0, idx - 1)];
    const pNext = trackPoints[Math.min(trackPoints.length - 1, idx + 1)];
    const dx = pNext.x - pPrev.x;
    const dz = pNext.z - pPrev.z;
    angle = Math.atan2(dz, dx);
  }

  const perpX = -Math.sin(angle);
  const perpZ = Math.cos(angle);
  const finalX = x + perpX * trackOffset;
  const finalZ = z + perpZ * trackOffset;
  return { x: finalX, z: finalZ, angle };
}

const WagonRake3D = ({
  center,
  targetLat,
  targetLng,
  trackOffset,
  count,
  withEngine = false,
  engineUrl = "/train.glb",
  wagonScale = 1.5,
  spacing = 4.5,
  engineScale = 2.0,
  engineRotYOffset = 0,
  // engineRightShift: track ke angle ke perpendicular (relative) shift — track ka angle jitna
  // zyada tilted hoga utna hi ye "left/right" ki jagah "diagonal" jaisa dikh sakta hai.
  engineRightShift = 0,
  engineForwardOffset = 0,   // sirf engine ko aage/peeche karne ke liye (wagons se attach karne ke liye)
  wagonYOffset = 0.4,        // wagons ki ground height
  engineYOffset = 0.4,       // engine ke base ka ground se height (auto ground-snap ke saath kaam karta hai)
  lateralOffset = 4,         // poori train (engine+wagons dono) ko left/right shift karne ke liye
  // engineWorldXShift / engineWorldZShift: DIRECT world-axis shift, track ke angle se koi lena dena nahi.
  // Map ko top-down se dekho: X axis = ek seedhi horizontal direction, Z axis = seedhi vertical direction.
  // Inhe use karo agar engineRightShift confusing lag raha ho — ye bilkul straightforward hain.
  engineWorldXShift = 0,
  engineWorldZShift = 0
}) => {
  const { scene: engineScene } = useGLTF(engineUrl);
  const { scene: wagonScene } = useGLTF("/wagon.glb");

  // Engine model ka apna internal pivot/origin ground pe nahi hota (model ke andar hi kahin center/upar set hota hai).
  // Isliye hum uski bounding box nikaal ke pata karte hain ki model ka sabse "neeche" wala point (min Y) kahan hai,
  // aur usi ke hisaab se engine ko automatically ground level pe "snap" kar dete hain — ab manual guess-check
  // ki zaroorat nahi. engineYOffset ab bas "engine ka base kitna upar ground se hona chahiye" (jaise wagons ka
  // wagonYOffset) — chhota, seedha number, jaise 0.4.
  const engineBoxMinY = useMemo(() => {
    if (!engineScene) return 0;
    const box = new THREE.Box3().setFromObject(engineScene);
    return box.min.y;
  }, [engineScene]);

  const { x, z, angle } = getTrackPositionAndAngle(center, targetLat, targetLng, trackOffset);

  const dirX = -Math.sin(angle);
  const dirZ = -Math.cos(angle);
  const perpX = -Math.sin(angle);
  const perpZ = Math.cos(angle);

  // Poori rake ko lateralOffset se side me shift karo (dono engine aur wagons pe apply hoga)
  const baseX = x + perpX * lateralOffset;
  const baseZ = z + perpZ * lateralOffset;

  const items = [];
  if (withEngine) {
    items.push({ type: 'engine', offset: 0, scale: engineScale });
  }
  for (let i = 1; i <= count; i++) {
    const offset = -i * spacing;
    items.push({ type: 'wagon', offset, scale: wagonScale });
  }

  return (
    <group>
      {items.map((item, index) => {
        let posX = baseX + dirX * item.offset;
        let posZ = baseZ + dirZ * item.offset;
        let posY = wagonYOffset;   // default: wagon height
        let rotY = -angle + Math.PI / 2;
        let scaleVal = item.scale;

        if (item.type === 'engine') {
          rotY += engineRotYOffset;
          // Sirf engine ko sideways (right/left) shift karta hai — wagons is se untouched hain
          posX += perpX * engineRightShift;
          posZ += perpZ * engineRightShift;
          // Sirf engine ko aage/peeche karta hai (wagons se attach karne ke liye)
          posX += dirX * engineForwardOffset;
          posZ += dirZ * engineForwardOffset;
          // DIRECT world-axis shift — track angle ignore karke seedha X/Z axis par move karta hai
          posX += engineWorldXShift;
          posZ += engineWorldZShift;
          // AUTO GROUND SNAP: engine ka model-base (bounding box ka sabse neeche wala point) ko
          // engineYOffset height par rakhta hai — chahe model ka internal pivot kahin bhi ho, ye
          // hamesha ground ko sahi se touch karega.
          posY = engineYOffset - engineBoxMinY * scaleVal;
        }

        const model = item.type === 'engine' ? engineScene : wagonScene;

        return (
          <Clone
            key={index}
            object={model}
            position={[posX, posY, posZ]}
            rotation={[0, rotY, 0]}
            scale={[scaleVal, scaleVal, scaleVal]}
            castShadow
            receiveShadow
          />
        );
      })}
    </group>
  );
};

function App() {
  const [slots, setSlots] = useState([]);
  const [containers, setContainers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [cranes, setCranes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [center, setCenter] = useState({ lat: 28.510, lng: 77.290 });
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const controlsRef = useRef(null);

  const fetchSlots = useCallback(() => {
    fetch("/slots.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((slotsData) => {
        const validSlots = slotsData.filter((item) => item.polygon && item.polygon.length >= 3);
        setSlots(validSlots);
        setCenter(calculateCenter(validSlots, WAREHOUSE_DATA));
        setLastUpdated(new Date());
        loading && setLoading(false);
      })
      .catch((err) => {
        console.warn("Slot data load error.", err);
        setCenter(calculateCenter([], WAREHOUSE_DATA));
        setLoading(false);
      });
  }, [loading]);

  const fetchContainers = useCallback(() => {
    fetch("https://kycl.in/api/api/yard-containers")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        const dataArray = Array.isArray(json?.data) ? json.data : [];
        const mappedContainers = dataArray
          .filter((item) => item.LAST_STK_LOC)
          .map((item) => {
            const rawLoc = String(item.LAST_STK_LOC).trim();
            const tierMatch = rawLoc.match(/^(.*?)([A-Za-z])$/);
            const slotKey = tierMatch ? tierMatch[1] : rawLoc;
            const tierChar = tierMatch ? tierMatch[2].toUpperCase() : "A";
            const stackLvl = tierChar.charCodeAt(0) - 64;

            return {
              id: item.CONTAINER_NO || "UNKNOWN",
              size: String(item.CONTAINER_SIZE || "20"),
              loc: slotKey,
              stack: stackLvl,
              originalData: item,
              _rawKey: rawLoc,
            };
          });
        setContainers(mappedContainers);
        setLastUpdated(new Date());
      })
      .catch((err) => console.warn("Container data load error.", err));
  }, []);

  const fetchEquipment = useCallback(() => {
    fetch("https://kycl.in/api/api/equipments")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        const dataArray = Array.isArray(json?.data) ? json.data : [];
        const validItems = dataArray
          .filter((item) => item.LATITUDE && item.LONGITUDE)
          .map((item) => ({
            name: item.EQUIPMENT_NAME || "RST",
            lat: parseFloat(item.LATITUDE),
            lng: parseFloat(item.LONGITUDE),
            angle: 0,
          }))
          .filter((item) => !Number.isNaN(item.lat) && !Number.isNaN(item.lng));
        const mappedCranes = validItems
          .filter((item) => item.name.toUpperCase().startsWith("RTG"))
          .map((item, idx) => ({ ...item, type: idx % 2 === 0 ? "yellow" : "orange" }));
        const mappedEquipment = validItems.filter((item) => !item.name.toUpperCase().startsWith("RTG"));

        setCranes(mappedCranes);
        setEquipment(mappedEquipment);
      })
      .catch((err) => console.warn("Equipment data load error.", err));
  }, []);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  useEffect(() => {
    fetchContainers();
    const intervalId = setInterval(fetchContainers, API_POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchContainers]);

  useEffect(() => {
    fetchEquipment();
    const intervalId = setInterval(fetchEquipment, API_POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchEquipment]);

  const placedContainers = useMemo(() => {
    const slotGroups = {};
    const lngScale = Math.cos((center.lat * Math.PI) / 180);

    slots.forEach((slot) => {
      const formattedId = formatSlotId(slot.id);
      if (!slotGroups[formattedId]) slotGroups[formattedId] = { polygons: [] };
      const points = slot.polygon.map((coord) => ({ x: (coord[1] - center.lng) * LAT_TO_METERS * lngScale, z: -(coord[0] - center.lat) * LAT_TO_METERS }));
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      points.forEach((p) => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); });
      const cx = (minX + maxX) / 2; const cz = (minZ + maxZ) / 2;
      let maxDist = 0, angle = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x; const dz = points[i + 1].z - points[i].z;
        const dist = Math.hypot(dx, dz);
        if (dist > maxDist) { maxDist = dist; angle = Math.atan2(dz, dx); }
      }
      // `len` = the real footprint length of this slot cell — used later to size 40ft
      // containers to the actual gap between their two sub-slots instead of a fixed length.
      slotGroups[formattedId].polygons.push({ cx, cz, angle, len: maxDist });
    });

    const result = [];
    containers.forEach((container) => {
      const stackLvl = parseInt(container.stack || "1", 10);
      if (stackLvl < 1 || stackLvl > 6) return;
      const group = slotGroups[container.loc];
      if (!group) return;

      const is40 = container.size === "40";
      const height = 2.6;
      const y = (stackLvl - 1) * height + height / 2 + 0.1;

      let x = 0, z = 0, angle = 0, lenScale = 1;
      if (is40) {
        const polys = group.polygons;
        if (polys.length >= 2) {
          // Sirf woh do slot-cells lo jo sabse zyada door hain — yehi asli 2 sub-slot
          // hain jo milke 40ft bay banate hain. Sirf inhi ka use karne se container
          // exactly unke beech center hoga aur uski length real gap ke hisaab se set
          // hogi — ab woh apni jagah se bahar overflow nahi karega.
          let bestA = 0, bestB = 1, bestDist = -1;
          for (let a = 0; a < polys.length; a++) {
            for (let b = a + 1; b < polys.length; b++) {
              const dx = polys[b].cx - polys[a].cx, dz = polys[b].cz - polys[a].cz;
              const dist = Math.hypot(dx, dz);
              if (dist > bestDist) { bestDist = dist; bestA = a; bestB = b; }
            }
          }
          const pA = polys[bestA], pB = polys[bestB];
          x = (pA.cx + pB.cx) / 2;
          z = (pA.cz + pB.cz) / 2;
          angle = pA.angle;
          const span = bestDist + (pA.len + pB.len) / 2;
          lenScale = span > 0.5 ? Math.min(1.15, Math.max(0.75, span / 12.2)) : 1;
        } else {
          const p = polys[0];
          x = p.cx; z = p.cz; angle = p.angle;
        }
      } else {
        const stackKey = `stack_${stackLvl}`;
        if (group[stackKey] === undefined) group[stackKey] = 0;
        const polyIndex = group[stackKey] % group.polygons.length;
        const targetPoly = group.polygons[polyIndex];
        x = targetPoly.cx; z = targetPoly.cz; angle = targetPoly.angle;
        group[stackKey]++;
      }
      result.push({ ...container, x, y, z, angle, is40, lenScale });
    });

    // === EMPTY-SLOT GRAY FILL ===
    // Har physical column (ek fixed x,z jagah jahan containers stack hote hain) ke liye check karo:
    // agar us column mein koi upar wala stack level occupied hai lekin uske neeche ke levels khali
    // hain, to unn khali levels par ek gray "empty" placeholder container daal do.
    const columnMap = new Map();
    const HEIGHT = 2.6;
    result.forEach((c) => {
      const key = `${c.x.toFixed(2)}_${c.z.toFixed(2)}`;
      if (!columnMap.has(key)) columnMap.set(key, { stacks: new Map(), is40: c.is40, angle: c.angle, x: c.x, z: c.z, lenScale: c.lenScale });
      columnMap.get(key).stacks.set(c.stack, true);
    });

    const placeholders = [];
    columnMap.forEach((col) => {
      const levels = Array.from(col.stacks.keys());
      const maxStack = Math.max(...levels);
      for (let lvl = 1; lvl < maxStack; lvl++) {
        if (!col.stacks.has(lvl)) {
          const y = (lvl - 1) * HEIGHT + HEIGHT / 2 + 0.1;
          placeholders.push({
            id: `EMPTY-${col.x.toFixed(1)}-${col.z.toFixed(1)}-${lvl}`,
            isEmpty: true,
            x: col.x,
            y,
            z: col.z,
            angle: col.angle,
            is40: col.is40,
            lenScale: col.lenScale,
            stack: lvl,
          });
        }
      }
    });

    return [...result, ...placeholders];
  }, [slots, containers, center]);

  if (loading) {
    return <div className={`screen-message ${isDark ? "dark" : "light"}`}>Loading Live 3D Engine…</div>;
  }

  const targetLat = 28.51402777568197; // from your code
  const targetLng = 77.286057243871;



  // Second train — new engine + 10 wagons at your given coordinate
  const targetLat2 = 28.509669;
  const targetLng2 = 77.286292;

  return (
    <div className={`app-container ${isDark ? "theme-dark" : "theme-light"}`}>
      <div className="ui-overlay">
        <div className="ui-header">
          <h1>ICD TKD 3D Yard</h1>
          <p className="subtitle">{containers.length} Containers | {WAREHOUSE_DATA.length} Warehouses</p>
          <div style={{ fontSize: "12px", marginTop: "5px", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ display: "inline-block", width: "8px", height: "8px", background: "#10B981", borderRadius: "50%", boxShadow: "0 0 5px #10B981" }} />
            API Live • Last Sync: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        <div className="ui-controls-group">
          <button className="theme-toggle" onClick={() => setIsDark(!isDark)} title="Toggle Theme">
            {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        {selectedItem && (
          <div className="ui-info-card fade-in" style={{ background: isDark ? "rgba(30,41,59,0.95)" : "rgba(255,255,255,0.95)", padding: "20px", borderRadius: "12px", marginTop: "50px", position: "relative" }}>
            <button
              className="close-btn"
              onClick={() => setSelectedItem(null)}
              style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: isDark ? "#f8fafc" : "#111827", opacity: 0.7, transition: "opacity 0.2s", padding: "0", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
              title="Close"
            >
              ×
            </button>
            <div className="card-header" style={{ fontSize: "12px", opacity: 0.7, paddingRight: "20px" }}>
              {selectedItem.isEmpty ? "Empty Slot" : selectedItem.size ? "Container Details" : "Selected Yard Slot"}
            </div>
            <h3 style={{ margin: "5px 0 12px 0", paddingRight: "20px" }}>
              {selectedItem.isEmpty ? "Empty" : (selectedItem.id || selectedItem.originalData?.CONTAINER_NO || selectedItem._rawKey)}
            </h3>
            <div style={{ fontSize: "14px" }}>
              {selectedItem.isEmpty ? (
                [
                  ["Status", "Empty — No Container"],
                  ["Size Slot", selectedItem.is40 ? "40 FT" : "20 FT"],
                  ["Stack Level", selectedItem.stack],
                ].map(([label, value], i, arr) => (
                  <div key={label} className="card-detail" style={{ padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` : "none" }}>
                    <span>{label}</span>
                    <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {i === 0 && <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: EMPTY_SLOT_COLOR, display: "inline-block" }} />}
                      {value || "—"}
                    </strong>
                  </div>
                ))
              ) : selectedItem.size ? (
                [
                  ["Size", `${selectedItem.originalData?.CONTAINER_SIZE || selectedItem.size} FT`],
                  ["Location", selectedItem._rawKey || selectedItem.loc],
                  ["Type", selectedItem.originalData?.TYPE],
                  ["Shipping Line", selectedItem.originalData?.SLINECODE, getContainerColor(selectedItem)],
                  ["Stack Level", selectedItem.stack || 'Truck Load'],
                ].map(([label, value, swatch], i, arr) => (
                  <div key={label} className="card-detail" style={{ padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` : "none" }}>
                    <span>{label}</span>
                    <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {swatch && <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: swatch, display: "inline-block" }} />}
                      {value || "—"}
                    </strong>
                  </div>
                ))
              ) : (
                <div className="card-detail" style={{ padding: "8px 0" }}>
                  <span>Path Vertices</span>
                  <strong>{selectedItem.polygon?.length}</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Canvas camera={{ position: [274, 1280, 80], fov: 45, near: 1, far: 10000 }} gl={{ logarithmicDepthBuffer: true }} shadows>
        <color attach="background" args={[isDark ? "#0f172a" : "#e2e8f0"]} />

        <ambientLight intensity={0.6} />
        <hemisphereLight skyColor={isDark ? "#1a3a5a" : "#add8e6"} groundColor="#3a3a3a" intensity={0.4} />
        <directionalLight position={[100, 300, 100]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-100, 100, -100]} intensity={0.5} />
        <pointLight position={[0, 200, 0]} intensity={0.3} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[10000, 10000]} />
          <meshStandardMaterial color={isDark ? "#1e293b" : "#f0f2f5"} roughness={1} />
        </mesh>

        <MapControls ref={controlsRef} target={[-120, 0, 150]} enableDamping={true} dampingFactor={0.05} maxPolarAngle={Math.PI / 2 - 0.05} minDistance={20} maxDistance={1500} />
        <PanBoundsClamp controlsRef={controlsRef} />

        {/* === AUTOMATION GATE === */}
        <AutomationGate3D center={center} isDark={isDark} />

        {/* === CGO GANTRY + BOOM BARRIER (added at user request) === */}
        <AutomationGate3D center={center} isDark={isDark} lanes={CGO_GATE_LANES} label="CGO Gantry" stripedPoles />
        <BoomBarrier3D center={center} isDark={isDark} coords={CGO_BOOM_BARRIER_COORDS} label="CGO Boom Barrier" lane={CGO_GATE_LANES[0]} />

        {/* === CGI GANTRY + BOOM BARRIER (added at user request) === */}
        <AutomationGate3D center={center} isDark={isDark} lanes={CGI_GATE_LANES} label="CGI Gantry" stripedPoles />
        <BoomBarrier3D center={center} isDark={isDark} coords={CGI_BOOM_BARRIER_COORDS} label="CGI Boom Barrier" lane={CGI_GATE_LANES[0]} />

        {/* === OCR GATE (orange pole gantry across 3 points, 2 back-to-back segments) === */}
        <AutomationGate3D center={center} isDark={isDark} lanes={OCR_GATE_LANES} label="OCR Gate" poleColor="#F97316" />
        <BoomBarrier3D center={center} isDark={isDark} coords={OCR_BOOM_BARRIER_COORDS} label="OCR Boom Barrier" lane={OCR_BOOM_LANE} />

        {/* === NEW REALISTIC QR CODE SCANNERS === */}
        <QRCodeScanner3D center={center} isDark={isDark} />

        {/* === NEW REALISTIC BOOM BARRIERS === */}
        <BoomBarrier3D center={center} isDark={isDark} />

        <Suspense fallback={null}>
          <FlagMemorial3D center={center} isDark={isDark} />
        </Suspense>

      
        <ParkingWall3D center={center} isDark={isDark} />
        <SmallYellowBlackWall3D center={center} isDark={isDark} />
        <SmallYellowBlackWall3D center={center} isDark={isDark} lines={SMALL_WALL_LINES_2} />
        <GreeneryArea3D center={center} isDark={isDark} />

        <BoundaryWall3D center={center} isDark={isDark} />
        <DomesticFence3D center={center} isDark={isDark} />
        <HeadOffice3D center={center} isDark={isDark} />
        <InGate3D center={center} isDark={isDark} />
        <TerminalMeshGate3D center={center} isDark={isDark} />

        <ParkingArea3D center={center} isDark={isDark} />

        <GrayBuilding3D polygon={IMPORT_BUILDING_POLYGON} center={center} isDark={isDark} label={"Import building"} />
        <GrayBuilding3D polygon={EXPORT_BUILDING_POLYGON} center={center} label={"Export building"} />
        <WorkshopShed3D polygon={WORKSHOP1_POLYGON} center={center} isDark={isDark} label="WORKSHOP 1" />
        <WorkshopShed3D polygon={WORKSHOP2_POLYGON} center={center} isDark={isDark} label="WORKSHOP 2" />

        <GardenBed3D center={center} isDark={isDark} />

        <MergedSlots slots={slots} center={center} isDark={isDark} onClick={setSelectedItem} />
        <InstancedContainers containers={placedContainers} isDark={isDark} onClick={setSelectedItem} />

        {WAREHOUSE_DATA.map((wh, idx) => (
          <Warehouse3D key={`wh-${idx}`} data={wh} center={center} isDark={isDark} />
        ))}

        <CraneField3D cranes={cranes} center={center} isDark={isDark} />
        <ReachStackerField3D machines={equipment} center={center} isDark={isDark} />
        <Railway3D center={center} isDark={isDark} />

        <Suspense fallback={null}>
          <CellTower3D center={center} />
        </Suspense>

        <Suspense fallback={null}>
          <GuardRoom3D center={center} isDark={isDark} />
        </Suspense>


        <Suspense fallback={null}>
          <WagonRake3D
            center={center}
            targetLat={targetLat}
            targetLng={targetLng}
            trackOffset={-4}
            count={10}
            withEngine={true}
            wagonScale={0.12}
            spacing={16}
            engineScale={2}
            engineRotYOffset={Math.PI / 2}
            engineForwardOffset={-6}
          />
        </Suspense>

        <Suspense fallback={null}>
          <WagonRake3D
            center={center}
            targetLat={targetLat2}
            targetLng={targetLng2}
            trackOffset={-4}
            count={10}
            withEngine={false}
            wagonScale={0.12}
            spacing={16}
            engineScale={3}
            engineRotYOffset={Math.PI / 2}
            engineForwardOffset={-16}
            engineRightShift={0}
            engineWorldXShift={-12}
            engineWorldZShift={0}
          />
        </Suspense>

      </Canvas>
    </div>
  );
}

export default App;
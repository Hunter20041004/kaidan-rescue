/* =====================================================================
   Content tables. New folklore / items / maps are added here; the core
   systems read these definitions.
   ===================================================================== */
const MONSTERS={
  mosin:{name:'魔神仔',origin:'台灣民間傳說',r:9,speed:60,chase:88,sight:4.5,holy:true,
    blurb:'山裡的「芒神」。會學熟人的聲音喊救命，把人帶進草叢深處，餵人吃草蜢和牛糞。被帶走的人，常常再也找不到。',
    rules:['學倖存者的聲音喊「救命」騙你過去','草叢擋不住祂，躲草叢反而最危險','被牽走時連按方向鍵掙脫，或讓同伴喊你的名字','怕鞭炮和鐘這種大聲響；進不了土地公廟和香的結界'],
    omen:'竹林那邊，有小孩子在笑。',spawn:'grass'},
  tiger:{name:'虎姑婆',origin:'台灣民間故事',r:11,speed:70,chase:118,sight:5.5,holy:true,
    blurb:'假扮成姑婆，半夜來敲門，專吃小孩的手指。故事裡的姊姊爬到樹上，用熱油燙跑了她。',
    rules:['隔著牆也聞得到小孩；線香的煙能蓋過氣味','會敲門，然後一個一個打開衣櫃、草垛，關著的門也撞得開','人在樹上她搆不著，但她會在樹下等','怕火；進不了土地公廟'],
    omen:'有人在敲門：「乖孩子，姑婆來了。」',spawn:'edge'},
  kuchi:{name:'裂口女',origin:'日本都市傳說',r:10,speed:72,chase:162,sight:9,holy:false,
    blurb:'戴著口罩問你「我漂亮嗎？」。答錯了，她會讓你的嘴變得和她一樣。據說她喜歡糖果。',
    rules:['看得最遠，跑得比你還快，只能躲出她的視線','她問「我漂亮嗎？」的時候，按互動回答「普通」，她會愣住','打不開衣櫃，看不見蹲在草叢裡的人','喜歡甜的；土地公廟擋不住她'],
    omen:'十字路口，有高跟鞋的聲音。',spawn:'road'},
  jiang:{name:'殭屍',origin:'華人民間傳說',r:10,speed:78,chase:116,sight:0,holy:true,
    blurb:'死後不腐的屍身，雙臂平舉，一跳一跳地走。眼睛看不見，靠活人的呼吸找人。',
    rules:['看不見人，只聞呼吸；按住空白鍵屏息，牠就找不到你','跨不過門檻，進不了屋子和廟','奔跑、喘氣、小孩憋不住氣都會被聽見','符咒正面拍上額頭，牠會定住一陣子'],
    omen:'墓地傳來一下、一下的跳動聲。',spawn:'grave'},
  suigui:{name:'水鬼',origin:'台灣民間傳說',r:10,speed:96,chase:150,sight:8,holy:false,
    blurb:'溺死的人困在水裡，要抓一個人當「交替」才能投胎。牠離不開水，但在水裡比誰都快。',
    rules:['只抓站在水裡的人，岸上和田埂是安全的','抓到交替後會消失一陣子','東西丟進水裡，牠會循著水聲過去','被拖住時連按方向鍵，或讓別人把你拉上岸'],
    omen:'稻田的水面，冒起一串泡泡。',spawn:'water'},
};
const MONSTER_ORDER=['mosin','tiger','kuchi','jiang','suigui'];
// apparitions do not hunt and cannot be driven off; they impose a rule, on you and on everyone with you
const APPARITIONS={
  girl:{name:'紅衣小女孩',origin:'台灣都市傳說',rule:'她出現的時候，三秒內不要動。',
    blurb:'一段家庭登山影片裡，隊伍後面跟著一個穿紅衣服的小女孩。沒有人認識她，也沒有人記得她跟上來。',
    rules:['會突然出現在你看得到的地方，不追你，也趕不走','三秒內不准動：走、跑、丟東西都算','動了，她會帶走一個人，你的手電筒也會熄掉','身邊的同伴也得停住；小孩常常忍不住'],omen:'遠處的路口，站著一個小小的紅色身影。'},
  funeral:{name:'夜半送葬',origin:'台灣民間禁忌',rule:'送葬的隊伍經過時，蹲下低頭，不要用手電筒照它。',
    blurb:'半夜聽到嗩吶和鑼，一隊穿白衣的人抬著棺材走過村子。老人說：別看，也別擋路。',
    rules:['一隊白衣人沿著路走過，不追你，也趕不走','手電筒照著它太久，你會被帶進隊伍裡；蹲下低頭就不算看','被帶走時連按方向鍵掙脫，或讓同伴把你拉回來','好奇的同伴也會轉頭去看'],omen:'嗩吶聲，從村子的另一頭傳過來。'},
  voice:{name:'叫名字',origin:'華人民間禁忌',rule:'背後有人叫你名字的時候，不要回頭，也不要回答。',
    blurb:'走夜路時，背後有人喊你的名字。老一輩說那不是人：一回頭、一答應，魂就被叫走了。',
    rules:['聲音會從你背後傳來，持續幾秒','不要把手電筒轉向聲音，也不要按互動回答','違反的話，黑暗裡的東西會抓住你，所有怪談都會知道你在哪','膽小的同伴可能會答應'],omen:'……'},
};
const APPARITION_ORDER=['girl','funeral','voice'];
// tools act through physical effects (noise, smell, smoke, fire, paper); none of them is the answer to one monster
const ITEMS={
  firecracker:{name:'鞭炮',kind:'聲音',desc:'丟出去炸響：所有怪談都會被聲音引過去，靠太近的會被嚇一跳。魔神仔特別怕這種聲音。'},
  candy:{name:'麥芽糖',kind:'氣味',desc:'丟出去當誘餌：鼻子靈的（裂口女、虎姑婆、魔神仔、狗）會去聞一陣子。'},
  incense:{name:'線香',kind:'煙',desc:'插在地上冒煙：煙裡聞不到人、聽不到呼吸，也擋住怕香火的怪談。在土地公前上香能補廟裡的香火。'},
  oil:{name:'煤油',kind:'火',desc:'丟出去點火：一小片火擋住路、照亮四周，踩到火的怪談會被燙退。丟進水裡就熄了。'},
  talisman:{name:'符咒',kind:'紙',desc:'貼在關著的門上，門就撞不開；正面拍在怪談身上，怕符的會退開，殭屍會被定住。'},
};
const ITEM_ORDER=['firecracker','candy','incense','oil','talisman'];
const HIDES={cabinet:{name:'衣櫃',cap:1,enter:.25},hay:{name:'草垛',cap:1,enter:.35},tree:{name:'樹上',cap:2,enter:.9},well:{name:'井裡',cap:1,enter:.5}};
const MODS=[
  {id:'calm',name:'無風',yi:'屏息',ji:'奔跑',desc:'四下太安靜，腳步聲傳得更遠。',light:1,speed:1,noise:1.4},
  {id:'fog',name:'濃霧',yi:'蹲伏',ji:'遠行',desc:'霧很濃，手電筒照不遠。',light:.72,speed:1},
  {id:'rain',name:'大雨',yi:'奔跑',ji:'涉水',desc:'雨聲蓋過腳步，但水鬼在雨裡更凶。',light:.9,speed:1,noise:.65,rain:true},
  {id:'moon',name:'血月',yi:'速去速回',ji:'逗留',desc:'怪談走得更快，月光也更亮。',light:1.15,speed:1.12},
  {id:'dogs',name:'犬吠',yi:'安撫',ji:'驚動',desc:'村裡的狗整夜不安，一點動靜就叫。',light:1,speed:1,dogs:1.6},
  {id:'temple',name:'香火鼎盛',yi:'入廟',ji:'熄燈',desc:'廟裡香火充足，線香結界更持久。',light:1,speed:1,incense:100,ward:1.5},
  {id:'dark',name:'斷電',yi:'摸黑',ji:'點燈',desc:'整村的路燈都不會亮。',light:.95,speed:1,nolamps:true},
  {id:'gate',name:'鬼門開',yi:'上香',ji:'出門',desc:'四個怪談，而且很早就來。',light:1,speed:1,count:4,times:[28,62,112,170]},
];
// night pacing (game seconds; the night is three 時辰 of 140 s). ~20 s of omens and sounds, first monster right after,
// then slow to fast: monsters start slower than you, speed up and notice you faster each 時辰; the frantic dash is the last minute only
const PACE={
  times:[28,100,165],jitter:4,omenLead:10,firstNear:[16,22], // spawn times (first one jittered); omen lead; first monster spawns 16–22 tiles out, unseen, and creeps in
  spare:60,                                              // the villager whose scream opens the night is left alone this long by the first monster
  reservePhase:2,maxMonsters:4,                          // one more monster exactly when 寅時 starts (omen 8 s before)
  heat:[.8,.92,1.04],finalHeat:1.18,                     // monster speed multiplier per 時辰 / last minute (player walks 100, runs 152)
  stalk:[2.2,1.4,.8],finalStalk:.3,                      // seconds a monster stalks after noticing you before it charges
  lonely:[22,16,12],finalLonely:7,                       // seconds without a monster nearby before the nearest one comes looking
  apps:[78,195,300],appJitter:18,appGap:35,              // rule apparitions (2–3 per night, at least appGap s apart, never in the last minute)
  firstScare:[5,8],scareGap:[24,24],                     // false scares: one in the opening, then every 24–48 s of quiet
  final:60,
};
// nights unlock in this order, one more after every night you finish
const MOD_UNLOCK=['calm','fog','rain','moon','dogs','temple','dark','gate'];
const NAMES=[
  {name:'阿明',kind:'adult',shirt:'#5d7da8',hair:'short'},{name:'小美',kind:'child',shirt:'#c46b8a',hair:'buns'},{name:'阿嬤',kind:'elder',shirt:'#7c6a9c',hair:'bun'},
  {name:'小胖',kind:'child',shirt:'#d39a3a',hair:'short'},{name:'志豪',kind:'adult',shirt:'#4f8a6e',hair:'short'},{name:'阿芬',kind:'adult',shirt:'#b0574a',hair:'long'},
  {name:'小安',kind:'child',shirt:'#5aa3a0',hair:'short'},{name:'阿伯',kind:'elder',shirt:'#8a7a55',hair:'bald'},{name:'淑芬',kind:'adult',shirt:'#9a6a8a',hair:'long'},
  {name:'阿弟',kind:'child',shirt:'#6a9a4a',hair:'short'},
];
// survivor quirks: each night two or three people get one
const QUIRKS={
  timid:{name:'膽小',kinds:['adult','child','elder'],hello:'我、我好怕……一點聲音我就會叫出來。'},
  brave:{name:'膽大',kinds:['adult','elder'],hello:'我不怕。你去哪，我就去哪。'},
  wander:{name:'愛亂跑',kinds:['child'],hello:'我剛剛看到螢火蟲耶！'},
  deaf:{name:'重聽',kinds:['elder'],hello:'啊？你說什麼？大聲一點！'},
  pious:{name:'守規矩',kinds:['adult','elder'],hello:'老一輩說，夜裡有夜裡的規矩。我記得。',extra:true}, // knows the rules, whispers them when an apparition comes; handed out apart from the others (seed hash, not the game RNG)
};
// things that happen once per night, at a random time
const EVENTS={
  blackout:{omen:'路燈一盞一盞熄滅了。'},
  bell:{omen:'廟前的鐘，自己響了起來。'},
  cry:{omen:'草叢裡傳來嬰兒的哭聲。'},
  fogroll:{omen:'山上的霧，一下子漫進村子。'},
};
const KIND={adult:{speed:118,r:7,breath:5},child:{speed:104,r:5.5,breath:2.4},elder:{speed:82,r:7,breath:3.5}};

/* ---------------- scenes ---------------- */
function houseBuilder(R,set){return(x0,y0,x1,y1,doors)=>{R(x0,y0,x1,y1,'#');R(x0+1,y0+1,x1-1,y1-1,'h');for(const[x,y]of doors)set(x,y,'d')}}
const SCENES={
village:{
  name:'山腳村',w:84,h:60,night:420,survivorCount:6,itemCount:14,
  build(R,set){
    const house=houseBuilder(R,set);
    R(0,0,83,1,'T');R(0,58,83,59,'T');R(0,0,1,59,'T');R(82,0,83,59,'T');
    // west: bamboo and grass (魔神仔)
    R(2,5,14,18,'g');R(2,22,9,28,'g');R(4,36,13,50,'g');R(9,52,15,56,'g');R(16,13,20,17,'g');
    for(const[x,y,w,h]of[[3,3,2,1],[7,3,3,1],[11,4,2,2],[2,12,1,3],[6,14,2,2],[11,9,2,1],[2,19,3,2],[7,20,2,1],[12,22,2,3],[2,30,3,4],[8,34,2,1],[2,40,1,4],[7,45,2,2],[12,46,2,2],[2,52,4,4],[16,52,2,3],[15,5,2,2],[16,9,1,2],[4,8,2,1]])R(x,y,x+w-1,y+h-1,'b');
    R(14,38,16,46,'T');R(2,46,3,50,'T');R(34,2,48,4,'T');R(76,2,81,4,'T');R(2,56,8,57,'T');R(74,55,81,57,'T');R(30,55,35,57,'T');R(48,55,53,57,'T');R(16,55,22,57,'T');
    // roads
    R(39,28,44,57,'r');R(4,31,80,33,'r');R(29,8,31,30,'r');R(52,6,54,30,'r');
    R(32,22,51,28,'s');
    // temple
    R(35,12,48,21,'P');R(36,13,47,20,'p');set(41,21,'d');set(42,21,'d');R(41,14,42,14,'A');set(37,14,'K');set(46,14,'K');
    // houses
    house(18,21,28,28,[[28,24],[28,25]]);house(56,21,66,28,[[56,24],[56,25]]);
    house(19,36,28,43,[[23,36],[24,36]]);house(55,36,65,43,[[59,36],[60,36]]);
    house(26,47,33,52,[[33,49],[33,50]]);house(50,47,57,52,[[50,49],[50,50]]);
    house(18,4,28,11,[[23,11],[24,11]]);
    for(const[x,y]of[[23,24],[24,24],[61,24],[62,24],[23,39],[24,39],[60,39],[61,39],[22,7],[23,7]])set(x,y,'K');
    // cemetery
    R(56,4,74,14,'.');for(let gx=57;gx<=73;gx+=3)for(let gy=5;gy<=13;gy+=3)if(hash(gx,gy,3)>.22)set(gx,gy,'G');
    // east water: paddies + pond with island
    R(68,16,80,29,'w');for(const y of[20,24])R(68,y,80,y,'.');R(74,16,74,29,'.');
    R(66,36,81,50,'w');R(70,39,79,47,'W');R(74,42,76,44,'g');R(69,43,73,43,'B');
    // south-east field
    R(60,51,72,56,'g');R(70,6,73,7,'g');
    // props & lamps
    // props: every one helps, hurts or makes noise
    for(const[x,y]of[[33,23],[77,35]])set(x,y,'Z');            // bells you can ring to lure
    for(const[x,y]of[[50,23],[16,34],[47,9]])set(x,y,'O');      // wells you can hide in
    for(const[x,y]of[[16,30],[66,30],[36,52]])set(x,y,'U');     // roadside 土地公 shrines
    for(const[x,y]of[[36,35],[58,46],[17,25],[67,22],[30,37],[22,44]])set(x,y,'J'); // wind chimes
    for(const[x,y]of[[46,46],[47,46],[5,35],[61,52]])set(x,y,'X'); // chicken coops
    for(const[x0,x1,y]of[[6,9,29],[58,61,34],[18,21,46],[59,62,44]])R(x0,y,x1,y,'Q'); // laundry lines
    for(const[x,y]of[[38,38],[45,44],[38,50],[45,29],[20,30],[62,30],[74,34],[30,20],[54,18]])set(x,y,'L');
    R(38,52,45,57,'x');R(41,55,42,56,'V');
  },
  start:[41.5,51.2],altar:{x:42*TS,y:14.5*TS},lanterns:[[40.2,21.8],[43.8,21.8]],truck:[42*TS,56*TS],
  lamps:[[38,38],[45,44],[38,50],[45,29],[20,30],[62,30],[74,34],[30,20],[54,18]],
  houses:[[18,21,28,28],[56,21,66,28],[19,36,28,43],[55,36,65,43],[26,47,33,52],[50,47,57,52],[18,4,28,11]],
  temple:[35,12,48,21],
  cabinets:[[[19,22],[27,22],[19,27]],[[65,22],[57,22],[65,27]],[[20,42],[27,42],[20,37]],[[64,42],[56,42],[64,37]],[[27,48],[27,51]],[[56,48],[56,51]],[[19,5],[27,5],[19,10]]],
  hays:[[62,54],[67,55],[58,30],[8,30],[35,46],[71,52],[64,9]],
  trees:[[16,29],[35,29],[48,35],[66,34],[12,20],[70,35],[36,44],[47,42],[60,16],[25,15],[14,51],[77,53],[34,9],[46,8]],
  survivors:[[22,26,0],[61,26,1],[25,40,2],[60,40,3],[30,50,4],[53,50,5],[23,8,6],[6,10],[8,44],[4,25],[12,54],[77,18],[71,26],[75,43],[60,8],[70,11],[44,17],[66,53],[53,9],[36,26]],
  items:[[20,24],[63,23],[21,40],[62,41],[29,48],[54,48],[25,9],[10,16],[6,26],[10,40],[13,55],[34,31],[60,32],[78,32],[71,19],[78,27],[75,44],[63,10],[72,12],[38,15],[45,19],[48,26],[44,40],[37,47],[64,55],[24,33]],
  dogs:[[17,27],[67,26],[29,40],[49,50],[25,12],[58,49]],
  clues:[[11,24],[33,44],[64,33],[44,9],[70,9],[8,52],[55,18],[26,34]],
  spawns:{grass:[[5,12],[10,43],[4,26]],edge:[[3,34],[80,40],[24,56],[46,6]],road:[[5,32],[79,32],[30,10]],grave:[[62,7],[68,12],[59,12]],water:[[72,18],[77,26],[69,48],[80,37]]},
},
tutorial:{
  name:'村口外',w:36,h:24,night:9999,survivorCount:1,itemCount:0,
  build(R,set){
    const house=houseBuilder(R,set);
    R(0,0,35,0,'T');R(0,23,35,23,'T');R(0,0,0,23,'T');R(35,0,35,23,'T');R(1,1,9,2,'T');R(26,1,34,3,'T');
    R(1,12,34,13,'r');R(8,15,14,18,'g');R(21,15,26,19,'g');R(27,4,33,9,'b');R(29,6,31,7,'.');
    house(12,3,20,9,[[16,9],[17,9]]);
    R(29,17,34,22,'x');R(31,20,32,21,'V');R(2,19,6,21,'.');
    for(const[x,y]of[[22,6],[5,7]])set(x,y,'K');set(19,15,'L');set(6,15,'L');
  },
  start:[3.5,20.5],altar:{x:-999,y:-999},lanterns:[],truck:[32*TS,21*TS],lamps:[[19,15],[6,15]],
  houses:[[12,3,20,9]],temple:null,cabinets:[[[13,4]]],hays:[],trees:[[24,10]],survivors:[[16,6]],items:[],spawns:{},dogs:[],clues:[],
},
};

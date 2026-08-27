/* ========================================
   云游中国 - 智能旅行助手
   app.js - Agent 核心逻辑
   架构: 感知(天气API) → 推理(建议引擎) → 行动(推荐输出)
   ======================================== */

/* ============ 数据层 ============ */

var currentCityId = 'beijing'; // 当前选中的目的地（攻略板块共用）

const destinations = [
  { id:'beijing', name:'北京', pinyin:'Beijing', region:'华北', description:'千年古都，帝王之城', attractions:['故宫','长城','天坛'], bestSeason:'春秋', emoji:'🏯', color:'#e63946', gradient:'linear-gradient(135deg,#c41e3a,#e63946)', coord:[39.9042,116.4074],
    spots:[
      {name:'故宫',emoji:'🏛️',wiki:'故宫',intro:'明清两代皇宫，旧称紫禁城。明成祖朱棣于永乐四年（1406 年）下诏始建，征调百万工匠、历时十四年建成。占地 72 万平方米，房屋九千余间，是世界上现存规模最大、保存最完整的木质结构宫殿建筑群。1925 年辟为故宫博物院，1987 年成为中国首批世界文化遗产。'},
      {name:'长城',emoji:'🧱',wiki:'长城',intro:'始建于西周，秦代连缀成万里，明代大规模重修。八达岭、慕田峪段依山势蜿蜒，是冷兵器时代最伟大的军事防御工程。"不到长城非好汉"使其成为家喻户晓的民族象征，1987 年列入世界文化遗产。'},
      {name:'天坛',emoji:'⛩️',wiki:'天坛',intro:'明永乐十八年（1420 年）建，是明清两代帝王冬至祭天、孟春祈谷之所。祈年殿以"天圆地方"为念，不用一根横梁，全凭 28 根楠木柱层层承托，是中国古建筑的巅峰之作，1998 年列入世界遗产。'}
    ] },
  { id:'shanghai', name:'上海', pinyin:'Shanghai', region:'华东', description:'魔都风云，东方明珠', attractions:['外滩','迪士尼','东方明珠'], bestSeason:'春秋', emoji:'🌃', color:'#2e86ab', gradient:'linear-gradient(135deg,#1a5276,#2e86ab)', coord:[31.2304,121.4737],
    spots:[
      {name:'外滩',emoji:'🌆',wiki:'上海外滩',intro:'1843 年上海开埠后，外资银行与洋行沿黄浦江兴建起 52 栋风格各异的万国建筑博览群（哥特、巴洛克、罗马式等）。对岸陆家嘴的摩天楼群与之隔江相望，是"东方巴黎"百年沧桑的最佳注脚，夜景尤为迷人。'},
      {name:'迪士尼',emoji:'🏰',wiki:'上海迪士尼乐园',intro:'2016 年开园，是中国大陆首座迪士尼主题乐园。中央的奇幻童话城堡为全球最高最大，融合十二位迪士尼公主的故事。创极速光轮、七个小矮人矿山车等项目中西合璧，是亲子打卡胜地。'},
      {name:'东方明珠',emoji:'🗼',wiki:'东方明珠广播电视塔',intro:'1994 年落成的上海地标电视塔，高 468 米，11 个大小不一的球体串联如"大珠小珠落玉盘"。263 米主观光层与 259 米全透明悬空走廊可俯瞰黄浦江两岸，塔身灯光随节日变幻。'}
    ] },
  { id:'chengdu', name:'成都', pinyin:'Chengdu', region:'西南', description:'天府之国，熊猫故乡', attractions:['大熊猫基地','宽窄巷子','锦里'], bestSeason:'春秋', emoji:'🐼', color:'#2ecc71', gradient:'linear-gradient(135deg,#27ae60,#2ecc71)', coord:[30.5728,104.0668],
    spots:[
      {name:'大熊猫基地',emoji:'🐼',wiki:'成都大熊猫繁育研究基地',intro:'成都大熊猫繁育研究基地建于 1987 年，由抢救的 6 只病饿大熊猫发展而来，如今圈养种群逾 200 只，是全球最重要的熊猫科研与保护机构。基地模拟山地竹林生境，可近距离观看幼崽嬉戏。'},
      {name:'宽窄巷子',emoji:'🏘️',wiki:'宽窄巷子',intro:'由宽巷子、窄巷子、井巷子三条清代古街组成，是老成都"少城"遗留下的兵丁胡同格局。青砖院落里茶馆、川剧、掏耳朵与盖碗茶交织，是体验成都慢生活的活标本。'},
      {name:'锦里',emoji:'🏮',wiki:'锦里',intro:'紧邻武侯祠的川西风情古街，得名于古"锦官城"。以三国文化为底，红灯笼下是担担面、糖油果子、三大炮等小吃，夜幕下的锦里最具市井烟火气，被誉为"成都版清明上河图"。'}
    ] },
  { id:'hangzhou', name:'杭州', pinyin:'Hangzhou', region:'华东', description:'人间天堂，西湖美景', attractions:['西湖','灵隐寺','宋城'], bestSeason:'春秋', emoji:'🏞️', color:'#1abc9c', gradient:'linear-gradient(135deg,#16a085,#1abc9c)', coord:[30.2741,120.1551],
    spots:[
      {name:'西湖',emoji:'🌊',wiki:'杭州西湖',intro:'三面云山一面城，自唐代白居易、宋代苏轼疏浚筑堤便成名湖。苏堤、白堤、断桥、三潭印月构成"西湖十景"。2011 年以"文化景观"列入世界遗产，"欲把西湖比西子"道尽其温婉。'},
      {name:'灵隐寺',emoji:'🛕',wiki:'灵隐寺',intro:'始建于东晋咸和元年（326 年），印度僧人慧理见飞来峰叹"仙灵所隐"而得名。寺隐于北高峰下，飞来峰石窟存元代造像百余尊，济公传说更添传奇，自古为江南禅林之首。'},
      {name:'宋城',emoji:'🎭',wiki:'杭州宋城',intro:'以南宋临安（杭州）风貌打造的主题景区，核心演出《宋城千古情》以良渚、南宋等历史片段编演，与拉斯维加斯"O 秀"、巴黎"红磨坊"并称世界三大名秀，年演出逾千场。'}
    ] },
  { id:'xian', name:'西安', pinyin:'Xian', region:'西北', description:'十三朝古都，丝路起点', attractions:['兵马俑','大雁塔','古城墙'], bestSeason:'春秋', emoji:'⛩️', color:'#c0392b', gradient:'linear-gradient(135deg,#d4a574,#c0392b)', coord:[34.3416,108.9398],
    spots:[
      {name:'兵马俑',emoji:'🗿',wiki:'兵马俑',intro:'1974 年临潼农民打井时意外发现，是秦始皇陵的陪葬军阵。约八千件与真人等大的陶俑，兵种、面容、服饰无一雷同，再现秦军雄风，被誉为"世界第八大奇迹"，1987 年随秦始皇陵列入世界遗产。'},
      {name:'大雁塔',emoji:'📜',wiki:'大雁塔',intro:'唐永徽三年（652 年）玄奘为保存自天竺取回的梵文经卷而建，初为五层，后增至七层。登塔可俯瞰古城，广场的音乐喷泉与夜景今成打卡热点，与荐福寺小雁塔并称"二圣"。'},
      {name:'古城墙',emoji:'🧱',wiki:'西安城墙',intro:'明洪武年间在唐皇城基础上扩建，是中国现存最完整、规模最大的古代城垣，周长 13.74 公里。城墙宽阔可驰车，骑行或漫步其上，城门箭楼依旧，千年长安气象扑面而来。'}
    ] },
  { id:'chongqing', name:'重庆', pinyin:'Chongqing', region:'西南', description:'山城雾都，火锅之城', attractions:['洪崖洞','长江索道','磁器口'], bestSeason:'春秋', emoji:'🌆', color:'#8e44ad', gradient:'linear-gradient(135deg,#8e44ad,#c0392b)', coord:[29.4316,106.9123],
    spots:[
      {name:'洪崖洞',emoji:'🏯',wiki:'洪崖洞',intro:'位于嘉陵江畔崖壁上的吊脚楼群，依山就势十一层，夜灯亮起如《千与千寻》的汤屋。原名"洪崖门"为重庆古九门之一，今集火锅、酒吧与民俗于一体，是魔幻山城的封面。'},
      {name:'长江索道',emoji:'🚡',wiki:'长江索道',intro:'1987 年建成，横跨长江连接渝中区与南岸区，被誉为"万里长江第一条空中走廊"。车厢凌空而过，俯瞰两江交汇与错落立体的山城，是感受重庆"8D 魔幻"的最佳方式。'},
      {name:'磁器口',emoji:'🏘️',wiki:'磁器口古镇',intro:'嘉陵江畔的千年古镇，因明清瓷器转运而得名，曾是繁华的水陆码头。青石板街、陈麻花、川剧清音与老茶馆延续着老重庆的码头记忆，是主城中最具古韵的街巷。'}
    ] },
  { id:'sanya', name:'三亚', pinyin:'Sanya', region:'华南', description:'热带天堂，海岛度假', attractions:['亚龙湾','天涯海角','蜈支洲岛'], bestSeason:'冬', emoji:'🏖️', color:'#00b4d8', gradient:'linear-gradient(135deg,#00b4d8,#0077b6)', coord:[18.2528,109.5119],
    spots:[
      {name:'亚龙湾',emoji:'🏖️',wiki:'亚龙湾',intro:'三亚东南的"天下第一湾"，7 公里银白沙滩形如新月，海水能见度逾 10 米。背靠青山、椰林绵延，终年可浴，是高端度假酒店与潜水、帆板等水上运动的天堂。'},
      {name:'天涯海角',emoji:'🪨',wiki:'天涯海角',intro:'海滨巨石上刻"天涯""海角""南天一柱"，始于清代官员题刻。古人视此为天之尽头、贬谪绝境，今引申为浪漫与远方，是三亚最具辨识度的地标与爱情打卡点。'},
      {name:'蜈支洲岛',emoji:'🏝️',wiki:'蜈支洲岛',intro:'海棠湾内的珊瑚岛，海水清澈如琉璃，珊瑚与热带鱼群清晰可辨，有"中国马尔代夫"之誉。潜水、摩托艇、直升机观光等项目丰富，也是电影《私人订制》的取景地。'}
    ] },
  { id:'guilin', name:'桂林', pinyin:'Guilin', region:'华南', description:'山水甲天下', attractions:['漓江','阳朔','象鼻山'], bestSeason:'春秋', emoji:'⛰️', color:'#27ae60', gradient:'linear-gradient(135deg,#2ecc71,#27ae60)', coord:[25.2736,110.29],
    spots:[
      {name:'漓江',emoji:'🛶',wiki:'漓江',intro:'桂林至阳朔 83 公里水路，是"桂林山水甲天下"的精华。乘竹筏漂流，象鼻山、九马画山、黄布倒影次第展开，二十元人民币背面的漓江山水即取景于此，如行水墨长卷。'},
      {name:'阳朔',emoji:'🏞️',wiki:'阳朔',intro:'漓江畔的山水小镇，自唐宋便为隐居胜地。西街融中西风情，遇龙河竹筏、十里画廊骑行、实景演出《印象·刘三姐》闻名。徐悲鸿曾赞"阳朔美甲天下"。'},
      {name:'象鼻山',emoji:'🐘',wiki:'象鼻山',intro:'桂林城徽，山体神似巨象临江饮水，象鼻与象腿间形成"水月洞"。历代文人题刻满布，陆游、范成大均留墨，是这座山水之城最负盛名的自然奇观。'}
    ] },
  { id:'lijiang', name:'丽江', pinyin:'Lijiang', region:'西南', description:'古城韵味，雪山壮丽', attractions:['丽江古城','玉龙雪山','泸沽湖'], bestSeason:'春秋冬', emoji:'🏔️', color:'#764ba2', gradient:'linear-gradient(135deg,#667eea,#764ba2)', coord:[26.8721,100.233],
    spots:[
      {name:'丽江古城',emoji:'🏘️',wiki:'丽江古城',intro:'始建于宋末，纳西族聚居的千年古镇，1997 年列入世界文化遗产。玉河水系穿街走巷，四方街、木府与东巴象形文字承载纳西古乐与母系遗风，被誉为"高原姑苏"。'},
      {name:'玉龙雪山',emoji:'❄️',wiki:'玉龙雪山',intro:'纳西族神山，13 座雪峰南北纵列如玉龙腾空，主峰扇子陡 5596 米终年积雪。乘大索道可登 4506 米冰川公园，山麓蓝月谷湖水澄蓝如镜，是丽江的灵魂地标。'},
      {name:'泸沽湖',emoji:'🌊',wiki:'泸沽湖',intro:'川滇交界的高原湖泊，摩梭人"女儿国"走婚文化独特——"男不娶、女不嫁"，以母系大家庭为核心。猪槽船划过水性杨花点缀的湖面，晨雾中的里格半岛如世外桃源。'}
    ] },
  { id:'zhangjiajie', name:'张家界', pinyin:'Zhangjiajie', region:'华中', description:'阿凡达取景，奇峰异石', attractions:['森林公园','天门山','玻璃栈道'], bestSeason:'春秋', emoji:'🌲', color:'#52b788', gradient:'linear-gradient(135deg,#2d6a4f,#52b788)', coord:[29.117,110.4791],
    spots:[
      {name:'森林公园',emoji:'🌲',wiki:'张家界国家森林公园',intro:'1982 年中国首个国家森林公园，三千余座石英砂岩峰林拔地而起，云雾缭绕如仙境。电影《阿凡达》中悬浮的"哈利路亚山"即以这里的乾坤柱为原型，故改名"哈利路亚山"。'},
      {name:'天门山',emoji:'🚠',wiki:'天门山 (张家界)',intro:'张家界之巅，因自然穿山溶洞"天门洞"得名。99 道弯的盘山公路号称"通天大道"，长 7455 米的索道为世界之最，贴崖而建的玻璃栈道惊险与云海并存。'},
      {name:'玻璃栈道',emoji:'🪟',wiki:'张家界玻璃栈道',intro:'悬挂于天门山悬崖之上的透明步道，脚下万丈深渊一览无余。挑战胆量的同时，可将奇峰、幽谷、云海尽收眼底，是张家界最刺激的体验项目之一。'}
    ] },
  { id:'xiamen', name:'厦门', pinyin:'Xiamen', region:'华东', description:'海上花园，鼓浪屿风情', attractions:['鼓浪屿','环岛路','南普陀'], bestSeason:'春秋', emoji:'🌅', color:'#f7971e', gradient:'linear-gradient(135deg,#f7971e,#ffd200)', coord:[24.4798,118.0894],
    spots:[
      {name:'鼓浪屿',emoji:'🎹',wiki:'鼓浪屿',intro:'厦门西南的海上花园小岛，2017 年列入世界文化遗产。近代曾为公共租界，留下千余栋中西合璧的万国建筑，钢琴密度冠绝全国，故有"琴岛"之称。日光岩、菽庄花园与蜿蜒小巷浪漫静谧。'},
      {name:'环岛路',emoji:'🚴',wiki:'厦门环岛路',intro:'依海岸而建的滨海景观大道，被誉为"最美马拉松赛道"。椰风海韵一路相伴，胡里山炮台、书法广场点缀其间，骑行或漫步于落日时分，金色的海面尤为动人。'},
      {name:'南普陀',emoji:'🛕',wiki:'南普陀寺',intro:'鹭岛名刹，始建于唐代，依五老峰面朝厦门湾。闽南佛学院所在地，素斋与南普陀素饼远近闻名。寺后登山可俯瞰厦大与上弦场，香火与书声相映成趣。'}
    ] },
  { id:'qingdao', name:'青岛', pinyin:'Qingdao', region:'华东', description:'红瓦绿树，碧海蓝天', attractions:['栈桥','八大关','崂山'], bestSeason:'夏秋', emoji:'🍺', color:'#0097e6', gradient:'linear-gradient(135deg,#0097e6,#48dbfb)', coord:[36.0671,120.3826],
    spots:[
      {name:'栈桥',emoji:'🌊',wiki:'青岛栈桥',intro:'青岛的城市原点，始建于清光绪十八年（1892 年），原是军事码头。长桥伸入青岛湾，桥端回澜阁八角重檐，是"红瓦绿树、碧海蓝天"的城市象征，也是最早的观光地标。'},
      {name:'八大关',emoji:'🏡',wiki:'八大关',intro:'以长城八大关隘命名的街区，汇聚俄、英、法、德等二十余国建筑风格的别墅，花石楼最为著名。四季花木掩映，春日碧桃、秋日银杏，浪漫静美如万国建筑博物馆。'},
      {name:'崂山',emoji:'⛰️',wiki:'崂山',intro:'耸立于黄海之滨，素有"海上名山第一"之称，道教全真派发祥地之一。太清宫古树参天、清幽古朴，蒲松龄《聊斋》中"崂山道士"即取材于此，山海相依的意境独步天下。'}
    ] },
  { id:'changsha', name:'长沙', pinyin:'Changsha', region:'华中', description:'网红之都，烟火星城', attractions:['橘子洲','岳麓山','湖南省博物馆'], bestSeason:'春秋', emoji:'🍜', color:'#e84393', gradient:'linear-gradient(135deg,#d6336c,#e84393)', coord:[28.2282,112.9388],
    spots:[
      {name:'橘子洲',emoji:'🌊',wiki:'橘子洲',intro:'湘江中流的江心洲，因毛泽东《沁园春·长沙》"独立寒秋，湘江北去，橘子洲头"闻名。青年毛泽东艺术雕塑高 32 米，洲上草坪、橘园与音乐喷泉相映，是长沙最具地标性的城市客厅。'},
      {name:'岳麓山',emoji:'🍁',wiki:'岳麓山',intro:'湘江西岸的青翠山峦，有"岳麓之胜，甲于楚湘"之誉。山间爱晚亭因杜牧"停车坐爱枫林晚"成名，岳麓书院为千年学府，山下湖南大学书香绵延，秋来红枫满山。'},
      {name:'湖南省博物馆',emoji:'🏛️',wiki:'湖南省博物馆',intro:'馆藏以马王堆汉墓出土文物最为震撼——素纱襌衣薄如蝉翼、T 形帛画与千年不腐的女尸辛追，完整再现西汉贵族生活，是了解楚汉文明的必访之地。'}
    ] },
  { id:'wuhan', name:'武汉', pinyin:'Wuhan', region:'华中', description:'江城武汉，樱花之城', attractions:['黄鹤楼','东湖','武汉大学'], bestSeason:'春秋', emoji:'🌸', color:'#2d98da', gradient:'linear-gradient(135deg,#2980b9,#2d98da)', coord:[30.5928,114.3055],
    spots:[
      {name:'黄鹤楼',emoji:'🏯',wiki:'黄鹤楼',intro:'江南三大名楼之首，"黄鹤一去不复返，白云千载空悠悠"传诵千年。始建于三国，屡毁屡建，今楼雄踞蛇山之巅、俯瞰万里长江与武汉长江大桥，是江城的精神坐标。'},
      {name:'东湖',emoji:'🚲',wiki:'东湖 (武汉)',intro:'中国最大的城中湖，水域达 33 平方公里。绿道环湖百余公里，磨山樱园春日繁花似雪，听涛、落雁景区各具意趣，是市民骑行慢跑的天然氧吧。'},
      {name:'武汉大学',emoji:'🌸',wiki:'武汉大学',intro:'百年学府，民国建筑掩映于珞珈山下。每年三月千株樱花次第绽放，老斋舍、樱顶老图与"武汉樱花"成为全网最火网红打卡，限流开放更显珍贵。'}
    ] },
  { id:'harbin', name:'哈尔滨', pinyin:'Harbin', region:'东北', description:'冰雪之城，东方莫斯科', attractions:['冰雪大世界','中央大街','圣索菲亚教堂'], bestSeason:'冬', emoji:'❄️', color:'#38bdf8', gradient:'linear-gradient(135deg,#0ea5e9,#38bdf8)', coord:[45.8038,126.535],
    spots:[
      {name:'冰雪大世界',emoji:'🏰',wiki:'哈尔滨冰雪大世界',intro:'每年冬季以松花江冰砖筑成的冰雪主题乐园，晶莹宝塔、冰滑梯与夜光城堡在霓虹下如童话王国，是"尔滨"冬季最耀眼的顶流网红 IP。'},
      {name:'中央大街',emoji:'🥃',wiki:'中央大街 (哈尔滨)',intro:'亚洲最长步行街之一，1450 米铺满百年前的面包石。两侧云集文艺复兴、巴洛克风格建筑，马迭尔冰棍、俄式西餐与冰雪夜景交织出浓浓异域风情。'},
      {name:'圣索菲亚教堂',emoji:'⛪',wiki:'圣索菲亚教堂 (哈尔滨)',intro:'始建于 1907 年的东正教教堂，墨绿穹顶与红砖墙在雪中格外肃穆，是哈尔滨"东方莫斯科"城市记忆的地标，夜间灯光秀常引游人驻足。'}
    ] },
  { id:'dali', name:'大理', pinyin:'Dali', region:'西南', description:'风花雪月，苍山洱海', attractions:['洱海','大理古城','苍山'], bestSeason:'春秋', emoji:'🏞️', color:'#16a085', gradient:'linear-gradient(135deg,#1abc9c,#16a085)', coord:[25.6065,100.2678],
    spots:[
      {name:'洱海',emoji:'🌊',wiki:'洱海',intro:'苍山脚下的高原湖泊，因形似人耳得名。环海公路串起双廊、喜洲，白族民居与远处苍山雪倒映碧波，海西生态廊道骑行、日出时分的粼粼波光是治愈系旅拍圣地。'},
      {name:'大理古城',emoji:'🏘️',wiki:'大理古城',intro:'南诏国、大理国故都，棋盘式街巷保留明清格局。五华楼下市井烟火，洋人街酒吧与扎染坊并存，苍山为屏、洱海为镜，慢生活节奏令人忘忧。'},
      {name:'苍山',emoji:'⛰️',wiki:'苍山',intro:'十九峰横列如屏，峰峰积雪、溪溪飞瀑。感通寺、清碧溪与洗马潭索道可观云海与高山杜鹃，是大理"风花雪月"中"苍山雪"的所在。'}
    ] },
  { id:'lhasa', name:'拉萨', pinyin:'Lhasa', region:'西南', description:'日光之城，圣洁高原', attractions:['布达拉宫','大昭寺','八廓街'], bestSeason:'夏秋', emoji:'🛕', color:'#6c5ce7', gradient:'linear-gradient(135deg,#5b4be0,#8e7bef)', coord:[29.65,91.1],
    spots:[
      {name:'布达拉宫',emoji:'🏯',wiki:'布达拉宫',intro:'屹立于红山之上的宫堡式建筑群，松赞干布始建、五世达赖扩建，是藏式建筑的巅峰与藏传佛教圣地。白宫居政、红宫奉佛，1994 年列入世界文化遗产，必提前预约。'},
      {name:'大昭寺',emoji:'🛕',wiki:'大昭寺',intro:'建于公元 647 年，供奉文成公主带入的释迦牟尼十二岁等身像，是藏民心中最神圣的寺院。寺前八廓街转经人流不息，"先有大昭寺，后有拉萨城"。'},
      {name:'八廓街',emoji:'🧶',wiki:'八廓街',intro:'环绕大昭寺的转经道，也是拉萨最古老的街市。玛吉阿米的黄房子、唐卡与藏饰店铺林立，甜茶馆里听一段仓央嘉措的传说，最是拉萨烟火气。'}
    ] },
  { id:'suzhou', name:'苏州', pinyin:'Suzhou', region:'华东', description:'园林甲天下，最是江南', attractions:['拙政园','平江路','虎丘'], bestSeason:'春秋', emoji:'🌿', color:'#0984e3', gradient:'linear-gradient(135deg,#0c7cd5,#4aa3e0)', coord:[31.2989,120.5853],
    spots:[
      {name:'拙政园',emoji:'🌳',wiki:'拙政园',intro:'中国四大名园之首，明代官员辞官归隐所筑。以水为中心，亭台楼榭依水而建，借景北寺塔，一步一景，是江南古典园林"虽由人作，宛自天开"的典范。'},
      {name:'平江路',emoji:'🌿',wiki:'平江路',intro:'保存最完整的古城河街，八百年来水陆并行、河街相邻。青石板、小桥与评弹声里，奶茶店与手作铺子点缀，是苏州"最江南"的慢游路线。'},
      {name:'虎丘',emoji:'🗼',wiki:'虎丘',intro:'吴中第一山，云岩寺塔（虎丘塔）倾斜千年被誉为"东方比萨斜塔"。剑池、千人石与春秋吴王传说叠映，苏轼言"到苏州不游虎丘，乃憾事也"。'}
    ] },
  { id:'nanjing', name:'南京', pinyin:'Nanjing', region:'华东', description:'六朝古都，金陵烟水', attractions:['中山陵','夫子庙','玄武湖'], bestSeason:'春秋', emoji:'🏛️', color:'#e17055', gradient:'linear-gradient(135deg,#d35400,#e17055)', coord:[32.0603,118.7969],
    spots:[
      {name:'中山陵',emoji:'⛩️',wiki:'中山陵',intro:'紫金山南麓的孙中山先生陵寝，392 级台阶寓意三民主义。蓝瓦白墙、肃穆庄严，登高可俯瞰金陵城，梧桐大道四季皆景，是南京的精神地标。'},
      {name:'夫子庙',emoji:'🏮',wiki:'夫子庙',intro:'秦淮河畔的孔庙所在，自古文人荟萃。"桨声灯影里的秦淮河"画舫夜游、小吃琳琅，江南贡院见证千年科举，是南京最有人间烟火的历史街区。'},
      {name:'玄武湖',emoji:'🌊',wiki:'玄武湖',intro:'六朝皇家园林湖泊，五洲点缀、城墙环抱。台城段城墙可俯瞰湖光城影，春日樱洲如雪，是主城内难得的山水闲步之处。'}
    ] },
  { id:'tianjin', name:'天津', pinyin:'Tianjin', region:'华北', description:'曲艺之乡，洋楼津味', attractions:['天津之眼','五大道','意式风情区'], bestSeason:'春秋', emoji:'🎡', color:'#fd79a8', gradient:'linear-gradient(135deg,#e84393,#fd79a8)', coord:[39.3434,117.3616],
    spots:[
      {name:'天津之眼',emoji:'🎡',wiki:'天津之眼',intro:'横跨海河永乐桥的巨型摩天轮，高 120 米，是世界唯一建在桥上的摩天轮。入夜华灯流转，车厢升至顶端可俯瞰津城与海河，浪漫地标。'},
      {name:'五大道',emoji:'🏡',wiki:'五大道',intro:'由马场道等五条街道组成的租界风貌区，两千余栋花园洋房汇集英、法、意、德式建筑，睦南道上的名人旧居与海棠花海，是"万国建筑博览会"。'},
      {name:'意式风情区',emoji:'🍝',wiki:'天津意式风情区',intro:'亚洲最大的意大利风格建筑群，原意大利租界。马可波罗广场、回力球馆与红顶石砌小楼间咖啡飘香，是夜生活与浪漫兼具的历史街区。'}
    ] },
  { id:'guangzhou', name:'广州', pinyin:'Guangzhou', region:'华南', description:'千年商都，食在广州', attractions:['广州塔','陈家祠','沙面'], bestSeason:'秋冬', emoji:'🏙️', color:'#e84393', gradient:'linear-gradient(135deg,#d63031,#e84393)', coord:[23.1291,113.2644],
    spots:[
      {name:'广州塔',emoji:'🗼',wiki:'广州塔',intro:'昵称"小蛮腰"，高 600 米，2010 年落成时为世界最高电视塔之一。塔身采用扭转的镂空钢结构，云霄飞车、摩天轮与 488 米户外观景平台可饱览珠江两岸，夜景灯光随季节变幻。'},
      {name:'陈家祠',emoji:'🏯',wiki:'陈氏书院',intro:'清光绪年间建的岭南宗祠书院，集木雕、砖雕、石雕、灰塑、陶塑"三雕两塑"于一体，是广府建筑装饰艺术的巅峰，今为广东民间工艺博物馆。'},
      {name:'沙面',emoji:'🌿',wiki:'沙面',intro:'珠江岔流中的小岛，曾为英法租界。150 余栋新巴洛克、新古典与哥特式建筑掩于榕荫大道间，岛西的白天鹅宾馆与咖啡馆让这里成为慢拍的citywalk天堂。'}
    ] },
  { id:'huangshan', name:'黄山', pinyin:'Huangshan', region:'华东', description:'奇松怪石，云海日出', attractions:['黄山风景区','宏村','西递'], bestSeason:'春秋', emoji:'🏔️', color:'#0984e3', gradient:'linear-gradient(135deg,#0c7cd5,#4aa3e0)', coord:[29.7148,118.3375],
    spots:[
      {name:'黄山风景区',emoji:'🌄',wiki:'黄山',intro:'"五岳归来不看山，黄山归来不看岳"。奇松、怪石、云海、温泉、冬雪并称五绝，迎客松依崖而生千年。1990 年列入世界文化与自然双遗产，光明顶日出云海尤为震撼。'},
      {name:'宏村',emoji:'🏘️',wiki:'宏村',intro:'始建于南宋的徽派古村，以"牛形"水系闻名，月沼、南湖倒映粉墙黛瓦。2000 年与西递同列世界文化遗产，是徽州文化与写生摄影的圣地。'},
      {name:'西递',emoji:'🏯',wiki:'西递镇',intro:'胡适故里般的徽州古村落，胡文光牌坊与百余栋明清古民居保存完好，"桃花源里人家"。青石板巷、马头墙与楹联家训，是徽派村落的活标本。'}
    ] },
  { id:'guiyang', name:'贵阳', pinyin:'Guiyang', region:'西南', description:'爽爽贵阳，避暑之都', attractions:['甲秀楼','青岩古镇','黔灵山'], bestSeason:'夏', emoji:'🌿', color:'#10b981', gradient:'linear-gradient(135deg,#059669,#34d399)', coord:[26.647,106.6302],
    spots:[
      {name:'甲秀楼',emoji:'🏯',wiki:'甲秀楼',intro:'明万历年间建在南明河鳌矶石上的三层阁楼，朱梁碧瓦、夜灯倒映河中，"科甲挺秀"寓意人才辈出，是贵阳城徽与老城中心地标。'},
      {name:'青岩古镇',emoji:'🏘️',wiki:'青岩古镇',intro:'明初 military 屯堡，城墙、石板街与四教并存（佛、道、天主、基督）。卤猪脚、玫瑰糖与背街的百年石巷，是贵阳近郊最地道的明清古镇。'},
      {name:'黔灵山',emoji:'🐒',wiki:'黔灵山公园',intro:'城中的灵秀山岳，弘福寺香火鼎盛，猕猴成群穿行其间。九曲径、黔灵湖与动物园集自然与人文，是"黔南第一山"式的市郊绿肺。'}
    ] },
  { id:'shenyang', name:'沈阳', pinyin:'Shenyang', region:'东北', description:'盛京故都，工业重镇', attractions:['沈阳故宫','张氏帅府','九一八历史博物馆'], bestSeason:'夏秋', emoji:'🏯', color:'#6366f1', gradient:'linear-gradient(135deg,#4f46e5,#818cf8)', coord:[41.8057,123.4315],
    spots:[
      {name:'沈阳故宫',emoji:'🏯',wiki:'沈阳故宫',intro:'清入关前（后金/清初）的皇宫，1625 年始建，是中国现存第二大皇宫建筑群。大政殿八角重檐、十王亭一字排开，满蒙汉建筑交融，2004 年列入世界遗产。'},
      {name:'张氏帅府',emoji:'🏛️',wiki:'张氏帅府',intro:'北洋奉系军阀张作霖、张学良父子的官邸私宅，中西合璧的庞大建筑群。四合院、大青楼与赵四小姐楼见证民国风云，是与沈阳故宫相邻的近代史现场。'},
      {name:'九一八历史博物馆',emoji:'🕯️',wiki:'九一八历史博物馆',intro:'位于事变爆发地柳条湖旁，巨型残历碑铭刻 1931 年 9 月 18 日。陈列揭露侵华史实，是国家级爱国主义教育示范基地与重要历史纪念地。'}
    ] },
  { id:'luoyang', name:'洛阳', pinyin:'Luoyang', region:'华中', description:'十三朝古都，牡丹花城', attractions:['龙门石窟','白马寺','老君山'], bestSeason:'春秋', emoji:'🏯', color:'#e67e22', gradient:'linear-gradient(135deg,#d35400,#e67e22)', coord:[34.6197,112.4539],
    spots:[
      {name:'龙门石窟',emoji:'🗿',wiki:'龙门石窟',intro:'始凿于北魏，历时 400 余年。两山对峙、伊水穿流，十万尊造像中以卢舍那大佛最为恢宏，武则天据传以其容貌雕成。2000 年列入世界遗产。'},
      {name:'白马寺',emoji:'🛕',wiki:'白马寺',intro:'东汉永平年间创建，被尊为中国第一古刹、佛教传入中原的祖庭。齐云塔、缅甸风格佛殿与古柏掩映，是中原佛教的千年源头。'},
      {name:'老君山',emoji:'⛰️',wiki:'老君山 (栾川)',intro:'伏牛山主峰，海拔 2217 米，道教圣地。金顶道观群在云海间若隐若现，十里画屏、玻璃栈道让"远赴人间惊鸿宴"成为全网最火登山打卡。'}
    ] },
  { id:'dunhuang', name:'敦煌', pinyin:'Dunhuang', region:'西北', description:'丝路明珠，大漠奇观', attractions:['莫高窟','鸣沙山月牙泉','玉门关'], bestSeason:'夏秋', emoji:'🏜️', color:'#d4a017', gradient:'linear-gradient(135deg,#ca8a04,#d4a017)', coord:[40.1421,94.6612],
    spots:[
      {name:'莫高窟',emoji:'🕉️',wiki:'莫高窟',intro:'前秦开凿于鸣沙山的千年佛教石窟，现存 735 个洞窟、4.5 万平方米壁画与 2000 余身彩塑，是世界最大的佛教艺术宝库，1987 年首批世界文化遗产。'},
      {name:'鸣沙山月牙泉',emoji:'🌙',wiki:'鸣沙山月牙泉',intro:'沙山环抱中一弯清泉千年不涸，沙鸣如雷而泉不被掩。骑骆驼、滑沙、看日落，是丝绸之路上最梦幻的沙漠奇景。'},
      {name:'玉门关',emoji:'🧱',wiki:'玉门关',intro:'汉代边塞关城，"春风不度玉门关"传诵千年。残存的夯土城垣与汉长城、河仓城并称"河仓三城"，是丝路北道与边塞诗的地理坐标。'}
    ] },
  { id:'urumqi', name:'乌鲁木齐', pinyin:'Urumqi', region:'西北', description:'亚心之都，丝路门户', attractions:['天山天池','国际大巴扎','红山'], bestSeason:'夏秋', emoji:'🏔️', color:'#0ea5e9', gradient:'linear-gradient(135deg,#0284c7,#0ea5e9)', coord:[43.8256,87.6168],
    spots:[
      {name:'天山天池',emoji:'🏞️',wiki:'天山天池',intro:'博格达峰下的高山湖泊，海拔 1900 余米，湖水湛蓝如镜，雪峰倒映。西王母神话与哈萨克牧歌交织，是新疆最负盛名的高山避暑与滑雪胜地。'},
      {name:'国际大巴扎',emoji:'🕌',wiki:'新疆国际大巴扎',intro:'二道桥畔的世界最大巴扎（集市），23 万平方米集伊斯兰风情建筑、干果、手工艺与歌舞美食于一体，是体验维吾尔族市井与丝路商贸的最佳窗口。'},
      {name:'红山',emoji:'🪨',wiki:'红山公园',intro:'横卧市区的赭红色山体，因断崖如巨龙而得名。登远眺楼可俯瞰全城与博格达峰，是乌鲁木齐的城市绿心与落日观景地。'}
    ] },
  { id:'hulunbeier', name:'呼伦贝尔', pinyin:'Hulunbuir', region:'华北', description:'草原天堂，牧歌之乡', attractions:['呼伦贝尔大草原','满洲里','额尔古纳'], bestSeason:'夏秋', emoji:'🌾', color:'#2ecc71', gradient:'linear-gradient(135deg,#27ae60,#2ecc71)', coord:[49.212,119.7572],
    spots:[
      {name:'呼伦贝尔大草原',emoji:'🌾',wiki:'呼伦贝尔大草原',intro:'世界四大草原之一，水草丰美、一望无垠。莫日格勒河如银带蜿蜒，蒙古包、牛羊与套马汉子构成"风吹草低见牛羊"的北国牧歌。'},
      {name:'满洲里',emoji:'🏰',wiki:'满洲里',intro:'中俄蒙三国交界的口岸小城，套娃广场、哥特式建筑与金色穹顶在边境夜色中流光溢彩，是草原尽头最具异域风情的打卡地。'},
      {name:'额尔古纳',emoji:'🌊',wiki:'额尔古纳市',intro:'中俄界河湿地的源头，亚洲最美湿地蜿蜒如画。白桦林、驯鹿与俄罗斯族木刻楞民居，是呼伦贝尔最静谧的边境秘境。'}
    ] },
  { id:'taiyuan', name:'太原', pinyin:'Taiyuan', region:'华北', description:'龙城晋韵，晋商之源', attractions:['晋祠','平遥古城','乔家大院'], bestSeason:'春秋', emoji:'🏯', color:'#8e44ad', gradient:'linear-gradient(135deg,#7b2ff7,#8e44ad)', coord:[37.8706,112.5489],
    spots:[
      {name:'晋祠',emoji:'🛕',wiki:'晋祠',intro:'为纪念周武王次子叔虞而建的千年祠庙，圣母殿宋代彩塑侍女像栩栩如生，难老泉、鱼沼飞梁并称"晋祠三绝"，是现存最古老的皇家祭祀园林。'},
      {name:'平遥古城',emoji:'🏘️',wiki:'平遥古城',intro:'保存最完整的明清县城，城墙、县衙、票号（日昇昌）见证晋商辉煌。1997 年列入世界遗产，是"中国古代华尔街"活着的范本。'},
      {name:'乔家大院',emoji:'🏯',wiki:'乔家大院',intro:'祁县乔氏家族的晋商豪宅，六院十九进院落、上千间房屋，"皇家看故宫，民宅看乔家"。砖雕、彩绘与《大红灯笼高高挂》取景让它声名远扬。'}
    ] },
  { id:'nanchang', name:'南昌', pinyin:'Nanchang', region:'华东', description:'英雄城，赣鄱明珠', attractions:['滕王阁','八一广场','鄱阳湖'], bestSeason:'春秋', emoji:'🏯', color:'#ef4444', gradient:'linear-gradient(135deg,#dc2626,#ef4444)', coord:[28.682,115.8579],
    spots:[
      {name:'滕王阁',emoji:'🏯',wiki:'滕王阁',intro:'"落霞与孤鹜齐飞，秋水共长天一色"因王勃一篇序文而名垂千古。临赣江而建的江南名楼屡毁屡建，夜景灯光与《滕王阁序》实景演出再现盛唐气象。'},
      {name:'八一广场',emoji:'⭐',wiki:'八一广场 (南昌)',intro:'为纪念 1927 年南昌起义而建的城市中心广场，八一南昌起义纪念塔高耸。是"军旗升起的地方"，红色文化与城市休闲交织。'},
      {name:'鄱阳湖',emoji:'🦢',wiki:'鄱阳湖',intro:'中国第一大淡水湖，与赣江相连。冬季数十万只候鸟（白鹤、小天鹅）在此越冬，吴城、都昌的观鸟季是生态摄影者的天堂。'}
    ] },
  { id:'yinchuan', name:'银川', pinyin:'Yinchuan', region:'西北', description:'塞上江南，西夏古都', attractions:['沙湖','西夏王陵','镇北堡西部影城'], bestSeason:'秋', emoji:'🏜️', color:'#d97706', gradient:'linear-gradient(135deg,#b45309,#d97706)', coord:[38.4872,106.2309],
    spots:[
      {name:'沙湖',emoji:'🏝️',wiki:'沙湖 (宁夏)',intro:'沙漠与湖水相依的奇观，芦苇丛中万鸟翔集。乘船穿行沙与水之间，既有大漠孤烟也有碧波荡漾，是"塞上江南"的最佳注脚。'},
      {name:'西夏王陵',emoji:'🏯',wiki:'西夏王陵',intro:'西夏王朝的皇家陵寝，九座帝陵如金字塔般矗立贺兰山下，"东方金字塔"神秘而苍凉，是破解西夏文字与历史的关键遗址。'},
      {name:'镇北堡西部影城',emoji:'🎬',wiki:'镇北堡西部影城',intro:'由明清夯土城堡改造的影视基地，《大话西游》《红高粱》在此诞生。黄土城墙、月亮门与西北苍茫，是"中国最美影视城"式打卡地。'}
    ] },
  { id:'xining', name:'西宁', pinyin:'Xining', region:'西北', description:'夏都西宁，青藏门户', attractions:['青海湖','塔尔寺','茶卡盐湖'], bestSeason:'夏', emoji:'🏔️', color:'#0891b2', gradient:'linear-gradient(135deg,#0e7490,#0891b2)', coord:[36.6232,101.7804],
    spots:[
      {name:'青海湖',emoji:'🌊',wiki:'青海湖',intro:'中国最大内陆咸水湖，七月油菜花海环抱湛蓝湖水，骑行环湖是经典路线。鸟岛、沙岛与日出云水，是青藏高原最治愈的风景。'},
      {name:'塔尔寺',emoji:'🛕',wiki:'塔尔寺',intro:'藏传佛教格鲁派六大寺之一，宗喀巴大师诞生地。大金瓦殿金碧辉煌，"艺术三绝"（酥油花、壁画、堆绣）精美绝伦，是青海信仰与艺术的心脏。'},
      {name:'茶卡盐湖',emoji:'🧂',wiki:'茶卡盐湖',intro:'"天空之镜"，湖面如镜倒映天空与云朵，赤脚走入似行走云端。这片柴达木盆地的盐湖是青藏高原最梦幻的拍照圣地。'}
    ] },
  // === 高频二线城市补充：让"佛/珠/甬/锡/绍/榕/济/连"单字也能命中本地 ===
  { id:'foshan', name:'佛山', pinyin:'Foshan', region:'华南', description:'岭南名镇，功夫之城', attractions:['祖庙','岭南天地','清晖园'], bestSeason:'春秋', emoji:'🏛️', color:'#e67e22', gradient:'linear-gradient(135deg,#d35400,#e67e22)', coord:[23.0218,113.1219],
    spots:[
      {name:'祖庙',emoji:'🏛️',wiki:'佛山祖庙',intro:'供奉北方真武玄天上帝的明清古建筑群，黄飞鸿纪念馆、叶问堂集聚，是佛山武术与粤剧文化的精神祖庭。'},
      {name:'岭南天地',emoji:'🏘️',wiki:'岭南天地',intro:'以岭南古街巷为骨，融合现代商业的开放式街区。青砖瓦房与时尚店铺相映，是佛山最国际范的休闲地标。'},
      {name:'清晖园',emoji:'🌿',wiki:'清晖园',intro:'广东四大名园之一，明代龙氏世居之地。亭台水榭、小桥流水、木石竹雕，处处是岭南园林的精致与温婉。'}
    ] },
  { id:'zhuhai', name:'珠海', pinyin:'Zhuhai', region:'华南', description:'浪漫之城，百岛之市', attractions:['情侣路','圆明新园','外伶仃岛'], bestSeason:'春秋', emoji:'🏖️', color:'#16a085', gradient:'linear-gradient(135deg,#0e7e7e,#16a085)', coord:[22.271,113.5767],
    spots:[
      {name:'情侣路',emoji:'🌅',wiki:'情侣路',intro:'珠海最浪漫的城市海岸线，全长55公里串起渔女、香洲湾、海滨公园，骑双人单车俯瞰南海是来珠海必打卡。'},
      {name:'圆明新园',emoji:'🏯',wiki:'圆明新园',intro:'按1:1比例复刻北京圆明园精华（18景）的皇家园林主题公园，依山傍海，是珠海第一座大型历史文化景区。'},
      {name:'外伶仃岛',emoji:'🏝️',wiki:'外伶仃岛',intro:'万山群岛中具代表性的海岛，登山俯瞰伶仃洋、看"一国两制"分界线，是珠海人最爱的海岛度假地。'}
    ] },
  { id:'dongguan', name:'东莞', pinyin:'Dongguan', region:'华南', description:'制造名城，活力之城', attractions:['可园','鸦片战争博物馆','松山湖'], bestSeason:'春秋', emoji:'🏭', color:'#f39c12', gradient:'linear-gradient(135deg,#e67e22,#f39c12)', coord:[23.0207,113.7518],
    spots:[
      {name:'可园',emoji:'🌿',wiki:'可园',intro:'广东四大名园之一，张敬修私人花园邀山阁、双清室精巧雅致，是岭南"小园极致"风格的代表。'},
      {name:'鸦片战争博物馆',emoji:'🏛️',wiki:'虎门鸦片战争博物馆',intro:'林则徐销烟旧址，"虎门销烟"见证地。威远炮台古炮与历史文物，让人重温近代史最壮烈的开端。'},
      {name:'松山湖',emoji:'🌊',wiki:'松山湖',intro:'国家级高新区里的生态湖区，华为欧洲小镇坐落湖畔。骑行、跑步、皮划艇，周边是科技与自然融合的现代景区。'}
    ] },
  { id:'wuxi', name:'无锡', pinyin:'Wuxi', region:'华东', description:'太湖明珠，吴文化发源地', attractions:['鼋头渚','灵山胜境','惠山古镇'], bestSeason:'春秋', emoji:'🌸', color:'#ec407a', gradient:'linear-gradient(135deg,#d81b60,#ec407a)', aliases:['锡'], coord:[31.4912,120.3119],
    spots:[
      {name:'鼋头渚',emoji:'🌸',wiki:'鼋头渚',intro:'太湖西北岸伸入湖中的半岛，每年三月底数万株樱花如雪，被誉"世界三大赏樱胜地"之一。'},
      {name:'灵山胜境',emoji:'🗿',wiki:'灵山胜境',intro:'88米高的灵山大佛矗立湖畔，梵宫金碧辉煌。九龙灌浴大型动态铜群雕是佛教艺术杰作。'},
      {name:'惠山古镇',emoji:'🏘️',wiki:'惠山古镇',intro:'118座历代祠堂串联的古街，惠山泥人、豆腐花、无锡小笼包是江南水乡最生活的气息。'}
    ] },
  { id:'ningbo', name:'宁波', pinyin:'Ningbo', region:'华东', description:'港通天下，书香悠远', attractions:['天一阁博物馆','老外滩','普陀山'], bestSeason:'春秋', emoji:'⛵', color:'#0288d1', gradient:'linear-gradient(135deg,#01579b,#0288d1)', aliases:['甬'], coord:[29.8683,121.544],
    spots:[
      {name:'天一阁博物馆',emoji:'📚',wiki:'天一阁',intro:'中国现存最古老的私家藏书楼，明代范钦所建。"南国书城"三十六万卷明清刻本，是读书人的朝圣地。'},
      {name:'老外滩',emoji:'🌃',wiki:'宁波老外滩',intro:'比上海外滩还早20年的中国最早"外滩"，欧式老建筑与现代酒吧、餐厅融合，是宁波夜生活的中心。'},
      {name:'普陀山',emoji:'🛕',wiki:'普陀山',intro:'中国佛教四大名山之一，观音菩萨道场。海天佛国、潮音古洞，是华东最具灵性的海岛佛教圣地。'}
    ] },
  { id:'shaoxing', name:'绍兴', pinyin:'Shaoxing', region:'华东', description:'鲁迅故里，水乡古城', attractions:['鲁迅故里','沈园','兰亭'], bestSeason:'春秋', emoji:'🍶', color:'#7b2d8e', gradient:'linear-gradient(135deg,#5b2c6f,#7b2d8e)', coord:[30.0023,120.581],
    spots:[
      {name:'鲁迅故里',emoji:'📖',wiki:'鲁迅故里',intro:'百草园、三味书屋原貌保留，乌篷船、绍兴黄酒、香糕臭豆腐，是从课本走进现实的江南文脉之旅。'},
      {name:'沈园',emoji:'🌸',wiki:'沈园',intro:'南宋陆游与唐婉《钗头凤》题壁处，江南古典园林典范，与古人隔池塘咏唱钗头凤，是爱情诗的伤心园。'},
      {name:'兰亭',emoji:'🖌️',wiki:'兰亭',intro:'王羲之《兰亭集序》诞生地，曲水流觞、茂林修竹。每年书法节重现千年雅集，是书法人必经之处。'}
    ] },
  { id:'fuzhou', name:'福州', pinyin:'Fuzhou', region:'华东', description:'有福之州，温泉闽都', attractions:['三坊七巷','鼓山','平潭岛'], bestSeason:'春秋冬', emoji:'🌳', color:'#16a34a', gradient:'linear-gradient(135deg,#15803d,#16a34a)', aliases:['榕'], coord:[26.0745,119.2965],
    spots:[
      {name:'三坊七巷',emoji:'🏘️',wiki:'三坊七巷',intro:'明清古建筑群，被誉为"中国城市里坊制度活化石"。林则徐、严复、冰心故居散布坊巷，是闽都文化核心。'},
      {name:'鼓山',emoji:'⛰️',wiki:'鼓山',intro:'福州东郊第一名山，涌泉寺千年古刹、十八景山径。登高眺望闽江口，是周末登山的经典路线。'},
      {name:'平潭岛',emoji:'🏝️',wiki:'平潭岛',intro:'福建第一大岛，"蓝眼泪"奇观每年春夏在海湾闪烁。石头厝渔村、东海仙境，是闽东最浪漫的海岛。'}
    ] },
  { id:'jinan', name:'济南', pinyin:'Jinan', region:'华东', description:'泉城济南，天下泉都', attractions:['趵突泉','大明湖','千佛山'], bestSeason:'春秋', emoji:'⛲', color:'#0ea5e9', gradient:'linear-gradient(135deg,#0284c7,#0ea5e9)', coord:[36.6512,117.1201],
    spots:[
      {name:'趵突泉',emoji:'⛲',wiki:'趵突泉',intro:'济南72名泉之首，被誉为"天下第一泉"。三股水昼夜喷涌，李清照故宅在侧，名副其实的泉城灵魂。'},
      {name:'大明湖',emoji:'🛶',wiki:'大明湖',intro:'由众泉汇聚而成的城中湖，荷花映柳、夏雨荷亭。"蛇不见、蛙不鸣"的独特生态令古人生出诸多遐想。'},
      {name:'千佛山',emoji:'🏯',wiki:'千佛山',intro:'隋开皇年间依山势雕凿数千佛像而成的佛教名山，与趵突泉、大明湖并称济南三大名胜。'}
    ] },
  { id:'dalian', name:'大连', pinyin:'Dalian', region:'东北', description:'北方明珠，浪漫海滨', attractions:['老虎滩海洋公园','星海广场','金石滩'], bestSeason:'夏秋', emoji:'🦭', color:'#06b6d4', gradient:'linear-gradient(135deg,#0891b2,#06b6d4)', coord:[38.914,121.6147],
    spots:[
      {name:'老虎滩海洋公园',emoji:'🐬',wiki:'老虎滩海洋公园',intro:'国家级海洋主题公园，珊瑚馆、极地馆、海兽馆与鸟语林串联，是东北最具规模的海滨观光胜地。'},
      {name:'星海广场',emoji:'🌊',wiki:'星海广场',intro:'亚洲最大城市广场，毗邻星海公园与百年城雕，跨海大桥、星海湾是俯瞰大连海岸的最佳视角。'},
      {name:'金石滩',emoji:'🏖️',wiki:'金石滩',intro:'国家地质公园，海蚀奇石十里长滩。神力雕塑公园里"巨兽"般的风化岩，亿年海岸的鬼斧神工。'}
    ] }
];

const travelTips = [
  { icon:'🧳', title:'行前查天气', desc:'出发前查看目的地3天天气预报，根据天气准备衣物和装备，避免到了才发现行李不对。' },
  { icon:'📱', title:'必备APP', desc:'天气APP、地图导航、翻译软件是旅行三件套，提前下载好离线地图以防断网。' },
  { icon:'💊', title:'健康安全', desc:'随身携带常用药（感冒药、肠胃药、创可贴），高原地区提前准备抗高反药物。' },
  { icon:'📷', title:'拍照最佳时间', desc:'日出后1小时和日落前1小时是黄金拍摄时段，光线柔和，出片率最高。' },
  { icon:'🍜', title:'美食探索', desc:'到了新城市先逛当地夜市和菜市场，那里藏着最地道的美食和最真实的市井气息。' },
  { icon:'🚗', title:'交通出行', desc:'城市内优先地铁+步行，城际间高铁最方便，偏远景区建议提前包车或拼车。' }
];

function getWeatherIcon(desc) {
  const d = (desc || '').toLowerCase();
  if (d.includes('sunny') || d.includes('clear')) return '☀️';
  if (d.includes('partly cloudy')) return '⛅';
  if (d.includes('cloudy')) return '☁️';
  if (d.includes('overcast')) return '🌥️';
  if (d.includes('fog') || d.includes('mist')) return '🌫️';
  if (d.includes('heavy rain') || d.includes('thunder')) return '⛈️';
  if (d.includes('moderate rain')) return '🌧️';
  if (d.includes('light rain') || d.includes('drizzle') || d.includes('patchy rain')) return '🌦️';
  if (d.includes('heavy snow') || d.includes('blizzard')) return '❄️';
  if (d.includes('snow')) return '🌨️';
  return '🌤️';
}

/* 动态天气图标（SVG + SMIL 动画，file:// 也能动） */
function weatherSVG(desc, size) {
  size = size || 64;
  var d = (desc || '').toLowerCase();
  if (d.indexOf('thunder') >= 0 || d.indexOf('thundery') >= 0) return thunderSVG(size);
  if (d.indexOf('snow') >= 0 || d.indexOf('sleet') >= 0) return snowSVG(size);
  if (d.indexOf('rain') >= 0 || d.indexOf('drizzle') >= 0 || d.indexOf('shower') >= 0) return rainSVG(size);
  if (d.indexOf('fog') >= 0 || d.indexOf('mist') >= 0) return fogSVG(size);
  if (d.indexOf('partly') >= 0 || d.indexOf('cloudy') >= 0 || d.indexOf('overcast') >= 0) return cloudSVG(size);
  return sunSVG(size);
}

function sunSVG(s) {
  return '<svg viewBox="0 0 64 64" width="' + s + '" height="' + s + '" aria-hidden="true">' +
    '<g>' +
    '<circle cx="32" cy="32" r="13" fill="#fbbf24"/>' +
    '<g stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round">' +
    '<line x1="32" y1="6" x2="32" y2="14"/>' +
    '<line x1="32" y1="50" x2="32" y2="58"/>' +
    '<line x1="6" y1="32" x2="14" y2="32"/>' +
    '<line x1="50" y1="32" x2="58" y2="32"/>' +
    '<line x1="13" y1="13" x2="19" y2="19"/>' +
    '<line x1="45" y1="45" x2="51" y2="51"/>' +
    '<line x1="51" y1="13" x2="45" y2="19"/>' +
    '<line x1="19" y1="45" x2="13" y2="51"/>' +
    '</g>' +
    '<animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="16s" repeatCount="indefinite"/>' +
    '</g></svg>';
}

function cloudSVG(s) {
  return '<svg viewBox="0 0 64 64" width="' + s + '" height="' + s + '" aria-hidden="true">' +
    '<g>' +
    '<path d="M20 42 a11 11 0 0 1 2 -21 a15 15 0 0 1 27 -3 a11 11 0 0 1 1 24 Z" fill="#cbd5e1"/>' +
    '<animateTransform attributeName="transform" type="translate" values="0 0; 3 0; 0 0; -3 0; 0 0" dur="5s" repeatCount="indefinite"/>' +
    '</g></svg>';
}

function rainSVG(s) {
  return '<svg viewBox="0 0 64 64" width="' + s + '" height="' + s + '" aria-hidden="true">' +
    '<g><path d="M20 38 a11 11 0 0 1 2 -21 a15 15 0 0 1 27 -3 a11 11 0 0 1 1 24 Z" fill="#cbd5e1"/></g>' +
    '<g stroke="#3b82f6" stroke-width="3" stroke-linecap="round">' +
    '<line x1="24" y1="44" x2="22" y2="54"><animate attributeName="y1" values="44;54;44" dur="1s" repeatCount="indefinite"/><animate attributeName="y2" values="54;64;54" dur="1s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite"/></line>' +
    '<line x1="32" y1="44" x2="30" y2="54"><animate attributeName="y1" values="44;54;44" dur="1s" begin="0.3s" repeatCount="indefinite"/><animate attributeName="y2" values="54;64;54" dur="1s" begin="0.3s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.2;1" dur="1s" begin="0.3s" repeatCount="indefinite"/></line>' +
    '<line x1="40" y1="44" x2="38" y2="54"><animate attributeName="y1" values="44;54;44" dur="1s" begin="0.6s" repeatCount="indefinite"/><animate attributeName="y2" values="54;64;54" dur="1s" begin="0.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.2;1" dur="1s" begin="0.6s" repeatCount="indefinite"/></line>' +
    '</g></svg>';
}

function snowSVG(s) {
  return '<svg viewBox="0 0 64 64" width="' + s + '" height="' + s + '" aria-hidden="true">' +
    '<g><path d="M20 38 a11 11 0 0 1 2 -21 a15 15 0 0 1 27 -3 a11 11 0 0 1 1 24 Z" fill="#cbd5e1"/></g>' +
    '<g fill="#93c5fd">' +
    '<circle cx="24" cy="48" r="2.5"><animate attributeName="cy" values="44;56;44" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite"/></circle>' +
    '<circle cx="32" cy="48" r="2.5"><animate attributeName="cy" values="44;56;44" dur="1.6s" begin="0.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.3;1" dur="1.6s" begin="0.5s" repeatCount="indefinite"/></circle>' +
    '<circle cx="40" cy="48" r="2.5"><animate attributeName="cy" values="44;56;44" dur="1.6s" begin="1s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.3;1" dur="1.6s" begin="1s" repeatCount="indefinite"/></circle>' +
    '</g></svg>';
}

function thunderSVG(s) {
  return '<svg viewBox="0 0 64 64" width="' + s + '" height="' + s + '" aria-hidden="true">' +
    '<path d="M22 34 h14 a10 10 0 0 1 1 18 a10 10 0 0 1 -14 -2 l6 10 h-4 l-8 -13 a10 10 0 0 1 5 -23 Z" fill="#94a3b8"/>' +
    '<polygon points="34,38 26,52 32,52 28,64 42,44 35,44" fill="#facc15">' +
    '<animate attributeName="opacity" values="1;0.15;1" dur="1.4s" repeatCount="indefinite"/></polygon>' +
    '</svg>';
}

function fogSVG(s) {
  return '<svg viewBox="0 0 64 64" width="' + s + '" height="' + s + '" aria-hidden="true">' +
    '<g stroke="#94a3b8" stroke-width="4" stroke-linecap="round">' +
    '<line x1="12" y1="24" x2="52" y2="24"><animate attributeName="x1" values="12;6;12" dur="3s" repeatCount="indefinite"/><animate attributeName="x2" values="52;46;52" dur="3s" repeatCount="indefinite"/></line>' +
    '<line x1="14" y1="34" x2="54" y2="34"><animate attributeName="x1" values="14;8;14" dur="3.5s" repeatCount="indefinite"/><animate attributeName="x2" values="54;48;54" dur="3.5s" repeatCount="indefinite"/></line>' +
    '<line x1="10" y1="44" x2="50" y2="44"><animate attributeName="x1" values="10;4;10" dur="4s" repeatCount="indefinite"/><animate attributeName="x2" values="50;44;50" dur="4s" repeatCount="indefinite"/></line>' +
    '</g></svg>';
}

function translateWeatherDesc(desc) {
  const d = (desc || '').toLowerCase();
  if (d.includes('thunder') || d.includes('thundery')) return '雷阵雨';
  if (d.includes('blizzard')) return '暴风雪';
  if (d.includes('freezing fog')) return '冻雾';
  if (d.includes('ice pellets')) return '冰粒';
  if (d.includes('freezing')) return '冻雨';
  if (d.includes('heavy snow') || d.includes('moderate snow')) return '大雪';
  if (d.includes('snow') || d.includes('sleet')) return '小雪';
  if (d.includes('heavy rain') || d.includes('moderate rain') || d.includes('rain shower') || d.includes('heavy shower')) return '中到大雨';
  if (d.includes('rain') || d.includes('drizzle') || d.includes('shower')) return '小雨';
  if (d.includes('fog') || d.includes('mist')) return '雾';
  if (d.includes('overcast')) return '阴天';
  if (d.includes('partly cloudy') || d.includes('cloudy')) return '多云';
  if (d.includes('sunny') || d.includes('clear')) return '晴';
  return '天气';
}

/* ============ 天气缓存 ============ */
const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

/* ============ 天气API（感知层） ============ */

async function fetchWeather(cityObj) {
  // 兼容：旧调用可能传字符串(拼音/英文名)，统一为对象
  var name = '';
  var pinyin = '';
  var coord = null;
  if (typeof cityObj === 'string') {
    pinyin = cityObj;
  } else if (cityObj && typeof cityObj === 'object') {
    name = cityObj.name || '';
    pinyin = cityObj.pinyin || '';
    coord = Array.isArray(cityObj.coord) ? cityObj.coord : null;
  }
  // 缓存 key：优先用坐标（最精确、唯一），否则用拼音/名
  var cacheKey = coord ? ('c' + coord[0].toFixed(3) + ',' + coord[1].toFixed(3)) : (pinyin || name).toLowerCase();
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // URL：有坐标用坐标格式（wttr.in/~lat,lon，最准，彻底避免中文/拼音错配城市）
  var url;
  if (coord && coord.length === 2) {
    url = 'https://wttr.in/~' + coord[0] + ',' + coord[1] + '?format=j1';
  } else {
    // 无坐标兜底：只用拼音/英文名（绝不用纯中文，避免 Open-Meteo 那种跨城市错配）
    var q = (/[A-Za-z]/.test(pinyin) ? pinyin : (/[A-Za-z]/.test(name) ? name : pinyin));
    if (!q) return null;
    url = 'https://wttr.in/' + encodeURIComponent(q) + '?format=j1';
  }

  try {
    const controller = new AbortController();
    const wtimer = setTimeout(function() { controller.abort(); }, 6000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(wtimer);
    if (!response.ok) throw new Error('Weather API error: ' + response.status);
    const data = await response.json();
    const parsed = parseWeatherData(data);
    weatherCache.set(cacheKey, { data: parsed, timestamp: Date.now() });
    return parsed;
  } catch (error) {
    console.error('Weather fetch failed for ' + (coord ? coord.join(',') : (pinyin || name)) + ':', error);
    return null;
  }
}

function parseWeatherData(data) {
  const current = data.current_condition[0];
  const currentDesc = current.weatherDesc[0].value;

  const forecast = (data.weather || []).slice(0, 7).map(function(day) {
    var noonHour = day.hourly[4] || day.hourly[day.hourly.length - 1];
    var dayDesc = noonHour ? noonHour.weatherDesc[0].value : '';
    var astro = day.astronomy && day.astronomy[0] ? day.astronomy[0] : null;
    return {
      date: day.date,
      maxTemp: parseInt(day.maxtempC),
      minTemp: parseInt(day.mintempC),
      desc: dayDesc,
      descZh: translateWeatherDesc(dayDesc),
      icon: getWeatherIcon(dayDesc),
      avgTemp: noonHour ? parseInt(noonHour.tempC) : parseInt(day.maxtempC),
      sunrise: astro ? astro.sunrise : '',
      sunset: astro ? astro.sunset : '',
      uv: parseInt(day.uvIndex) || 0
    };
  });

  // 24 小时 hourly：把 3 天 × 8 个时间点（每 3 小时一次）拍平成时间序列
  var hourlyAll = [];
  (data.weather || []).forEach(function(day) {
    (day.hourly || []).forEach(function(h) {
      var hh = Math.floor(parseInt(h.time) / 100);
      var d = new Date(day.date + 'T00:00:00'); // 本地时区，避免 UTC 偏移
      d.setHours(hh, 0, 0, 0);
      var desc = h.weatherDesc[0].value;
      hourlyAll.push({
        time: d.toISOString(),
        hour: hh,
        temp: parseInt(h.tempC),
        code: 0,
        desc: desc,
        descZh: translateWeatherDesc(desc),
        pop: parseInt(h.chanceofrain) || 0
      });
    });
  });
  var now = Date.now();
  var startIdx = 0;
  for (var k = 0; k < hourlyAll.length; k++) {
    if (new Date(hourlyAll[k].time).getTime() >= now) { startIdx = k; break; }
  }
  var hourly = hourlyAll.slice(startIdx, startIdx + 24);

  return {
    temp: parseInt(current.temp_C),
    feelsLike: parseInt(current.FeelsLikeC),
    desc: currentDesc,
    descZh: translateWeatherDesc(currentDesc),
    icon: getWeatherIcon(currentDesc),
    humidity: parseInt(current.humidity),
    windSpeed: parseInt(current.windspeedKmph),
    windDir: current.winddir16Point,
    uvIndex: parseInt(current.uvIndex),
    visibility: parseInt(current.visibility),
    pressure: parseInt(current.pressure),
    forecast: forecast,
    hourly: hourly
  };
}

/* ============ AI 建议引擎（推理层） ============ */

function generateAdvice(weather) {
  var advice = [];
  var temp = weather.temp;
  var desc = weather.desc.toLowerCase();
  var humidity = weather.humidity;
  var wind = weather.windSpeed;
  var uv = weather.uvIndex;

  /* 穿搭建议 */
  if (temp <= 0) {
    advice.push({ icon:'🧥', text:'气温仅' + temp + '°C，需穿厚羽绒服、保暖内衣，戴围巾手套' });
  } else if (temp <= 10) {
    advice.push({ icon:'🧥', text:'气温' + temp + '°C较冷，建议穿厚外套加毛衣，注意保暖' });
  } else if (temp <= 18) {
    advice.push({ icon:'👔', text:'气温' + temp + '°C微凉，穿薄外套或卫衣比较合适' });
  } else if (temp <= 26) {
    advice.push({ icon:'👕', text:'气温' + temp + '°C舒适，穿长袖或短袖即可，非常适合出行' });
  } else if (temp <= 32) {
    advice.push({ icon:'👕', text:'气温' + temp + '°C较热，穿轻薄透气衣物，注意防暑' });
  } else {
    advice.push({ icon:'🧴', text:'气温' + temp + '°C炎热，穿透气速干衣物，尽量减少户外活动' });
  }

  /* 活动建议 */
  if (desc.includes('sunny') || desc.includes('clear')) {
    advice.push({ icon:'📸', text:'天气晴朗，适合户外观光、拍照和自然探索' });
    if (uv >= 6) {
      advice.push({ icon:'🧴', text:'紫外线指数' + uv + '较强，务必涂防晒霜、戴太阳镜和遮阳帽' });
    }
  } else if (desc.includes('partly cloudy') || desc.includes('cloudy')) {
    advice.push({ icon:'🚶', text:'多云天气，光线柔和适合摄影，户外活动不受影响' });
  } else if (desc.includes('overcast')) {
    advice.push({ icon:'🏛️', text:'阴天适合参观博物馆、美术馆等室内景点' });
  } else if (desc.includes('rain') || desc.includes('drizzle')) {
    advice.push({ icon:'☂️', text:'有雨天气，请带雨伞，建议安排室内行程如博物馆、商场' });
  } else if (desc.includes('snow')) {
    advice.push({ icon:'❄️', text:'有雪天气，路面湿滑注意安全，可赏雪景但要做好保暖' });
  } else if (desc.includes('thunder')) {
    advice.push({ icon:'⚡', text:'有雷暴天气，避免户外活动，远离空旷地带和高树' });
  } else if (desc.includes('fog') || desc.includes('mist')) {
    advice.push({ icon:'🌫️', text:'有雾能见度低，自驾注意减速，山区景点视野可能受限' });
  }

  /* 湿度建议 */
  if (humidity >= 80) {
    advice.push({ icon:'💧', text:'湿度' + humidity + '%偏高，体感闷热，多喝水防中暑' });
  } else if (humidity <= 30) {
    advice.push({ icon:'🧴', text:'空气干燥（湿度' + humidity + '%），注意补水和皮肤保湿' });
  }

  /* 风力建议 */
  if (wind >= 30) {
    advice.push({ icon:'💨', text:'风力较大（' + wind + 'km/h），避免高空项目，注意保暖' });
  }

  return advice;
}

/* 天气舒适度评分（用于多城市智能推荐） */
function calculateWeatherScore(weather) {
  var score = 50;
  var temp = weather.temp;
  var desc = weather.desc.toLowerCase();

  if (temp >= 18 && temp <= 25) score += 20;
  else if (temp >= 15 && temp <= 28) score += 10;
  else if (temp >= 10 && temp <= 32) score += 0;
  else if (temp < 0 || temp > 35) score -= 20;
  else score -= 10;

  if (desc.includes('sunny') || desc.includes('clear')) score += 15;
  else if (desc.includes('partly cloudy')) score += 10;
  else if (desc.includes('cloudy')) score += 0;
  else if (desc.includes('overcast')) score -= 5;
  else if (desc.includes('rain') || desc.includes('drizzle')) score -= 15;
  else if (desc.includes('snow')) score -= 10;
  else if (desc.includes('fog') || desc.includes('mist')) score -= 10;
  else if (desc.includes('thunder')) score -= 20;

  if (weather.humidity >= 40 && weather.humidity <= 70) score += 5;
  else if (weather.humidity > 85) score -= 5;

  if (weather.windSpeed > 30) score -= 10;
  else if (weather.windSpeed > 20) score -= 5;

  return Math.max(0, Math.min(100, score));
}

/* ============ DOM 渲染（行动层） ============ */

/* 32 个热门城市的旅行特色标签，用于下拉选择器里告诉用户「这城适合干嘛」 */
var CITY_FEATURES = {
  '北京': '🏛️ 历史古都',
  '上海': '🌃 繁华都市',
  '成都': '🐼 休闲美食',
  '杭州': '🌸 西湖春城',
  '西安': '🏛️ 十三朝古都',
  '重庆': '🌶️ 山城夜景',
  '三亚': '🏖️ 热带海滨',
  '桂林': '🏞️ 山水甲天下',
  '丽江': '🏔️ 古城雪山',
  '张家界': '🏔️ 奇峰怪石',
  '厦门': '🏖️ 鼓浪屿',
  '青岛': '🏖️ 红瓦海滨',
  '长沙': '🍲 湘江美食',
  '武汉': '🌸 黄鹤樱花',
  '哈尔滨': '❄️ 冰雪世界',
  '大理': '🏔️ 风花雪月',
  '拉萨': '🏔️ 雪域高原',
  '苏州': '🌸 园林水乡',
  '南京': '🏛️ 六朝古都',
  '天津': '🏛️ 欧式风情',
  '广州': '🍜 早茶之都',
  '黄山': '🏔️ 五岳归来',
  '贵阳': '🌿 避暑之都',
  '沈阳': '❄️ 冰雪工业',
  '洛阳': '🌸 牡丹花城',
  '敦煌': '🐪 丝路大漠',
  '乌鲁木齐': '🏔️ 西域风情',
  '呼伦贝尔': '🌿 大草原',
  '太原': '🏛️ 晋商古韵',
  '南昌': '🌿 滕王阁',
  '银川': '🌿 西夏古都',
  '西宁': '🌿 高原明珠'
};

function renderCityTabs() {
  var container = document.getElementById('cityTabs');
  var itemsHtml = destinations.map(function(d) {
    var feature = CITY_FEATURES[d.name] || '热门旅游城市';
    return '<button class="cs-item" data-city="' + d.id + '" type="button">' +
      '<span class="cs-item-main">' + d.emoji + ' ' + d.name + '</span>' +
      '<span class="cs-item-tag">' + feature + '</span>' +
    '</button>';
  }).join('');

  container.innerHTML =
    '<button class="city-select-btn" id="citySelectBtn" type="button">' +
      '<span class="csb-label">选择城市查看实时天气</span>' +
      '<span class="csb-arrow">▾</span>' +
    '</button>' +
    '<div class="city-select-panel" id="citySelectPanel" role="listbox">' +
      '<div class="cs-panel-head">🏖️ 热门旅游城市 · ' + destinations.length + ' 城 <small>选一个看实时天气 + AI 出行建议</small></div>' +
      '<div class="cs-grid">' + itemsHtml + '</div>' +
    '</div>';

  var btn = document.getElementById('citySelectBtn');
  var panel = document.getElementById('citySelectPanel');

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    panel.classList.toggle('open');
    btn.classList.toggle('open');
  });
  document.addEventListener('click', function(e) {
    if (!container.contains(e.target)) {
      panel.classList.remove('open');
      btn.classList.remove('open');
    }
  });
  panel.addEventListener('click', function(e) {
    e.stopPropagation();
  });

  panel.querySelectorAll('.cs-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var id = item.dataset.city;
      var d = destinations.find(function(x) { return x.id === id; });
      if (d) btn.querySelector('.csb-label').textContent = d.emoji + ' ' + d.name;
      panel.classList.remove('open');
      btn.classList.remove('open');
      selectCity(id);
    });
  });
}

function renderDestinations() {
  var container = document.getElementById('destinationsGrid');
  container.innerHTML = destinations.map(function(d) {
    return '<div class="dest-card" data-city="' + d.id + '">' +
      '<div class="dest-card-header" style="background:' + d.gradient + '" data-region="' + d.region + '">' + d.emoji + '</div>' +
      '<div class="dest-card-body">' +
        '<h3 class="dest-card-name">' + d.name + '</h3>' +
        '<p class="dest-card-desc">' + d.description + '</p>' +
        '<div class="dest-card-attractions">' +
          d.attractions.map(function(a) { return '<span class="dest-attraction-tag">' + a + '</span>'; }).join('') +
        '</div>' +
        '<div class="dest-card-footer">' +
          '<span class="dest-card-season">最佳季节: ' + d.bestSeason + '</span>' +
          '<span class="dest-card-weather">查看天气 →</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  container.querySelectorAll('.dest-card').forEach(function(card) {
    card.addEventListener('click', function() {
      selectCity(card.dataset.city);
      document.getElementById('weather').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function renderTips() {
  var container = document.getElementById('tipsGrid');
  container.innerHTML = travelTips.map(function(t) {
    return '<div class="tip-card"><div class="tip-icon">' + t.icon + '</div><h3>' + t.title + '</h3><p>' + t.desc + '</p></div>';
  }).join('');
}

async function selectCity(cityId) {
  var city = destinations.find(function(d) { return d.id === cityId; });
  if (!city) return;
  currentCityId = cityId;
  syncGuideCityFromWeather();

  var btnLabel = document.querySelector('.city-select-btn .csb-label');
  if (btnLabel) btnLabel.textContent = city.emoji + ' ' + city.name;

  var weatherCard = document.getElementById('weatherCard');
  var weatherSide = document.getElementById('weatherSide');
  var forecastContainer = document.getElementById('forecastContainer');
  var hourlyContainer = document.getElementById('hourlyContainer');

  weatherCard.className = 'weather-main';
  weatherCard.innerHTML = '<div class="weather-placeholder"><div class="loading-spinner"></div><p style="margin-top:16px">正在获取' + city.name + '实时天气...</p></div>';
  weatherSide.className = 'weather-side';
  weatherSide.innerHTML = '<div class="advice-placeholder"><div class="loading-spinner"></div><p style="margin-top:16px;text-align:center">AI 正在分析天气并生成建议...</p></div>';
  forecastContainer.innerHTML = '';
  if (hourlyContainer) hourlyContainer.innerHTML = '<div class="hourly-empty">⏱ 加载未来 24 小时…</div>';

  var weather = await fetchWeather(city);

  if (!weather) {
    weatherCard.innerHTML = '<div class="weather-placeholder"><div class="placeholder-icon">😕</div><p>暂未获取到' + city.name + '的天气数据<br>请稍后再试</p></div>';
    weatherSide.innerHTML = '<div class="advice-placeholder"><p>天气数据获取失败，无法生成建议。</p></div>';
    if (hourlyContainer) hourlyContainer.innerHTML = '';
    showToast('天气数据获取失败，请稍后重试', 'error');
    return;
  }

  renderWeatherCard(city, weather);
  renderAdvice(weather);

  // 24h + 7 天：优先 Open-Meteo（每 1 小时 24 点 + 7 天），失败回退 wttr.in
  var ext = await fetchExtendedForecast(city);
  var parsed = ext ? parseExtendedForecast(ext) : null;
  if (parsed && parsed.hourly && parsed.hourly.length >= 20) {
    renderHourly(parsed);
    renderForecast(parsed);
  } else {
    renderHourly({ hourly: weather.hourly });
    renderForecast({ daily: weather.forecast }, null);
  }

  var today = weather.forecast && weather.forecast[0] ? weather.forecast[0] : null;
  if (today) {
    renderWeatherCard(city, weather, {
      sunrise: today.sunrise,
      sunset: today.sunset,
      todayMax: today.maxTemp,
      todayMin: today.minTemp
    });
  }
}

/* ============ AI 旅行攻略 · Editorial Aurora ============ */
var currentGuideCat = '一日游';
var currentGuideCityName = '北京'; // 跟随 #guideCityInput 的当前文字，可任意自由输入
var GUIDE_CATS = ['一日游', '情侣游', '二人游', '两天一夜', '亲子游', '美食探店', '摄影打卡'];

// 天气板块切城市时调用 → 把城市同步进攻略输入框
function syncGuideCityFromWeather() {
  var c = destinations.find(function(d) { return d.id === currentCityId; });
  if (!c) return;
  var inp = document.getElementById('guideCityInput');
  if (inp && document.activeElement !== inp) {
    inp.value = c.name;
    currentGuideCityName = c.name;
  }
}

// 动态渲染分段控件按钮 + 滑动指示器
function renderGuideCategories() {
  var cats = document.getElementById('guideCats');
  if (!cats) return;
  // 保留 indicator，清掉旧的按钮
  var indicator = document.getElementById('gsCatsIndicator');
  cats.querySelectorAll('.guide-cat').forEach(function(b) { b.remove(); });
  GUIDE_CATS.forEach(function(cat) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'guide-cat' + (cat === currentGuideCat ? ' active' : '');
    btn.dataset.cat = cat;
    btn.textContent = cat;
    cats.appendChild(btn);
  });
  // 等待布局稳定后定位指示器
  requestAnimationFrame(function() { updateCatsIndicator(); });
}

function updateCatsIndicator() {
  var cats = document.getElementById('guideCats');
  var indicator = document.getElementById('gsCatsIndicator');
  if (!cats || !indicator) return;
  var active = cats.querySelector('.guide-cat.active');
  if (!active) return;
  var r = active.getBoundingClientRect();
  var cr = cats.getBoundingClientRect();
  indicator.style.left = (r.left - cr.left) + 'px';
  indicator.style.width = r.width + 'px';
}

// 期刊格式日期：2026.08.25
function formatGuideDate(d) {
  d = d || new Date();
  var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
  return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate());
}

// 空状态：编辑精选 swatch
function renderGuideEmpty() {
  var box = document.getElementById('guideResult');
  if (!box) return;
  // 取 8 个热门目的地作为精选
  var picks = (destinations || []).slice(0, 8);
  var html = '<div class="gs-empty">' +
    '<div class="gs-e-head">' +
      '<span class="gs-e-label">Editor\'s Picks</span>' +
      '<h3 class="gs-e-title">选一个目的地,开始你的故事</h3>' +
    '</div>' +
    '<div class="gs-e-swatches">' +
      picks.map(function(d) {
        return '<button type="button" class="gs-swatch" data-pick="' + escapeHtml(d.name) + '"' +
          ' style="background:' + (d.gradient || 'linear-gradient(135deg,#0ea5e9,#2563eb)') + '">' +
          '<span class="gs-swatch-emoji">' + escapeHtml(d.emoji || '📍') + '</span>' +
          '<span class="gs-swatch-name">' + escapeHtml(d.name) +
            '<span class="gs-swatch-pinyin">' + escapeHtml(d.pinyin || '') + '</span>' +
          '</span>' +
        '</button>';
      }).join('') +
    '</div>' +
    '<div class="gs-e-hint">点击 swatch 可直接填入目的地,或上方输入景点名</div>' +
  '</div>';
  box.innerHTML = html;

  // 点击 swatch → 填入输入框 + 自动触发生成
  box.querySelectorAll('.gs-swatch[data-pick]').forEach(function(b) {
    b.addEventListener('click', function() {
      var name = b.dataset.pick;
      var inp = document.getElementById('guideCityInput');
      if (inp) inp.value = name;
      currentGuideCityName = name;
      generateGuide();
    });
  });
}

// 三段式 loading
function renderGuideLoading() {
  var box = document.getElementById('guideResult');
  if (!box) return;
  box.innerHTML =
    '<div class="gs-loading">' +
      '<div class="gs-l-orb" aria-hidden="true"></div>' +
      '<div class="gs-l-title">AI 旅行官正在创作</div>' +
      '<div class="gs-l-stages">' +
        '<div class="gs-l-stage active" data-stage="0">' +
          '<span class="gs-l-stage-dot"></span>扫描目的地信号' +
        '</div>' +
        '<div class="gs-l-stage" data-stage="1">' +
          '<span class="gs-l-stage-dot"></span>规划最优行程' +
        '</div>' +
        '<div class="gs-l-stage" data-stage="2">' +
          '<span class="gs-l-stage-dot"></span>润色小红书文案' +
        '</div>' +
      '</div>' +
    '</div>';
}

var _guideLoadingTimer = null;
function startGuideLoadingStages() {
  stopGuideLoadingStages();
  var stages = document.querySelectorAll('.gs-l-stage');
  if (!stages.length) return;
  var i = 0;
  // 每 2.5s 推进一阶段
  _guideLoadingTimer = setInterval(function() {
    if (i >= stages.length) return;
    if (i > 0 && stages[i - 1]) {
      stages[i - 1].classList.remove('active');
      stages[i - 1].classList.add('done');
    }
    stages[i].classList.add('active');
    i++;
  }, 2500);
}

function stopGuideLoadingStages() {
  if (_guideLoadingTimer) {
    clearInterval(_guideLoadingTimer);
    _guideLoadingTimer = null;
  }
}

function renderGuidePopup() {
  var popup = document.getElementById('guideCityPopup');
  var inp = document.getElementById('guideCityInput');
  if (!popup || !inp) return;
  var q = (inp.value || '').trim().toLowerCase();
  var matches = destinations.slice();
  if (q) {
    matches = matches.filter(function(d) {
      return (d.name || '').toLowerCase().indexOf(q) >= 0 ||
        (d.pinyin || '').toLowerCase().indexOf(q) >= 0 ||
        (d.region || '').toLowerCase().indexOf(q) >= 0;
    });
  }
  var html = '';
  if (matches.length) {
    html += '<div class="gcp-section-title">常用城市（' + matches.length + '）</div>';
    html += matches.slice(0, 12).map(function(d) {
      return '<div class="gcp-item" data-city-name="' + escapeHtml(d.name) + '">' +
        '<span class="gcp-emoji">' + (d.emoji || '📍') + '</span>' +
        '<span class="gcp-name">' + escapeHtml(d.name) + '</span>' +
        '<span class="gcp-region">' + escapeHtml(d.region || '') + '</span>' +
      '</div>';
    }).join('');
  } else {
    html += '<div class="gcp-empty">没有匹配的城市。直接输入任意名称（中文/拼音/景点名）后按回车即可 ✏️</div>';
  }
  html += '<div class="gcp-hint">💡 支持任意城市与景点地标，输入即生效</div>';
  popup.innerHTML = html;
  popup.hidden = false;
}

function bindGuideEvents() {
  // 玩法 Tab
  var cats = document.getElementById('guideCats');
  if (cats) {
    cats.addEventListener('click', function(e) {
      var btn = e.target.closest('.guide-cat');
      if (!btn) return;
      cats.querySelectorAll('.guide-cat').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentGuideCat = btn.dataset.cat;
      updateCatsIndicator();
    });
    // 窗口尺寸变化时重新定位指示器
    window.addEventListener('resize', updateCatsIndicator);
  }

  var gen = document.getElementById('guideGenBtn');
  if (gen) gen.addEventListener('click', generateGuide);

  // 目的地输入
  var inp = document.getElementById('guideCityInput');
  var popup = document.getElementById('guideCityPopup');
  if (inp) {
    currentGuideCityName = inp.value || '北京';

    // 打开 popup 的统一入口：只要聚焦/输入，就保持可见 + 刷新内容
    function openGuidePopup() {
      if (!popup) return;
      renderGuidePopup();
      popup.hidden = false;
    }

    inp.addEventListener('focus', openGuidePopup);

    // ✅ 实时搜索过滤：input 事件中重渲染 popup
    inp.addEventListener('input', function() {
      currentGuideCityName = inp.value.trim();
      openGuidePopup();           // 有输入 → 立刻重过滤 + 保持打开
    });

    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (popup) popup.hidden = true;
        // 回车直接生成攻略（如果用户没主动点 swatch 也好走）
        var gen = document.getElementById('guideGenBtn');
        if (gen) gen.click();
      }
      if (e.key === 'Escape') { if (popup) popup.hidden = true; }
    });

    // 失焦延迟关闭，给点 popup / 常用 按钮留 200ms 命中窗口
    inp.addEventListener('blur', function() {
      setTimeout(function() {
        // 仅当鼠标没有停在 popup / 常用按钮上时才关
        var ae = document.activeElement;
        if (popup && !popup.contains(ae) &&
            ae !== document.getElementById('guideCitySwitch')) {
          popup.hidden = true;
        }
      }, 180);
    });
  }

  // 「常用城市」按钮：切换浮层
  var sw = document.getElementById('guideCitySwitch');
  if (sw) sw.addEventListener('click', function(e) {
    e.stopPropagation();
    if (!popup) return;
    if (popup.hidden) { renderGuidePopup(); popup.hidden = false; }
    else popup.hidden = true;
  });

  // 浮层内点选 → 写回输入框
  if (popup) {
    popup.addEventListener('click', function(e) {
      var item = e.target.closest('[data-city-name]');
      if (!item) return;
      var n = item.dataset.cityName;
      if (n) {
        if (inp) inp.value = n;
        currentGuideCityName = n;
      }
      popup.hidden = true;
    });
  }

  // 点击输入框/按钮/浮层 之外 → 自动关闭浮层
  document.addEventListener('click', function(e) {
    if (!popup || popup.hidden) return;
    // 在驾驶舱内（含输入框/常用按钮/popup 自身） → 不关
    if (e.target.closest('.gs-cockpit')) return;
    popup.hidden = true;
  });
}

async function generateGuide() {
  var inp = document.getElementById('guideCityInput');
  var name = (inp ? inp.value : currentGuideCityName) || '';
  name = name.trim();
  if (!name) {
    showToast('请输入或选择目的地', 'error');
    if (inp) inp.focus();
    return;
  }
  currentGuideCityName = name;

  // 命中预设城市 → 取完整数据；否则只有 name（让大模型自由发挥）
  var city = destinations.find(function(d) { return d.name === name; })
    || destinations.find(function(d) { return (d.emoji ? d.emoji + ' ' + d.name : d.name) === name; });

  var result = document.getElementById('guideResult');
  var gen = document.getElementById('guideGenBtn');
  var genText = gen ? gen.querySelector('.gs-cta-text') : null;
  if (gen) { gen.disabled = true; if (genText) genText.textContent = '⏳ 创作中…'; else gen.textContent = '⏳ 创作中…'; }
  renderGuideLoading();
  startGuideLoadingStages();

  var fallbackEmoji = city ? city.emoji : '🧭';
  var fallbackGradient = city ? city.gradient : 'linear-gradient(135deg,#0ea5e9,#2563eb)';
  var displayCity = city || { name: name, emoji: fallbackEmoji, gradient: fallbackGradient };

  try {
    var payload = {
      city: city ? {
        name: city.name, region: city.region, description: city.description,
        bestSeason: city.bestSeason, emoji: city.emoji, color: city.color, gradient: city.gradient
      } : { name: name },
      category: currentGuideCat,
      spots: (city && city.spots) || []
    };
    var base = (window.GUIDE_API_BASE || '').replace(/\/$/, '');
    var resp = await fetch(base + '/api/guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      // 同源（未配置云端函数）且 404：只是静态托管、没有后端，直接走本地兜底
      if (resp.status === 404 && !window.GUIDE_API_BASE) {
        throw new Error('NO_BACKEND');
      }
      var errData = await resp.json().catch(function() { return { error: '请求失败（' + resp.status + '）' }; });
      throw new Error(errData.error || ('服务异常 ' + resp.status));
    }
    var data = await resp.json();
    renderGuide(data.guide, displayCity);
  } catch (e) {
    var msg = e && e.message ? e.message : String(e);
    var offline = (msg.indexOf('Failed to fetch') >= 0 || msg.indexOf('NetworkError') >= 0 || msg.indexOf('无法连接') >= 0 || msg === 'NO_BACKEND');

    if (offline) {
      // 离线：永远先给一份本地兜底（不管有没有预设）
      var guessCity = city || { name: name, emoji: '🧭', gradient: 'linear-gradient(135deg,#0ea5e9,#2563eb)' };
      var preview = city ? localGuide(city, currentGuideCat) : localGuideUniversal(name, currentGuideCat);
      renderGuide(preview, guessCity);
      var hint = document.createElement('div');
      hint.className = 'guide-upgrade-card';
      var usedUniversal = !city;
      hint.innerHTML =
        '<div class="guc-icon">' + (usedUniversal ? '⚡' : '✨') + '</div>' +
        '<div class="guc-body">' +
          '<div class="guc-title">' + (usedUniversal ? '已为你生成通用模板预览' : '已为你生成本地数据预览') + '</div>' +
          '<div class="guc-desc">' + name + ' · ' + currentGuideCat + ' · ' +
          (usedUniversal ? '因为「' + name + '」不在常用城市里，使用通用模板生成。' : '使用本地真实景点数据生成。') +
          ' 连接 AI 后端后，可一键升级为实时精修版。</div>' +
        '</div>' +
        '<button type="button" class="guc-btn" id="guideRetry">🔗 连接 AI 后端后重试</button>';
      result.appendChild(hint);
      var r = document.getElementById('guideRetry');
      if (r) r.addEventListener('click', generateGuide);
      // 不弹 toast —— 卡片底部已经清楚说明，避免打扰
    } else {
      // 真错误（如 LLM key 错误、配额耗尽）
      if (result) result.innerHTML =
        '<div class="guide-error">⚠️ ' + escapeHtml(msg) +
        '<div style="margin-top:12px"><button class="guide-retry" type="button" id="guideRetry">🔁 重试</button></div>' +
        '</div>';
      var r3 = document.getElementById('guideRetry');
      if (r3) r3.addEventListener('click', generateGuide);
    }
  } finally {
    stopGuideLoadingStages();
    if (gen) {
      gen.disabled = false;
      if (genText) genText.textContent = '✨ 生成攻略';
      else gen.textContent = '✨ 生成攻略';
    }
  }
}

// 离线兜底：用 destinations 里的景点 + 玩法拼一份"本地预览"
function localGuide(city, category) {
  var spots = city.spots || [];
  var cat = category || '一日游';
  var twoDay = cat === '两天一夜';
  var itin = [
    { day: 'Day 1', time: '09:00', title: '城市经典景点集合出发', spot: spots[0] ? spots[0].name : '', detail: '建议提前查看开放时间，工作日上午人最少' },
    { day: 'Day 1', time: '12:00', title: '本地特色午餐', spot: '', detail: '认准本地人常去的口碑小店，避开景区门口' },
    { day: 'Day 1', time: '14:30', title: '深度文化/自然体验', spot: spots[1] ? spots[1].name : (spots[0] ? spots[0].name : ''), detail: '慢节奏逛，深入了解在地故事' },
    { day: 'Day 1', time: '18:30', title: '晚餐 + 夜景/夜市', spot: spots[2] ? spots[2].name : '', detail: '夜市更有烟火气，注意贵重物品' }
  ];
  if (twoDay) {
    itin = itin.concat([
      { day: 'Day 2', time: '09:30', title: '第二天行程：周边自然/古镇', spot: spots[3] ? spots[3].name : '', detail: '可包车或公共交通，注意末班车时间' },
      { day: 'Day 2', time: '12:30', title: '午餐', spot: '', detail: '继续挖掘本地菜系' },
      { day: 'Day 2', time: '15:00', title: '自由活动 / 返程', spot: '', detail: '给自己留 30 分钟的留白时间' }
    ]);
  }
  if (cat === '美食探店' || cat === '二人游') {
    itin = itin.map(function(s) {
      if (s.title.indexOf('午餐') >= 0 || s.title.indexOf('晚餐') >= 0) return s;
      return Object.assign({}, s, { detail: '本玩法建议以吃为主，可减少景点时段' });
    });
  }
  // 选 2~3 个最像美食 / 必打卡的 spot
  var food = spots.filter(function(s) { return /吃|菜|馆|小厨|小吃|酒|面|饼/.test(s.name || ''); }).slice(0, 3);
  if (!food.length) food = spots.slice(0, Math.min(3, spots.length));

  return {
    emoji: city.emoji || '🧭',
    title: city.name + ' · ' + cat + ' 全攻略（本地预览）',
    summary: '本地数据预览版本——下面是 ' + city.name + ' 的热门景点与玩法导览。完整 AI 攻略请启动攻略服务（server/index.js）后重试。',
    tags: [cat, city.region || '精选', '本地推荐', '懒人版'],
    highlights: spots.slice(0, 6).map(function(s) { return s.name; }),
    itinerary: itin,
    food: food.map(function(s) { return { name: s.name, rec: '本地口碑热门，建议工作日错峰前往' }; }),
    tips: [
      '本卡为本地数据预览，server 启动后将获得 AI 实时生成的详细方案',
      '建议结合天气板块的实时气温与降水安排室外行程',
      '热门景点尽量工作日上午前往，错开客流高峰',
      '提前查看景点预约政策与节假日临时管制'
    ],
    budget: {
      perPerson: twoDay ? '约 ¥500–1200 / 人' : '约 ¥200–500 / 人',
      note: '视购物与住宿标准上下浮动；本数据为本地参考'
    }
  };
}

// 通用兜底：任意城市名都没有本地数据时用（按玩法给一份通用行程模板）
function localGuideUniversal(name, category) {
  var cat = category || '一日游';
  var twoDay = cat === '两天一夜';
  var isFood = cat === '美食探店';
  var isRomantic = cat === '情侣游' || cat === '二人游';
  var isFamily = cat === '亲子游';
  var isPhoto = cat === '摄影打卡';

  var highlights = [];
  if (isFood) highlights = ['本地老字号小吃', '夜市 / 美食街', '街头特色早餐', '深夜面馆 / 烧烤', '菜场小吃'];
  else if (isRomantic) highlights = ['日落观景点', '江/海/湖夜景', '文艺街区漫步', '咖啡馆小酌', '特色民宿'];
  else if (isFamily) highlights = ['主题乐园 / 公园', '动物园 / 海洋馆', '科技馆 / 博物馆', '亲子手工坊', '儿童餐厅'];
  else if (isPhoto) highlights = ['日出 / 日落机位', '城市天际线', '古建 / 街巷', '网红墙 / 涂鸦', '夜景长曝光'];
  else highlights = ['城市地标 / 博物馆', '本地老街区', '近郊自然 / 公园', '美食街 / 夜市', '特色书店 / 文创'];

  var itin = [];
  if (isFood) {
    itin = [
      { day: 'Day 1', time: '08:30', title: '老字号早餐（粥/面/饼）', detail: '早晨人少、出品稳定，多看本地人排队的小店' },
      { day: 'Day 1', time: '12:00', title: '本地午餐', detail: '避开网红排队店，找社区门口的小馆子更地道' },
      { day: 'Day 1', time: '15:00', title: '下午茶 / 街头小吃', detail: '卤味、炸物、甜汤配咖啡/茶，慢慢走' },
      { day: 'Day 1', time: '18:30', title: '晚餐 + 宵夜' , detail: '夜市走一遍，注意肠胃节奏' }
    ];
  } else if (isRomantic) {
    itin = [
      { day: 'Day 1', time: '10:00', title: '慢节奏逛文艺街区', detail: '咖啡馆、手作小店，适合牵手走走停停' },
      { day: 'Day 1', time: '13:00', title: '特色餐厅双人午餐', detail: '提前预约景观位，包厢有惊喜' },
      { day: 'Day 1', time: '17:00', title: '日落观景点', detail: '带件薄外套，山顶/江边风大' },
      { day: 'Day 1', time: '20:00', title: '夜景散步 + 夜宵', detail: '避开拥挤主街，找沿河或小区旁的路' }
    ];
  } else if (isFamily) {
    itin = [
      { day: 'Day 1', time: '09:30', title: '主题乐园 / 动物园', detail: '提前买儿童票，避开 11 点后的人群高峰' },
      { day: 'Day 1', time: '12:30', title: '亲子友好餐厅', detail: '有儿童菜单 + 游乐区的餐厅，娃不无聊' },
      { day: 'Day 1', time: '15:00', title: '博物馆 / 科技馆互动展', detail: '互动体验比纯参观更吸引孩子' },
      { day: 'Day 1', time: '18:30', title: '公园散步 + 夜市小吃', detail: '运动量刚好的一天，收尾轻松' }
    ];
  } else if (isPhoto) {
    itin = [
      { day: 'Day 1', time: '06:30', title: '日出机位', detail: '三脚架 + ND 滤镜，云海/朝霞更出片' },
      { day: 'Day 1', time: '10:00', title: '老街 / 巷子人文', detail: '35mm/50mm 定焦，老门老窗韵味浓' },
      { day: 'Day 1', time: '16:30', title: '黄金时段：城市地标', detail: '逆光人像、剪影、广角大全景' },
      { day: 'Day 1', time: '20:00', title: '夜景 + 长曝光', detail: '记得带三脚架和满电备用电池' }
    ];
  } else {
    itin = [
      { day: 'Day 1', time: '09:00', title: '城市地标 / 博物馆', detail: '提前在官方小程序预约，节省排队时间' },
      { day: 'Day 1', time: '12:00', title: '本地特色午餐', detail: '避开景区门口的连锁店，往小区方向走两条街' },
      { day: 'Day 1', time: '14:30', title: '老街区 / 文化体验', detail: '慢节奏逛，配一杯咖啡或茶' },
      { day: 'Day 1', time: '18:30', title: '夜景 / 夜市 / 夜宵', detail: '夜景配小酒，回程注意安全' }
    ];
  }
  if (twoDay) {
    itin = itin.concat([
      { day: 'Day 2', time: '09:30', title: '周边自然 / 古镇一日', detail: '提前查好班次，包车比打车灵活' },
      { day: 'Day 2', time: '12:30', title: '午餐', detail: '继续试本地菜系，记录好吃的回程再安排' },
      { day: 'Day 2', time: '15:00', title: '自由活动 / 购物 / 返程', detail: '给自己留 30 分钟空隙，别赶太紧' }
    ]);
  }

  return {
    emoji: '🧭',
    title: name + ' · ' + cat + ' 全攻略（本地通用模板）',
    summary: '当前没有「' + name + '」的本地精细数据，下面是一份基于玩法的通用行程框架。启动攻略服务（server/index.js）后，AI 会基于该城市的真实景点与本地文化生成更精准的方案。',
    tags: [cat, '通用模板', '本地预览'],
    highlights: highlights,
    itinerary: itin,
    food: [
      { name: '本地早餐（粥/面/饼）', rec: '早起步行到居民小区门口，排队多的通常不会差' },
      { name: '招牌菜午餐', rec: '认准有本地人聚餐的小馆子，避开纯游客店' },
      { name: '夜市 / 夜宵', rec: '注意卫生，按两人份点，吃不完更开心' }
    ],
    tips: [
      '本卡为「本地通用模板」，启动 server 后将由 AI 替换为「' + name + '」的真实攻略',
      '建议结合天气板块的实时气温与降水安排室外/室内比例',
      '热门景点优先选工作日上午，错峰游览体验更好',
      '门票/预约请通过景点官方小程序或公众号，避免第三方加价'
    ],
    budget: {
      perPerson: twoDay ? '约 ¥500–1500 / 人' : '约 ¥200–600 / 人',
      note: '按玩法浮动：美食/亲子/情侣需额外预算'
    }
  };
}

function renderGuide(g, city) {
  if (!g) { document.getElementById('guideResult').innerHTML = '<div class="guide-error">⚠️ 攻略内容为空</div>'; return; }

  var coverStyle = city.gradient || 'linear-gradient(135deg,#0ea5e9,#2563eb)';
  var title = escapeHtml(g.title || (city.name + currentGuideCat + '攻略'));
  var emoji = escapeHtml(g.emoji || city.emoji || '🧭');
  var cat = escapeHtml(currentGuideCat);

  // 行程 - 章节式
  var chapters = (g.itinerary || []).map(function(s, i) {
    var day = escapeHtml(s.day || '');
    var time = escapeHtml(s.time || '');
    var t = escapeHtml(s.title || '');
    var spot = s.spot ? '<span class="gc-chapter-spot">@' + escapeHtml(s.spot) + '</span>' : '';
    var detail = escapeHtml(s.detail || '');
    var dayShort = day.replace(/[Dd]ay\s*/i, '').replace(/第\s*/g, '').replace(/天/g, '');
    return '<div class="gc-chapter">' +
      '<div class="gc-chapter-time">' +
        '<span class="gc-chapter-time-day">' + (dayShort ? 'D' + dayShort : '·') + '</span>' +
        '<span class="gc-chapter-time-clock">' + (time || '—') + '</span>' +
      '</div>' +
      '<div class="gc-chapter-main">' +
        '<div class="gc-chapter-title">' + t + spot + '</div>' +
        (detail ? '<div class="gc-chapter-detail">' + detail + '</div>' : '') +
      '</div>' +
    '</div>';
  }).join('');

  // 标签
  var tags = (g.tags || []).map(function(t) {
    return '<span class="gc-tag">' + escapeHtml(t) + '</span>';
  }).join('');

  // 亮点
  var highlights = (g.highlights || []).map(function(h) {
    return '<span class="gc-hl">' + escapeHtml(h) + '</span>';
  }).join('');

  // 美食
  var foods = (g.food || []).map(function(f) {
    var name = escapeHtml(f.name || '');
    var rec = escapeHtml(f.rec || '');
    return '<div class="gc-food">' +
      '<div class="gc-food-name">' + name + '</div>' +
      (rec ? '<div class="gc-food-rec">' + rec + '</div>' : '') +
    '</div>';
  }).join('');

  // 贴士
  var tips = (g.tips || []).map(function(t) {
    return '<div class="gc-tip">' + escapeHtml(t) + '</div>';
  }).join('');

  // 预算
  var budget = g.budget || {};
  var budgetHtml = (budget.perPerson || budget.note) ?
    '<section class="gc-section">' +
      '<div class="gc-section-head">' +
        '<span class="gc-section-num">04</span>' +
        '<h4 class="gc-section-title">预算参考</h4>' +
        '<span class="gc-section-en">Budget</span>' +
      '</div>' +
      '<div class="gc-budget">' +
        '<span class="gc-budget-amount">' + escapeHtml(budget.perPerson || '人均') + '</span>' +
        (budget.note ? '<span class="gc-budget-note">' + escapeHtml(budget.note) + '</span>' : '') +
      '</div>' +
    '</section>' : '';

  var html =
    '<article class="guide-card">' +
      // ===== 极光封面 =====
      '<div class="gc-cover" style="--gc-bg:' + coverStyle + '">' +
        '<span class="gc-cover-orb gc-cover-orb-1"></span>' +
        '<span class="gc-cover-orb gc-cover-orb-2"></span>' +
        '<span class="gc-cover-orb gc-cover-orb-3"></span>' +
        '<span class="gc-cover-noise"></span>' +
        '<div class="gc-cover-top">' +
          '<span class="gc-issue">ISSUE №01</span>' +
          '<span class="gc-cover-cat">' + cat + ' · 专刊</span>' +
        '</div>' +
        '<div class="gc-cover-main">' +
          '<span class="gc-cover-emoji">' + emoji + '</span>' +
          '<h3 class="gc-cover-title">' + title + '</h3>' +
          '<span class="gc-cover-city">⌖ ' + escapeHtml(city.name || '') + '</span>' +
        '</div>' +
        '<div class="gc-cover-bottom">' +
          '<span class="gc-cover-date">' + formatGuideDate() + '</span>' +
          '<span class="gc-cover-min">5 分钟阅读 · AI 旅行官 编</span>' +
        '</div>' +
      '</div>' +

      // ===== 正文 =====
      '<div class="gc-body">' +
        // 编辑名片
        '<div class="gc-masthead">' +
          '<div class="gc-avatar" aria-hidden="true"></div>' +
          '<div class="gc-author">' +
            '<div class="gc-author-name">AI 旅行官 <span class="gc-author-verified">✓</span></div>' +
            '<div class="gc-author-meta">Editor at Large · 12.8w 关注 · 真实 AI 创作</div>' +
          '</div>' +
          '<button class="gc-follow" type="button">+ 关注</button>' +
        '</div>' +
        // 引文段（lede with drop cap）
        (g.summary ? '<p class="gc-lede">' + escapeHtml(g.summary) + '</p>' : '') +
        // 标签
        (tags ? '<div class="gc-tags">' + tags + '</div>' : '') +

        // 亮点
        (highlights ? '<section class="gc-section">' +
          '<div class="gc-section-head">' +
            '<span class="gc-section-num">01</span>' +
            '<h4 class="gc-section-title">必打卡亮点</h4>' +
            '<span class="gc-section-en">Highlights</span>' +
          '</div>' +
          '<div class="gc-highlights">' + highlights + '</div>' +
        '</section>' : '') +

        // 行程
        (chapters ? '<section class="gc-section">' +
          '<div class="gc-section-head">' +
            '<span class="gc-section-num">02</span>' +
            '<h4 class="gc-section-title">行程安排</h4>' +
            '<span class="gc-section-en">Itinerary</span>' +
          '</div>' +
          '<div class="gc-chapters">' + chapters + '</div>' +
        '</section>' : '') +

        // 美食 + 贴士 合并到第 03 章
        ((foods || tips) ? '<section class="gc-section">' +
          '<div class="gc-section-head">' +
            '<span class="gc-section-num">03</span>' +
            '<h4 class="gc-section-title">美食 & 实用贴士</h4>' +
            '<span class="gc-section-en">Eat & Tips</span>' +
          '</div>' +
          (foods ? '<div class="gc-list" style="margin-bottom:' + (tips ? '14px' : '0') + '">' + foods + '</div>' : '') +
          (tips ? '<div class="gc-list">' + tips + '</div>' : '') +
        '</section>' : '') +

        budgetHtml +
      '</div>' +

      // 操作栏
      '<div class="gc-actions">' +
        '<button class="gc-act" type="button" data-act="like"><span class="ico">♡</span><span class="lbl">3.2w</span></button>' +
        '<button class="gc-act" type="button" data-act="collect"><span class="ico">☆</span><span class="lbl">收藏</span></button>' +
        '<button class="gc-act" type="button" data-act="comment"><span class="ico">✎</span><span class="lbl">862</span></button>' +
        '<button class="gc-act" type="button" data-act="share" style="margin-left:auto"><span class="ico">↗</span><span class="lbl">分享</span></button>' +
      '</div>' +
    '</article>';

  var box = document.getElementById('guideResult');
  box.innerHTML = html;

  // 关注切换
  var follow = box.querySelector('.gc-follow');
  if (follow) follow.addEventListener('click', function() {
    var on = follow.classList.toggle('on');
    follow.textContent = on ? '已关注' : '+ 关注';
  });
  // 点赞 / 收藏切换
  box.querySelectorAll('.gc-act').forEach(function(act) {
    act.addEventListener('click', function() {
      var on = act.classList.toggle('on');
      var ico = act.querySelector('.ico');
      if (act.dataset.act === 'like') ico.textContent = on ? '♥' : '♡';
      if (act.dataset.act === 'collect') ico.textContent = on ? '★' : '☆';
    });
  });
}

function renderWeatherCard(city, weather, extra) {
  extra = extra || {};
  var card = document.getElementById('weatherCard');
  var mood = 'wx-sunny';
  var d = (weather.desc || '').toLowerCase();
  if (d.includes('rain') || d.includes('drizzle') || d.includes('thunder')) mood = 'wx-rain';
  else if (d.includes('snow') || d.includes('sleet')) mood = 'wx-snow';
  else if (d.includes('cloud') || d.includes('overcast') || d.includes('fog') || d.includes('mist')) mood = 'wx-cloud';
  card.dataset.mood = mood;
  card.className = 'weather-main loaded';

  var humPct = Math.min(weather.humidity, 100);
  var visPct = Math.min(weather.visibility / 20 * 100, 100);
  var windPct = Math.min(weather.windSpeed / 50 * 100, 100);

  card.innerHTML =
    '<div class="weather-header ' + mood + '">' +
      '<div class="weather-head-top">' +
        '<div class="weather-head-left">' +
          '<div class="weather-city-name">' + city.name + '</div>' +
          '<div class="weather-city-region">' + (city.region || '') + ' · ' + (city.description || '') + '</div>' +
        '</div>' +
        '<div class="weather-head-right">' +
          '<div class="weather-temp-row">' +
            '<span class="weather-temp">' + weather.temp + '</span>' +
            '<span class="weather-temp-unit">°C</span>' +
          '</div>' +
          '<div class="weather-desc">' + weather.descZh + '</div>' +
          (extra.todayMax != null && extra.todayMin != null ?
            '<div class="weather-temp-range">' +
              '<span class="hi">↑ ' + extra.todayMax + '°</span>' +
              '<span class="lo">↓ ' + extra.todayMin + '°</span>' +
            '</div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="weather-head-center">' +
        '<div class="weather-icon-large">' + weatherSVG(weather.desc, 96) + '</div>' +
      '</div>' +
      (extra.sunrise || extra.sunset ?
        '<div class="weather-sun-row">' +
          (extra.sunrise ? '<div class="sun-item"><span class="sun-icon">🌅</span><span class="sun-time">' + formatTimeShort(extra.sunrise) + '</span><span class="sun-label">日出</span></div>' : '') +
          '<div class="sun-item sun-mid"><span class="sun-icon">⏰</span><span class="sun-time">' + weather.feelsLike + '°</span><span class="sun-label">体感</span></div>' +
          (extra.sunset ? '<div class="sun-item"><span class="sun-icon">🌇</span><span class="sun-time">' + formatTimeShort(extra.sunset) + '</span><span class="sun-label">日落</span></div>' : '') +
        '</div>' : '') +
    '</div>' +
    '<div class="weather-body">' +
      detailItem('🌡️', '体感温度', weather.feelsLike + '°C', 'temp', ringHtml(weather.temp, 45, -20)) +
      detailItem('💧', '湿度', weather.humidity + '%', 'hum', barHtml(humPct, '#0ea5e9')) +
      detailItem('💨', '风速', weather.windSpeed + ' km/h', 'wind', windCompassHtml(weather.windDir, windPct)) +
      detailItem('👁️', '能见度', weather.visibility + ' km', 'vis', barHtml(visPct, '#a855f7')) +
      detailItem('☀️', '紫外线', uvLevel(weather.uvIndex), 'uv', ringHtml(weather.uvIndex, 11, 0)) +
      detailItem('📊', '气压', weather.pressure + ' hPa', 'press', '') +
    '</div>';
}

function detailItem(icon, label, value, colorKey, extra) {
  return '<div class="weather-detail detail-' + colorKey + '">' +
    '<span class="weather-detail-icon">' + icon + '</span>' +
    '<div class="weather-detail-info">' +
      '<span class="weather-detail-label">' + label + '</span>' +
      '<span class="weather-detail-value">' + value + '</span>' +
    '</div>' +
    (extra ? '<div class="weather-detail-extra">' + extra + '</div>' : '') +
  '</div>';
}

function ringHtml(value, max, min) {
  min = min || 0;
  var pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  var r = 16, c = 2 * Math.PI * r;
  var offset = c * (1 - pct);
  var stroke = pct > 0.75 ? '#ef4444' : pct > 0.5 ? '#f59e0b' : '#0ea5e9';
  return '<svg class="detail-ring" viewBox="0 0 36 36" width="32" height="32">' +
    '<circle cx="18" cy="18" r="' + r + '" stroke="#e2e8f0" stroke-width="3" fill="none"/>' +
    '<circle cx="18" cy="18" r="' + r + '" stroke="' + stroke + '" stroke-width="3" fill="none" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + offset.toFixed(2) + '" stroke-linecap="round" transform="rotate(-90 18 18)"/>' +
    '</svg>';
}

function barHtml(pct, color) {
  color = color || '#0284c7';
  return '<div class="detail-bar"><div class="detail-bar-inner" style="width:' + pct.toFixed(0) + '%;background:' + color + '"></div></div>';
}

function windCompassHtml(dir, pct) {
  var deg = dir16ToDeg(dir);
  var dirZh = dir16ToZh(dir);
  return '<div class="detail-wind">' +
    '<svg class="detail-compass" viewBox="0 0 36 36" width="28" height="28">' +
      '<circle cx="18" cy="18" r="14" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>' +
      '<text x="18" y="6" text-anchor="middle" font-size="4" fill="#94a3b8">N</text>' +
      '<g style="transform:rotate(' + deg + 'deg);transform-origin:18px 18px"><polygon points="18,4 16,11 20,11" fill="#10b981"/></g>' +
    '</svg>' +
    '<span class="detail-wind-text">' + dirZh + '</span>' +
    '<span class="detail-wind-bar"><span class="detail-wind-bar-inner" style="width:' + pct.toFixed(0) + '%"></span></span>' +
  '</div>';
}

function dir16ToZh(dir) {
  var map = { 'N':'北风','NNE':'东北偏北','NE':'东北风','ENE':'东偏北','E':'东风','ESE':'东偏南','SE':'东南风','SSE':'南偏东','S':'南风','SSW':'南偏西','SW':'西南风','WSW':'西偏南','W':'西风','WNW':'西偏北','NW':'西北风','NNW':'北偏西' };
  return map[dir] || dir;
}

function dir16ToDeg(dir) {
  var map = { 'N':0,'NNE':22.5,'NE':45,'ENE':67.5,'E':90,'ESE':112.5,'SE':135,'SSE':157.5,'S':180,'SSW':202.5,'SW':225,'WSW':247.5,'W':270,'WNW':292.5,'NW':315,'NNW':337.5 };
  return map[dir] != null ? map[dir] : 0;
}

function uvLevel(uv) {
  if (uv <= 2) return '弱 · ' + uv;
  if (uv <= 5) return '中等 · ' + uv;
  if (uv <= 7) return '强 · ' + uv;
  if (uv <= 10) return '很强 · ' + uv;
  return '极强 · ' + uv;
}

function renderAdvice(weather) {
  var side = document.getElementById('weatherSide');
  var advice = generateAdvice(weather);
  side.className = 'weather-side loaded';
  side.innerHTML =
    '<div class="advice-header"><div class="advice-head-inner"><span class="advice-head-avatar">✦</span><div><h3>AI 出行建议</h3><span class="advice-sub">基于实时天气智能分析</span></div></div></div>' +
    '<div class="advice-body">' +
      advice.map(function(a) {
        var cat = classifyAdvice(a.text);
        return '<div class="advice-item advice-' + cat + '">' +
          '<div class="advice-item-icon-wrap"><span class="advice-item-icon">' + a.icon + '</span></div>' +
          '<div class="advice-item-content"><span class="advice-item-cat">' + catLabel(cat) + '</span><span class="advice-item-text">' + a.text + '</span></div>' +
        '</div>';
      }).join('') +
    '</div>';
}

function classifyAdvice(text) {
  if (text.includes('穿') || text.includes('衣物') || text.includes('外套') || text.includes('防晒') || text.includes('保暖')) return 'wear';
  if (text.includes('户') || text.includes('拍照') || text.includes('观光') || text.includes('室内')) return 'activity';
  return 'notice';
}

function catLabel(cat) {
  return cat === 'wear' ? '穿搭' : cat === 'activity' ? '活动' : '提示';
}

function renderForecast(parsed, fallbackDays) {
  var container = document.getElementById('forecastContainer');
  if (!container) return;

  var days = [];
  if (parsed && parsed.daily && parsed.daily.length) days = parsed.daily;
  else if (fallbackDays && fallbackDays.length) days = fallbackDays;

  if (!days.length) {
    container.innerHTML = '<div class="forecast-empty">7 天预告暂不可用，请稍后重试</div>';
    return;
  }

  var allMin = Infinity, allMax = -Infinity;
  for (var i = 0; i < days.length; i++) {
    if (days[i].minTemp < allMin) allMin = days[i].minTemp;
    if (days[i].maxTemp > allMax) allMax = days[i].maxTemp;
  }
  var range = Math.max(allMax - allMin, 1);

  var cardsHtml = '';
  for (var j = 0; j < days.length; j++) {
    var day = days[j];
    var d = new Date(day.date);
    var wk = ['周日','周一','周二','周三','周四','周五','周六'];
    var label = j === 0 ? '今天' : j === 1 ? '明天' : wk[d.getDay()];
    var dateStr = (d.getMonth() + 1) + '/' + d.getDate();
    var leftPct = ((day.minTemp - allMin) / range) * 100;
    var widthPct = Math.max(((day.maxTemp - day.minTemp) / range) * 100, 4);
    var popHtml = day.pop > 10 ? '<span class="fr-pop">💧' + day.pop + '%</span>' : '<span class="fr-pop"></span>';
    cardsHtml += '<div class="forecast-row">' +
      '<div class="fr-left"><span class="fr-label">' + label + '</span><span class="fr-date">' + dateStr + '</span></div>' +
      '<div class="fr-icon">' + weatherSVG(day.desc || 'Clear', 32) + '</div>' +
      '<div class="fr-temp">' +
        '<span class="fr-temp-low">' + day.minTemp + '°</span>' +
        '<span class="fr-temp-bar"><span class="fr-temp-bar-inner" style="left:' + leftPct + '%;width:' + widthPct + '%"></span></span>' +
        '<span class="fr-temp-high">' + day.maxTemp + '°</span>' +
      '</div>' +
      popHtml +
    '</div>';
  }

  var sunrise = (days[0] && days[0].sunrise) ? formatTimeShort(days[0].sunrise) : '--:--';
  var sunset = (days[0] && days[0].sunset) ? formatTimeShort(days[0].sunset) : '--:--';

  container.innerHTML =
    '<div class="forecast-card-list" style="position:relative;z-index:5;">' +
      '<div class="forecast-head">' +
        '<span class="forecast-title">📅 未来 7 天天气预报</span>' +
        '<span class="forecast-sub">日出 ' + sunrise + ' · 日落 ' + sunset + '</span>' +
      '</div>' +
      '<div class="forecast-body" style="position:relative;z-index:2;">' + cardsHtml + '</div>' +
    '</div>';
}

function renderHourly(parsed) {
  var container = document.getElementById('hourlyContainer');
  if (!container) return;
  if (!parsed || !parsed.hourly || !parsed.hourly.length) {
    container.innerHTML = '<div class="hourly-empty">24 小时预告暂不可用</div>';
    return;
  }
  var samples = parsed.hourly.slice(0, 24);
  var temps = samples.map(function(s) { return s.temp; });
  var tMin = Math.min.apply(null, temps);
  var tMax = Math.max.apply(null, temps);
  var tRange = Math.max(tMax - tMin, 1);
  var iMax = temps.indexOf(tMax);
  var iMin = temps.indexOf(tMin);

  var points = samples.map(function(s, i) {
    var norm = (s.temp - tMin) / tRange;
    return { x: (i + 0.5) * (100 / samples.length), y: 15 + (1 - norm) * 70, temp: s.temp };
  });
  // Catmull-Rom 转 Cubic Bezier：平滑曲线穿过所有点
  function smoothPath(pts, closeY) {
    if (pts.length < 2) return '';
    var d = 'M ' + pts[0].x.toFixed(2) + ',' + pts[0].y.toFixed(2);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || pts[i + 1];
      var cp1x = p1.x + (p2.x - p0.x) / 6;
      var cp1y = p1.y + (p2.y - p0.y) / 6;
      var cp2x = p2.x - (p3.x - p1.x) / 6;
      var cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C ' + cp1x.toFixed(2) + ',' + cp1y.toFixed(2) +
           ' ' + cp2x.toFixed(2) + ',' + cp2y.toFixed(2) +
           ' ' + p2.x.toFixed(2) + ',' + p2.y.toFixed(2);
    }
    return d;
  }
  var linePath = smoothPath(points);
  var areaPath = linePath + ' L 100,100 L 0,100 Z';

  // 23 条垂直分隔线
  var dividers = '';
  for (var d = 1; d < samples.length; d++) {
    dividers += '<div class="hourly-col-divider" style="left:' + (d * (100 / samples.length)) + '%"></div>';
  }

  var curveSvg =
    '<svg class="hourly-curve" viewBox="0 0 100 100" preserveAspectRatio="none">' +
      '<defs>' +
        '<linearGradient id="hourlyArea" x1="0" x2="0" y1="0" y2="1">' +
          '<stop offset="0" stop-color="#fb7185" stop-opacity="0.32"/>' +
          '<stop offset="0.6" stop-color="#f59e0b" stop-opacity="0.12"/>' +
          '<stop offset="1" stop-color="#0ea5e9" stop-opacity="0.02"/>' +
        '</linearGradient>' +
        '<linearGradient id="hourlyLine" x1="0" x2="1" y1="0" y2="0">' +
          '<stop offset="0" stop-color="#fb7185"/>' +
          '<stop offset="0.5" stop-color="#f59e0b"/>' +
          '<stop offset="1" stop-color="#0ea5e9"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<path d="' + areaPath + '" fill="url(#hourlyArea)"/>' +
      '<path d="' + linePath + '" fill="none" stroke="url(#hourlyLine)" stroke-width="0.7" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  var itemsHtml = samples.map(function(s, i) {
    var label = (s.hour < 10 ? '0' : '') + s.hour + ':00';
    var isMax = i === iMax;
    var isMin = i === iMin;
    var tempClass = isMax ? ' is-max' : isMin ? ' is-min' : '';
    var marker = '';
    if (isMax) marker = '<span class="hi-marker-label max">↑ 最高 ' + tMax + '°</span>';
    else if (isMin) marker = '<span class="hi-marker-label min">↓ 最低 ' + tMin + '°</span>';
    return '<div class="hourly-item">' +
      marker +
      '<div class="hi-time">' + label + '</div>' +
      '<div class="hi-icon">' + weatherSVG(s.desc, 28) + '</div>' +
      '<div class="hi-temp' + tempClass + '">' + s.temp + '°</div>' +
      (s.pop > 10 ? '<div class="hi-pop">💧' + s.pop + '%</div>' : '<div class="hi-pop"></div>') +
    '</div>';
  }).join('');

  container.innerHTML =
    '<div class="hourly-card">' +
      '<div class="hourly-head">' +
        '<span class="hourly-title">⏱ 未来 24 小时</span>' +
        '<div class="hourly-head-right">' +
          '<span class="hourly-range-pill max">↑ ' + tMax + '°</span>' +
          '<span class="hourly-range-pill min">↓ ' + tMin + '°</span>' +
          '<span class="hourly-sub">每 1 小时一档</span>' +
        '</div>' +
      '</div>' +
      '<div class="hourly-track">' + dividers + curveSvg + itemsHtml + '</div>' +
    '</div>';
}

function formatTimeShort(iso) {
  if (!iso) return '--:--';
  var m = iso.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : iso;
}

/* 统一坐标解析：预置 coord → 拼音 Open-Meteo → 高德兜底。
   返回 [lng, lat] 或 null。实时卡(wttr.in)与 7 天卡(Open-Meteo)共用，
   保证两路用的是同一坐标，绝不一致 / 跨城市错配。 */
async function resolveCoord(city) {
  if (city && Array.isArray(city.coord) && city.coord.length === 2) return city.coord;
  var py = (city && city.pinyin) ? city.pinyin : '';
  var nm = (city && city.name) ? city.name : '';
  // query 优先用拼音（英文/拼音命中 Open-Meteo），否则用中文走高德兜底
  var query = /[A-Za-z]/.test(py) ? py : (/[A-Za-z]/.test(nm) ? nm : (py || nm));
  if (!query) return null;
  // 1) 拼音/英文名 → Open-Meteo geocoding（最准，只取第一个结果）
  if (/[A-Za-z]/.test(query)) {
    try {
      var c1 = new AbortController();
      var t1 = setTimeout(function() { c1.abort(); }, 5000);
      var geoResp = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(query) + '&count=1&language=en', { signal: c1.signal });
      clearTimeout(t1);
      if (geoResp.ok) {
        var geo = await geoResp.json();
        if (geo.results && geo.results.length) return [geo.results[0].latitude, geo.results[0].longitude];
      }
    } catch (e1) { clearTimeout(t1); }
  }
  // 2) 高德浏览器端兜底（中文名 / 拼音失败 / 网络受限）
  try {
    var amap = await geocodePlace(query);
    if (amap) return amap;
  } catch (e2) {}
  return null;
}

/* Open-Meteo 24h + 7 天扩展预告（无需 key）
   接受 city 对象：{ name, pinyin, coord:[lat,lon] }
   坐标统一由 resolveCoord 解析（实时卡与 7 天卡共用同一坐标）。 */
async function fetchExtendedForecast(city) {
  try {
    var coord = await resolveCoord(city);
    if (!coord) return null;
    var lat = coord[0], lon = coord[1];
    var c2 = new AbortController();
    var t2 = setTimeout(function() { c2.abort(); }, 6000);
    var fcUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
      '&hourly=weather_code,temperature_2m,precipitation_probability' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max' +
      '&forecast_days=7&timezone=auto';
    var fcResp = await fetch(fcUrl, { signal: c2.signal });
    clearTimeout(t2);
    if (!fcResp.ok) return null;
    return await fcResp.json();
  } catch (e) {
    return null;
  }
}

function parseExtendedForecast(fc) {
  try {
    if (!fc || !fc.hourly || !fc.daily) return null;
    var h = fc.hourly;
    var times = h.time || [];
    var now = Date.now();
    var startIdx = 0;
    for (var i = 0; i < times.length; i++) {
      if (new Date(times[i]).getTime() >= now) { startIdx = i; break; }
    }
    var hourly = [];
    for (var j = 0; j < 24 && (startIdx + j) < times.length; j++) {
      var idx = startIdx + j;
      var date = new Date(times[idx]);
      var descStr = wmoToDesc(h.weather_code[idx]);
      hourly.push({
        time: times[idx],
        hour: date.getHours(),
        temp: Math.round(h.temperature_2m[idx]),
        code: h.weather_code[idx],
        desc: descStr,
        descZh: translateWeatherDesc(descStr),
        pop: h.precipitation_probability ? (h.precipitation_probability[idx] || 0) : 0
      });
    }
    var d = fc.daily;
    var daily = [];
    var dtimes = d.time || [];
    for (var k = 0; k < dtimes.length && k < 7; k++) {
      var ddesc = wmoToDesc(d.weather_code[k]);
      daily.push({
        date: dtimes[k],
        maxTemp: Math.round(d.temperature_2m_max[k]),
        minTemp: Math.round(d.temperature_2m_min[k]),
        code: d.weather_code[k],
        desc: ddesc,
        descZh: translateWeatherDesc(ddesc),
        pop: d.precipitation_probability_max ? (d.precipitation_probability_max[k] || 0) : 0,
        sunrise: d.sunrise ? d.sunrise[k] : '',
        sunset: d.sunset ? d.sunset[k] : '',
        uv: d.uv_index_max ? Math.round(d.uv_index_max[k]) : 0
      });
    }
    return { hourly: hourly, daily: daily };
  } catch (e) {
    console.warn('parseExtendedForecast error:', e);
    return null;
  }
}

function wmoToDesc(code) {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code === 51 || code === 53 || code === 55) return 'Drizzle';
  if (code === 56 || code === 57) return 'Freezing Drizzle';
  if (code === 61 || code === 63 || code === 65) return 'Rain';
  if (code === 66 || code === 67) return 'Freezing Rain';
  if (code === 71 || code === 73 || code === 75) return 'Snow';
  if (code === 77) return 'Snow grains';
  if (code === 80 || code === 81 || code === 82) return 'Rain showers';
  if (code === 85 || code === 86) return 'Snow showers';
  if (code === 95) return 'Thunderstorm';
  if (code === 96 || code === 99) return 'Thunderstorm w/ hail';
  return 'Clear';
}

/* 实时天气看板：支持用户搜索任意城市/地点（自定义） */
function searchWeatherCustom() {
  var input = document.getElementById('weatherSearch');
  if (!input) return;
  var q = input.value.trim();
  if (!q) { showToast('请输入要查询的城市或地点', 'error'); return; }
  showWeatherForPlace(q);
}

async function showWeatherForPlace(q) {
  var card = document.getElementById('weatherCard');
  var side = document.getElementById('weatherSide');
  var fc = document.getElementById('forecastContainer');
  var hourly = document.getElementById('hourlyContainer');
  if (!card || !side) return;
  card.className = 'weather-main';
  card.innerHTML = '<div class="weather-placeholder"><div class="loading-spinner"></div><p style="margin-top:16px">正在获取 ' + q + ' 实时天气...</p></div>';
  side.className = 'weather-side';
  side.innerHTML = '<div class="advice-placeholder"><div class="loading-spinner"></div><p style="margin-top:16px;text-align:center">AI 正在分析天气并生成建议...</p></div>';
  fc.innerHTML = '';
  if (hourly) hourly.innerHTML = '<div class="hourly-empty">⏱ 加载未来 24 小时…</div>';
  // —— 统一解析城市与坐标：实时卡(wttr.in) + 7 天卡(Open-Meteo) 共用同一坐标，
  //    彻底避免「实时卡用中文名错配到别城 / 两路坐标不一致」的问题 ——
  var matchedCity = null;
  try {
    var qLower = String(q).toLowerCase();
    for (var i = 0; i < destinations.length; i++) {
      var d = destinations[i];
      if (d.id === qLower || d.name === q || d.pinyin === q || (d.aliases && d.aliases.indexOf(q) >= 0)) {
        matchedCity = d;
        break;
      }
    }
    // 不在精选城 → 从全国库 CITY_DB 取拼音（中文名 → 英文拼音，Open-Meteo 最准）
    if (!matchedCity && window.CITY_DB) {
      for (var ci = 0; ci < window.CITY_DB.length; ci++) {
        var cdb = window.CITY_DB[ci];
        if (cdb.n === q || cdb.p === q) {
          matchedCity = { name: cdb.n, pinyin: cdb.p, coord: null, __custom: true };
          break;
        }
      }
    }
  } catch (e) {}
  // 解析坐标：精选城用预置 coord → 拼音 Open-Meteo → 高德兜底
  var coord = await resolveCoord(matchedCity || { name: q, pinyin: q });
  var cityForBoth = { name: q, pinyin: matchedCity ? matchedCity.pinyin : q, coord: coord };

  var weather = await fetchWeather(cityForBoth);
  if (!weather) {
    card.innerHTML = '<div class="weather-placeholder"><div class="placeholder-icon">😕</div><p>暂未获取到 ' + q + ' 的天气数据<br>请检查地点名称后重试</p></div>';
    side.innerHTML = '<div class="advice-placeholder"><p>天气数据获取失败，无法生成建议。</p></div>';
    if (hourly) hourly.innerHTML = '';
    showToast('天气获取失败，请确认地点名称', 'error');
    return;
  }
  renderWeatherCard({ name: q, region: '自定义地点', description: '你搜索的地点' }, weather);
  renderAdvice(weather);

  // 24h + 7 天：与实时卡共用同一坐标，Open-Meteo 优先，失败回退 wttr.in
  var ext = await fetchExtendedForecast(cityForBoth);
  var parsed = ext ? parseExtendedForecast(ext) : null;
  if (parsed && parsed.hourly && parsed.hourly.length >= 20) {
    renderHourly(parsed);
    renderForecast(parsed);
  } else {
    renderHourly({ hourly: weather.hourly });
    renderForecast({ daily: weather.forecast }, null);
  }

  var today = weather.forecast && weather.forecast[0] ? weather.forecast[0] : null;
  if (today) {
    renderWeatherCard({ name: q, region: '自定义地点', description: '你搜索的地点' }, weather, {
      sunrise: today.sunrise,
      sunset: today.sunset,
      todayMax: today.maxTemp,
      todayMin: today.minTemp
    });
  }
}

/* ============ 地图模块（高德 AMap，GCJ-02 坐标） ============ */

const cityCoords = {
  beijing: [116.397, 39.908],
  shanghai: [121.473, 31.230],
  chengdu: [104.066, 30.572],
  hangzhou: [120.155, 30.274],
  xian: [108.948, 34.263],
  chongqing: [106.551, 29.563],
  sanya: [109.508, 18.247],
  guilin: [110.299, 25.274],
  lijiang: [100.233, 26.872],
  zhangjiajie: [110.479, 29.117],
  xiamen: [118.089, 24.479],
  qingdao: [120.382, 36.067],
  changsha: [112.939, 28.228],
  wuhan: [114.305, 30.593],
  harbin: [126.535, 45.803],
  dali: [100.267, 25.606],
  lhasa: [91.140, 29.645],
  suzhou: [120.619, 31.299],
  nanjing: [118.797, 32.060],
  tianjin: [117.190, 39.125],
  guangzhou: [113.264, 23.129],
  huangshan: [118.340, 29.710],
  guiyang: [106.713, 26.578],
  shenyang: [123.431, 41.805],
  luoyang: [112.454, 34.619],
  dunhuang: [94.662, 40.142],
  urumqi: [87.617, 43.825],
  hulunbeier: [119.767, 49.214],
  taiyuan: [112.549, 37.857],
  nanchang: [115.858, 28.682],
  yinchuan: [106.232, 38.487],
  xining: [101.778, 36.617]
};

let amapLoadingPromise = null;

// 兜底：捕获高德异步返回的 key/安全密钥错误，直接显示到地图容器
window.addEventListener('error', function(ev) {
  var msg = (ev && ev.message) ? ev.message : '';
  if (/AMap|KEY|key|security|INVALID|PLAT|REF_ROUTER|SCODE/i.test(msg)) {
    var box = document.getElementById('chinaMap');
    if (box && box.querySelector('.map-placeholder') === null) {
      box.innerHTML = '<div class="map-placeholder">⚠️ 地图错误：<br><small>' + msg + '</small><br>常见原因：Key 服务平台选错(需 Web端 JS API)、安全密钥不匹配、Referer 白名单未放行 localhost。</div>';
    }
  }
});

function loadAMapScript() {
  if (amapLoadingPromise) return amapLoadingPromise;
  amapLoadingPromise = new Promise(function(resolve, reject) {
    if (window.AMap) { resolve(window.AMap); return; }
    var cfg = window.MAP_CONFIG;
    if (!cfg || !cfg.key || cfg.key.indexOf('在此粘贴') === 0) {
      reject(new Error('NO_KEY'));
      return;
    }
    window._AMapSecurityConfig = { securityJsCode: cfg.securityJsCode };
    var s = document.createElement('script');
    s.src = 'https://webapi.amap.com/maps?v=2.0&key=' + encodeURIComponent(cfg.key) + '&plugin=AMap.PlaceSearch,AMap.Geocoder,AMap.Driving,AMap.Transfer,AMap.Walking,AMap.Riding';
    s.onload = function() { resolve(window.AMap); };
    s.onerror = function() { reject(new Error('LOAD_FAIL')); };
    document.head.appendChild(s);
  });
  return amapLoadingPromise;
}

let chinaMap = null;

async function initMap() {
  var container = document.getElementById('chinaMap');
  if (!container) return;
  try {
    var AMap = await loadAMapScript();
    chinaMap = new AMap.Map('chinaMap', {
      zoom: 5,
      center: [104.5, 34.0],
      viewMode: '3D'
    });
    destinations.forEach(function(d) {
      var coord = cityCoords[d.id];
      if (!coord) return;
      var markerContent =
        '<div class="city-marker" data-id="' + d.id + '">' +
          '<div class="city-marker-pulse" style="background:' + d.color + '"></div>' +
          '<div class="city-marker-dot" style="background:' + d.color + '"></div>' +
          '<div class="city-marker-label">' + d.name + '</div>' +
        '</div>';
      var marker = new AMap.Marker({
        position: coord,
        content: markerContent,
        title: d.name,
        offset: new AMap.Pixel(0, 0)
      });
      marker.on('click', function() { if (mapPickCity(d)) return; openCityWeather(d, coord); });
      marker.on('mouseover', function(e) { showSpotPopover(d, e.pixel); });
      marker.on('mouseout', function() { scheduleHideSpotPopover(); });
      chinaMap.add(marker);
    });
    chinaMap.on('click', function(ev) { mapPickPoint(ev.lnglat); });
  } catch (e) {
    if (e && e.message === 'NO_KEY') {
      container.innerHTML = '<div class="map-placeholder">🗺️ 地图待激活：请在 <b>config.js</b> 中填入你的高德 Key 与安全密钥，保存后刷新即可显示。</div>';
    } else {
      var detail = (e && e.message) ? e.message : String(e);
      container.innerHTML = '<div class="map-placeholder">⚠️ 地图加载失败：<br><small>' + detail + '</small><br>常见原因：Key 服务平台选错(需 Web端 JS API)、安全密钥不匹配、Referer 白名单未放行 localhost。</div>';
      console.error('AMap load error:', e);
    }
  }
}

async function openCityWeather(city, coord) {
  if (!chinaMap) return;
  chinaMap.setZoomAndCenter(7, coord);
  var weather = await fetchWeather(city);
  var content;
  if (!weather) {
    content = '<div style="padding:12px;min-width:180px"><strong>' + city.name + '</strong><br>天气获取失败，请稍后重试</div>';
  } else {
    var advice = generateAdvice(weather).slice(0, 2).map(function(a) {
      return a.icon + ' ' + a.text;
    }).join('<br>');
    content = '<div style="padding:12px;min-width:210px">' +
      '<div style="font-weight:700;font-size:15px">' + city.name + ' ' + weather.icon + ' ' + weather.temp + '°C</div>' +
      '<div style="color:#64748b;font-size:12px;margin:2px 0 8px">' + weather.descZh + ' · 体感 ' + weather.feelsLike + '°C</div>' +
      '<div style="font-size:12px;line-height:1.6">' + advice + '</div>' +
      '<button id="mapViewDetail" style="margin-top:10px;padding:6px 14px;border:none;border-radius:9999px;background:#0284c7;color:#fff;cursor:pointer;font-size:12px">查看完整天气 →</button>' +
      '</div>';
  }
  var infoWindow = new AMap.InfoWindow({ content: content, offset: new AMap.Pixel(0, -30) });
  infoWindow.open(chinaMap, coord);
  setTimeout(function() {
    var btn = document.getElementById('mapViewDetail');
    if (btn) {
      btn.addEventListener('click', function() {
        infoWindow.close();
        selectCity(city.id);
        document.getElementById('weather').scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, 60);
}

/* ---------- 景点悬停轮播卡 + 简介弹窗 ---------- */

let spotPopover = null;
let spotPopoverTimer = null;
let spotCarouselTimer = null;
let spotCarouselIdx = 0;
let spotCarouselCity = null;

function ensureSpotPopover() {
  if (spotPopover) return spotPopover;
  var mapEl = document.getElementById('chinaMap');
  if (!mapEl) return null;
  var el = document.createElement('div');
  el.className = 'spot-popover';
  el.innerHTML =
    '<div class="spot-weather" id="spotWeather"></div>' +
    '<div class="spot-carousel"></div>';
  mapEl.appendChild(el);
  el.addEventListener('mouseenter', function() { clearTimeout(spotPopoverTimer); });
  el.addEventListener('mouseleave', function() { hideSpotPopover(); });
  spotPopover = el;
  return el;
}

function showSpotPopover(city, pixel) {
  if (!city.spots || !city.spots.length) return;
  var el = ensureSpotPopover();
  if (!el) return;
  clearTimeout(spotPopoverTimer);
  spotCarouselCity = city;
  spotCarouselIdx = 0;
  if (city.spots) city.spots.forEach(function(s) { resolveSpotImage(s); });
  var wEl = el.querySelector('#spotWeather');
  if (wEl) {
    wEl.innerHTML = '<span class="spot-city">' + city.name + '</span><span class="spot-wx-loading">天气…</span>';
    fetchWeather(city).then(function(w) {
      if (w && wEl && spotPopover === el) {
        wEl.innerHTML = '<span class="spot-city">' + city.name + '</span>' +
          '<span class="spot-wx">' +
            '<span class="spot-wx-zh">' + w.icon + ' ' + w.descZh + '</span>' +
            '<span class="spot-wx-temp">' + w.temp + '°C</span>' +
            '<span class="spot-wx-en">' + w.desc + '</span>' +
          '</span>';
      }
    });
  }
  renderSpotSlide(city, 0);
  var w = el.offsetWidth || 240;
  var h = el.offsetHeight || 150;
  var px = (pixel && typeof pixel.x === 'number') ? pixel.x : (el.parentNode.offsetWidth / 2);
  var py = (pixel && typeof pixel.y === 'number') ? pixel.y : 0;
  var left = px - w / 2;
  var top = py - h - 14;
  el.style.left = Math.max(4, left) + 'px';
  el.style.top = Math.max(4, top) + 'px';
  el.classList.add('show');
  startSpotCarousel();
}

function renderSpotSlide(city, idx) {
  var spots = city.spots;
  idx = (idx + spots.length) % spots.length;
  spotCarouselIdx = idx;
  var spot = spots[idx];
  var carousel = spotPopover.querySelector('.spot-carousel');
  carousel.innerHTML =
    '<div class="spot-slide">' +
      '<div class="spot-img" style="background:' + city.gradient + '">' +
        '<span class="spot-emoji-fallback">' + spot.emoji + '</span>' +
        '<img class="spot-img-el" alt="' + spot.name + '" loading="lazy" decoding="async">' +
        '<span class="spot-loading">照片加载中…</span>' +
      '</div>' +
      '<div class="spot-caption">' +
        '<span class="spot-name">' + spot.name + '</span>' +
        '<span class="spot-hint">点击查看简介 ›</span>' +
      '</div>' +
    '</div>';
  var slide = carousel.querySelector('.spot-slide');
  slide.addEventListener('click', function(e) {
    e.stopPropagation();
    openSpotModal(city, spot);
  });
  var imgBox = slide.querySelector('.spot-img');
  var imgEl = slide.querySelector('.spot-img-el');
  var loadingEl = slide.querySelector('.spot-loading');
  resolveSpotImage(spot).then(function(info) {
    if (info && info.src) {
      imgEl.onload = function() { imgEl.classList.add('loaded'); imgBox.classList.add('has-img'); if (loadingEl) { loadingEl.style.display = 'none'; } };
      imgEl.onerror = function() { if (loadingEl) { loadingEl.textContent = '（暂无网络照片，显示示意图）'; loadingEl.classList.add('note'); } };
      imgEl.src = info.src;
    } else if (loadingEl) {
      loadingEl.textContent = '（暂无网络照片，显示示意图）';
      loadingEl.classList.add('note');
    }
  });
}

function startSpotCarousel() {
  clearInterval(spotCarouselTimer);
  spotCarouselTimer = setInterval(function() {
    if (spotCarouselCity) renderSpotSlide(spotCarouselCity, spotCarouselIdx + 1);
  }, 3000);
}

function scheduleHideSpotPopover() {
  clearTimeout(spotPopoverTimer);
  spotPopoverTimer = setTimeout(hideSpotPopover, 300);
}

function hideSpotPopover() {
  clearTimeout(spotPopoverTimer);
  clearInterval(spotCarouselTimer);
  if (spotPopover) spotPopover.classList.remove('show');
  spotCarouselCity = null;
}

/* ---------- 景点简介弹窗 ---------- */

let spotModal = null;

function ensureSpotModal() {
  if (spotModal) return spotModal;
  var el = document.createElement('div');
  el.className = 'spot-modal-overlay';
  el.innerHTML =
    '<div class="spot-modal" role="dialog" aria-modal="true">' +
      '<button class="spot-modal-close" aria-label="关闭">×</button>' +
      '<div class="spot-modal-img"><span class="spot-modal-img-emoji"></span><img class="spot-modal-img-el" alt="" loading="lazy" decoding="async"></div>' +
      '<div class="spot-modal-body">' +
        '<div class="spot-modal-head">' +
          '<div>' +
            '<div class="spot-modal-name"></div>' +
            '<div class="spot-modal-city"></div>' +
          '</div>' +
        '</div>' +
        '<p class="spot-modal-intro"></p>' +
        '<div class="spot-modal-credit"></div>' +
        '<button class="spot-modal-weather">查看该城市天气 →</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(el);
  el.addEventListener('click', function(e) {
    if (e.target === el) closeSpotModal();
  });
  el.querySelector('.spot-modal-close').addEventListener('click', closeSpotModal);
  el.querySelector('.spot-modal-weather').addEventListener('click', function() {
    var cityId = el.getAttribute('data-city');
    closeSpotModal();
    if (cityId) { selectCity(cityId); document.getElementById('weather').scrollIntoView({ behavior: 'smooth' }); }
  });
  spotModal = el;
  return el;
}

function openSpotModal(city, spot) {
  var el = ensureSpotModal();
  el.setAttribute('data-city', city.id);
  var imgBox = el.querySelector('.spot-modal-img');
  var emojiEl = el.querySelector('.spot-modal-img-emoji');
  var imgEl = el.querySelector('.spot-modal-img-el');
  var creditEl = el.querySelector('.spot-modal-credit');
  imgBox.style.background = city.gradient;
  imgBox.classList.remove('has-img');
  imgEl.classList.remove('loaded');
  imgEl.removeAttribute('src');
  emojiEl.textContent = spot.emoji;
  emojiEl.style.display = '';
  creditEl.textContent = '';
  el.querySelector('.spot-modal-name').textContent = spot.name;
  el.querySelector('.spot-modal-city').textContent = city.name + ' · ' + city.region;
  el.querySelector('.spot-modal-intro').textContent = spot.intro;
  el.classList.add('show');
  document.body.style.overflow = 'hidden';
  resolveSpotImage(spot).then(function(info) {
    if (info && info.src) {
      imgEl.onload = function() { imgEl.classList.add('loaded'); imgBox.classList.add('has-img'); emojiEl.style.display = 'none'; };
      imgEl.onerror = function() {};
      imgEl.src = info.src;
      if (info.credit) {
        creditEl.innerHTML = '图片：<a href="' + (info.page || '#') + '" target="_blank" rel="noopener">' + info.credit + '</a> · ' + (info.source || '维基共享资源');
      }
    }
  });
}

function closeSpotModal() {
  if (!spotModal) return;
  spotModal.classList.remove('show');
  document.body.style.overflow = '';
}

/* ---------- 维基共享资源：实时获取景点真实高清照片（合法 CC 授权） ---------- */

function stripTags(html) {
  var d = document.createElement('div');
  d.innerHTML = html;
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}

function fetchWithTimeout(url, ms) {
  return new Promise(function(resolve, reject) {
    var timer = setTimeout(function() { reject(new Error('timeout')); }, ms);
    fetch(url, { mode: 'cors' }).then(function(r) {
      clearTimeout(timer);
      resolve(r);
    }).catch(function(e) {
      clearTimeout(timer);
      reject(e);
    });
  });
}

function hashStr(s) {
  var h = 0;
  for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return h;
}

function resolveSpotImage(spot) {
  if (spot._promise) return spot._promise;
  var TIMEOUT = 4500;
  var wikiTitle = spot.wiki;
  // 本地优先：用户自备的授权经典图放在 images/ 下，spot.img 指向文件名（如 "great-wall.jpg"）
  if (spot.img) {
    spot._promise = Promise.resolve({
      src: 'images/' + spot.img,
      credit: '© ' + (spot.credit || '景点授权图片'),
      page: '#',
      source: '本地图库'
    });
    return spot._promise;
  }
  function tryChain() {
    return tryWikipedia()
      .catch(function() { return tryWikimedia(); })
      .catch(function() { return tryFlickr(); });
  }
  function run(times) {
    return tryChain().then(function(info) {
      if (info || times <= 1) return info;
      // 全部源失败（多为瞬时网络抖动），间隔后整体重试
      return new Promise(function(res) { setTimeout(res, 600); }).then(function() { return run(times - 1); });
    });
  }
    function tryWikipedia() {
      if (!wikiTitle) return Promise.reject();
      var api = 'https://zh.wikipedia.org/w/api.php?action=query&redirects=1' +
        '&titles=' + encodeURIComponent(wikiTitle) +
        '&prop=pageimages&piprop=name|thumbnail&pithumbsize=1000&format=json&origin=*';
      return fetchWithTimeout(api, TIMEOUT).then(function(r) {
        if (!r.ok) throw new Error('bad');
        return r.json();
      }).then(function(data) {
        var pages = (data.query && data.query.pages) ? data.query.pages : {};
        var pid = null;
        Object.keys(pages).forEach(function(k) {
          var p = pages[k];
          if (p.pageimage && p.thumbnail && p.thumbnail.source) pid = p;
        });
        if (!pid) throw new Error('no pageimage');
        var src = pid.thumbnail.source;
        var fileTitle = pid.pageimage;
        var api2 = 'https://commons.wikimedia.org/w/api.php?action=query&redirects=1' +
          '&titles=' + encodeURIComponent(fileTitle) +
          '&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=1000&format=json&origin=*';
        return fetchWithTimeout(api2, TIMEOUT).then(function(r2) {
          if (!r2.ok) throw new Error('bad2');
          return r2.json();
        }).then(function(data2) {
          var p2 = (data2.query && data2.query.pages) ? data2.query.pages : {};
          var best = null;
          Object.keys(p2).forEach(function(k) {
            var ii = p2[k].imageinfo && p2[k].imageinfo[0];
            if (!ii) return;
            if (/(map|flag|logo|icon|symbol|locator|relief|blank|disambig|question|distribution|ceramic|pottery|stamp|coin|diagram)/i.test(p2[k].title)) return;
            if (!best) best = ii;
          });
          var meta = best ? (best.extmetadata || {}) : {};
          var artist = best ? stripTags((meta.Artist && meta.Artist.value) || '') : '';
          if (!artist) artist = 'Wikimedia 贡献者';
          var license = best ? ((meta.LicenseShortName && meta.LicenseShortName.value) || 'CC') : 'CC';
          return {
            src: best && (best.thumburl || best.url) ? (best.thumburl || best.url) : src,
            credit: '© ' + artist + ' / ' + license,
            page: best && best.descriptionurl ? best.descriptionurl : 'https://zh.wikipedia.org/wiki/' + encodeURIComponent(wikiTitle),
            source: '维基百科'
          };
        }).catch(function() {
          return { src: src, credit: '© Wikimedia 贡献者 / CC', page: 'https://zh.wikipedia.org/wiki/' + encodeURIComponent(wikiTitle), source: '维基百科' };
        });
      });
    }
    function tryWikimedia() {
      if (!spot.wiki) return Promise.reject();
      var api = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
        '&gsrsearch=' + encodeURIComponent(spot.wiki) +
        '&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url%7Cextmetadata%7Cmime&iiurlwidth=1000&format=json&origin=*';
      return fetchWithTimeout(api, TIMEOUT).then(function(r) {
        if (!r.ok) throw new Error('bad');
        return r.json();
      }).then(function(data) {
        var pages = (data.query && data.query.pages) ? data.query.pages : {};
        var best = null;
        Object.keys(pages).forEach(function(k) {
          var p = pages[k];
          var ii = p.imageinfo && p.imageinfo[0];
          if (!ii || !ii.mime) return;
          if (ii.mime.indexOf('image/') !== 0 || ii.mime.indexOf('svg') >= 0) return;
          if (/(map|flag|logo|icon|symbol|locator|relief|blank|disambig|question|distribution|ceramic|pottery|stamp|coin|svg|diagram)/i.test(p.title)) return;
          if (!best) best = ii;
        });
        if (!best) throw new Error('none');
        var meta = best.extmetadata || {};
        var artist = stripTags((meta.Artist && meta.Artist.value) || '');
        if (!artist) artist = 'Wikimedia Commons 贡献者';
        var license = (meta.LicenseShortName && meta.LicenseShortName.value) || 'CC';
        return {
          src: best.thumburl || best.url,
          credit: '© ' + artist + ' / ' + license,
          page: best.descriptionurl || 'https://commons.wikimedia.org/',
          source: '维基共享资源'
        };
      });
    }
    function tryFlickr() {
      var kw = (spot.wiki || spot.name).replace(/\s+/g, ',');
      var url = 'https://loremflickr.com/800/600/' + encodeURIComponent(kw) + '?lock=' + Math.abs(hashStr(spot.name));
      return new Promise(function(res) {
        var settled = false;
        var t = setTimeout(function() { if (!settled) { settled = true; res(null); } }, TIMEOUT);
        var img = new Image();
        img.onload = function() {
          if (settled) return;
          settled = true; clearTimeout(t);
          res({ src: url, credit: '© Flickr 贡献者 / CC', page: 'https://www.flickr.com/search/?q=' + encodeURIComponent(spot.name), source: 'Flickr' });
        };
        img.onerror = function() {
          if (settled) return;
          settled = true; clearTimeout(t); res(null);
        };
        img.src = url;
      });
    }
  spot._promise = run(3);
  return spot._promise;
}

/* ============ 路线规划（AI 出行方式建议） ============ */

var routePickMode = false;
var routeStartCity = null;
var routeEndCity = null;
var routeWaypoints = [];

function haversineKm(a, b) {
  var R = 6371;
  var lat1 = a[1] * Math.PI / 180, lat2 = b[1] * Math.PI / 180;
  var dLat = (b[1] - a[1]) * Math.PI / 180;
  var dLng = (b[0] - a[0]) * Math.PI / 180;
  var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function fmtDuration(h) {
  if (h < 1) return Math.max(1, Math.round(h * 60)) + ' 分钟';
  return h.toFixed(1) + ' 小时';
}

/* 预计到达时间（ETA）：现在 + 行驶时长 → HH:MM（手机导航标配） */
function fmtETA(timeH) {
  var d = new Date(Date.now() + (timeH || 0) * 3600 * 1000);
  var h = d.getHours(), m = d.getMinutes();
  return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
}

function cityById(id) {
  return destinations.find(function(d) { return d.id === id; });
}

function coordOf(c) {
  if (!c) return null;
  return c.coord || (cityCoords[c.id] || null);
}

/* 高德地理编码：把任意地点名转成坐标 */
function geocodePlace(q) {
  return new Promise(function(resolve) {
    if (!window.AMap || !window.AMap.Geocoder) { resolve(null); return; }
    try {
      var geocoder = new window.AMap.Geocoder({ city: '全国' });
      geocoder.getLocation(q, function(status, result) {
        if (status === 'complete' && result.info === 'OK' && result.geocodes && result.geocodes.length) {
          var loc = result.geocodes[0].    location;
          resolve([loc.lat, loc.lng]);
        } else { resolve(null); }
      });
    } catch (e) { resolve(null); }
  });
}

/* 高德逆地理编码：坐标 → 地名（用于自由选点命名） */
function reverseGeocode(coord) {
  return new Promise(function(resolve) {
    if (!window.AMap || !window.AMap.Geocoder) { resolve('自定义点'); return; }
    try {
      var geocoder = new window.AMap.Geocoder({});
      geocoder.getAddress(new window.AMap.LngLat(coord[0], coord[1]), function(status, result) {
        if (status === 'complete' && result.info === 'OK' && result.regeocode) {
          resolve(result.regeocode.formattedAddress || '自定义点');
        } else { resolve('自定义点'); }
      });
    } catch (e) { resolve('自定义点'); }
  });
}

/* 依据距离 + 当前出行方式 + 偏好，生成某一段的候选出行方式
   - 严格按 mode 过滤：驾车只看到自驾/打车；公交地铁只看到地铁/公交/高铁；步行只见步行；骑行只见单车（短距离附步行）。
   - 再按 pref（最快/最省钱/躲避拥堵/推荐）决定展示顺序与 reco。 */
function transportForLeg(d, pref, mode) {
  var driveT = d / 40, walk = d / 4.5, cycle = d / 14, bus = d / 18, subway = d / 30, hsr = d / 250, flight = d / 750;
  function cost(km, perKm, base) { return Math.max(base || 0, Math.round((base || 0) + (km * (perKm || 0)))); }
  var all = {
    walk:   { key:'walk',   name:'步行',     time: walk,   cost: 0,                     reason:'0 元，零碳排放，适合短距离顺路散步。' },
    cycle:  { key:'cycle',  name:'共享单车', time: cycle,  cost: cost(d, 0.5, 1.5),     reason:'1.5 元起/次，灵活穿街走巷，避开拥堵。' },
    bus:    { key:'bus',    name:'公交/大巴', time: bus,   cost: cost(d, 0.3, 2),       reason:'2 元起，便宜但站点固定、需换乘。' },
    subway: { key:'subway', name:'地铁',     time: subway, cost: cost(d, 0.4, 2),       reason:'不堵车、准点，适合城内中短途。' },
    taxi:   { key:'taxi',   name:'打车/网约车', time: driveT, cost: cost(d, 2.3, 14),    reason:'14 元起步，点对点最省心，堵车另算。' },
    drive:  { key:'drive',  name:'自驾',     time: driveT, cost: cost(d, 0.8, 0),       reason:'0.8 元/km 油/电费，自由但需停车。' },
    hsr:    { key:'hsr',    name:'高铁/动车', time: hsr,   cost: cost(d, 0.45, 0),      reason:'250km/h，市中心到市中心，准点舒适。' },
    flight: { key:'flight', name:'飞机',     time: flight + 2.5, cost: cost(d, 0.6, 0), reason:'含约 2.5h 值机安检，超远距离才划算。' }
  };

  // 1) 按当前出行方式 mode 过滤候选池
  var byMode;
  if (mode === 'drive') {
    byMode = d < 3 ? ['taxi', 'drive', 'walk']
                    : (pref === 'avoidtraffic' ? ['taxi', 'drive'] : ['drive', 'taxi']);
  } else if (mode === 'transit') {
    if (d < 5)      byMode = ['subway', 'bus', 'walk'];
    else if (d > 200) byMode = ['hsr', 'subway', 'bus'];
    else            byMode = ['subway', 'bus', 'hsr'];
  } else if (mode === 'walk') {
    byMode = d > 50 ? [] : ['walk']; // 太远就不推荐步行
  } else if (mode === 'ride') {
    byMode = d < 2 ? ['cycle', 'walk'] : (d > 60 ? [] : ['cycle']);
  } else {
    byMode = ['drive', 'taxi', 'subway', 'bus', 'cycle', 'walk', 'hsr'];
  }
  if (!byMode.length) byMode = ['walk']; // 兜底，至少有步行
  var pool = byMode.map(function(k){ return all[k]; });

  // 2) 按偏好 pref 决定排序（仍只在该 mode 池内排）
  if (pref === 'fastest')      pool = pool.slice().sort(function(a, b){ return a.time - b.time; });
  else if (pref === 'cheapest') pool = pool.slice().sort(function(a, b){ return a.cost - b.cost; });
  // pref='recommend' 保持原 mode 默认顺序；pref='avoidtraffic' 已在 mode 分支里把 taxi 排前

  // 3) 第一项 = 推荐
  pool.forEach(function(m, i){ m.reco = (i === 0); });
  return pool;
}

/* 依据地点名推断最佳打卡时段 */
function bestVisitTime(name) {
  var n = (name || '');
  if (/日出|看日|观日|晨|清晨|晨跑/.test(n)) return '清晨（看日出/晨景最佳）';
  if (/夜|夜景|夜市|酒吧|灯光|晚霞/.test(n)) return '夜晚（夜景/夜市最佳）';
  if (/博物馆|博物|展览|美术馆|故居|遗址|寺|庙|宫|陵|祠|院|纪念馆/.test(n)) return '上午（馆内参观宜趁早）';
  if (/山|峰|湖|海|草原|公园|自然|峡谷|梯田|沙漠|雪山/.test(n)) return '上午（光线柔和、人少）';
  if (/古城|老街|古镇|街|巷|小镇|风情|市集|市场/.test(n)) return '下午（慢逛最惬意）';
  if (/日落|黄昏|夕阳/.test(n)) return '傍晚（日落时分最美）';
  return '上午或下午';
}

function fmtClock(minutes) {
  var h = Math.floor(minutes / 60) % 24;
  var m = minutes % 60;
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

/* ============ 高德风格路线规划 ============ */
var MODE_META = {
  drive:   { name:'驾车', icon:'🚗', speed:70, color:'#0a84ff' },
  transit: { name:'公交地铁', icon:'🚌', speed:32, color:'#34c759' },
  walk:    { name:'步行', icon:'🚶', speed:4.5, color:'#ff9500' },
  ride:    { name:'骑行', icon:'🚲', speed:15, color:'#af52de' }
};
var currentRouteMode = 'drive';
var lastPlanResult = null, lastPlanStart = null, lastPlanEnd = null;

function metersToKm(m) { return m / 1000; }
function secToH(sec) { return sec / 3600; }

/* 本地兜底方案：不依赖高德服务，始终可用（高德失败/未加载时显示） */
function localPlan(start, end, mode, pref) {
  var d = haversineKm(coordOf(start), coordOf(end));
  var meta = MODE_META[mode] || MODE_META.drive;
  var speed = meta.speed;
  if (mode === 'drive') speed = d > 300 ? 92 : (d > 50 ? 80 : 38); // 城区拥堵更慢
  var baseTime = d / speed;
  var basePath = buildWavyPath(coordOf(start), coordOf(end), mode, 'base');
  var strategies = [];
  if (mode === 'drive') {
    var toll = d > 40 ? Math.round(d * 0.45) : 0;
    var fuel = Math.round(d * 0.8);
    strategies.push({ tag:'推荐', title:'推荐路线', timeH: baseTime, costYuan: toll + fuel, toll: toll, lights: Math.max(2, Math.round(d * 0.08)), distanceKm: d, path: basePath, steps: driveSteps(start.name, end.name, d, '沿城市快速路 / 主干道') });
    strategies.push({ tag:'高速优先', title:'走高速', timeH: d / 95, costYuan: Math.round(d * 0.45) + Math.round(d * 0.8), toll: Math.round(d * 0.45), lights: Math.max(0, Math.round(d * 0.02)), distanceKm: d * 1.05, path: buildWavyPath(coordOf(start), coordOf(end), mode, 'highway'), steps: driveSteps(start.name, end.name, d * 1.05, '优先驶入高速公路') });
    strategies.push({ tag:'躲避拥堵', title:'少走拥堵', timeH: baseTime * 1.12, costYuan: toll + fuel, toll: toll, lights: Math.max(3, Math.round(d * 0.12)), distanceKm: d, path: buildWavyPath(coordOf(start), coordOf(end), mode, 'avoid'), steps: driveSteps(start.name, end.name, d, '避开拥堵主干道，改走辅路') });
  } else if (mode === 'transit') {
    var fare = Math.max(2, Math.round(2 + d * 0.25));
    strategies.push({ tag:'推荐', title:'地铁优先', timeH: d / 32, costYuan: fare, toll: 0, lights: 0, distanceKm: d, path: basePath, steps: transitSteps(start.name, end.name, d, '乘坐地铁') });
    strategies.push({ tag:'公交', title:'公交直达', timeH: d / 22, costYuan: Math.max(2, Math.round(2 + d * 0.15)), toll: 0, lights: 0, distanceKm: d, path: buildWavyPath(coordOf(start), coordOf(end), mode, 'bus'), steps: transitSteps(start.name, end.name, d, '乘坐公交车') });
    // ✅ 本地兜底也补一张跨城飞机/高铁估算，确保 >800km 时仍有替代
    if (d > 800) {
      strategies.push({ tag:'✈ 含航班', title:'含航班', timeH: d / 750 + 2.5, costYuan: Math.round(d * 0.6), toll: 0, lights: 0, distanceKm: d, path: null, steps: [
        { icon:'🚖', text:'前往出发机场', distKm: 25 },
        { icon:'✈️', text:'航班直飞目的地机场', distKm: d * 0.95 },
        { icon:'🛬', text:'落地后前往目的地', distKm: 35 }
      ], isFlightEstimate: true });
    }
  } else if (mode === 'walk') {
    strategies.push({ tag:'步行', title:'步行路线', timeH: d / 4.5, costYuan: 0, toll: 0, lights: Math.round(d / 0.4), distanceKm: d, path: buildWavyPath(coordOf(start), coordOf(end), mode, 'walk'), steps: simpleSteps(start.name, end.name, d, '🚶') });
  } else {
    strategies.push({ tag:'骑行', title:'骑行路线', timeH: d / 15, costYuan: Math.round(1.5 + d * 0.5), toll: 0, lights: Math.round(d / 0.5), distanceKm: d, path: buildWavyPath(coordOf(start), coordOf(end), mode, 'ride'), steps: simpleSteps(start.name, end.name, d, '🚲') });
  }
  // ✅ 改用统一入口：先按 pref 排序（fastest/cheapest），再统一重打 tag
  return applyPrefToStrategies({ mode: mode, startName: start.name, endName: end.name, distanceKm: d, strategies: strategies, weatherNote: '' }, pref || 'recommend', mode);
}

/* 本地伪路径：在起终点之间按出行方式插若干"沿道路"拐点，避免一根直线。
 * density = base|highway|avoid|bus|walk|ride 控制采样点数与抖动幅度。
 * 输出形如 [[lng,lat], ...]，可被 extractPath / drawRouteByMode 直接复用。 */
function buildWavyPath(sc, ec, mode, density) {
  density = density || 'base';
  var cfg = {
    'base':    { n: 14, amp: 0.6 },  // 驾车推荐
    'highway': { n: 10, amp: 0.4 },  // 高速优先：折线更直
    'avoid':   { n: 20, amp: 0.9 },  // 躲避拥堵：折线更碎
    'bus':     { n: 12, amp: 0.5 },  // 公交直达
    'walk':    { n: 10, amp: 0.5 },  // 步行：小路街巷
    'ride':    { n: 12, amp: 0.55 }  // 骑行：自行车道
  }[density] || { n: 14, amp: 0.6 };
  if (mode === 'walk') cfg = { n: 10, amp: 0.5 };
  else if (mode === 'ride') cfg = { n: 12, amp: 0.55 };
  else if (mode === 'transit') cfg = (density === 'bus') ? { n: 12, amp: 0.5 } : { n: 14, amp: 0.6 };

  var dLng = ec[0] - sc[0];
  var dLat = ec[1] - sc[1];
  if (Math.abs(dLng) + Math.abs(dLat) < 0.001) return [sc, ec]; // 同点

  // 在垂直于主方向加抖动（不能让首尾点偏移，否则接不上）
  var path = [sc];
  // 用伪随机数列（基于起终点）让抖动可复现，不会因为刷新跳来跳去
  var seed = Math.abs((sc[0] * 31 + sc[1] * 17 + ec[0] * 13 + ec[1] * 7) | 0) || 1;
  function rand(i) {
    var x = Math.sin(seed * 9301 + i * 49297 + density.charCodeAt(0) * 13) * 233280;
    return x - Math.floor(x);
  }
  for (var i = 1; i < cfg.n; i++) {
    var t = i / cfg.n;
    var lng = sc[0] + dLng * t + Math.cos(t * Math.PI) * cfg.amp * dLat * (rand(i) - 0.5) * 0.6;
    var lat = sc[1] + dLat * t + Math.cos(t * Math.PI) * cfg.amp * dLng * (rand(i + 31) - 0.5) * 0.6;
    path.push([lng, lat]);
  }
  path.push(ec);
  return path;
}

function driveSteps(a, b, d, road) {
  return [
    { icon:'🚩', text:'从「' + a + '」出发', distKm: 0 },
    { icon:'🛣️', text:'沿' + road + '向「' + b + '」方向行驶约 ' + d.toFixed(1) + ' 公里', distKm: d * 0.6 },
    { icon:'🚦', text:'途经约 ' + Math.max(2, Math.round(d / 0.9)) + ' 个红绿灯 / 路口，注意礼让行人', distKm: 0 },
    { icon:'🏁', text:'到达目的地「' + b + '」', distKm: d * 0.4 }
  ];
}
function transitSteps(a, b, d, how) {
  return [
    { icon:'🚩', text:'从「' + a + '」出发，步行至最近站点', distKm: 0.4 },
    { icon:'🚌', text: how + '，乘坐约 ' + Math.max(1, Math.round(d / 8)) + ' 站', distKm: d },
    { icon:'🚶', text:'下车后步行抵达「' + b + '」', distKm: 0.4 }
  ];
}
function simpleSteps(a, b, d, ic) {
  return [
    { icon:'🚩', text:'从「' + a + '」出发', distKm: 0 },
    { icon: ic, text:'沿人行道 / 绿道向「' + b + '」方向前进约 ' + d.toFixed(1) + ' 公里', distKm: d * 0.7 },
    { icon:'🏁', text:'到达「' + b + '」', distKm: d * 0.3 }
  ];
}

/* 高德 Driving/Transfer/DrivingPolicy policy 映射
   - DrivingPolicy 不一定在子模块下，部分版本裸挂在 AMap 上；同时兼容纯数字回退
   - TransferPolicy 高德文档以数字给出：0 最快 / 1 最少换乘 / 2 最少步行 / 3 最省钱 / 4 地铁优先 */
function drivingPolicyFor(pref, AMap) {
  if (pref === 'fastest')      return policyVal(AMap, 'DrivingPolicy', 'LEAST_TIME', 0);
  if (pref === 'cheapest')     return policyVal(AMap, 'DrivingPolicy', 'LEAST_FEE', 1);
  if (pref === 'avoidtraffic') return policyVal(AMap, 'DrivingPolicy', 'AVOID_HIGHWAY', 3);
  return null; // recommend → 用高德默认
}
function transferPolicyFor(pref) {
  if (pref === 'fastest')      return 0; // LEAST_TIME
  if (pref === 'cheapest')     return 3; // LEAST_FEE
  if (pref === 'avoidtraffic') return 1; // LEAST_TRANSFER
  return null; // recommend → 默认
}
function policyVal(AMap, ns, key, fallback) {
  if (!AMap) return fallback;
  var dict = AMap[ns];
  if (dict && typeof dict[key] === 'number') return dict[key];
  if (typeof AMap[key] === 'number') return AMap[key]; // 兼容常量挂在 AMap 上的旧版
  return fallback;
}

/* 尝试调用高德真实路线服务；无插件 / 失败返回 null
   入参：start, end, mode, pref — 偏好会同时影响 AMap.Driving/Transfer 的 policy 与返回策略的排序与标签 */
function amapPlan(start, end, mode, pref) {
  pref = pref || 'recommend';
  return new Promise(function(resolve) {
    try {
      var AMap = window.AMap;
      if (!AMap) { resolve(null); return; }
      var origin = new AMap.LngLat(coordOf(start)[0], coordOf(start)[1]);
      var dest = new AMap.LngLat(coordOf(end)[0], coordOf(end)[1]);

      // ✅ 任意 mode 都额外拉一次 AMap.Driving，拿到一条「真实路况 polyline」作为绘制兜底
      // - 公交地铁跨城时 AMap.Transfer 段间 path 经常是空 → 用驾车路况线填上
      // - 步行/骑行跨城时 AMap.Walking/Riding 直接不返回 → 用驾车路况线救场
      function fetchDrivingPolyline(cb) {
        try {
          if (!AMap.Driving) return cb(null);
          var dsvc = new AMap.Driving();
          dsvc.search(origin, dest, function(s, r) {
            if (s === 'complete' && r && r.routes && r.routes[0]) {
              var p = extractPath(r.routes[0]);
              if (p && p.length > 1) return cb(p);
              // 一次性返回但 path 数组过短：尝试分段拼接
              return chunkDrivingPolyline(origin, dest, 3, cb);
            } else { cb(null); }
          });
        } catch (e) { cb(null); }
      }

      /* 长距离驾车一次性搜不到时，按经纬度线性插值拆成 N 段，逐段调 AMap.Driving 拼接 polyline
         - 保证至少有一半段拿到完整路况线（部分段可能仍 fail，整体已足够长）
         - 性能开销可控：默认 3 段 = +3 次 AMap 调用 */
      function chunkDrivingPolyline(o, d, n, cb) {
        try {
          if (!AMap || !AMap.Driving) return cb(null);
          var L = function(p) { return new AMap.LngLat(p[0], p[1]); };
          var segs = [];
          function step(k) {
            if (k > n) {
              // 拼接所有段，去重连续点
              var all = [];
              segs.forEach(function(s) {
                if (!all.length) { all = all.concat(s); return; }
                // 去掉新段第一点（与上一段尾点重合）
                s.slice(1).forEach(function(pt) { all.push(pt); });
              });
              return cb(all.length > 2 ? all : null);
            }
            // 线性插值：t = k/n
            var t = k / (n + 1);
            var mid = [o.lng + (d.lng - o.lng) * t, o.lat + (d.lat - o.lat) * t];
            var svc = new AMap.Driving();
            if (k === 1) {
              svc.search(o, L(mid), function(s1, r1) {
                if (s1 === 'complete' && r1 && r1.routes && r1.routes[0]) {
                  var p1 = extractPath(r1.routes[0]);
                  if (p1 && p1.length > 1) segs.push(p1);
                }
                step(k + 1);
              });
            } else if (k === n) {
              var lastSeg = segs.length ? segs[segs.length - 1].slice(-1)[0] : o;
              var start = lastSeg ? L(lastSeg) : L(mid);
              svc.search(start, d, function(sn, rn) {
                if (sn === 'complete' && rn && rn.routes && rn.routes[0]) {
                  var pn = extractPath(rn.routes[0]);
                  if (pn && pn.length > 1) segs.push(pn);
                }
                step(k + 1);
              });
            } else {
              // 中间段：用上一段尾点 → mid
              var prevSeg = segs.length ? segs[segs.length - 1].slice(-1)[0] : null;
              var from = prevSeg ? L(prevSeg) : L(mid);
              svc.search(from, L(mid), function(sm, rm) {
                if (sm === 'complete' && rm && rm.routes && rm.routes[0]) {
                  var pm = extractPath(rm.routes[0]);
                  if (pm && pm.length > 1) segs.push(pm);
                }
                step(k + 1);
              });
            }
          }
          step(1);
        } catch (e) { cb(null); }
      }

      var svc = null, usePlans = false;
      if (mode === 'drive' && AMap.Driving) {
        var opts = {};
        var dp = drivingPolicyFor(pref, AMap);
        if (dp != null) opts.policy = dp;
        svc = new AMap.Driving(opts);
      } else if (mode === 'transit' && AMap.Transfer) {
        var topts = { city: end.name || '全国' };
        var tp = transferPolicyFor(pref);
        if (tp != null) topts.policy = tp;
        svc = new AMap.Transfer(topts);
        usePlans = true;
      } else if (mode === 'walk' && AMap.Walking) {
        svc = new AMap.Walking();
      } else if (mode === 'ride' && AMap.Riding) {
        svc = new AMap.Riding();
      }
      if (!svc) { resolve(null); return; }
      svc.search(origin, dest, function(status, result) {
        if (status !== 'complete' || !result) { resolve(null); return; }
        var list = usePlans ? (result.plans || []) : (result.routes || []);
        if (!list.length) { resolve(null); return; }
        var strategies = list.slice(0, 3).map(function(r, i) {
          var distM = r.distance || 0;
          var timeS = r.time || 0;
          var steps = usePlans ? parseTransitSteps(r.segments || []) : parseDriveSteps(r.steps || []);
          var toll = r.tolls || 0;
          var cost = mode === 'transit'
            ? (r.transit_fee != null ? r.transit_fee : Math.max(2, Math.round(2 + metersToKm(distM) * 0.25)))
            : (mode === 'walk' ? 0 : Math.round(metersToKm(distM) * 0.8) + toll);
          var lights = mode === 'transit' ? 0 : countLights(r.steps || []);
          return {
            tag: i === 0 ? '推荐' : (mode === 'drive' ? (i === 1 ? '高速优先' : '躲避拥堵') : ('方案' + (i + 1))),
            title: i === 0 ? '推荐路线' : ('方案' + (i + 1)),
            timeH: secToH(timeS),
            costYuan: cost,
            toll: toll,
            lights: lights,
            distanceKm: metersToKm(distM),
            path: extractPath(r),
            steps: steps
          };
        });
        // ✅ 并行补一条驾车路况线；所有没有 path 的策略都拿它填上
        var dKm = (typeof start.coord === 'object' && start.coord.length === 2 && end.coord)
          ? Math.round(Math.hypot((end.coord[0] - start.coord[0]) * 111, (end.coord[1] - start.coord[1]) * 111))
          : 0;
        fetchDrivingPolyline(function(dp) {
          // ✅ 最后兜底：哪怕驾车都失败，也用本地 buildWavyPath 起/终点同城路况线，保证 drawing 永远有内容
          var safeDp = (dp && dp.length > 1) ? dp : buildWavyPath(coordOf(start), coordOf(end), 'drive', dKm < 50 ? 'base' : 'highway');
          strategies.forEach(function(s) {
            if (!s.path || s.path.length < 2) {
              s.path = safeDp;
              s.pathSource = dp ? 'driving-fallback' : 'wavy-fallback';
            }
          });
          var res = { mode: mode, startName: start.name, endName: end.name, distanceKm: strategies[0].distanceKm, strategies: strategies, weatherNote: '', drivingPolyline: safeDp };
          // ✅ 跨城公交 (>800km) 叠加飞机/高铁估算卡片，避免在高德 Transfer 长距离弱区出现幻觉站点
          if (mode === 'transit' && res.distanceKm > 800) {
            res = enrichTransitWithFlight(res, pref);
            // enrich 后的新卡片 (flight/hsr) 也补上驾车路况线，让它们在地图上不空
            res.strategies.forEach(function(s) {
              if (!s.path || s.path.length < 2) { s.path = safeDp; s.pathSource = dp ? 'driving-fallback' : 'wavy-fallback'; }
            });
          }
          // ✅ 按偏好统一：重排 + 第 0 张重打 tag
          res = applyPrefToStrategies(res, pref, mode);
          resolve(res);
        });
      });
    } catch (e) { resolve(null); }
  });
}

/* 按偏好重排 strategies + 重命名第一张卡片 tag
   - fastest      : 按 time 升序；tag '⚡ 最快到达'
   - cheapest     : 按 cost 升序；tag '💰 最省钱'
   - avoidtraffic : 保持原序（依赖高德 AVOID_HIGHWAY/LEAST_TRANSFER 策略）；tag '🛣️ 躲避拥堵'
   - recommend    : 不动；tag '推荐'
   其他张：方案2 / 方案3 … */
function applyPrefToStrategies(res, pref, mode) {
  if (!res || !res.strategies || !res.strategies.length) return res;
  pref = pref || 'recommend';
  var arr = res.strategies.slice();
  if (pref === 'fastest')        arr.sort(function(a, b){ return a.timeH - b.timeH; });
  else if (pref === 'cheapest')  arr.sort(function(a, b){ return a.costYuan - b.costYuan; });
  // avoidtraffic 保持高德 server 端顺序；recommend 也不动
  var firstTag;
  if      (pref === 'fastest')      firstTag = '⚡ 最快到达';
  else if (pref === 'cheapest')     firstTag = '💰 最省钱';
  else if (pref === 'avoidtraffic') firstTag = '🛣️ 躲避拥堵';
  else                              firstTag = mode === 'drive' ? '推荐路线' : '智能推荐';
  if (arr[0]) {
    arr[0].tag = firstTag;
    arr[0].title = firstTag.replace(/^[^\s]+\s/, ''); // 去掉 emoji，空格后的纯文本
  }
  for (var i = 1; i < arr.length; i++) {
    arr[i].tag = '方案' + (i + 1);
    arr[i].title = arr[i].tag;
  }
  res.strategies = arr;
  return res;
}

/* 跨城公交加强：把"夜班卧铺+多次换乘"的公交方案附上一张基于路网距离估算的"✈ 含航班"卡片
   - 仅在 transit 模式 + 距离 > 800km 时启用，避免 AMap.Transfer 在超长跨城返回幻觉站点（郴柏相类）
   - 卡片插入到第 0 位后，自动被 applyPrefToStrategies 按需重排序 */
function enrichTransitWithFlight(res, pref) {
  var d = res.distanceKm || 0;
  if (!d) return res;
  var flightHours = d / 750 + 2.5;        // 含安检值机
  var flightCost  = Math.round(d * 0.6);  // 含机建燃油
  var hsrHours    = d / 250;              // 高铁
  var hsrCost     = Math.round(d * 0.45);
  var flight = {
    tag: '✈ 含航班',
    title: '含航班',
    timeH: flightHours,
    costYuan: flightCost,
    toll: 0,
    lights: 0,
    distanceKm: d,
    path: null,
    steps: [
      { icon: '🚖', text: '从「' + res.startName + '」前往出发机场', distKm: 25 },
      { icon: '✈️', text: '航班直飞目的地机场，约 ' + flightHours.toFixed(1) + ' 小时', distKm: d * 0.95 },
      { icon: '🛬', text: '落地后前往「' + res.endName + '」', distKm: 35 }
    ],
    isFlightEstimate: true
  };
  var hsr = {
    tag: '🚄 高铁/动车',
    title: '高铁/动车',
    timeH: hsrHours,
    costYuan: hsrCost,
    toll: 0,
    lights: 0,
    distanceKm: d,
    path: null,
    steps: [
      { icon: '🚖', text: '从「' + res.startName + '」前往高铁站', distKm: 8 },
      { icon: '🚄', text: '高铁至目的地车站，约 ' + hsrHours.toFixed(1) + ' 小时', distKm: d },
      { icon: '🚖', text: '出站后前往「' + res.endName + '」', distKm: 12 }
    ],
    isHsrEstimate: true
  };
  // flight 比 hsr 快、贵；force flight 排在 hsr 前
  var aug = res.strategies.slice(0, 2);             // 取高德原始两张
  aug.push(flight);
  aug.push(hsr);
  return Object.assign({}, res, { strategies: aug, hasCrossCityHint: true });
}

function extractPath(route) {
  try {
    var path = [];
    function pick(p) {
      if (!p) return;
      if (Array.isArray(p)) {
        // 形如 [[lng,lat], ...] 的扁平坐标数组
        p.forEach(function(x) {
          if (Array.isArray(x) && x.length >= 2 && typeof x[0] === 'number') path.push([x[0], x[1]]);
          else if (x && typeof x.lng === 'number') path.push([x.lng, x.lat]);
        });
      } else if (typeof p.lng === 'number') {
        path.push([p.lng, p.lat]);
      }
    }
    // 顶层 path（驾/步/骑直接返回 route.path 的情况）
    pick(route.path || route.polyline);
    // 驾车 steps[*].path（主要数据源）
    (route.steps || []).forEach(function(s) {
      pick(s.path);
      // 驾车嵌套 steps（多段路）
      (s.steps || []).forEach(function(ss) { pick(ss.path); });
    });
    // 公交 segments（路线 + 换乘段），以及 segment.transit.lines[*].path
    (route.segments || []).forEach(function(seg) {
      pick(seg.path);
      var lines = (seg.transit && seg.transit.lines) || [];
      lines.forEach(function(l) { pick(l.path); });
    });
    return path.length ? path : null;
  } catch (e) { return null; }
}
function parseDriveSteps(steps) {
  var out = [];
  (steps || []).forEach(function(s) {
    if (s.steps) s.steps.forEach(function(ss) { pushStep(out, ss); });
    else pushStep(out, s);
  });
  if (!out.length) out.push({ icon:'🧭', text:'沿推荐道路前往目的地', distKm: 0 });
  return out;
}
function pushStep(out, s) {
  var txt = (s.instruction || s.road || '继续直行').replace(/<[^>]+>/g, '');
  if (!txt) txt = s.road || '继续直行';
  out.push({ icon: stepIcon(txt), text: txt, distKm: metersToKm(s.distance || 0) });
}
function parseTransitSteps(segments) {
  var out = [];
  (segments || []).forEach(function(seg) {
    var txt = (seg.instruction || '').replace(/<[^>]+>/g, '');
    var mode = seg.transit_mode;
    var icon = mode === 'WALK' ? '🚶' : (mode === 'RAIL' || mode === 'SUBWAY' ? '🚇' : '🚌');
    if (!txt) txt = (mode === 'WALK' ? '步行' : '乘车') + '前往下一站';
    out.push({ icon: icon, text: txt, distKm: metersToKm(seg.distance || 0) });
  });
  return out;
}
function stepIcon(txt) {
  if (/左转/.test(txt)) return '↩️';
  if (/右转/.test(txt)) return '↪️';
  if (/上|高架|高速|入口|匝道/.test(txt)) return '🛣️';
  if (/红绿灯|路口/.test(txt)) return '🚦';
  if (/到达|终点|目的地/.test(txt)) return '🏁';
  if (/出发/.test(txt)) return '🚩';
  return '🧭';
}

/* 从步骤文本解析转向动作，给「开始导航」大箭头用
   返回 { dir, cls, arrow } —— arrow 用 SVG path 渲染更清晰，cls 决定旋转方向 */
function maneuverFromText(txt) {
  txt = txt || '';
  if (/出发/.test(txt))        return { dir:'depart',      cls:'m-depart',    arrow:'🚩' };
  if (/到达|终点|目的地/.test(txt)) return { dir:'arrive',  cls:'m-arrive',    arrow:'🏁' };
  if (/掉头|调头|U转|回转|掉头/.test(txt)) return { dir:'uturn', cls:'m-uturn', arrow:'⤵' };
  if (/左转/.test(txt))        return { dir:'left',        cls:'m-left',      arrow:'↰' };
  if (/右转/.test(txt))        return { dir:'right',       cls:'m-right',     arrow:'↱' };
  if (/靠左|向左/.test(txt))   return { dir:'slight-left', cls:'m-sleft',     arrow:'⬉' };
  if (/靠右|向右/.test(txt))   return { dir:'slight-right',cls:'m-sright',    arrow:'⬊' };
  return { dir:'straight', cls:'m-straight', arrow:'↑' };
}
function countLights(steps) {
  var n = 0;
  (steps || []).forEach(function(s) {
    if (/红绿灯/.test(s.instruction || '')) n++;
    if (s.steps) s.steps.forEach(function(ss) { if (/红绿灯/.test(ss.instruction || '')) n++; });
  });
  return n;
}

/* 主入口：优先高德真实路线，失败回退本地估算 */
async function planTrip(start, end, mode, pref) {
  // 补全缺失坐标：全国库/景点库命中但无预置坐标时，用浏览器端高德 geocode 按需获取
  if (!coordOf(start)) { var cs = await geocodePlace(start.__spotName || start.name); if (cs) start.coord = cs; }
  if (!coordOf(end))   { var ce = await geocodePlace(end.__spotName || end.name);   if (ce) end.coord = ce; }
  var real = null;
  try { real = await amapPlan(start, end, mode, pref); } catch (e) { real = null; }
  if (real && real.strategies && real.strategies.length) return real;
  return localPlan(start, end, mode, pref);
}

/* 当前请求用的偏好：用于在结果区顶部画「已按偏好重排」徽章 */
var lastPlanPref = 'recommend';
var PREF_META = {
  fastest:      { tag: '⚡ 最快到达', desc: '已按最快到达排序' },
  cheapest:     { tag: '💰 最省钱',   desc: '已按票价/油费升序排序' },
  avoidtraffic: { tag: '🛣️ 躲避拥堵', desc: '已采用躲避拥堵/少换乘策略' },
  recommend:    { tag: '🧭 智能推荐', desc: '按高德默认排序' }
};

/* 渲染：高德风格结果卡片 */
function buildRouteHTML(start, end, plan) {
  var meta = MODE_META[plan.mode] || MODE_META.drive;
  var pref = lastPlanPref || 'recommend';
  var prefMeta = PREF_META[pref] || PREF_META.recommend;
  var html = '';
  // ✅ 顶部加「已按偏好重排」徽章
  html += '<div class="route-summary">';
  html += '<span class="rs-mode-chip">' + meta.icon + ' ' + meta.name + '</span>';
  html += '<span class="route-pref-badge route-pref-' + pref + '" title="实时生效">' + prefMeta.tag + ' · ' + prefMeta.desc + '</span>';
  if (plan.hasCrossCityHint) html += '<span class="route-pref-crosscity" title="跨城约 ' + plan.distanceKm.toFixed(0) + ' 公里">🛬 跨城出行</span>';
  html += ' · 📏 <strong>' + plan.distanceKm.toFixed(1) + '</strong> 公里';
  if (plan.strategies[0]) {
    html += ' · 🕒 约 <strong>' + fmtDuration(plan.strategies[0].timeH) + '</strong>';
    // ✅ 手机导航标配：预计到达时间（ETA）
    html += ' · 🏁 预计 <strong>' + fmtETA(plan.strategies[0].timeH) + '</strong> 到达';
  }
  html += '</div>';
  html += '<div class="route-strategies">';
  plan.strategies.forEach(function(st, i) {
    var sub = st.distanceKm.toFixed(1) + ' 公里';
    if (plan.mode === 'drive') sub += ' · 红绿灯 ' + st.lights + ' 个' + (st.toll ? ' · 过路费 ¥' + st.toll : '');
    if (plan.mode === 'transit') sub += ' · 步行 ' + (st.distanceKm * 0.08).toFixed(1) + ' 公里';
    // 跨城估算给个微标签
    if (st.isFlightEstimate) sub += ' · 航班估算';
    if (st.isHsrEstimate) sub += ' · 高铁估算';
    var cls = 'route-strategy' + (i === 0 ? ' selected' : '');
    if (st.isFlightEstimate || st.isHsrEstimate) cls += ' route-estimate';
    html += '<div class="' + cls + '" data-i="' + i + '">' +
      '<div class="rs-top"><span class="rs-tag rs-tag-' + i + '">' + st.tag + '</span>' +
      '<span class="rs-time">' + fmtDuration(st.timeH) + '</span>' +
      '<span class="rs-cost">' + (st.costYuan > 0 ? '约 ¥' + st.costYuan : '免费') + '</span></div>' +
      '<div class="rs-sub">' + sub + '</div></div>';
  });
  html += '</div>';
  html += '<div class="route-steps collapsed" id="routeSteps">' + renderSteps(plan.strategies[0].steps) + '</div>';
  html += '<div class="route-nav-actions">' +
    '<button class="route-btn route-btn-full" id="routeShowMap">🗺️ 在地图上查看路线</button>' +
    '<button class="route-btn route-btn-nav" id="routeNavBtn">🧭 开始导航</button>' +
    '</div>';
  return html;
}
function renderSteps(steps) {
  if (!steps || !steps.length) return '';
  // 默认折叠：前 4 条照常渲染，超出的包进 .steps-rest 由 CSS + 按钮控制
  var PREVIEW = 4;
  var shown = steps.slice(0, PREVIEW);
  var rest  = steps.slice(PREVIEW);
  var rows = shown.map(function(s) {
    return '<div class="step-item"><span class="step-icon">' + s.icon + '</span>' +
      '<span class="step-text">' + escapeHtml(s.text) + '</span>' +
      (s.distKm > 0 ? '<span class="step-dist">' + s.distKm.toFixed(1) + 'km</span>' : '') +
      '</div>';
  }).join('');
  if (rest.length) {
    rows += '<div class="steps-rest">' + rest.map(function(s) {
      return '<div class="step-item"><span class="step-icon">' + s.icon + '</span>' +
        '<span class="step-text">' + escapeHtml(s.text) + '</span>' +
        (s.distKm > 0 ? '<span class="step-dist">' + s.distKm.toFixed(1) + 'km</span>' : '') +
        '</div>';
    }).join('') + '</div>';
    rows += '<button type="button" class="steps-toggle" data-action="expand">展开剩余 ' + rest.length + ' 步 ▼</button>';
  }
  return rows;
}
/* 切换折叠状态（默认再次读卡片时仍保持折叠，避免滚动跳） */
function bindStepsToggle(stepsEl, btn) {
  if (!stepsEl || !btn) return;
  btn.addEventListener('click', function() {
    var collapsed = stepsEl.classList.toggle('collapsed');
    btn.textContent = collapsed
      ? ('展开剩余 ' + (stepsEl.querySelectorAll('.steps-rest .step-item').length) + ' 步 ▼')
      : ('收起 ▲');
  });
}

/* 多地点行程：起点 + 途经点 + 终点，按地理就近排序并给出逐段交通与时间线 */
async function planItinerary(startCity, endCity, waypointLabels, mode) {
  var stops = [];
  if (startCity) stops.push({ name: startCity.name, coord: coordOf(startCity), kind: 'start' });
  for (var i = 0; i < waypointLabels.length; i++) {
    var label = waypointLabels[i];
    var coord = await geocodePlace(label);
    if (!coord) coord = startCity ? coordOf(startCity).slice() : [116.397, 39.908];
    stops.push({ name: label, coord: coord, kind: 'wp' });
  }
  if (endCity && (!startCity || endCity.id !== startCity.id)) {
    stops.push({ name: endCity.name, coord: coordOf(endCity), kind: 'end' });
  }
  if (stops.length < 2) throw new Error('至少需要起点和终点');

  var order = [stops[0]];
  var remain = stops.slice(1);
  while (remain.length) {
    var last = order[order.length - 1];
    var bestIdx = 0, bestD = Infinity;
    for (var j = 0; j < remain.length; j++) {
      var dd = haversineKm(last.coord, remain[j].coord);
      if (dd < bestD) { bestD = dd; bestIdx = j; }
    }
    order.push(remain[bestIdx]);
    remain.splice(bestIdx, 1);
  }

  var pref = (document.getElementById('routePref') || {}).value || 'recommend';
  var routeMode = mode || currentRouteMode || 'drive';
  var legs = [];
  var clock = 9 * 60;
  var timeline = [];
  // 并发请求每一段的真实路况 path（高德 Driving/Walking/Riding/Transfer）
  var segPaths = await Promise.all(order.slice(0, -1).map(function(_, k) {
    var a = order[k], b = order[k + 1];
    return amapPlan(a, b, routeMode).catch(function() { return null; });
  }));
  for (var k = 0; k < order.length - 1; k++) {
    var a = order[k], b = order[k + 1];
    var dist = haversineKm(a.coord, b.coord);
    var modes = transportForLeg(dist, pref, routeMode);
    timeline.push({ stop: a, time: fmtClock(clock), label: bestVisitTime(a.name) });
    clock += 90;
    clock += Math.round(modes[0].time * 60);
    legs.push({ from: a, to: b, dist: dist, modes: modes, path: (segPaths[k] && segPaths[k].strategies && segPaths[k].strategies[0] && segPaths[k].strategies[0].path) || null });
  }
  timeline.push({ stop: order[order.length - 1], time: fmtClock(clock), label: bestVisitTime(order[order.length - 1].name) });

  // 把所有段的真实坐标点拼接成一条完整 polyline（A→B→C→D）
  var polyline = [];
  legs.forEach(function(lg, idx) {
    if (lg.path && lg.path.length > 1) {
      var part = idx === 0 ? lg.path : lg.path.slice(1); // 段间去重首点
      polyline = polyline.concat(part);
    }
  });
  // 兜底：若整条线路没拿到任何真实坐标，按 order 两两直线拼接
  if (polyline.length < 2) {
    polyline = [];
    for (var p = 0; p < order.length - 1; p++) {
      polyline.push(order[p].coord);
      polyline.push(order[p + 1].coord);
    }
  }

  return { order: order, legs: legs, timeline: timeline, polyline: polyline, totalKm: legs.reduce(function(s, l){ return s + l.dist; }, 0), mode: routeMode };
}

function buildItineraryHTML(startCity, endCity, data) {
  var html = '<div class="route-summary">🗺️ 打卡顺序：<strong>' + data.order.map(function(s){ return s.name; }).join(' → ') + '</strong></div>';
  html += '<div class="route-timeline">';
  data.timeline.forEach(function(t) {
    html += '<div class="tl-item"><span class="tl-time">' + t.time + '</span>' +
      '<span class="tl-dot"></span>' +
      '<span class="tl-name">' + t.stop.name + '</span>' +
      '<span class="tl-tag">' + t.label + '</span></div>';
  });
  html += '</div>';
  data.legs.forEach(function(leg) {
    html += '<div class="route-leg"><div class="leg-head">🚩 ' + leg.from.name + ' → ' + leg.to.name + ' · ' + Math.round(leg.dist) + 'km</div><div class="route-modes">';
    leg.modes.forEach(function(m) {
      html += '<div class="route-mode' + (m.reco ? ' reco' : '') + '">' +
        '<div class="rm-head"><span class="rm-name">' + (m.reco ? '✅ ' : '') + m.name + '</span>' +
        '<span class="rm-time">约 ' + fmtDuration(m.time) + ' · ¥' + m.cost + '</span></div>' +
        '<div class="rm-reason">' + m.reason + '</div></div>';
    });
    html += '</div></div>';
  });
  html += '<button class="route-btn route-btn-full" id="routeShowMap">🗺️ 在地图上标出路线</button>';
  return html;
}

/* 方案卡片：点击切换选中 + 刷新步骤 + 重绘地图 */
function bindRouteInteractions(box) {
  var strategies = box.querySelectorAll('.route-strategy');
  strategies.forEach(function(card) {
    card.addEventListener('click', function() {
      strategies.forEach(function(c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      var i = parseInt(card.getAttribute('data-i'), 10);
      var st = lastPlanResult && lastPlanResult.strategies[i];
      var stepsEl = box.querySelector('#routeSteps');
      if (st && stepsEl) {
        stepsEl.innerHTML = renderSteps(st.steps);
        stepsEl.classList.add('collapsed');
        bindStepsToggle(stepsEl, stepsEl.parentNode.querySelector('.steps-toggle'));
      }
      if (st) drawRouteByMode(lastPlanStart, lastPlanEnd, st, lastPlanResult && lastPlanResult.order, lastPlanResult);
    });
  });
  var showBtn = box.querySelector('#routeShowMap');
  if (showBtn) showBtn.addEventListener('click', function() {
    var sel = box.querySelector('.route-strategy.selected');
    var i = sel ? parseInt(sel.getAttribute('data-i'), 10) : 0;
    var st = lastPlanResult && lastPlanResult.strategies[i];
    if (st) drawRouteByMode(lastPlanStart, lastPlanEnd, st, lastPlanResult && lastPlanResult.order, lastPlanResult);
    var mv = document.getElementById('mapview');
    if (mv) mv.scrollIntoView({ behavior: 'smooth' });
  });
  var navBtn = box.querySelector('#routeNavBtn');
  if (navBtn) navBtn.addEventListener('click', function() {
    openNavigation(lastPlanResult, lastPlanStart, lastPlanEnd);
  });
}

/* 交通方式可点击选择：点击切换 .selected，并更新顶部摘要 */
function bindModeSelection(box) {
  var summary = box.querySelector('#routeSummary');
  var groups = box.querySelectorAll('.route-modes');
  groups.forEach(function(group) {
    var modes = group.querySelectorAll('.route-mode');
    modes.forEach(function(mode) {
      mode.addEventListener('click', function() {
        modes.forEach(function(m) { m.classList.remove('selected'); });
        mode.classList.add('selected');
        if (summary) {
          var name = mode.getAttribute('data-mode-name') || '';
          var time = mode.getAttribute('data-mode-time') || '';
          var kmMatch = summary.textContent.match(/(\d+)\s*公里/);
          var km = kmMatch ? kmMatch[1] : '';
          summary.innerHTML = '📏 约 <strong>' + km + '</strong> 公里 · ✅ <strong>已选 ' + name + '</strong>（' + time + '）';
        }
      });
    });
  });
}

/* 「开始导航」全屏面板：仿手机导航主界面
   - 顶部：预计到达 (ETA) + 剩余距离/时间 + 关闭 + 语音开关
   - 中央：大转向箭头 + 下一段指令 + 距离
   - 下部：步骤列表（可点选跳转）+ 下一段推进
   纯前端模拟（无实时 GPS），免费可用 speechSynthesis 语音播报 */
function openNavigation(plan, start, end) {
  var overlay = document.getElementById('navOverlay');
  if (!overlay) return;
  var st0 = plan && plan.strategies && plan.strategies[0];
  var steps = (st0 && st0.steps) || [];
  if (!steps.length) { showToast('暂无导航步骤，无法开始导航', 'error'); return; }
  var mode = (plan && plan.mode) || 'drive';
  var meta = MODE_META[mode] || MODE_META.drive;
  var totalKm = steps.reduce(function(s, x){ return s + (x.distKm || 0); }, 0);
  if (totalKm <= 0) totalKm = plan.distanceKm || 0;
  var totalH = st0.timeH || 0;
  var idx = 0;
  var voiceOn = false;
  var keyHandler = null;

  function remainingKm() { return steps.slice(idx).reduce(function(s, x){ return s + (x.distKm || 0); }, 0); }
  function remainingH() { var rk = remainingKm(); return totalKm > 0 ? totalH * (rk / totalKm) : 0; }
  function speak(text) {
    try {
      if (!voiceOn || !window.speechSynthesis) return;
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN'; u.rate = 1.05; u.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function closeNav() {
    overlay.hidden = true;
    overlay.innerHTML = '';
    document.body.classList.remove('nav-active');
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
  }
  function render() {
    var cur = steps[idx];
    var m = maneuverFromText(cur.text);
    var remKm = remainingKm();
    var remH = remainingH();
    var next = steps[idx + 1];
    var nextM = next ? maneuverFromText(next.text) : null;
    var navStepsHtml = steps.map(function(s, i) {
      var sm = maneuverFromText(s.text);
      return '<div class="nav-step' + (i === idx ? ' active' : '') + (i < idx ? ' done' : '') + '" data-i="' + i + '">' +
        '<span class="nav-step-arrow ' + sm.cls + '">' + sm.arrow + '</span>' +
        '<span class="nav-step-text">' + escapeHtml(s.text) + '</span>' +
        (s.distKm > 0 ? '<span class="nav-step-dist">' + s.distKm.toFixed(1) + 'km</span>' : '') +
        '</div>';
    }).join('');
    overlay.innerHTML =
      '<div class="nav-card">' +
        '<div class="nav-top">' +
          '<button class="nav-close" id="navClose" aria-label="关闭导航">✕</button>' +
          '<div class="nav-eta-wrap"><div class="nav-eta-label">预计到达</div>' +
            '<div class="nav-eta-time">' + fmtETA(totalH) + '</div></div>' +
          '<button class="nav-voice' + (voiceOn ? ' on' : '') + '" id="navVoice" aria-pressed="' + (voiceOn ? 'true' : 'false') + '" title="语音播报">🔊</button>' +
        '</div>' +
        '<div class="nav-remain">剩余 <strong>' + remKm.toFixed(1) + '</strong> 公里 · 约 <strong>' + fmtDuration(remH) + '</strong></div>' +
        '<div class="nav-turn">' +
          '<div class="nav-arrow ' + m.cls + '">' + m.arrow + '</div>' +
          '<div class="nav-instr">' +
            '<div class="nav-dist">' + (cur.distKm > 0 ? '前方 ' + cur.distKm.toFixed(1) + ' 公里' : (m.dir === 'depart' ? '出发' : (m.dir === 'arrive' ? '即将到达' : '继续直行'))) + '</div>' +
            '<div class="nav-road">' + escapeHtml(cur.text) + '</div>' +
          '</div>' +
        '</div>' +
        (nextM ? '<div class="nav-next-preview">然后 <span class="' + nextM.cls + '">' + nextM.arrow + '</span> ' + escapeHtml(next.text) + '</div>' : '') +
        '<div class="nav-steps" id="navSteps">' + navStepsHtml + '</div>' +
        '<button class="nav-advance" id="navAdvance">' + (idx >= steps.length - 1 ? '导航结束' : '下一段 ▼') + '</button>' +
      '</div>';
    // 绑定
    var closeBtn = overlay.querySelector('#navClose');
    if (closeBtn) closeBtn.addEventListener('click', closeNav);
    var voiceBtn = overlay.querySelector('#navVoice');
    if (voiceBtn) voiceBtn.addEventListener('click', function() {
      voiceOn = !voiceOn;
      voiceBtn.classList.toggle('on', voiceOn);
      voiceBtn.setAttribute('aria-pressed', voiceOn ? 'true' : 'false');
      if (voiceOn) speak('开始语音导航，' + (cur.distKm > 0 ? '前方' + cur.distKm.toFixed(1) + '公里' : '') + cur.text);
      else { try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {} }
    });
    var advBtn = overlay.querySelector('#navAdvance');
    if (advBtn) advBtn.addEventListener('click', function() {
      if (idx < steps.length - 1) { idx++; render(); }
      else { closeNav(); }
    });
    Array.prototype.forEach.call(overlay.querySelectorAll('.nav-step'), function(el) {
      el.addEventListener('click', function() {
        idx = parseInt(el.getAttribute('data-i'), 10) || 0;
        render();
      });
    });
    speak(cur.text);
  }

  overlay.hidden = false;
  document.body.classList.add('nav-active');
  render();
  keyHandler = function(e) {
    if (e.key === 'Escape') closeNav();
    else if (e.key === 'ArrowDown' || e.key === 'Enter') {
      if (idx < steps.length - 1) { idx++; render(); }
    } else if (e.key === 'ArrowUp') {
      if (idx > 0) { idx--; render(); }
    }
  };
  document.addEventListener('keydown', keyHandler);
}

function bindShowMultiMap(data) {
  var showBtn = document.getElementById('routeShowMap');
  if (!showBtn) return;
  showBtn.addEventListener('click', function() {
    // ✅ 关键：把整个 data（带 polyline 真实路况）传进去，否则 fallback 走直线
    drawRouteByMode(routeStartCity, routeEndCity, null, data.order, data);
    var mv = document.getElementById('mapview');
    if (mv) mv.scrollIntoView({ behavior: 'smooth' });
  });
}

/* 周边探索：饭店 / 商场 / 地铁站 */
async function runNearby(city) {
  var box = document.getElementById('routeNearby');
  if (!box) return;
  box.innerHTML = '<div class="route-loading">🔍 正在搜索 ' + city.name + ' 周边…</div>';
  var coord = city.coord || (cityCoords[city.id] || [116.397, 39.908]);
  var cats = [
    { key:'food', label:'🍜 美食饭店', kw:'餐饮' },
    { key:'mall', label:'🛍️ 商场购物', kw:'购物中心' },
    { key:'metro', label:'🚇 地铁站', kw:'地铁站' }
  ];
  var out = '<div class="nearby-head"><span class="nh-title">📍 ' + city.name + ' 周边</span>' +
    '<button type="button" class="nearby-close" aria-label="收起周边探索">✕</button></div>';
  try {
    for (var i = 0; i < cats.length; i++) {
      var list = await searchNearby(coord, cats[i].kw, 3000);
      out += '<div class="nearby-cat">' + cats[i].label + '</div>';
      if (!list.length) { out += '<div class="nearby-empty">（暂未获取到数据）</div>'; continue; }
      out += '<div class="nearby-list">';
      list.slice(0, 6).forEach(function(p) {
        out += '<div class="nearby-item"><span class="ni-name">' + p.name + '</span>' +
          '<span class="ni-dist">' + (p.dist != null ? Math.round(p.dist) + ' m' : '') + '</span>' +
          (p.address ? '<div class="ni-addr">' + p.address + '</div>' : '') + '</div>';
      });
      out += '</div>';
    }
    box.innerHTML = out;
  } catch (e) {
    box.innerHTML = '<div class="route-loading">周边搜索失败，请稍后重试</div>';
  }
}

function searchNearby(center, keyword, radius) {
  return new Promise(function(resolve) {
    if (!window.AMap || !window.AMap.PlaceSearch) { resolve([]); return; }
    try {
      var ps = new window.AMap.PlaceSearch({ pageSize: 8, pageIndex: 1 });
      ps.searchNearBy(keyword, new window.AMap.LngLat(center[0], center[1]), radius, function(status, result) {
        if (status === 'complete' && result.poiList && result.poiList.pois) {
          resolve(result.poiList.pois.map(function(p) {
            return { name: p.name, address: p.address || '', dist: p.distance };
          }));
        } else { resolve([]); }
      });
    } catch (e) { resolve([]); }
  });
}

function populateRouteSelects() {
  // 起/终点已改为可搜索输入框；保留同名 hidden 字段用于结果取值
  bindRouteSearch('start');
  bindRouteSearch('end');
}

/* 起/终点：可搜索输入框
 *  - 输入前：弹热门搜索城市（默认前 10）
 *  - 输入后：城市命中 + 该城市所有命中景点 + 高德解析任意地名
 *  - 选中后立即关闭 popup（含 latch 防 race），ESC/方向键/回车可操作
 *  - 【增强】拼音首字母/ID 模糊匹配 + 关键词联想空态建议 + 输入字符高亮
 */
function bindRouteSearch(which) {
  var inputId = which === 'start' ? 'routeStartInput' : 'routeEndInput';
  var popupId = which === 'start' ? 'routeStartPopup' : 'routeEndPopup';
  var hiddenId = which === 'start' ? 'routeStart' : 'routeEnd';
  var input = document.getElementById(inputId);
  var popup = document.getElementById(popupId);
  if (!input || !popup) return;
  var state = { items: [], activeIdx: -1, geoTimer: null, geoReq: 0, commitLatch: 0 };
  // 拼音首字母：取 pinyin 串的首字母连写
  function pinyinInitials(pinyin) {
    if (!pinyin) return '';
    return pinyin.replace(/[^A-Za-z\s]/g, '').split(/\s+/).map(function(w) { return w.charAt(0); }).join('').toLowerCase();
  }
  // 首次 focus 待用户主动 hover 才开放 popup（避免页面打开就被面板遮挡）
  input.dataset.routeSearchReady = '0';

  function openPopup() {
    if (state.commitLatch > 0) return; // commit 锁定期间不允许 reopen
    popup.hidden = false;
  }
  function clearActive() {
    var rows = popup.querySelectorAll('.route-search-item');
    rows.forEach(function(r) { r.classList.remove('active'); });
  }
  function closePopup() {
    popup.hidden = true;
    state.activeIdx = -1;
    clearActive();
  }
  // 双保险的关闭：commit 后 latch 锁住，避免被 focus/keydown 再打开
  function hardClose() {
    state.commitLatch++;
    closePopup();
    setTimeout(function() { state.commitLatch = Math.max(0, state.commitLatch - 1); }, 220);
  }

  function commit(item) {
    hardClose(); // 先关 + 锁（防 race）
    if (item.kind === 'spot') {
      input.value = item.name;                          // 显示景点名
      document.getElementById(hiddenId).value = item.cityId;
      var city = item.cityObj;
      city.__spotName = item.name;                      // 标记：选了这个景点
      if (which === 'start') routeStartCity = city; else routeEndCity = city;
    } else {
      input.value = item.name;
      document.getElementById(hiddenId).value = item.id || '';
      var cityObj = item.cityObj || { id: item.id, name: item.name, coord: item.coord, __custom: !item.cityObj };
      if (which === 'start') routeStartCity = cityObj; else routeEndCity = cityObj;
    }
    input.parentElement.classList.add('has-value');
    if (typeof syncRouteSelects === 'function') syncRouteSelects();
    // commit 后再做一次 hardClose（双保险）
    hardClose();
    try { input.blur(); } catch (e) {} // 主动失焦避免键盘上下方向键再误触 popup
    var label = (which === 'start' ? '起点' : '终点') + '：' + input.value;
    showToast(label, 'info');
  }

  function refreshActive() {
    var rows = popup.querySelectorAll('.route-search-item');
    rows.forEach(function(r, i) { r.classList.toggle('active', i === state.activeIdx); });
    if (state.activeIdx >= 0 && rows[state.activeIdx]) {
      rows[state.activeIdx].scrollIntoView({ block: 'nearest' });
    }
  }

  function render(matches, geoItem, geoLoading) {
    state.items = [];
    var hasLocal = matches && matches.length;
    var hasGeo = !!geoItem;
    var hasLoading = !!geoLoading;
    var q = input.value.trim();
    // 空 query 且无内容：保持关闭（不显示无意义的空提示）
    if (!q && !hasGeo && !hasLoading && !hasLocal) {
      popup.innerHTML = '';
      return;
    }
    // 空态：本地无匹配 + 高德无解析 + 没在加载中 → 给关键词提示建议
    if (!hasLocal && !hasGeo && !hasLoading) {
      var hintHTML = '<div class="route-search-empty">' +
        '<div>没找到「<b>' + escapeHtml(q) + '</b>」相关城市或景点</div>' +
        '<div class="rse-hint">试试输入景点/街道/地标/拼音首字母</div>' +
        '<div style="margin-top:8px">' +
          '<span class="rse-suggest" data-hint="故宫">故宫</span>' +
          '<span class="rse-suggest" data-hint="西湖">西湖</span>' +
          '<span class="rse-suggest" data-hint="外滩">外滩</span>' +
          '<span class="rse-suggest" data-hint="布达拉宫">布达拉宫</span>' +
          '<span class="rse-suggest" data-hint="深圳湾公园">深圳湾公园</span>' +
          '<span class="rse-suggest" data-hint="bj">bj（拼音首字母）</span>' +
        '</div>' +
      '</div>';
      popup.innerHTML = hintHTML;
      // 建议项点击 → 自动填入 input 并触发 input 事件
      popup.querySelectorAll('.rse-suggest').forEach(function(el) {
        el.addEventListener('mousedown', function(e) {
          e.preventDefault();
          e.stopPropagation();
          var v = el.getAttribute('data-hint') || '';
          input.value = v;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.focus();
        });
      });
      openPopup();
      return;
    }
    var html = '';
    if (hasLocal) {
      var sectionLabel;
      if (matches[0].kind === 'spot') sectionLabel = '景点命中';
      else if (!q) sectionLabel = '热门搜索城市';
      else sectionLabel = '本地命中（' + matches.length + ' 条）';
      html += '<div class="route-search-section">' + sectionLabel + '</div>';
      matches.forEach(function(m) {
        var displayName = m.kind === 'spot' ? (m.cityName + ' · ' + m.name) : m.name;
        var nameHTML = highlightMatch(displayName, q);
        html += '<div class="route-search-item" data-i="' + state.items.length + '">' +
          '<span class="route-search-emoji">' + (m.emoji || '🏙️') + '</span>' +
          '<span class="route-search-name">' + nameHTML + '</span>' +
          '<span class="route-search-meta">' + escapeHtml(m.region || '') + '</span>' +
          '<span class="route-search-tag ' + m.tagClass + '">' + m.tag + '</span>' +
        '</div>';
        state.items.push(m);
      });
    }
    if (hasLoading) {
      html += '<div class="route-search-section">关键词联想 · 高德解析</div>';
      html += '<div class="route-search-loading">🔍 正在匹配「' + escapeHtml(q) + '」任意地名…</div>';
    } else if (hasGeo) {
      html += '<div class="route-search-section">关键词联想 · 高德命中</div>';
      html += '<div class="route-search-item" data-i="' + state.items.length + '">' +
        '<span class="route-search-emoji">📍</span>' +
        '<span class="route-search-name">' + escapeHtml(geoItem.name) + '</span>' +
        '<span class="route-search-meta">' + escapeHtml(geoItem.region || '任意地点') + '</span>' +
        '<span class="route-search-tag tag-geo">关键字</span>' +
      '</div>';
      state.items.push({ kind: 'geo', name: geoItem.name, coord: geoItem.coord });
    }
    popup.innerHTML = html;
    state.activeIdx = state.items.length ? 0 : -1;
    openPopup();
    // 绑定每行点击 + hover
    popup.querySelectorAll('.route-search-item').forEach(function(row, i) {
      row.addEventListener('mousedown', function(e) {
        e.preventDefault();
        if (state.items[i]) commit(state.items[i]);
      });
      row.addEventListener('mouseenter', function() {
        state.activeIdx = i;
        refreshActive();
      });
    });
    refreshActive();
  }

  /* 高亮匹配字符（用户输入 q 在 name 中用浅黄色背景显示） */
  function highlightMatch(name, q) {
    if (!q) return escapeHtml(name);
    var nameEsc = escapeHtml(name);
    var qEsc = escapeHtml(q);
    var lower = name.toLowerCase();
    var qLower = q.toLowerCase();
    var idx = lower.indexOf(qLower);
    if (idx < 0) return nameEsc;
    var before = escapeHtml(name.slice(0, idx));
    var mid = escapeHtml(name.slice(idx, idx + q.length));
    var after = escapeHtml(name.slice(idx + q.length));
    return before + '<mark style="background:#fde68a;color:#92400e;padding:0 2px;border-radius:3px">' + mid + '</mark>' + after;
  }

  /* 把 destinations + 它的景点全部结构化为统一候选项
   *  匹配方式（按优先级）：全名/全拼 > 全名 substring/全拼 substring > fuzzy > ID/region
   *  fuzzy：q 字符按顺序在 haystack 中找（"bj" → "beijing" 中的 b+j）
   */
  function fuzzyMatch(q, hay) {
    if (!q) return true;
    if (!hay) return false;
    var n = q.toLowerCase(), h = hay.toLowerCase();
    var ni = 0;
    for (var hi = 0; hi < h.length && ni < n.length; hi++) {
      if (h[hi] === n[ni]) ni++;
    }
    return ni === n.length;
  }

  function searchLocal(q) {
    var items = [];
    var seen = {};
    var isShortQuery = q.length <= 1;
    function pushUnique(it) {
      if (seen[it.name]) return;
      seen[it.name] = true;
      items.push(it);
    }
    if (!q) {
      destinations.slice(0, 10).forEach(function(d) {
        items.push({ kind:'city', name:d.name, id:d.id, cityObj:d, emoji:d.emoji, region:d.region, tag:'热门', tagClass:'tag-city' });
      });
      return items;
    }
    var lower = q.toLowerCase();
    destinations.forEach(function(d) {
      var py = (d.pinyin || '').toLowerCase();
      // 综合匹配：substring OR fuzzy
      var nameHit = d.name.indexOf(q) >= 0 || fuzzyMatch(lower, d.name);
      var pyHit = py.indexOf(lower) >= 0 || fuzzyMatch(lower, py);
      var pyInit = pinyinInitials(d.pinyin || '');
      var pyInitHit = pyInit.indexOf(lower) >= 0 || fuzzyMatch(lower, pyInit);
      var regionHit = d.region && (d.region.indexOf(q) >= 0 || fuzzyMatch(lower, d.region));
      var idHit = d.id && (d.id.toLowerCase().indexOf(lower) >= 0 || d.id.toLowerCase() === lower);
      // 城市别名（简称，如"甬"→宁波、"榕"→福州、"锡"→无锡）：单字命中度最高
      var aliasHit = false;
      if (d.aliases && d.aliases.length) {
        for (var ai = 0; ai < d.aliases.length; ai++) {
          if (d.aliases[ai] === q) { aliasHit = true; break; }
        }
      }
      if (nameHit || pyHit || pyInitHit || regionHit || idHit || aliasHit) {
        var score = 0;
        if (aliasHit) score = 950;          // 别名（甬/榕/锡）命中 → 用户确实想找这座城市，置顶
        else if (d.name === q) score = 1000;
        else if (d.name.indexOf(q) === 0) score = 900;
        else if (nameHit && pyHit && q.length === 1) score = 600;
        else if (py.indexOf(lower) === 0) score = 700;
        else if (nameHit && pyHit) score = 500;
        else if (pyInitHit || idHit) score = 400;
        else if (nameHit) score = 300;
        else if (pyHit) score = 250;
        else score = 150;
        pushUnique({ kind:'city', name:d.name, id:d.id, cityObj:d, emoji:d.emoji, region:d.region, tag:'城市', tagClass:'tag-city',  score: score });
      }
      // 景点匹配策略：
      //  - 单字（如「珠」「佛」）：用户绝大多数情况是想找**城市**，景点名含单字重名过多（东方明珠/佛山祖庙），反而干扰
      //  - 多字（如「故宫」「西湖」「外滩」）：景点/城市都会命中，"故宫"应是景点（精确）
      //  - 用户输 q.length>=2 才匹配景点，并把 pyHit 的景点 score 调低，避免拼音巧合（如"shanghai"的"sh"）误中
      var isShortQuery = q.length <= 1;
      if (!isShortQuery && d.spots && d.spots.length) {
        d.spots.forEach(function(s) {
          if (!s.name) return;
          var spotNameHit = s.name.indexOf(q) >= 0 || (q.length >= 2 && fuzzyMatch(lower, s.name));
          var spotPyHit = false; // 拼音不直接命中景点，避免"sh"命中"上海·所有景点"
          if (spotNameHit) {
            pushUnique({
              kind:'spot', name:s.name, cityName:d.name, cityId:d.id, cityObj:d,
              emoji: s.emoji || d.emoji, region: '📍 ' + d.name,
              tag:'景点', tagClass:'tag-spot', score: s.name.indexOf(q) === 0 ? 450 : 80
            });
          }
        });
      }
    });
    // 2) 全国城市库（地级市/地区/港澳台）—— 任意城市名都能搜到
    if (window.CITY_DB && window.CITY_DB.length) {
      window.CITY_DB.forEach(function(c) {
        if (seen[c.n]) return;
        var py = (c.p || '').toLowerCase();
        var pyInit = pinyinInitials(c.p || '');
        var nameHit = c.n.indexOf(q) >= 0 || fuzzyMatch(lower, c.n);
        var pyHit = py.indexOf(lower) >= 0 || fuzzyMatch(lower, py);
        var pyInitHit = pyInit.indexOf(lower) >= 0 || fuzzyMatch(lower, pyInit);
        if (nameHit || pyHit || pyInitHit) {
          var score2 = 0;
          if (c.n === q) score2 = 1000;
          else if (c.n.indexOf(q) === 0) score2 = 900;
          else if (py.indexOf(lower) === 0) score2 = 700;
          else if (nameHit && pyHit) score2 = 500;
          else if (pyInitHit) score2 = 400;
          else if (nameHit) score2 = 300;
          else score2 = 250;
          pushUnique({
            kind:'city', name:c.n, id:null,
            cityObj:{ id:null, name:c.n, coord:null, province:c.pv, __custom:true },
            emoji:'🏙️', region:c.pv, tag:'城市', tagClass:'tag-city', score: score2
          });
        }
      });
    }
    // 3) 全国景点库 —— 任意知名景区都能搜到
    if (!isShortQuery && window.SPOT_DB && window.SPOT_DB.length) {
      window.SPOT_DB.forEach(function(sp) {
        if (seen[sp.n]) return;
        if (sp.n.indexOf(q) >= 0 || fuzzyMatch(lower, sp.n)) {
          pushUnique({
            kind:'spot', name:sp.n, cityName:sp.c, cityId:null,
            cityObj:{ id:null, name:sp.c, coord:null, __custom:true },
            emoji:'📍', region:(sp.region || sp.p), tag:'景点', tagClass:'tag-spot',
            score: sp.n.indexOf(q) === 0 ? 450 : 80
          });
        }
      });
    }
    items.sort(function(a, b) { return (b.score || 0) - (a.score || 0); });
    return items.slice(0, 18);
  }

  async function maybeGeocode(q) {
    if (!q || state.commitLatch > 0) return;
    state.geoReq++;
    var myReq = state.geoReq;
    render(searchLocal(input.value.trim()), null, true);
    try {
      var coord = await geocodePlace(q);
      if (myReq !== state.geoReq) return; // 用户继续输入过，旧结果丢弃
      if (state.commitLatch > 0) return; // 期间用户已 commit
      if (coord) {
        render(searchLocal(input.value.trim()), { name: q, coord: coord, region: '高德解析' }, false);
      } else {
        render(searchLocal(input.value.trim()), null, false);
      }
    } catch (e) {
      if (myReq === state.geoReq && state.commitLatch === 0) {
        render(searchLocal(input.value.trim()), null, false);
      }
    }
  }

  input.addEventListener('input', function() {
    if (state.commitLatch > 0) return; // commit 锁定期间忽略 input
    input.parentElement.classList.remove('has-value');
    document.getElementById(hiddenId).value = ''; // 清掉旧 ID，重新选择才算
    var q = input.value.trim();
    clearTimeout(state.geoTimer);
    if (!q) { render([], null, false); return; }
    render(searchLocal(q), null, false);
    // 1 字及以上就触发高德解析（去重 trim 后空格）
    if (q.length >= 1) state.geoTimer = setTimeout(function() { maybeGeocode(q); }, 300);
  });

  input.addEventListener('focus', function() {
    // commit 已主动 input.blur()，所以下次 focus 一定是用户主动行为，应允许开 popup
    var q = input.value.trim();
    // 空 query：第一次 focus 暂不打开大面板（避免打开页面就被遮挡），再次 focus 才打开
    if (!q) {
      if (input.dataset.routeSearchReady === '1') render(searchLocal(''), null, false);
      else input.dataset.routeSearchReady = '1';
      return;
    }
    if (!popup.innerHTML.trim()) render(searchLocal(q), null, false);
    else openPopup();
  });

  input.addEventListener('blur', function() {
    setTimeout(closePopup, 180); // 给点击留 180ms，避免提前关闭
  });

  input.addEventListener('keydown', function(e) {
    var max = state.items.length;
    if (e.key === 'Escape') { e.preventDefault(); closePopup(); input.blur(); return; }
    if (!max) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); openPopup(); state.activeIdx = (state.activeIdx + 1) % max; refreshActive(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); openPopup(); state.activeIdx = (state.activeIdx - 1 + max) % max; refreshActive(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (state.activeIdx >= 0 && state.items[state.activeIdx]) commit(state.items[state.activeIdx]);
    }
  });
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* 把"输入框文字 + 已有城市"统一解析成可用的 city 对象
 *  1. 优先用已设置的 routeStartCity / routeEndCity
 *  2. 否则按文字匹配 destinations
 *  3. 找不到就 geocode 当自定义地点
 */
async function resolveRouteEndpoint(which) {
  var cached = which === 'start' ? routeStartCity : routeEndCity;
  if (cached && cached.coord) return cached;
  var inputId = which === 'start' ? 'routeStartInput' : 'routeEndInput';
  var input = document.getElementById(inputId);
  var txt = (input && input.value || '').trim();
  if (!txt) return null;
  // 兼容显示形式 "故宫（北京）" / "西湖（杭州）"
  var match = destinations.find(function(d) { return d.name === txt; });
  if (!match && txt.indexOf('（') > 0) {
    var inner = txt.split('（')[0].trim();
    match = destinations.find(function(d) { return d.name === inner; });
  }
  if (!match) {
    var lower = txt.toLowerCase();
    match = destinations.find(function(d) {
      return d.name.indexOf(txt) >= 0 || txt.indexOf(d.name) >= 0 ||
        d.pinyin.toLowerCase().indexOf(lower) >= 0 || lower.indexOf(d.pinyin.toLowerCase()) >= 0;
    });
  }
  if (match) {
    if (which === 'start') routeStartCity = match; else routeEndCity = match;
    return match;
  }
  // 也尝试匹配景点名
  var spotMatch = null;
  for (var i = 0; i < destinations.length; i++) {
    var d = destinations[i];
    if (d.spots) {
      for (var j = 0; j < d.spots.length; j++) {
        if (d.spots[j].name === txt) { spotMatch = d; break; }
      }
    }
    if (spotMatch) break;
  }
  if (spotMatch) {
    if (which === 'start') routeStartCity = spotMatch; else routeEndCity = spotMatch;
    return spotMatch;
  }
  var coord = await geocodePlace(txt);
  if (coord) {
    var custom = { id: 'custom-' + Date.now(), name: txt, coord: coord, __custom: true };
    if (which === 'start') routeStartCity = custom; else routeEndCity = custom;
    return custom;
  }
  return null;
}

async function runRoutePlan(startCity, endCity) {
  var s = startCity;
  var e = endCity;
  if (!s) s = await resolveRouteEndpoint('start');
  if (!e) e = await resolveRouteEndpoint('end');
  var box = document.getElementById('routeResult');
  if (!box) return;
  if (!s || !e) { showToast('请先选择起点和终点', 'error'); return; }
  if (s.name === e.name) { showToast('起点和终点不能相同', 'error'); return; }
  var meta = MODE_META[currentRouteMode] || MODE_META.drive;
  box.innerHTML = '<div class="route-loading">🤖 正在规划' + meta.name + '路线…</div>';
  try {
    var pref = (document.getElementById('routePref') || {}).value || 'recommend';
    lastPlanPref = pref; // ✅ 让 buildRouteHTML 顶部徽章拿到当前偏好
    if (routeWaypoints && routeWaypoints.length) {
      var labels = routeWaypoints.map(function(wp) { return wp.name; });
      var data = await planItinerary(s, e, labels, currentRouteMode);
      lastPlanResult = data; lastPlanStart = s; lastPlanEnd = e;
      box.innerHTML = buildItineraryHTML(s, e, data);
      bindShowMultiMap(data);  // ← 传整个 data（带 polyline），不是 data.order
      bindModeSelection(box);
      // ✅ 自动按真实路况绘制 polyline + 落点图标（plan 内已含 polyline）
      drawRouteByMode(s, e, null, data.order, data);
      var mv = document.getElementById('mapview');
      if (mv) mv.scrollIntoView({ behavior: 'smooth' });
    } else {
      var plan = await planTrip(s, e, currentRouteMode, pref);
      lastPlanResult = plan; lastPlanStart = s; lastPlanEnd = e;
      box.innerHTML = buildRouteHTML(s, e, plan);
      bindRouteInteractions(box);
      bindStepsToggle(box.querySelector('#routeSteps'), box.querySelector('.steps-toggle'));
      drawRouteByMode(s, e, plan.strategies[0], plan.order, plan);
    }
  } catch (err) {
    box.innerHTML = '<div class="route-loading">规划失败，请稍后重试</div>';
  }
}

/* 按所选方案在地图上绘制路线：有真实 path 用真实，沿主方向按方式着色
   params:
     start     : 起点城市
     end       : 终点城市
     strategy  : 路线策略（含 path）
     order     : 可选 plan.order —— 含所有点（起/经/终）按优化后顺序
                 不传时仅起/终两点
     plan      : 可选 plan 整体 —— 若 plan.polyline 存在则优先按它（多地点真实路况） */
function drawRouteByMode(start, end, strategy, order, plan) {
  if (!chinaMap || !window.AMap) { showToast('地图未加载，无法标线', 'error'); return; }
  var AMap = window.AMap;

  // 1) 清旧线 + 旧标记
  if (window._routeLine) { chinaMap.remove(window._routeLine); window._routeLine = null; }
  if (window._routeMarkers && window._routeMarkers.length) {
    window._routeMarkers.forEach(function(m) { chinaMap.remove(m); });
  }
  window._routeMarkers = [];

  var mode = (plan && plan.mode) || (lastPlanResult && lastPlanResult.mode) || 'drive';
  var color = (MODE_META[mode] || MODE_META.drive).color;

  // 2) 路线 polyline —— 优先取真实路况
  var path;
  if (plan && plan.polyline && plan.polyline.length > 1) {
    // 多地点拼接的真实路况 path（planItinerary 已按高德 Driving 调过）
    path = plan.polyline.map(function(p) { return new AMap.LngLat(p[0], p[1]); });
  } else if (strategy && strategy.path && strategy.path.length > 1) {
    path = strategy.path.map(function(p) { return new AMap.LngLat(p[0], p[1]); });
  } else if (plan && plan.drivingPolyline && plan.drivingPolyline.length > 1) {
    // ✅ 任何 mode 都有驾车路况兜底 polyline（公交跨城段、步行/骑行长距离时使用）
    path = plan.drivingPolyline.map(function(p) { return new AMap.LngLat(p[0], p[1]); });
  } else if (order && order.length > 1) {
    // 多地点（无真实 path）：按 order 全节点顺序画一条折线
    path = order.map(function(p) {
      var c = p.coord || coordOf({ id: p.id });
      return new AMap.LngLat(c[0], c[1]);
    });
  } else {
    var fallback = buildWavyPath(coordOf(start), coordOf(end), mode, mode === 'drive' ? 'base' : mode);
    path = fallback.map(function(p) { return new AMap.LngLat(p[0], p[1]); });
  }
  var line = new AMap.Polyline({
    path: path,
    strokeColor: color,
    strokeWeight: 6,
    strokeOpacity: 0.92,
    showDir: true,
    lineJoin: 'round'
  });
  chinaMap.add(line);
  window._routeLine = line;

  // 3) 点标记 —— 用 AMap.Icon + SVG drop-pin（像定位坐标一样的 logo）
  var stops = computeStopList(order, start, end);
  stops.forEach(function(stop, i) {
    var isFirst = i === 0;
    var isLast  = i === stops.length - 1;
    var kind, letter, fillHex, label;
    if (isFirst) { kind = 'start'; letter = 'A'; fillHex = '#10b981'; }
    else if (isLast) { kind = 'end'; letter = 'B'; fillHex = '#ef4444'; }
    else { kind = 'via'; letter = String(i + 1); fillHex = '#475569'; }
    label = stop.name || '';

    var iconUrl = buildPinSvg(fillHex, letter);
    var icon = new AMap.Icon({
      size: new AMap.Size(40, 56),
      image: iconUrl,
      imageSize: new AMap.Size(40, 56),
      imageOffset: new AMap.Pixel(0, 0)
    });
    var m = new AMap.Marker({
      position: new AMap.LngLat(stop.coord[0], stop.coord[1]),
      icon: icon,
      offset: new AMap.Pixel(-20, -52),   // 钉在针尖（与 AMap 默认对齐方式一致）
      title: label,
      zIndex: 200,
      extData: { kind: kind, idx: i, name: label }
    });
    // 鼠标悬停时给一个有 shadow 的 infoWindow-like 提示
    m.on('mouseover', function() {
      var info = new AMap.Marker({ position: m.getPosition(), offset: new AMap.Pixel(0, -56), content: '' });
      // 简化：直接复用 Marker 的 title（浏览器原生 tooltip），无需 infoWindow
    });
    chinaMap.add(m);
    window._routeMarkers.push(m);
  });

  // 4) fitView —— 同时纳入所有点 + 线
  var fitTargets = window._routeMarkers.slice();
  fitTargets.push(line);
  try { chinaMap.setFitView(fitTargets); } catch (e) { /* setFitView 接受数组 */ }
}

/* 生成图钉 SVG 的 dataURL —— AMap.Icon 直接使用
   size: 40 × 56
   形状：经典 tear-drop 图钉（与高德"定位坐标"图标一致）
   颜色头：fillHex  （A=#10b981 起 / via=#475569 / B=#ef4444 终）
   内嵌：白色圆 + 字母或数字 */
function buildPinSvg(fillHex, letter) {
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="56" viewBox="0 0 40 56">' +
      '<defs>' +
        '<filter id="ds" x="-30%" y="-10%" width="160%" height="140%">' +
          '<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/>' +
        '</filter>' +
      '</defs>' +
      '<path filter="url(#ds)" ' +
        'd="M20 0C9 0 0 9 0 20c0 14.7 16.6 32.4 18.5 34.3a2 2 0 0 0 3 0C23.4 52.4 40 34.7 40 20 40 9 31 0 20 0z" ' +
        'fill="' + fillHex + '"/>' +
      '<circle cx="20" cy="20" r="11" fill="#fff"/>' +
      '<text x="20" y="25.5" text-anchor="middle" font-size="14" font-weight="800" ' +
        'fill="' + fillHex + '" font-family="-apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif">' +
        escapeXml(letter) +
      '</text>' +
    '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, function(c) {
    return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c];
  });
}

/* 把 plan.order 收敛成 [{name, coord}] 序列；没传时仅 起 + 终 */
function computeStopList(order, start, end) {
  if (order && order.length) {
    return order.map(function(o) {
      return {
        name: o.name || o.id || '',
        coord: o.coord || (o.id ? coordOf({ id: o.id }) : null) || [116.397, 39.908]
      };
    }).filter(function(s) { return s.coord; });
  }
  var sCoord = coordOf(start), eCoord = coordOf(end);
  return [
    { name: start.name, coord: sCoord },
    { name: end.name,   coord: eCoord }
  ];
}

function syncRouteSelects() {
  var sInput = document.getElementById('routeStartInput');
  var eInput = document.getElementById('routeEndInput');
  var sHidden = document.getElementById('routeStart');
  var eHidden = document.getElementById('routeEnd');
  function display(city) {
    if (!city) return '';
    return city.__spotName ? (city.__spotName + '（' + city.name + '）') : city.name;
  }
  if (sInput && routeStartCity) {
    sInput.value = display(routeStartCity);
    sHidden.value = routeStartCity.id || '';
    sInput.parentElement.classList.add('has-value');
  } else if (sInput && !routeStartCity) {
    sHidden.value = '';
    sInput.parentElement.classList.remove('has-value');
  }
  if (eInput && routeEndCity) {
    eInput.value = display(routeEndCity);
    eHidden.value = routeEndCity.id || '';
    eInput.parentElement.classList.add('has-value');
  } else if (eInput && !routeEndCity) {
    eHidden.value = '';
    eInput.parentElement.classList.remove('has-value');
  }
}

function toggleRoutePick() {
  if (routePickMode) { exitPickMode(); return; }
  routePickMode = true;
  routeStartCity = null; routeEndCity = null; routeWaypoints = [];
  syncRouteSelects();
  renderWaypointChips();
  var btn = document.getElementById('routePickBtn');
  var mapEl = document.getElementById('chinaMap');
  if (btn) btn.classList.add('active');
  if (mapEl) mapEl.classList.add('picking');
  showDoneBtn(true);
  showToast('地图自由选点：① 点击设起点 ② 再点击设终点 ③ 继续点击加途经点 ④ 点「✓ 完成选点」开始规划', 'info');
}

function exitPickMode() {
  routePickMode = false;
  var btn = document.getElementById('routePickBtn'); if (btn) btn.classList.remove('active');
  var mapEl = document.getElementById('chinaMap'); if (mapEl) mapEl.classList.remove('picking');
  showDoneBtn(false);
}

function showDoneBtn(visible) {
  var btn = document.getElementById('routeDoneBtn');
  if (!btn) return;
  if (visible) {
    btn.hidden = false;
    // 实时显示已选点数：起点(0/1) + 终点(0/1) + 途经点(N)
    var sp = routeStartCity ? 1 : 0;
    var ep = routeEndCity ? 1 : 0;
    var wp = (routeWaypoints || []).length;
    btn.textContent = '✓ 完成选点（' + (sp + ep + wp) + '）';
  } else {
    btn.hidden = true;
  }
}

function mapPickCity(city) {
  if (!routePickMode) return false;
  setRouteEndpoint(city);
  return true;
}

/* 新版：1 = 起点 / 2 = 终点 / 3+ = 途经点。
   起点终点都设好后不自动退出，由「✓ 完成选点」或「🧭 规划路线」手动触发规划。 */
async function setRouteEndpoint(cityObj) {
  if (!routeStartCity) {
    routeStartCity = cityObj;
    syncRouteSelects();
    showDoneBtn(true);
    showToast('起点：' + cityObj.name + '，下一步点击设终点（或继续添加途经点）', 'info');
  } else if (!routeEndCity) {
    routeEndCity = cityObj;
    syncRouteSelects();
    showDoneBtn(true);
    if (routeWaypoints.length === 0) {
      showToast('终点：' + cityObj.name + '。可继续添加途经点，或点「✓ 完成选点」开始规划', 'info');
    } else {
      showToast('已设 ' + (routeWaypoints.length + 2) + ' 个点。点「✓ 完成选点」开始规划', 'info');
    }
  } else {
    // 第 3 个及以后的点全部加为途经点
    routeWaypoints.push({
      id: 'wp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: cityObj.name,
      coord: cityObj.coord || null,
      custom: !!cityObj.custom
    });
    renderWaypointChips();
    showDoneBtn(true);
    showToast('已添加途经点：' + cityObj.name + '（共 ' + routeWaypoints.length + ' 个途经点）', 'success');
  }
}

async function mapPickPoint(lnglat) {
  if (!routePickMode) return;
  var coord = [lnglat.getLng(), lnglat.getLat()];
  var name = await reverseGeocode(coord);
  setRouteEndpoint({ id: 'custom-' + Date.now(), name: name, coord: coord, custom: true });
}

/* 主动结束选点：起点+终点+途经点 全部保留，按当前偏好规划 */
function finishPickAndPlan() {
  if (!routePickMode) return;
  exitPickMode();
  if (!routeStartCity || !routeEndCity) {
    showToast('还需设起点和终点', 'error');
    // 回到选点模式继续选
    routePickMode = true;
    var mapEl = document.getElementById('chinaMap'); if (mapEl) mapEl.classList.add('picking');
    var btn = document.getElementById('routePickBtn'); if (btn) btn.classList.add('active');
    showDoneBtn(true);
    return;
  }
  runRoutePlan(routeStartCity, routeEndCity);
}

function renderWaypointChips() {
  var box = document.getElementById('waypointChips');
  if (!box) return;
  if (!routeWaypoints.length) { box.innerHTML = ''; return; }
  box.innerHTML = routeWaypoints.map(function(wp, i) {
    return '<span class="wp-chip" data-i="' + i + '">' + wp.name + ' <span class="wp-del">✕</span></span>';
  }).join('');
  box.querySelectorAll('.wp-del').forEach(function(el) {
    el.addEventListener('click', function() {
      var i = parseInt(el.parentElement.getAttribute('data-i'), 10);
      routeWaypoints.splice(i, 1);
      renderWaypointChips();
    });
  });
}

function addWaypointFromInput() {
  var input = document.getElementById('waypointInput');
  if (!input) return;
  var v = input.value.trim();
  if (!v) { showToast('请输入途经点名称', 'error'); return; }
  routeWaypoints.push({ id: 'wp-' + Date.now(), name: v, coord: null });
  input.value = '';
  renderWaypointChips();
  if (routePickMode) showDoneBtn(true);
  showToast('已添加途经点：' + v + '（规划时按地名解析坐标）', 'info');
}

function clearRoute() {
  routeStartCity = null; routeEndCity = null; routeWaypoints = [];
  if (routePickMode) exitPickMode();
  showDoneBtn(false);
  syncRouteSelects();
  renderWaypointChips();
  var box = document.getElementById('routeResult');
  if (box) box.innerHTML = '';
  if (window._routeLine && chinaMap) { chinaMap.remove(window._routeLine); window._routeLine = null; }
  if (window._routeMarkers && chinaMap) {
    window._routeMarkers.forEach(function(m) { chinaMap.remove(m); });
    window._routeMarkers = [];
  }
}

function bindRouteEvents() {
  var planBtn = document.getElementById('routePlanBtn');
  var pickBtn = document.getElementById('routePickBtn');
  var clearBtn = document.getElementById('routeClearBtn');
  var wpAdd = document.getElementById('waypointAdd');
  var nearbyBtn = document.getElementById('routeNearbyBtn');
  var doneBtn = document.getElementById('routeDoneBtn');
  if (planBtn) planBtn.addEventListener('click', function() { runRoutePlan(); });
  if (doneBtn) doneBtn.addEventListener('click', finishPickAndPlan);
  var tabs = document.getElementById('routeTabs');
  if (tabs) {
    tabs.querySelectorAll('.route-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        tabs.querySelectorAll('.route-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        currentRouteMode = tab.getAttribute('data-mode');
        if (routeStartCity && routeEndCity) runRoutePlan(routeStartCity, routeEndCity);
      });
    });
  }
  if (pickBtn) pickBtn.addEventListener('click', toggleRoutePick);
  if (clearBtn) clearBtn.addEventListener('click', clearRoute);
  if (wpAdd) wpAdd.addEventListener('click', addWaypointFromInput);
  if (nearbyBtn) nearbyBtn.addEventListener('click', function() {
    var box = document.getElementById('routeNearby');
    // 已展开则再次点击 = 收起
    if (box && box.innerHTML.trim() && !box.classList.contains('nearby-hidden')) {
      box.classList.add('nearby-hidden');
      return;
    }
    var city = routeStartCity || routeEndCity || destinations[0];
    if (!city) return;
    runNearby(city);
    if (box) box.classList.remove('nearby-hidden');
    var rp = document.getElementById('routePanel');
    if (rp) rp.scrollIntoView({ behavior: 'smooth' });
  });
  // ✅ 手机导航标配：从我位置出发（浏览器原生定位，免费无需 key）
  var locateBtn = document.getElementById('routeLocateBtn');
  if (locateBtn) locateBtn.addEventListener('click', function() {
    if (!navigator.geolocation) { showToast('当前浏览器不支持定位', 'error'); return; }
    var prev = locateBtn.textContent;
    locateBtn.disabled = true; locateBtn.textContent = '⏳';
    navigator.geolocation.getCurrentPosition(function(pos) {
      var lng = pos.coords.longitude, lat = pos.coords.latitude;
      reverseGeocode([lng, lat]).then(function(addr) {
        var name = (addr && addr !== '自定义点') ? addr : '我的位置';
        routeStartCity = { id: 'loc-' + Date.now(), name: name, coord: [lng, lat], __custom: true, __loc: true };
        syncRouteSelects();
        locateBtn.disabled = false; locateBtn.textContent = '📍';
        showToast('已使用我的位置作为起点：' + name, 'success');
      });
    }, function(err) {
      locateBtn.disabled = false; locateBtn.textContent = '📍';
      showToast('定位失败，请手动输入起点（' + ((err && err.message) || '权限被拒绝') + '）', 'error');
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  });
  // ✅ 手机导航标配：实时路况图层开关（高德免费 TrafficLayer）
  var trafficBtn = document.getElementById('trafficToggle');
  if (trafficBtn) trafficBtn.addEventListener('click', function() {
    if (!chinaMap || !window.AMap) { showToast('地图未加载，无法开启路况', 'error'); return; }
    var on = trafficBtn.getAttribute('aria-pressed') === 'true';
    if (!window._trafficLayer) {
      try { window._trafficLayer = new window.AMap.TrafficLayer(); } catch (e) { window._trafficLayer = null; }
    }
    if (!window._trafficLayer) { showToast('当前高德版本不支持实时路况图层', 'error'); return; }
    if (on) {
      window._trafficLayer.setMap(null);
      trafficBtn.setAttribute('aria-pressed', 'false');
      trafficBtn.classList.remove('active');
    } else {
      window._trafficLayer.setMap(chinaMap);
      trafficBtn.setAttribute('aria-pressed', 'true');
      trafficBtn.classList.add('active');
    }
  });
  // 周边探索栏内的「✕」收起按钮（事件委托，兼容每次重新渲染）
  var nearbyBox = document.getElementById('routeNearby');
  if (nearbyBox) {
    nearbyBox.addEventListener('click', function(e) {
      if (e.target.closest('.nearby-close')) nearbyBox.classList.add('nearby-hidden');
    });
  }
}

/* 规划路线搜索下拉 & 周边探索栏：点击面板外部时自动收起 */
function bindRouteDismiss() {
  document.addEventListener('click', function(e) {
    var t = e.target;
    // 1) 起 / 终点搜索下拉：点击发生在对应搜索框之外则关闭
    ['start', 'end'].forEach(function(which) {
      var wrap = document.querySelector('.route-search[data-which="' + which + '"]');
      var popup = document.getElementById(which === 'start' ? 'routeStartPopup' : 'routeEndPopup');
      if (popup && !popup.hidden && wrap && !wrap.contains(t)) {
        popup.hidden = true;
      }
    });
    // 2) 周边探索栏：点击发生在路线面板之外则收起
    var panel = document.getElementById('routePanel');
    var nearby = document.getElementById('routeNearby');
    if (panel && nearby && !panel.contains(t)) {
      nearby.classList.add('nearby-hidden');
    }
  });
}

/* 从聊天"从A到B怎么去"中提取有序的两个城市 */
function extractRouteCities(text, lower) {
  var found = [];
  destinations.forEach(function(d) {
    var idx = lower.indexOf(d.name);
    if (idx < 0) idx = lower.indexOf(d.pinyin.toLowerCase());
    if (idx >= 0) found.push({ city: d, idx: idx });
  });
  found.sort(function(a, b) { return a.idx - b.idx; });
  return found.slice(0, 5).map(function(f) { return f.city; });
}

async function processRouteQuery(start, end) {
  removeLoadingMessage();
  var plan = await planTrip(start, end, 'drive', 'recommend');
  var best = plan.strategies[0];
  var html = '从 <strong>' + start.name + '</strong> 到 <strong>' + end.name + '</strong> 约 <strong>' + plan.distanceKm.toFixed(1) + ' 公里</strong>。<br><br>';
  html += '🤖 <strong>AI 推荐：' + best.title + '</strong>（驾车约 ' + fmtDuration(best.timeH) + (best.costYuan > 0 ? '，¥' + best.costYuan : '') + '）<br><br>';
  plan.strategies.forEach(function(st, i) {
    html += (i === 0 ? '✅ ' : '• ') + '<strong>' + st.title + '</strong>：' + st.tag + '，' + fmtDuration(st.timeH) + (st.costYuan > 0 ? '，¥' + st.costYuan : '') + '<br>';
  });
  html += '<br>需要我也在地图上把这条路线标出来吗？';
  addMessage(html, 'agent');
  selectCity(end.id);
}

/* 聊天里带途经点的多地点行程：从 A 经 B、C 到 D */
async function processMultiRouteQuery(start, end, waypointLabels) {
  removeLoadingMessage();
  var data = await planItinerary(start, end, waypointLabels, currentRouteMode);
  var html = '🗺️ 为你规划的打卡顺序：<strong>' + data.order.map(function(s) { return s.name; }).join(' → ') + '</strong><br><br>';
  data.legs.forEach(function(leg) {
    var best = leg.modes.find(function(m) { return m.reco; }) || leg.modes[0];
    html += '🚩 ' + leg.from.name + ' → ' + leg.to.name + '（约 ' + Math.round(leg.dist) + 'km）<br>';
    html += '&nbsp;&nbsp;✅ 推荐 ' + best.name + '，约 ' + fmtDuration(best.time) + '，¥' + best.cost + '<br>';
  });
  html += '<br>详细时间线（到达时间 + 打卡时段 + 全部出行方式）请到「AI 出行规划」面板查看。';
  addMessage(html, 'agent');
  selectCity(end.id);
}

/* 聊天里问"XX 周边有什么" */
async function processNearbyQuery(city) {
  removeLoadingMessage();
  var coord = city.coord || (cityCoords[city.id] || [116.397, 39.908]);
  var cats = [
    { label: '🍜 美食饭店', kw: '餐饮' },
    { label: '🛍️ 商场购物', kw: '购物中心' },
    { label: '🚇 地铁站', kw: '地铁站' }
  ];
  var html = '📍 <strong>' + city.name + '</strong> 周边推荐：';
  var any = false;
  for (var i = 0; i < cats.length; i++) {
    var list = await searchNearby(coord, cats[i].kw, 3000);
    html += '<br><br>' + cats[i].label + '<br>';
    if (!list.length) { html += '（暂未获取到数据）<br>'; continue; }
    any = true;
    list.slice(0, 4).forEach(function(p) {
      html += '• ' + p.name + (p.dist != null ? '（约 ' + Math.round(p.dist) + 'm）' : '') + '<br>';
    });
  }
  if (!any) html += '<br>（附近数据获取失败，可能地图 Key 未配置）';
  addMessage(html, 'agent');
}

/* ============ 聊天系统 ============ */

var QUICK_ACTIONS = [
  '今天去哪玩比较好？',
  '北京天气怎么样？',
  '推荐一个适合周末出游的地方',
  '三亚适合现在去吗？'
];

function initChat() {
  addMessage('你好！我是<strong>云游小助手</strong> ✦<br><br>我可以帮你：<br>• 查询任意城市的实时天气<br>• 根据天气推荐出行目的地<br>• 生成个性化的穿搭和活动建议<br><br>试试问我：<strong>"今天去哪玩？"</strong>', 'agent');
  renderQuickActions();
}

function renderQuickActions() {
  var container = document.getElementById('quickActions');
  container.innerHTML = QUICK_ACTIONS.map(function(q) {
    return '<button class="quick-btn">' + q + '</button>';
  }).join('');

  container.querySelectorAll('.quick-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var input = document.getElementById('chatInput');
      input.value = btn.textContent;
      handleSend();
    });
  });
}

function addMessage(html, type, isLoading) {
  var container = document.getElementById('chatMessages');
  var msg = document.createElement('div');
  msg.className = 'message ' + type + (isLoading ? ' loading' : '');

  if (isLoading) {
    msg.innerHTML = '<div class="message-avatar">✦</div><div class="message-bubble"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
  } else {
    var avatar = type === 'agent' ? '✦' : '🧑';
    msg.innerHTML = '<div class="message-avatar">' + avatar + '</div><div class="message-bubble">' + html + '</div>';
  }

  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  return msg;
}

function removeLoadingMessage() {
  var container = document.getElementById('chatMessages');
  var loading = container.querySelector('.message.loading');
  if (loading) loading.remove();
}

var isProcessing = false;

async function handleSend() {
  if (isProcessing) return;
  var input = document.getElementById('chatInput');
  var text = input.value.trim();
  if (!text) return;

  input.value = '';
  isProcessing = true;
  document.getElementById('sendBtn').disabled = true;

  addMessage(text, 'user');
  addMessage('', 'agent', true);

  try {
    await handleUserInput(text);
  } catch (error) {
    console.error('Chat error:', error);
    removeLoadingMessage();
    addMessage('抱歉，处理你的问题时遇到了一些问题，请稍后再试。', 'agent');
  }

  isProcessing = false;
  document.getElementById('sendBtn').disabled = false;
}

async function handleUserInput(input) {
  var lower = input.toLowerCase();

  /* 路线规划意图：从 A 到 B 怎么去；含途经点则多地点行程 */
  var routeCities = extractRouteCities(input, lower);
  if (routeCities.length >= 2 && /(怎么去|怎么走|怎么到|出行方式|交通|路线|规划|前去|前往|如何到|到|去)/.test(lower)) {
    if (routeCities.length >= 3) {
      await processMultiRouteQuery(routeCities[0], routeCities[routeCities.length - 1],
        routeCities.slice(1, -1).map(function(c) { return c.name; }));
    } else {
      await processRouteQuery(routeCities[0], routeCities[1]);
    }
    return;
  }

  /* 检测城市名称 */
  var matchedCity = destinations.find(function(d) {
    return lower.includes(d.name) || lower.includes(d.pinyin.toLowerCase());
  });

  if (matchedCity) {
    if (/(周边|附近|周围|好吃的|美食|吃饭|饭店|餐厅|商场|购物|地铁站)/.test(lower)) {
      await processNearbyQuery(matchedCity);
      return;
    }
    await processCityQuery(matchedCity);
    return;
  }

  /* 检测推荐请求 */
  if (lower.includes('推荐') || lower.includes('去哪') || lower.includes('哪里') ||
      lower.includes('适合') || lower.includes('建议') || lower.includes('周末') ||
      lower.includes('出游') || lower.includes('旅行') || lower.includes('旅游')) {
    await processRecommendationQuery();
    return;
  }

  /* 检测问候 */
  if (lower.includes('你好') || lower.includes('hi') || lower.includes('hello') ||
      lower.includes('嗨') || lower.includes('你是谁') || lower.includes('谢谢')) {
    removeLoadingMessage();
    addMessage('我是<strong>云游小助手</strong>，你的智能旅行助手！我可以查询中国各城市的实时天气，并根据天气给你出行建议。试试问我某个城市的天气，或者让我推荐今天最适合去哪玩？', 'agent');
    return;
  }

  /* 默认回复 */
  removeLoadingMessage();
  addMessage('我可以帮你查询<strong>中国各城市的实时天气</strong>，也可以根据天气<strong>推荐出行目的地</strong>。<br><br>你可以问我：<br>• "北京天气怎么样？"<br>• "今天去哪玩比较好？"<br>• "推荐一个适合周末出游的地方"', 'agent');
}

/* 处理城市天气查询 */
async function processCityQuery(city) {
  var weather = await fetchWeather(city);
  removeLoadingMessage();

  if (!weather) {
    addMessage('抱歉，暂时无法获取<strong>' + city.name + '</strong>的天气数据，请稍后再试。', 'agent');
    showToast('天气数据获取失败', 'error');
    return;
  }

  var advice = generateAdvice(weather);
  var score = calculateWeatherScore(weather);
  var scoreLabel = '';
  if (score >= 75) scoreLabel = '非常适合出行';
  else if (score >= 60) scoreLabel = '比较适合出行';
  else if (score >= 40) scoreLabel = '一般，需注意天气';
  else scoreLabel = '不太适合户外活动';

  var html = '<strong>' + city.name + '</strong> 实时天气 ' + weather.icon + '<br><br>';
  html += '<span class="weather-inline">🌡️ ' + weather.temp + '°C（体感' + weather.feelsLike + '°C）</span> ';
  html += '<span class="weather-inline">' + weather.icon + ' ' + weather.descZh + '</span><br>';
  html += '湿度 ' + weather.humidity + '% · 风速 ' + weather.windSpeed + 'km/h · 紫外线 ' + weather.uvIndex + '<br><br>';
  html += '<strong>出行指数：' + scoreLabel + '</strong><br><br>';
  html += '<strong>AI 建议：</strong><br>';
  advice.forEach(function(a) {
    html += a.icon + ' ' + a.text + '<br>';
  });
  html += '<br>要不要我也帮你看看其他城市的天气，对比一下哪边更适合出行？';

  addMessage(html, 'agent');

  /* 同步更新天气看板 */
  selectCity(city.id);
}

/* 处理推荐请求 —— Agent 的核心能力：多城市并行查询 + 智能评分排序 */
async function processRecommendationQuery() {
  var citiesToCheck = destinations.slice(0, 6);

  var results = await Promise.all(
    citiesToCheck.map(async function(city) {
      var weather = await fetchWeather(city);
      return { city: city, weather: weather, score: weather ? calculateWeatherScore(weather) : -1 };
    })
  );

  var valid = results.filter(function(r) { return r.weather !== null; });
  var sorted = valid.sort(function(a, b) { return b.score - a.score; });

  removeLoadingMessage();

  if (sorted.length === 0) {
    addMessage('抱歉，暂时无法获取天气数据，请稍后再试。', 'agent');
    return;
  }

  var html = '我帮你查了几个热门城市的实时天气，以下是推荐排序：<br><br>';

  var top3 = sorted.slice(0, 3);
  top3.forEach(function(r, i) {
    var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
    html += medal + ' <strong>' + r.city.name + '</strong> ' + r.weather.icon + ' ' + r.weather.temp + '°C ' + r.weather.descZh;
    html += ' — 出行指数 ' + r.score + '/100<br>';
  });

  var best = top3[0];
  html += '<br><strong>最推荐：' + best.city.name + '</strong><br>';
  html += best.city.description + '，' + best.city.attractions.join('、') + '等景点都值得一去。<br><br>';

  var advice = generateAdvice(best.weather);
  html += '<strong>出行建议：</strong><br>';
  advice.slice(0, 3).forEach(function(a) {
    html += a.icon + ' ' + a.text + '<br>';
  });

  html += '<br>点击下方目的地卡片可以查看更多城市详情，也可以直接问我某个城市的天气！';

  addMessage(html, 'agent');

  /* 同步更新天气看板为推荐第一的城市 */
  selectCity(best.city.id);
}

/* ============ 工具函数 ============ */

function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toastContainer');
  // 防堆叠：同 message+type 已在显示中就只刷新存活时间；总数最多保留 4 张
  var existing = Array.prototype.find.call(container.children, function(t) {
    return t.textContent === message && t.className.indexOf(type) >= 0;
  });
  var toast;
  if (existing) {
    toast = existing;
    toast.classList.remove('toast-fade');
    void toast.offsetWidth; // restart animation
  } else {
    toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
  }
  if (container.children.length > 4) {
    var old = container.firstElementChild;
    if (old) old.remove();
  }
  toast._dismiss && clearTimeout(toast._dismiss);
  toast._dismiss = setTimeout(function() {
    toast.classList.add('toast-fade');
    setTimeout(function() { toast.remove(); }, 280);
  }, 2800);
}

/* ============ 事件绑定 ============ */

function bindEvents() {
  /* 导航栏滚动效果 */
  window.addEventListener('scroll', function() {
    var navbar = document.getElementById('navbar');
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });

  /* 移动端菜单 */
  var navToggle = document.getElementById('navToggle');
  var navMenu = document.getElementById('navMenu');
  navToggle.addEventListener('click', function() {
    navMenu.classList.toggle('open');
  });
  navMenu.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      navMenu.classList.remove('open');
    });
  });

  /* 搜索 */
  var searchBtn = document.getElementById('searchBtn');
  var citySearch = document.getElementById('citySearch');
  searchBtn.addEventListener('click', handleSearch);
  citySearch.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') handleSearch();
  });

  /* 聊天 */
  var sendBtn = document.getElementById('sendBtn');
  var chatInput = document.getElementById('chatInput');
  sendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') handleSend();
  });

  /* 悬浮 AI 助手开关 */
  var chatFab = document.getElementById('chatFab');
  var chatClose = document.getElementById('chatClose');
  var navAssistant = document.getElementById('navAssistantLink');
  if (chatFab) chatFab.addEventListener('click', openChat);
  if (chatClose) chatClose.addEventListener('click', closeChat);
  if (navAssistant) navAssistant.addEventListener('click', function(e) {
    e.preventDefault();
    navMenu.classList.remove('open');
    openChat();
  });
}

function openChat() {
  var widget = document.getElementById('chatWidget');
  var fab = document.getElementById('chatFab');
  if (widget) widget.classList.add('open');
  if (fab) fab.classList.add('hidden');
}

function closeChat() {
  var widget = document.getElementById('chatWidget');
  var fab = document.getElementById('chatFab');
  if (widget) widget.classList.remove('open');
  if (fab) fab.classList.remove('hidden');
}

function handleSearch() {
  var input = document.getElementById('citySearch');
  var text = input.value.trim();
  if (!text) {
    showToast('请输入城市名称', 'error');
    return;
  }

  var matched = destinations.find(function(d) {
    return text.includes(d.name) || text.toLowerCase().includes(d.pinyin.toLowerCase());
  });

  if (matched) {
    selectCity(matched.id);
    document.getElementById('weather').scrollIntoView({ behavior: 'smooth' });
    showToast('已切换到' + matched.name + '天气', 'success');
  } else {
    showToast('未找到城市"' + text + '"，试试：北京、上海、成都...', 'error');
  }
}

/* ============ 初始化 ============ */

function init() {
  applyLocalImageMap();
  renderCityTabs();
  renderDestinations();
  initDestCarousel();
  renderTips();
  initChat();
  bindEvents();
  initMap();
  populateRouteSelects();
  bindRouteEvents();
  bindRouteDismiss();
  bindGuideEvents();
  renderGuideCategories();
  renderGuideEmpty();
  // 期刊日期
  var dEl = document.getElementById('gsMhDate');
  if (dEl) dEl.textContent = formatGuideDate();
  syncGuideCityFromWeather();
  var wSearchBtn = document.getElementById('weatherSearchBtn');
  var wSearchInput = document.getElementById('weatherSearch');
  if (wSearchBtn) wSearchBtn.addEventListener('click', searchWeatherCustom);
  if (wSearchInput) wSearchInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') searchWeatherCustom(); });
  prefetchSpotImages();
  setupReveal();
  setupHeroMouseGlow();
  setupMeteorStreak();
  console.log('✦ 云游中国 - 智能旅行助手已启动');
  console.log('✦ Agent 架构：感知(天气API) → 推理(建议引擎) → 行动(推荐输出)');
}

/* 首页背景鼠标跟随光斑：mousemove 更新 CSS 变量 --mx/--my */
function setupHeroMouseGlow() {
  var hero = document.getElementById('hero');
  if (!hero) return;
  var bg = hero.querySelector('.hero-bg');
  if (!bg) return;
  var raf = null;
  hero.addEventListener('mousemove', function(e) {
    if (raf) return;
    raf = requestAnimationFrame(function() {
      raf = null;
      var r = hero.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width) * 100;
      var y = ((e.clientY - r.top) / r.height) * 100;
      bg.style.setProperty('--mx', x + '%');
      bg.style.setProperty('--my', y + '%');
    });
  });
}

/* 首屏背景：鼠标划过时浮现一道"流星"光带，沿运动方向跟随光标掠过背景（位于内容与背景之间）
   ——用 lerp 让位置/角度有惯性跟随，避免硬切；亮头在远端、光标在中段 */
function setupMeteorStreak() {
  var hero = document.querySelector('.hero');
  if (!hero) return;
  var m = document.createElement('span');
  m.className = 'meteor';
  hero.appendChild(m);

  var targetX = 0, targetY = 0;
  var displayX = 0, displayY = 0;
  var targetAngle = -20, displayAngle = -20;
  var lastTX = null, lastTY = null;
  var raf = null, active = false, initialized = false, idleTimer = null;
  var POS_LERP = 0.22;   // 位置惯性：越小越拖尾、越大越跟手
  var ANG_LERP = 0.14;   // 角度惯性：越小越慢转、越大越快对齐

  function tick() {
    if (!initialized) {
      displayX = targetX; displayY = targetY; displayAngle = targetAngle;
      initialized = true;
    } else {
      displayX += (targetX - displayX) * POS_LERP;
      displayY += (targetY - displayY) * POS_LERP;
      // 角度走最短路径（处理 -180/180 跳变）
      var diff = targetAngle - displayAngle;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      displayAngle += diff * ANG_LERP;
    }
    m.style.left = displayX + 'px';
    m.style.top = displayY + 'px';
    m.style.transform = 'rotate(' + displayAngle + 'deg)';

    if (active || Math.abs(targetX - displayX) > 0.4 || Math.abs(targetY - displayY) > 0.4) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = null;
    }
  }

  window.addEventListener('mousemove', function(e) {
    var r = hero.getBoundingClientRect();
    targetX = e.clientX - r.left;
    targetY = e.clientY - r.top;
    if (lastTX !== null) {
      var dx = targetX - lastTX, dy = targetY - lastTY;
      if (dx || dy) targetAngle = Math.atan2(dy, dx) * 180 / Math.PI;
    }
    lastTX = targetX; lastTY = targetY;

    if (!active) {
      // 重新激活时直接对齐当前位置，避免从远处飞过来
      displayX = targetX; displayY = targetY; displayAngle = targetAngle;
      m.classList.add('is-on');
      active = true;
    }
    if (!raf) raf = requestAnimationFrame(tick);

    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(function() {
      m.classList.remove('is-on');
      active = false;
      lastTX = null; lastTY = null;
      // 淡出后让 rAF 继续把 display 收敛到 target，再停
      if (!raf) raf = requestAnimationFrame(tick);
    }, 420);
  }, { passive: true });
}

/* 滚动进入视口时淡入上移，减弱页面静态感 */
function setupReveal() {
  var targets = document.querySelectorAll('.section-header, .weather-dashboard, .route-panel, .hero-content, .hero-stats, .footer-content');
  targets.forEach(function(el) { el.classList.add('reveal'); });
  document.querySelectorAll('.tip-card, .forecast-card').forEach(function(el) { el.classList.add('reveal'); });
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(function(el) { el.classList.add('visible'); });
    return;
  }
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(function(el) { io.observe(el); });
}

/* 热门目的地轮播（coverflow 魔术卡片）：中间大、两侧小且渐透明，自动丝滑轮播 */
function initDestCarousel() {
  var track = document.getElementById('destinationsGrid');
  var viewport = track ? track.parentElement : null;
  var prevBtn = document.getElementById('destCarouselPrev');
  var nextBtn = document.getElementById('destCarouselNext');
  if (!track || !viewport || !prevBtn || !nextBtn) return;

  var cards = track.querySelectorAll('.dest-card');
  var total = cards.length;
  if (!total) return;

  var currentIndex = 0;
  var timer = null;
  var INTERVAL = 3200;

  function cardWidth() {
    return cards[0].offsetWidth || 300;
  }

  function layout() {
    var w = cardWidth();
    var step = w * 0.72;
    var half = Math.floor(total / 2);
    cards.forEach(function(card, i) {
      var offset = i - currentIndex;
      if (offset > half) offset -= total;
      else if (offset < -half) offset += total;
      var abs = Math.abs(offset);
      var x, scale, opacity, z;
      if (abs === 0) {
        x = 0; scale = 1; opacity = 1; z = 5;
      } else if (abs === 1) {
        x = offset * step; scale = 0.82; opacity = 0.55; z = 4;
      } else if (abs === 2) {
        x = offset * step; scale = 0.68; opacity = 0.3; z = 3;
      } else {
        x = offset * step; scale = 0.58; opacity = 0; z = 2;
      }
      card.style.transform = 'translate(-50%, -50%) translateX(' + x.toFixed(1) + 'px) scale(' + scale + ')';
      card.style.opacity = opacity;
      card.style.zIndex = z;
      card.style.pointerEvents = abs === 0 ? 'auto' : 'none';
    });
    prevBtn.disabled = total <= 1;
    nextBtn.disabled = total <= 1;
  }

  function next() {
    currentIndex = (currentIndex + 1) % total;
    layout();
  }
  function prev() {
    currentIndex = (currentIndex - 1 + total) % total;
    layout();
  }
  function start() { stop(); if (total > 1) timer = setInterval(next, INTERVAL); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function restart() { stop(); start(); }

  prevBtn.addEventListener('click', function() { prev(); restart(); });
  nextBtn.addEventListener('click', function() { next(); restart(); });
  viewport.addEventListener('mouseenter', stop);
  viewport.addEventListener('mouseleave', start);
  window.addEventListener('resize', layout);

  layout();
  start();
}

/* 若用户已运行 download-images.js，则优先使用本地经典图（离线稳定、加载快） */
function applyLocalImageMap() {
  if (!window.SPOT_IMAGES) return;
  destinations.forEach(function(d) {
    (d.spots || []).forEach(function(s) {
      if (window.SPOT_IMAGES[s.wiki]) {
        s.img = window.SPOT_IMAGES[s.wiki];
        if (window.SPOT_CREDITS && window.SPOT_CREDITS[s.wiki]) s.credit = window.SPOT_CREDITS[s.wiki];
      }
    });
  });
}

/* 页面加载后分批预取景点图，悬停时直接命中缓存，减少临时拉取失败 */
function prefetchSpotImages() {
  var list = [];
  destinations.forEach(function(d) {
    (d.spots || []).forEach(function(s) { if (!s.img) list.push(s); });
  });
  var limit = 5, idx = 0;
  function next() {
    if (idx >= list.length) return;
    var batch = [];
    for (var i = 0; i < limit && idx < list.length; i++, idx++) batch.push(list[idx]);
    batch.forEach(function(s) { resolveSpotImage(s).catch(function() {}); });
    setTimeout(next, 1500);
  }
  next();
}

init();

// "yyyyMMddHHmmss_SSS": {
//   ja: { "keyname":"翻訳文" },
//   en: {},
//   ko: {},
//   fr: {},
//   zh: {},
//   ru: {},
//   es: {},
//   de: {}
// },
//マージされるので追加日ごとにyyyyMMddHHmmss_SSSをTopKeyに入れます。個別の翻訳はKey名・翻訳文を任意に付けてください。ただし被らないように。
const resources = {
"20260218220000_001":{
"en":{
"modelSettingsButton":"&#128295; Models & Workflows",
"modelSettingsTitle":"&#128295; Model & Workflow Settings"
},
"zh":{
"modelSettingsButton":"&#128295; 模型与工作流",
"modelSettingsTitle":"&#128295; 模型与工作流设置"
},
},
"20260218003000_001":{
"en":{
"falaiReloadModels":"Reload",
"falaiFetchingModels":"Loading..."
},
"zh":{
"falaiReloadModels":"重新获取",
"falaiFetchingModels":"获取中..."
},
},
"20260217210000_001":{
"en":{
"usConcurrency":"Concurrency"
},
"zh":{
"usConcurrency":"并发数"
},
},
"20260217200000_001":{
"en":{
"usBtnReset":"Reset",
"usBtnShow":"Show",
"usBtnFetch":"Fetch"
},
"zh":{
"usBtnReset":"重置",
"usBtnShow":"显示",
"usBtnFetch":"获取"
},
},
"20260217213500_001":{
"en":{
"falaiModelList":"Model List ↗",
"falaiSelectedModel":"Selected Model ↗"
},
"zh":{
"falaiModelList":"模型列表 ↗",
"falaiSelectedModel":"已选模型 ↗"
},
},
"20260218001000_001":{
"en":{
"falaiContentPolicy":"Prompt was flagged by the content checker. Please modify your prompt."
},
"zh":{
"falaiContentPolicy":"提示词被内容检查器标记，请修改提示词。"
},
},
"20260217212100_001":{
"en":{
"falaiBalanceExhausted":"Fal.ai balance exhausted. Please top up at the dashboard."
},
"zh":{
"falaiBalanceExhausted":"Fal.ai余额已耗尽，请在控制面板中充值。"
},
},
"20260217190000_001":{
"en":{
"generate":"AI Generate",
"rembg":"Remove BG",
"upscale":"Upscale",
"falaiSelectModel":"Please select a model"
},
"zh":{
"generate":"AI生成",
"rembg":"删除背景",
"upscale":"高分辨率化",
"falaiSelectModel":"请选择模型"
},
},
"20260217120000_001":{
"en":{
"usWindowTitle":"&#9881; Generative AI Settings",
"usTabAI":"Services",
"usTabWorkflow":"ComfyUI Workflow",
"usServiceTitle":"Services",
"usConnectionTitle":"Connection",
"usConnService":"Service",
"usConnSettings":"URL / API Key",
"usDashboard":"Web ↗"
},
"zh":{
"usWindowTitle":"&#9881; 生成AI设置",
"usTabAI":"使用服务",
"usTabWorkflow":"ComfyUI Workflow",
"usServiceTitle":"使用服务",
"usConnectionTitle":"连接",
"usConnService":"服务",
"usConnSettings":"URL / API Key",
"usDashboard":"Web ↗"
},
},
"20260216170000_001":{
"en":{
"roleAssignTitle":"&#9881; AI Settings",
"roleAssignButton":"&#9881; AI Settings",
"roleAssignNote":"\"—\" indicates an unsupported service",
"roleAssignCancel":"Cancel",
"roleAssignApply":"Apply",
"roleText2Image":"Text → Image",
"roleImage2Image":"Image → Image",
"roleInpaint":"Inpaint",
"roleUpscaler":"Upscale",
"roleRemoveBG":"Remove BG",
"roleAngle":"Image → Image<br>Angle",
"roleInterrogateCLIP":"CLIP",
"roleInterrogateDEEPDOORU":"DEEPDOORU"
},
"zh":{
"roleAssignTitle":"&#9881; AI设置",
"roleAssignButton":"&#9881; AI设置",
"roleAssignNote":"「—」表示不支持的服务",
"roleAssignCancel":"取消",
"roleAssignApply":"应用",
"roleText2Image":"Text → Image",
"roleImage2Image":"Image → Image",
"roleInpaint":"Inpaint",
"roleUpscaler":"高分辨率化",
"roleRemoveBG":"删除背景",
"roleAngle":"Image → Image<br>Angle",
"roleInterrogateCLIP":"CLIP",
"roleInterrogateDEEPDOORU":"DEEPDOORU"
},
},
"20260216160000_001":{
"en":{
"copyAndPast":"Duplicate",
"menuClipping":"Clipping..."
},
"zh":{
"copyAndPast":"复制",
"menuClipping":"裁剪..."
},
},
"20260216150000_001":{
"en":{
"aiCancelTask":"Cancel AI generation"
},
"zh":{
"aiCancelTask":"取消AI生成"
},
},
"20260216120000_001":{
"en":{
"tipTemplate":"Templates",
"tipPageManager":"Page Manager",
"tipAutoGenerate":"Auto Generate",
"tipPrompt":"Prompt",
"tipTemplateBubble":"Template Bubbles",
"tipFreeBubble":"Free Bubbles",
"tipText":"Text",
"tipImageText":"Image Text",
"tipPen":"Pen",
"tipTone":"Tone",
"tipEffect":"Effect",
"tipControl":"Control",
"tipShape":"Shape"
},
"zh":{
"tipTemplate":"模板",
"tipPageManager":"页面管理",
"tipAutoGenerate":"自动生成",
"tipPrompt":"提示词",
"tipTemplateBubble":"模板气泡",
"tipFreeBubble":"自由气泡",
"tipText":"文字",
"tipImageText":"图片文字",
"tipPen":"画笔",
"tipTone":"网点",
"tipEffect":"效果",
"tipControl":"操作",
"tipShape":"图形"
},
},
"20260216001500_001":{
"en":{
"iphMajorHuman":"Human",
"iphMajorOutfit":"Outfit",
"iphMajorCamera":"Camera",
"iphMajorScene":"Scene",
"iphMajorStyle":"Style",
"iphSearch":"Search...",
"iphClearAll":"Clear All",
"iphCatHair":"Hair",
"iphCatFace":"Face",
"iphCatExpression":"Expression",
"iphCatBodyType":"Body Type",
"iphCatAge":"Age",
"iphCatSkin":"Skin",
"iphCatMakeup":"Makeup",
"iphCatClothing":"Clothing",
"iphCatFootwear":"Footwear",
"iphCatCamera":"Camera",
"iphCatPose":"Pose",
"iphCatNumberOfPeople":"Number of People",
"iphCatBackground":"Background",
"iphCatLightSource":"Light Source",
"iphCatQuality":"Quality",
"iphCatColor":"Color",
"iphCatArtStyle":"Art Style",
"iphCatSetStyle":"Set Style",
"iphCatCustomSet":"Custom Set",
"iphSubHairStyle":"Hair Style",
"iphSubHairLength":"Hair Length",
"iphSubHairTexture":"Hair Texture",
"iphSubHairColor":"Hair Color",
"iphSubEyes":"Eyes",
"iphSubMouth":"Mouth",
"iphSubNose":"Nose",
"iphSubJoy":"Joy",
"iphSubAnger":"Anger",
"iphSubSad":"Sad",
"iphSubAnxious":"Anxious",
"iphSubBreast":"Breast",
"iphSubSkinTone":"Skin Tone",
"iphSubSkinTexture":"Skin Texture",
"iphSubOverallMakeup":"Overall Makeup",
"iphSubEyebrows":"Eyebrows",
"iphSubEyeshadow":"Eyeshadow",
"iphSubCheeks":"Cheeks",
"iphSubLips":"Lips",
"iphSubTops":"Tops",
"iphSubOuterwear":"Outerwear",
"iphSubBottoms":"Bottoms",
"iphSubSkirt":"Skirt",
"iphSubDress":"Dress",
"iphSubShoes":"Shoes",
"iphSubSocks":"Socks",
"iphSubGaze":"Gaze",
"iphSubCameraAngle":"Camera Angle",
"iphSubShot":"Shot",
"iphSubFocus":"Focus",
"iphSubGesture":"Gesture",
"iphSubMovement":"Movement",
"iphSubWeatherSky":"Weather/Sky",
"iphSubNature":"Nature",
"iphSubIndoor":"Indoor",
"iphSubCommercial":"Commercial",
"iphSubPublicFacility":"Public Facility",
"iphSubPosition":"Position",
"iphSubEffect":"Effect",
"iphSubIntensity":"Intensity",
"iphSubStyle":"Style"
},
"zh":{
"iphMajorHuman":"人物",
"iphMajorOutfit":"服装",
"iphMajorCamera":"拍摄",
"iphMajorScene":"场景",
"iphMajorStyle":"风格",
"iphSearch":"搜索...",
"iphClearAll":"全部清除",
"iphCatHair":"发型",
"iphCatFace":"脸部",
"iphCatExpression":"表情",
"iphCatBodyType":"体型",
"iphCatAge":"年龄",
"iphCatSkin":"肤色",
"iphCatMakeup":"化妆",
"iphCatClothing":"服装",
"iphCatFootwear":"鞋子",
"iphCatCamera":"相机",
"iphCatPose":"姿势",
"iphCatNumberOfPeople":"人数",
"iphCatBackground":"背景",
"iphCatLightSource":"光源",
"iphCatQuality":"质量",
"iphCatColor":"颜色",
"iphCatArtStyle":"画风",
"iphCatSetStyle":"套装风格",
"iphCatCustomSet":"自定义集",
"iphSubHairStyle":"发型",
"iphSubHairLength":"发长",
"iphSubHairTexture":"发质",
"iphSubHairColor":"发色",
"iphSubEyes":"眼睛",
"iphSubMouth":"嘴巴",
"iphSubNose":"鼻子",
"iphSubJoy":"喜悦",
"iphSubAnger":"愤怒",
"iphSubSad":"悲伤",
"iphSubAnxious":"焦虑",
"iphSubBreast":"胸部",
"iphSubSkinTone":"肤色",
"iphSubSkinTexture":"肤质",
"iphSubOverallMakeup":"整体妆容",
"iphSubEyebrows":"眉毛",
"iphSubEyeshadow":"眼影",
"iphSubCheeks":"腮红",
"iphSubLips":"唇妆",
"iphSubTops":"上衣",
"iphSubOuterwear":"外套",
"iphSubBottoms":"下装",
"iphSubSkirt":"裙子",
"iphSubDress":"连衣裙",
"iphSubShoes":"鞋子",
"iphSubSocks":"袜子",
"iphSubGaze":"视线",
"iphSubCameraAngle":"相机角度",
"iphSubShot":"镜头",
"iphSubFocus":"焦点",
"iphSubGesture":"手势",
"iphSubMovement":"动作",
"iphSubWeatherSky":"天气/天空",
"iphSubNature":"自然",
"iphSubIndoor":"室内",
"iphSubCommercial":"商业",
"iphSubPublicFacility":"公共设施",
"iphSubPosition":"位置",
"iphSubEffect":"效果",
"iphSubIntensity":"强度",
"iphSubStyle":"风格"
},
},
"20260215190000_001":{
"en":{
"actAiGenerate":"AI Gen",
"actUpscale":"Enhance",
"actRemoveBg":"Rm BG",
"actPromptApply":"Prompt",
"actSeedApply":"Seed",
"actDownload":"DL",
"actDeepDanbooru":"DanBooru",
"actClip":"CLIP",
"actAngleGen":"Angle Gen"
},
"zh":{
"actAiGenerate":"AI生成",
"actUpscale":"高画质",
"actRemoveBg":"去背景",
"actPromptApply":"提示词",
"actSeedApply":"种子",
"actDownload":"DL",
"actDeepDanbooru":"DanBooru",
"actClip":"CLIP",
"actAngleGen":"角度生成"
},
},
"20260215132500_001": {
"en":{
"pagePortrait":"Vertical Page",
"pageLandscape":"Horizontal Page"
},
"zh":{
"pagePortrait":"纵向页面",
"pageLandscape":"横向页面"
},
},
"20260215130000_001": {
"en":{
"blendColorLabel":"Color",
"blendStartColor":"Start Color",
"blendEndColor":"End Color"
},
"zh":{
"blendColorLabel":"颜色",
"blendStartColor":"起始颜色",
"blendEndColor":"结束颜色"
},
},
"20260215124500_001": {
"en":{
"blendImageListTitle":"Image List"
},
"zh":{
"blendImageListTitle":"图片列表"
},
},
"20260214211300_001": {
"en":{
"boldOn":"Bold ON",
"boldOff":"Bold OFF"
},
"zh":{
"boldOn":"加粗 ON",
"boldOff":"加粗 OFF"
},
},
"20260214210000_001": {
"en":{
"secFontAdd":"Add Font"
},
"zh":{
"secFontAdd":"添加字体"
},
},
"20260214202000_001": {
"en":{
"com-textColor":"Text",
"com-outlineColor":"Outline",
"com-bgColor":"Background"
},
"zh":{
"com-textColor":"文字",
"com-outlineColor":"轮廓",
"com-bgColor":"背景色"
},
},
"20260214193000_001": {
"en":{
"blendResult":"Blend Result",
"reblend":"Re-blend",
"blendLowImages":"At least 2 layers required",
"addFillLayer":"Add Fill Layer",
"addGradientLayer":"Add Gradient Layer",
"fillLayer":"Fill Layer",
"gradientLayer":"Gradient Layer",
"addLayer":"Add",
"dragToSetDirection":"Drag to set direction",
"blendApply":"Apply",
"blendSelectMode":"Select a mode",
"blendLowerLayer":"Lower Layer",
"blendLayer":"Layer",
"blendCatDarken":"Darken",
"blendCatLighten":"Lighten",
"blendCatContrast":"Contrast",
"blendCatDifference":"Difference",
"blendCatColor":"Color",
"blendNormal":"Normal",
"blendDarken":"Darken",
"blendColorBurn":"Color Burn",
"blendLinearBurn":"Linear Burn",
"blendLighten":"Lighten",
"blendScreen":"Screen",
"blendColorDodge":"Color Dodge",
"blendLinearDodge":"Linear Dodge",
"blendAdd":"Add",
"blendAddNpm":"Add (npm)",
"blendOverlay":"Overlay",
"blendHardLight":"Hard Light",
"blendSoftLight":"Soft Light",
"blendPinLight":"Pin Light",
"blendVividLight":"Vivid Light",
"blendLinearLight":"Linear Light",
"blendHardMix":"Hard Mix",
"blendDifference":"Difference",
"blendExclusion":"Exclusion",
"blendNegation":"Negation",
"blendSubtract":"Subtract",
"blendDivide":"Divide",
"blendSaturation":"Saturation",
"blendColor":"Color",
"blendLuminosity":"Luminosity"
},
"zh":{
"blendResult":"混合结果",
"reblend":"重新混合",
"blendLowImages":"至少需要2个图层",
"addFillLayer":"添加填充图层",
"addGradientLayer":"添加渐变图层",
"fillLayer":"填充图层",
"gradientLayer":"渐变图层",
"addLayer":"添加",
"dragToSetDirection":"拖动设置方向",
"blendApply":"应用",
"blendSelectMode":"请选择模式",
"blendLowerLayer":"下层",
"blendLayer":"图层",
"blendCatDarken":"变暗",
"blendCatLighten":"变亮",
"blendCatContrast":"对比度",
"blendCatDifference":"差值",
"blendCatColor":"颜色",
"blendNormal":"正常",
"blendDarken":"变暗",
"blendColorBurn":"颜色加深",
"blendLinearBurn":"线性加深",
"blendLighten":"变亮",
"blendScreen":"滤色",
"blendColorDodge":"颜色减淡",
"blendLinearDodge":"线性减淡",
"blendAdd":"相加",
"blendAddNpm":"相加(npm)",
"blendOverlay":"叠加",
"blendHardLight":"强光",
"blendSoftLight":"柔光",
"blendPinLight":"点光",
"blendVividLight":"亮光",
"blendLinearLight":"线性光",
"blendHardMix":"实色混合",
"blendDifference":"差值",
"blendExclusion":"排除",
"blendNegation":"反相乘",
"blendSubtract":"减去",
"blendDivide":"划分",
"blendSaturation":"饱和度",
"blendColor":"颜色",
"blendLuminosity":"明度"
},
},
"20260214160600_001": {
"en":{
"fileProject":"Project",
"fileImage":"Image",
"canvasDisplay":"Display",
"canvasGrid":"Grid",
"canvasLayout":"Layout",
"helpGuide":"Guide",
"helpManual":"Manual",
"languageSelect":"Language",
"linksTools":"Related Tools",
"linksCommunity":"Community"
},
"zh":{
"fileProject":"项目",
"fileImage":"图像",
"canvasDisplay":"显示",
"canvasGrid":"网格",
"canvasLayout":"布局",
"helpGuide":"指南",
"helpManual":"手册",
"languageSelect":"语言",
"linksTools":"相关工具",
"linksCommunity":"社区"
},
},
"20260214155000_001": {
"en":{
"20260214155000_001":"Auto Save",
"20260214155000_002":"Generative AI Settings"
},
"zh":{
"20260214155000_001":"自动保存",
"20260214155000_002":"生成AI设置"
},
},
"20260212_191212_001": {
"en":{
"heartShape":"Heart",
"customPanel":"Custom Page",
"sectionPageAdd":"Add Page",
"sectionPanelSplit":"Split Panel",
"sectionPanelSettings":"Panel Settings",
"sectionShapeAdd":"Add Shape",
"secRandomCut":"Random Cut",
"secMultiPage":"Multi Page",
"secAutoPrompt":"Auto Prompt",
"secBatchGenerate":"Batch Generate",
"secDrawMode":"Drawing Mode",
"secBubbleStyle":"Style",
"secLinePreset":"Line Preset",
"secFontSettings":"Font Settings",
"secTextAdd":"Add Text",
"secTextEffect":"Effects",
"secInfoDisplay":"Info Display",
"secTransform":"Transform",
"secFlip":"Flip",
"secIconSearch":"Icon Search",
"secIconStyle":"Style",
"secIconShadow":"Shadow",
"secIconPreset":"Search Results"
},
"zh":{
"heartShape":"心形",
"customPanel":"自定义页面",
"sectionPageAdd":"添加页面",
"sectionPanelSplit":"分割格子",
"sectionPanelSettings":"格子设置",
"sectionShapeAdd":"添加图形",
"secRandomCut":"随机分割",
"secMultiPage":"多页生成",
"secAutoPrompt":"自动提示词",
"secBatchGenerate":"批量生成",
"secDrawMode":"绘制模式",
"secBubbleStyle":"样式",
"secLinePreset":"线型预设",
"secFontSettings":"字体设置",
"secTextAdd":"添加文本",
"secTextEffect":"效果",
"secInfoDisplay":"信息显示",
"secTransform":"变形",
"secFlip":"翻转",
"secIconSearch":"图标搜索",
"secIconStyle":"样式",
"secIconShadow":"阴影",
"secIconPreset":"搜索结果"
},
},
"20260211c": {
"en":{
"dashboardStreak":"Streak",
"dashboardCurrentStreak":"Current",
"dashboardLongestStreak":"Longest",
"dashboardToday":"Today",
"dashboardSessionStats":"Session",
"dashboardCurrentSession":"This Session",
"dashboardGenPerSession":"Gens",
"dashboardAvgSession":"Avg Session",
"dashboardTotalSessions":"Sessions",
"dashboardCalendar":"Activity Calendar",
"dashboardSuccessRate":"Success Rate",
"dashboardSuccess":"Success",
"dashboardFailure":"Failure",
"dashboardPromptLength":"Prompt Length",
"dashboardLengthChars":"Characters",
"dashboardCoOccurrence":"Tag Co-occurrence",
"dashboardTagPair":"Tag Pair",
"dashboardPairCount":"Count",
"dashboardModelUsage":"Model Usage",
"dashboardGoals":"Goals",
"dashboardDailyGoal":"Daily Goal",
"dashboardGoalSave":"Save",
"dashboardWeeklyGoal":"Weekly Goal",
"dashboardLess":"Less",
"dashboardMore":"More",
"dashboardBadges":"Badges",
"dashboardExport":"Export",
"dashboardExportJSON":"JSON",
"dashboardExportCSV":"CSV",
"dashboardBadge10Gen":"10+ Generations",
"dashboardBadge50Gen":"50+ Generations",
"dashboardBadge100Gen":"100+ Generations",
"dashboardBadge500Gen":"500+ Generations",
"dashboardBadge1000Gen":"1000+ Generations",
"dashboardBadge7Streak":"7-Day Streak",
"dashboardBadge30Streak":"30-Day Streak",
"dashboardBadge100Streak":"100-Day Streak",
"dashboardBadge10Tags":"10+ Tags",
"dashboardBadge50Tags":"50+ Tags",
"dashboardBadge100Tags":"100+ Tags",
"dashboardBadge10Launch":"10+ Launches",
"dashboardBadge50Launch":"50+ Launches",
"dashboardBadgeT2I":"T2I Used",
"dashboardBadgeI2I":"I2I Used",
"dashboardBadgeAngle":"Angle Used",
"dashboardBadgeInpaint":"Inpaint Used",
"dashboardBadgeUpscaler":"Upscaler Used",
"dashboardBadgeRembg":"Rembg Used",
"dashboardBadge1hTime":"1h+ Total Time"
},
"zh":{
"dashboardStreak":"连续记录",
"dashboardCurrentStreak":"当前",
"dashboardLongestStreak":"最长",
"dashboardToday":"今日",
"dashboardSessionStats":"会话",
"dashboardCurrentSession":"本次",
"dashboardGenPerSession":"生成数",
"dashboardAvgSession":"平均",
"dashboardTotalSessions":"会话数",
"dashboardCalendar":"活动日历",
"dashboardSuccessRate":"成功率",
"dashboardSuccess":"成功",
"dashboardFailure":"失败",
"dashboardPromptLength":"提示词长度",
"dashboardLengthChars":"字符",
"dashboardCoOccurrence":"标签共现",
"dashboardTagPair":"标签对",
"dashboardPairCount":"次数",
"dashboardModelUsage":"模型使用",
"dashboardGoals":"目标",
"dashboardDailyGoal":"每日目标",
"dashboardGoalSave":"保存",
"dashboardWeeklyGoal":"每周目标",
"dashboardLess":"少",
"dashboardMore":"多",
"dashboardBadges":"徽章",
"dashboardExport":"导出",
"dashboardExportJSON":"JSON",
"dashboardExportCSV":"CSV",
"dashboardBadge10Gen":"10次生成",
"dashboardBadge50Gen":"50次生成",
"dashboardBadge100Gen":"100次生成",
"dashboardBadge500Gen":"500次生成",
"dashboardBadge1000Gen":"1000次生成",
"dashboardBadge7Streak":"连续7天",
"dashboardBadge30Streak":"连续30天",
"dashboardBadge100Streak":"连续100天",
"dashboardBadge10Tags":"10+标签",
"dashboardBadge50Tags":"50+标签",
"dashboardBadge100Tags":"100+标签",
"dashboardBadge10Launch":"10次启动",
"dashboardBadge50Launch":"50次启动",
"dashboardBadgeT2I":"T2I使用",
"dashboardBadgeI2I":"I2I使用",
"dashboardBadgeAngle":"角度使用",
"dashboardBadgeInpaint":"修复使用",
"dashboardBadgeUpscaler":"放大使用",
"dashboardBadgeRembg":"去背景使用",
"dashboardBadge1hTime":"累计1小时"
},
},
"20260211194810_128": {
"en":{
"cropImage":"Crop",
"cropHelpText":"Press Enter to confirm crop"
},
"zh":{
"cropImage":"裁剪",
"cropHelpText":"按 Enter 确认裁剪"
},
},
"20260211b": {
"en":{
"menuGroupOperation":"Operation",
"menuGroupAI":"AI",
"menuGroupTransform":"Transform",
"menuGroupPanel":"Panel",
"menuGroupViewLimit":"Clipping",
"menuGroupStyle":"Style"
},
"zh":{
"menuGroupOperation":"操作",
"menuGroupAI":"AI",
"menuGroupTransform":"变形",
"menuGroupPanel":"面板",
"menuGroupViewLimit":"裁剪",
"menuGroupStyle":"样式"
},
},
"20260211": {
"en":{
"dashboard":"Dashboard",
"dashboardTitle":"Performance Dashboard",
"dashboardClearAll":"Clear All",
"dashboardConfirmClear":"Delete all statistics data?",
"dashboardTotal":"Total",
"dashboardAvg":"AVG",
"dashboardMin":"MIN",
"dashboardMax":"MAX",
"dashboardTags":"Tags",
"dashboardLaunch":"Launch",
"dashboardSince":"Since",
"dashboardModeStats":"Mode Statistics",
"dashboardMode":"Mode",
"dashboardCount":"Count",
"dashboardAvgMs":"AVG (ms)",
"dashboardMinMs":"MIN (ms)",
"dashboardMaxMs":"MAX (ms)",
"dashboardTimeGraph":"Generation Time Graph",
"dashboardGenTime":"Generation Time (ms)",
"dashboardRecentGen":"Recent Generations",
"dashboardHourlyHeatmap":"Hourly Activity Heatmap",
"dashboardTrendGraph":"Generation Trend",
"dashboardDaily":"Daily",
"dashboardWeekly":"Weekly",
"dashboardMonthly":"Monthly",
"dashboardGenerations":"generations",
"dashboardDay0":"Sun",
"dashboardDay1":"Mon",
"dashboardDay2":"Tue",
"dashboardDay3":"Wed",
"dashboardDay4":"Thu",
"dashboardDay5":"Fri",
"dashboardDay6":"Sat",
"dashboardTopTags":"Most Used Tags",
"dashboardNoTags":"No tags recorded",
"dashboardWordcloud":"Word Cloud",
"dashboardDownload":"Download",
"dashboardClearTags":"Clear Tags",
"dashboardConfirmClearTags":"Delete tag history?",
"dashboardNoData":"No data available"
},
"zh":{
"dashboard":"仪表板",
"dashboardTitle":"性能仪表板",
"dashboardClearAll":"全部清除",
"dashboardConfirmClear":"确定要删除所有统计数据吗？",
"dashboardTotal":"生成",
"dashboardAvg":"平均",
"dashboardMin":"最小",
"dashboardMax":"最大",
"dashboardTags":"标签",
"dashboardLaunch":"启动",
"dashboardSince":"首次",
"dashboardModeStats":"模式统计",
"dashboardMode":"模式",
"dashboardCount":"次数",
"dashboardAvgMs":"平均 (ms)",
"dashboardMinMs":"最小 (ms)",
"dashboardMaxMs":"最大 (ms)",
"dashboardTimeGraph":"生成时间图表",
"dashboardGenTime":"生成时间 (ms)",
"dashboardRecentGen":"最近生成",
"dashboardHourlyHeatmap":"时段活动热力图",
"dashboardTrendGraph":"生成趋势",
"dashboardDaily":"按日",
"dashboardWeekly":"按周",
"dashboardMonthly":"按月",
"dashboardGenerations":"次",
"dashboardDay0":"周日",
"dashboardDay1":"周一",
"dashboardDay2":"周二",
"dashboardDay3":"周三",
"dashboardDay4":"周四",
"dashboardDay5":"周五",
"dashboardDay6":"周六",
"dashboardTopTags":"常用标签",
"dashboardNoTags":"暂无标签",
"dashboardWordcloud":"词云",
"dashboardDownload":"下载",
"dashboardClearTags":"清除标签",
"dashboardConfirmClearTags":"确定要删除标签历史吗？",
"dashboardNoData":"暂无数据"
},
},
"20260210": {
"en":{
"angleGenerate":"Angle Generate",
"anglePrompt":"Angle Prompt",
"angleGenerate_btn":"Generate",
"angleReset":"Reset",
"angleOriginal":"Original",
"angleNoPrompt":"Please enter an angle prompt"
},
"zh":{
"angleGenerate":"角度生成",
"anglePrompt":"角度提示词",
"angleGenerate_btn":"生成",
"angleReset":"重置",
"angleOriginal":"原图",
"angleNoPrompt":"请输入角度提示词"
},
},
"20260209": {
"en":{
"inpaint":"Inpaint",
"inpaintBrush":"Brush",
"inpaintEraser":"Eraser",
"inpaintFillAll":"Fill All",
"inpaintClear":"Clear",
"inpaintBrushSize":"Size",
"inpaintPrompt":"Prompt",
"inpaintNegative":"Negative",
"inpaintDenoise":"Denoise",
"inpaintGenerate":"Generate",
"inpaintNoMask":"Please draw a mask area first",
"settingsMenu":"Settings",
"settingsAutoSave":"Settings Auto Save",
"aiCheck":"AI Connection Check",
"connectionStatus":"Connection Status",
"autoSave":"Project Auto Save",
"autoSaveSeconds":"sec",
"autoSaveComplete":"Auto-saved",
"autoSaveRecoveryTitle":"Recover Auto-save",
"autoSaveRecoveryMessage":"Auto-save data found. Recover?",
"autoSaveRecover":"Recover",
"autoSaveDiscard":"Discard"
},
"zh":{
"inpaint":"图像修复",
"inpaintBrush":"画笔",
"inpaintEraser":"橡皮擦",
"inpaintFillAll":"全部填充",
"inpaintClear":"清除",
"inpaintBrushSize":"大小",
"inpaintPrompt":"提示词",
"inpaintNegative":"反向提示词",
"inpaintDenoise":"去噪强度",
"inpaintGenerate":"生成",
"inpaintNoMask":"请先绘制蒙版区域",
"settingsMenu":"设置",
"settingsAutoSave":"设置自动保存",
"aiCheck":"AI连接检查",
"connectionStatus":"连接状态",
"autoSave":"项目自动保存",
"autoSaveSeconds":"秒",
"autoSaveComplete":"已自动保存",
"autoSaveRecoveryTitle":"恢复自动保存",
"autoSaveRecoveryMessage":"发现自动保存数据。是否恢复？",
"autoSaveRecover":"恢复",
"autoSaveDiscard":"删除"
},
},
"20260212": {
"en":{
"sc_prevPage":"Previous page",
"sc_nextPage":"Next page"
},
"zh":{
"sc_prevPage":"上一页",
"sc_nextPage":"下一页"
},
},
"20260130": {
"en":{"sc_newPage":"New Page"},
"zh":{"sc_newPage":"新建页面"},
},
"20260118": {
"en":{"imageImport":"Image Import",
"shortcutTitle":"Keyboard Shortcuts",
"shortcutKeys":"Shortcut",
"shortcutFunction":"Function",
"sc_cat_file":"File",
"sc_cat_edit":"Edit",
"sc_cat_view":"View",
"sc_cat_object":"Object",
"sc_cat_other":"Other",
"sc_toggleGrid":"Toggle grid",
"sc_undo":"Undo",
"sc_redo":"Redo",
"sc_copy":"Copy",
"sc_paste":"Paste",
"sc_projectSave":"Save project",
"sc_projectLoad":"Load project",
"sc_imageDownload":"Download image",
"sc_settingsSave":"Save settings",
"sc_promptView":"View prompt",
"sc_toggleLayerPanel":"Toggle layer panel",
"sc_toggleControls":"Toggle controls",
"sc_toggleBottomBar":"Toggle bottom bar",
"sc_zoomIn":"Zoom in",
"sc_zoomOut":"Zoom out",
"sc_zoomReset":"Reset zoom",
"sc_deleteLayer":"Delete",
"sc_arrowKeys":"Arrow Keys",
"sc_arrow":"Arrow",
"sc_shiftArrow":"Shift + Arrow",
"sc_moveObject":"Move",
"sc_moveObjectFast":"Move (10px)",
"sc_layerUp":"Move forward",
"sc_layerDown":"Move backward",
"sc_deselect":"Deselect",
"sc_shortcutPage":"Shortcuts"},
"zh":{"imageImport":"导入图片",
"shortcutTitle":"快捷键列表",
"shortcutKeys":"快捷键",
"shortcutFunction":"功能",
"sc_cat_file":"文件",
"sc_cat_edit":"编辑",
"sc_cat_view":"视图",
"sc_cat_object":"对象",
"sc_cat_other":"其他",
"sc_toggleGrid":"切换网格",
"sc_undo":"撤销",
"sc_redo":"重做",
"sc_copy":"复制",
"sc_paste":"粘贴",
"sc_projectSave":"保存项目",
"sc_projectLoad":"加载项目",
"sc_imageDownload":"下载图片",
"sc_settingsSave":"保存设置",
"sc_promptView":"查看提示",
"sc_toggleLayerPanel":"图层面板",
"sc_toggleControls":"控件",
"sc_toggleBottomBar":"底部栏",
"sc_zoomIn":"放大",
"sc_zoomOut":"缩小",
"sc_zoomReset":"重置缩放",
"sc_deleteLayer":"删除",
"sc_arrowKeys":"方向键",
"sc_arrow":"方向",
"sc_shiftArrow":"Shift + 方向键",
"sc_moveObject":"移动",
"sc_moveObjectFast":"移动(10px)",
"sc_layerUp":"前移",
"sc_layerDown":"后移",
"sc_deselect":"取消选择",
"sc_shortcutPage":"快捷键"},
},
"20260115": {
"en":{"settingsReset":"Reset All Settings",
"settingsResetConfirmTitle":"The following data will be deleted:",
"settingsResetItem1":"API connection settings (URLs, API keys)",
"settingsResetItem2":"AI image generation settings (prompts, models, etc.)",
"settingsResetItem3":"Drawing tool & canvas settings",
"settingsResetItem4":"Custom prompt sets",
"settingsResetItem5":"UI settings (language, theme, sidebar, etc.)",
"settingsResetItem6":"Tutorial progress",
"settingsResetCancel":"Cancel",
"settingsResetOk":"Reset",
"tutorialWelcomeTitle":"Create Your First Manga",
"tutorialWelcomeBody":"Learn basics in 5 steps",
"tutorialStart":"Start",
"tutorialSkip":"Skip",
"tutorialStep1Title":"Place Panels",
"tutorialStep1Body":"Drag & drop panels onto the canvas",
"tutorialStep2Title":"Add Images",
"tutorialStep2Body":"Drop images into panels for auto-fit",
"tutorialStep3Title":"Add Speech Bubbles",
"tutorialStep3Body":"Drag speech bubbles onto panels",
"tutorialStep4Title":"Add Text",
"tutorialStep4Body":"Use text tools to add dialogue",
"tutorialStep5Title":"Done!",
"tutorialStep5Body":"Edit and adjust freely on canvas",
"tutorialNext":"Next",
"tutorialFinish":"Finish",
"tutorialExit":"Exit",
"tutorialCompleteTitle":"Tutorial Complete",
"tutorialCompleteBody":"Restart anytime from menu",
"tutorialDontShowAgain":"Don't show again",
"tutorialGotIt":"OK",
"comfyGuideOnlineTitle":"Connected!",
"comfyGuideOnlineStep1":"Select Workflow from left tabs",
"comfyGuideOnlineStep2":"Click Test Generate to verify",
"comfyGuideOnlineStep3":"Download workflow to check in ComfyUI if errors",
"comfyGuideOfflineTitle":"Cannot connect to ComfyUI",
"comfyGuideOfflineStep1":"Start ComfyUI",
"comfyGuideOfflineStep2":"Check URL is correct",
"comfyGuideOfflineStep3":"Default: http://127.0.0.1:8188",
"comfyGuideNodeErrorTitle":"Nodes not found",
"comfyGuideNodeErrorMissing":"Missing nodes",
"comfyGuideNodeErrorStep1":"Open ComfyUI Manager",
"comfyGuideNodeErrorStep2":"Run Install Missing Custom Nodes",
"comfyGuideNodeErrorTip":"Download workflow → Drop in ComfyUI to see node details",
"comfyGuideGenErrorTitle":"Generation Error",
"comfyGuideGenErrorStep1":"Check ComfyUI console for errors",
"comfyGuideGenErrorStep2":"Verify model matches workflow",
"comfyGuideGenErrorExample":"Example: Using Flux model with SDXL workflow causes errors",
"comfyGuideGenErrorStep3":"Review workflow settings"},
"zh":{"settingsReset":"重置所有设置",
"settingsResetConfirmTitle":"以下数据将被全部删除：",
"settingsResetItem1":"API连接设置（URL、API密钥）",
"settingsResetItem2":"AI图像生成设置（提示词、模型等）",
"settingsResetItem3":"绘图工具和画布设置",
"settingsResetItem4":"自定义提示词集",
"settingsResetItem5":"界面设置（语言、主题、侧边栏等）",
"settingsResetItem6":"教程进度",
"settingsResetCancel":"取消",
"settingsResetOk":"重置",
"tutorialWelcomeTitle":"创建您的第一部漫画",
"tutorialWelcomeBody":"5步学会基本操作",
"tutorialStart":"开始",
"tutorialSkip":"跳过",
"tutorialStep1Title":"放置分格",
"tutorialStep1Body":"将分格拖放到画布上",
"tutorialStep2Title":"添加图片",
"tutorialStep2Body":"将图片拖入分格自动适配",
"tutorialStep3Title":"添加对话框",
"tutorialStep3Body":"将对话框拖到分格上",
"tutorialStep4Title":"添加文字",
"tutorialStep4Body":"使用文字工具添加对话",
"tutorialStep5Title":"完成！",
"tutorialStep5Body":"在画布上自由编辑调整",
"tutorialNext":"下一步",
"tutorialFinish":"完成",
"tutorialExit":"退出",
"tutorialCompleteTitle":"教程完成",
"tutorialCompleteBody":"随时从菜单重新开始",
"tutorialDontShowAgain":"不再显示",
"tutorialGotIt":"确定",
"comfyGuideOnlineTitle":"已连接！",
"comfyGuideOnlineStep1":"从左侧选项卡选择Workflow",
"comfyGuideOnlineStep2":"点击测试生成验证",
"comfyGuideOnlineStep3":"出错时下载到ComfyUI检查",
"comfyGuideOfflineTitle":"无法连接ComfyUI",
"comfyGuideOfflineStep1":"启动ComfyUI",
"comfyGuideOfflineStep2":"检查URL是否正确",
"comfyGuideOfflineStep3":"默认: http://127.0.0.1:8188",
"comfyGuideNodeErrorTitle":"找不到节点",
"comfyGuideNodeErrorMissing":"缺失节点",
"comfyGuideNodeErrorStep1":"打开ComfyUI Manager",
"comfyGuideNodeErrorStep2":"运行Install Missing Custom Nodes",
"comfyGuideNodeErrorTip":"下载Workflow→拖入ComfyUI查看节点详情",
"comfyGuideGenErrorTitle":"生成错误",
"comfyGuideGenErrorStep1":"检查ComfyUI控制台错误",
"comfyGuideGenErrorStep2":"确认模型与工作流匹配",
"comfyGuideGenErrorExample":"例如：SDXL工作流使用Flux模型会报错",
"comfyGuideGenErrorStep3":"检查工作流设置"},
},
"20260111": {
"en": {"unsupportedProjectFileFormat": "Unsupported file format",
"unsupportedProjectFileFormatMessage": "Please select a .zip or .lz4 file",
"OutlinePen": "Double Outline",
"outline1-color": "Outline1 Color",
"outline2-color": "Outline2 Color",
"outline1-size": "Outline1 Width",
"outline2-size": "Outline2 Width",
"outline1-opacity": "Outline1 Opacity",
"outline2-opacity": "Outline2 Opacity"},
"zh": {"unsupportedProjectFileFormat": "不支持的文件格式",
"unsupportedProjectFileFormatMessage": "请选择.zip或.lz4文件",
"OutlinePen": "双重描边",
"outline1-color": "描边1颜色",
"outline2-color": "描边2颜色",
"outline1-size": "描边1宽度",
"outline2-size": "描边2宽度",
"outline1-opacity": "描边1透明度",
"outline2-opacity": "描边2透明度"},
},
"20260114": {
"en": {"editModeNoObject": "Please select an object",
"editModeNotPanel": "Please select a panel",
"editModeNotPolygon": "Only polygon panels can be edited",
"editModeNoPoints": "No editable points",
"editModeOn": "Panel Edit Mode ON",
"editModeOff": "Panel Edit Mode OFF"},
"zh": {"editModeNoObject": "请选择对象",
"editModeNotPanel": "请选择面板",
"editModeNotPolygon": "只能编辑多边形面板",
"editModeNoPoints": "没有可编辑的点",
"editModeOn": "面板编辑模式 ON",
"editModeOff": "面板编辑模式 OFF"},
},
"20260113": {
"en": {"cropEnterToast": "Crop: Press Enter to complete",
"comfyuiWorkflowSettings": "ComfyUI Workflows Settings",
"sbSelectmode": "Select Mode (ESC)"},
"zh": {"cropEnterToast": "裁剪: 按Enter完成",
"comfyuiWorkflowSettings": "ComfyUI Workflows设置",
"sbSelectmode": "选择模式 (ESC)"},
},
"20260112": {
"en": {"op_cancel": "Cancel",
"op_cancelling": "Cancelling...",
"op_cancelled": "Cancelled",
"op_waitingTask": "Waiting for current task..."},
"zh": {"op_cancel": "取消",
"op_cancelling": "取消中...",
"op_cancelled": "已取消",
"op_waitingTask": "等待当前任务..."},
},
"20260211_ttt": {
en:{
viewMenu:"View",
viewPanel:"Panel"
},
zh:{
viewMenu:"视图",
viewPanel:"面板"
},
},
"20250413": {
"en": {"upscaleButton": "Upscale image",
"cropButton": "Crop",
"importButton": "Import",
"exitModeButton": "Exit Mode (ESC)"},
"zh": {"upscaleButton": "提升图像分辨率",
"cropButton": "裁剪",
"importButton": "导入",
"exitModeButton": "退出模式 (ESC)"},
},

"20250322": {
en: {missingNode:"Some nodes have unverified information", missingDescription:"[Solution] Click Down button to download workflow → Drop into ComfyUI and run Install Missing Custom Nodes → After resolving missing nodes, verify with test generation"},
zh: {missingNode:"部分节点信息无法确认", missingDescription:"【解决方法】点击Down按钮下载工作流 → 拖入ComfyUI执行Install Missing Custom Nodes → 节点补齐后用测试生成验证"},
},
"20250321": {
 en: {
 auto_generate:"Auto Generate",
 prompt:"Prompt(β)",
 prompt_gallery:"Prompt Gallery",
 loading_image:"Loading",
 image_load_error:"No image"
 },
 zh: {
 auto_generate:"自动生成",
 prompt:"提示(β)",
 prompt_gallery:"提示画廊",
 loading_image:"加载中",
 image_load_error:"没有图像"
 },
},
"20250301_v2": {
en: {view_Layer:"Layer",view_AI:"AI"},
zh: {view_Layer:"图层",view_AI:"AI"},
},
"20250301": {
en: {terms_of_service:"Terms of Service"},
zh: {terms_of_service:"服务条款"},
},
"base": {
  en: base_en,zh: base_zh
}
};

function mergeResources(resources) {
const mergedResources = {};

if (resources.base) {
  Object.keys(resources.base).forEach(function(lang) {
    mergedResources[lang] = {
      translation: Object.assign({}, resources.base[lang])
    };
  });
}

Object.keys(resources)
  .filter(function(key) { return key !== 'base'; })
  .sort()
  .forEach(function(dateKey) {
    Object.keys(resources[dateKey]).forEach(function(lang) {
      if (!mergedResources[lang]) {
        mergedResources[lang] = { translation: {} };
      }
      
      Object.assign(
        mergedResources[lang].translation,
        resources[dateKey][lang]
      );
    });
  });

return mergedResources;
}

const mergedResources = mergeResources(resources);
let savedLanguage = localStorage.getItem("language") || "en";

// Only English and Chinese are maintained. Any other previously-supported or
// legacy language code stored in localStorage falls back to English. The notice is
// plain English on purpose: i18next is not initialised yet at this point, and the
// languages it would translate from no longer exist.
var supportedLanguages = ["en", "zh"];

if (supportedLanguages.indexOf(savedLanguage) === -1) {
var unsupportedMsg = "This language is no longer supported. Switched to English.";
savedLanguage = "en";
localStorage.setItem("language", savedLanguage);
setTimeout(function() {
createToast("Language", unsupportedMsg, 6000);
}, 1500);
}

var langFlagMap = {
"en":"us","zh":"cn"
};

var langWelcomeMap = {
"en":"HEY HEY! Welcome my friend! You like manga yes? BEST editor! Number one! Come come!",
"zh":"来来来！朋友！你喜欢漫画吗？最好的！第一名！快进来看看！"
};

function updateLanguageFlag(lng) {
var flagEl = document.getElementById("languageFlag");
if (!flagEl) return;
flagEl.className = "flag-icon";
var code = langFlagMap[lng];
if (code) {
flagEl.classList.add("flag-icon-" + code);
}
}

i18next.init(
{
  lng: savedLanguage,
  resources: mergedResources,
},
function (err, t) {
  updateContent();
  setLanguage(savedLanguage);
  updateLanguageFlag(savedLanguage);
}
);

function updateContent() {
document.querySelectorAll("[data-i18n]").forEach(function (element) {
  const key = element.getAttribute("data-i18n");
  const translation = i18next.t(key);
  if (translation) {
    if (element.tagName === "OPTION") {
      element.textContent = translation;
    } else {
      element.innerHTML = translation;
    }
  } else {
    uiLogger.warn(`Translation for key "${key}" not found.`);
  }
});
document.querySelectorAll("[data-i18n-label]").forEach(function (element) {
  const key = element.getAttribute("data-i18n-label");
  element.setAttribute("data-label", i18next.t(key));
});
document.querySelectorAll("[data-i18n-title]").forEach(function (element) {
  const key = element.getAttribute("data-i18n-title");
  const translation = i18next.t(key);
  if (translation) element.setAttribute("title", translation);
});
}

function changeLanguage(lng, event) {
if (event) {
event.preventDefault();
}
i18next.changeLanguage(lng, function (err, t) {
if (!err) {
var welcome = langWelcomeMap[lng] || "Welcome!";
createToast("Welcome!", welcome, 5000);
localStorage.setItem("language", lng);
updateContent();
setLanguage(lng);
updateLayerPanel();
updateLanguageFlag(lng);
savedLanguage = lng;
if (objectMenu && objectMenu.style.display === "flex") {
showObjectMenu(lastClickType);
}
} else {
uiLogger.error("Failed to change language:", err);
}
});
recreateFloatingWindow();
}

function getTranslation(key, defaultText) {
const translatedText = i18next.t(key);
return translatedText !== key ? translatedText : defaultText;
}

function getText(key) {
const translatedText = i18next.t(key);
return translatedText !== key ? translatedText : key;
}
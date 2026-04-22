#!/usr/bin/env python3
"""Generate individual article HTML pages for ml-center."""

# ── Shared CSS (no f-string conflicts) ──────────────────────────────────────
CSS = """
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter','Noto Sans SC',-apple-system,BlinkMacSystemFont,sans-serif;
            background: #F7F8FC; color: #1A1D2E; line-height: 1.75;
            -webkit-font-smoothing: antialiased;
        }
        .header {
            background: #0B0F35; position: sticky; top: 0; z-index: 100;
            padding: 0 40px; height: 60px; display: flex; align-items: center; gap: 20px;
        }
        .header a { color: rgba(255,255,255,0.5); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .header a:hover { color: rgba(255,255,255,0.9); }
        .header span { color: rgba(255,255,255,0.25); font-size: 13px; }
        .header h1 { color: #fff; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
        .breadcrumb {
            background: #fff; border-bottom: 1px solid #E8EAF2;
            padding: 0 40px; height: 44px; display: flex; align-items: center; gap: 8px;
        }
        .breadcrumb a { color: #9398B2; text-decoration: none; font-size: 13px; transition: color 0.2s; }
        .breadcrumb a:hover { color: #1A1D2E; }
        .breadcrumb span { color: #9398B2; font-size: 13px; }
        .breadcrumb .current { color: #1A1D2E; font-weight: 500; font-size: 13px; }
        .breadcrumb .sep { color: #E8EAF2; }
        .container { max-width: 820px; margin: 0 auto; padding: 40px 24px 80px; }
        .article-card { background: #fff; border-radius: 16px; box-shadow: 0 4px 16px rgba(11,15,53,0.08); overflow: hidden; }
        .article-meta-top {
            background: linear-gradient(135deg,#0B0F35 0%,#1a2556 100%);
            padding: 32px 40px 28px;
        }
        .article-section-tag {
            display: inline-flex; align-items: center; gap: 6px;
            background: rgba(245,197,24,0.15); border: 1px solid rgba(245,197,24,0.3);
            color: #F5C518; font-size: 12px; font-weight: 600;
            padding: 4px 14px; border-radius: 20px; margin-bottom: 14px;
            text-decoration: none;
        }
        .article-title { font-size: 24px; font-weight: 700; color: #fff; letter-spacing: -0.02em; line-height: 1.4; margin-bottom: 10px; }
        .article-summary { font-size: 14px; color: rgba(255,255,255,0.65); line-height: 1.7; }
        .article-body { padding: 48px 56px; }
        .article-body h2 { font-size: 22px; font-weight: 700; color: #1A1D2E; margin-bottom: 24px; letter-spacing: -0.02em; line-height: 1.4; }
        .article-body h3 { font-size: 16px; font-weight: 600; color: #1A1D2E; margin: 32px 0 14px; padding-left: 14px; border-left: 3px solid #F5C518; line-height: 1.5; }
        .article-body h4 { font-size: 15px; font-weight: 600; color: #1A1D2E; margin: 20px 0 10px; line-height: 1.5; }
        .article-body p { font-size: 15px; color: #5B6182; line-height: 1.85; margin-bottom: 14px; }
        .article-body ul { padding-left: 20px; margin-bottom: 18px; }
        .article-body ul li { font-size: 15px; color: #5B6182; line-height: 1.85; margin-bottom: 6px; }
        .article-body strong { color: #1A1D2E; font-weight: 600; }
        .highlight {
            background: linear-gradient(135deg,#FFFBF0 0%,#FFF8E1 100%);
            border-left: 4px solid #F5C518; padding: 18px 24px;
            border-radius: 0 12px 12px 0; margin: 20px 0;
            font-size: 15px; color: #1A1D2E; line-height: 1.8;
        }
        .tip-box {
            background: #F0F4FF; border: 1px solid #DDE3F9; border-radius: 12px;
            padding: 18px 24px; margin: 20px 0;
            font-size: 15px; color: #3B407E; line-height: 1.8;
        }
        .article-nav {
            display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
            margin-top: 40px; padding-top: 32px; border-top: 1px solid #E8EAF2;
        }
        .article-nav-btn {
            background: #fff; border: 1.5px solid #E8EAF2;
            border-radius: 16px; padding: 18px 22px;
            text-decoration: none; transition: all 0.2s; display: block;
        }
        .article-nav-btn:hover { box-shadow: 0 4px 16px rgba(11,15,53,0.08); border-color: #F5C518; transform: translateY(-1px); }
        .article-nav-btn.next { text-align: right; }
        .article-nav-label { font-size: 11px; color: #9398B2; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .article-nav-title { font-size: 14px; font-weight: 600; color: #1A1D2E; display: flex; align-items: center; gap: 6px; }
        .article-nav-btn.next .article-nav-title { justify-content: flex-end; }
        @media (max-width: 768px) {
            .header, .breadcrumb { padding: 0 20px; }
            .breadcrumb { overflow-x: auto; }
            .container { padding: 24px 16px 60px; }
            .article-body { padding: 28px 24px; }
            .article-meta-top { padding: 24px; }
            .article-title { font-size: 20px; }
            .article-nav { grid-template-columns: 1fr; }
        }
"""

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - 云帆跨境</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>{css}</style>
</head>
<body>
<div class="header">
    <a href="dashboard.html">← 工作台</a>
    <span>/</span>
    <a href="ml-center.html">美客多运营中心</a>
    <span>/</span>
    <a href="ml-center.html#{section_id}">{section_name}</a>
    <span>/</span>
    <h1>{icon} {title_short}</h1>
</div>
<div class="breadcrumb">
    <a href="dashboard.html">工作台</a>
    <span class="sep">›</span>
    <a href="ml-center.html">美客多运营中心</a>
    <span class="sep">›</span>
    <a href="ml-center.html#{section_id}">{section_name}</a>
    <span class="sep">›</span>
    <span class="current">{icon} {title}</span>
</div>
<div class="container">
    <div class="article-card">
        <div class="article-meta-top">
            <a class="article-section-tag" href="ml-center.html#{section_id}">📂 {section_name}</a>
            <h1 class="article-title">{icon} {title}</h1>
            <p class="article-summary">{summary}</p>
        </div>
        <div class="article-body">{content}</div>
    </div>
    <div class="article-nav">{prev_btn}{next_btn}</div>
</div>
</body>
</html>"""


def nav_btn(label, icon, title, href, is_next):
    cls = "next" if is_next else "prev"
    arrow = "→" if is_next else "←"
    t = title[:28] + "…" if len(title) > 28 else title
    if not href:
        return ""
    return f\'<a class="article-nav-btn {cls}" href="{href}">\' \
           f\'<div class="article-nav-label">{label}</div>\' \
           f\'<div class="article-nav-title">{arrow} {icon} {t}</div></a>\'


def generate(article, section, prev_art, next_art, path):
    title_short = article["title"][:22] + "…" if len(article["title"]) > 22 else article["title"]
    prev_b = nav_btn("上一篇", prev_art["icon"] if prev_art else "📄",
                     prev_art["title"] if prev_art else "",
                     f\'ml-article-{section["id"]}-{prev_art["id"]}.html\' if prev_art else "", False)
    next_b = nav_btn("下一篇", next_art["icon"] if next_art else "📄",
                     next_art["title"] if next_art else "",
                     f\'ml-article-{section["id"]}-{next_art["id"]}.html\' if next_art else "", True)

    html = HTML_TEMPLATE.format(
        title=article["title"],
        icon=article["icon"],
        title_short=title_short,
        summary=article["summary"],
        content=article["content"],
        section_id=section["id"],
        section_name=section["name"],
        css=CSS,
        prev_btn=prev_b,
        next_btn=next_b,
    )
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  ✓ {path.split(\"/\")[-1]}")


# ── Article data ─────────────────────────────────────────────────────────────
SECTION_PRE = {"id": "pre", "name": "售前板块"}

ARTICLES = [
    dict(id="intro", icon="⚠️",
         title="开篇语",
         summary="师傅领进门，修行靠个人。先读三遍，再开始干。",
         content=
         "<h2>⚠️ 开篇语</h2>"
         "<p>感谢你的信任，让我们有缘一起出海，体验跨境电商的魅力。这套教程凝聚了我们运营美客多三年来的思考、经验和实操心得。</p>"
         "<div class=\"highlight\"><strong>我们的定位是教练，不是保姆。</strong><br>不能事无巨细地帮你解决所有问题，而是教会你思路、方法和经验。能百度解决的，先百度。</div>"
         "<p>熟练操作电脑、动手能力强 → 这套教程适合你<br>对电脑不熟悉、想要手把手带 → 建议选 <strong>1V1 陪跑教学</strong></p>"
         "<div class=\"tip-box\"><strong>💡 记住：</strong>一个人的能力，体现在他解决问题的难度上。主动思考，多做笔记，让店铺早日爆单。</div>"),

    dict(id="art1", icon="🔥",
         title="为什么未来十年是跨境电商的红利期？",
         summary="这可能是你距离「赚钱不费力」最近的一次机会，看完睡不着别怪我。",
         content=
         "<h2>🔥 为什么未来十年是跨境电商的红利期？</h2>"
         "<div class=\"highlight\">这可能是你距离「赚钱不费力」最近的一次机会。</div>"
         "<h3>一、看懂红利，才能赚到钱</h3>"
         "<p>先问自己两个问题：2005年，如果你知道房价要涨20倍，你会不会砸锅卖铁去买一套？2015年，如果你知道淘宝店随便上架就能赚钱，你会不会辞职去开一家？</p>"
         "<p>如果答案是"会"——那<strong>未来十年的财富风口，正在你眼前打开</strong>。</p>"
         "<p>过去20年，房地产让一批普通人成了千万富翁。<br>过去10年，电商让一批年轻人实现了财务自由。<br><strong>未来10年，跨境电商将是普通人最后一次低门槛逆袭的机会。</strong></p>"
         "<h3>二、为什么一定是跨境电商？三个残酷真相</h3>"
         "<h4>真相一：国内的钱，越来越难赚了</h4>"
         "<p>实体店在倒闭，商场在空置，曾经人挤人的步行街冷冷清清。国内电商也在抱怨：流量贵、竞争狠、利润薄，10个商家抢1个客户。产能严重过剩，消费持续低迷——这不是暂时的寒冬，这是新常态。</p>"
         "<h4>真相二：国外的钱，比你想的好赚</h4>"
         "<p>同样的手机壳，国内卖9.9块还包邮，欧美卖39美金（280元人民币）抢着买。TikTok、亚马逊、Temu正在疯狂拉拢中国卖家——他们把路修到了你家门口，只等你把货送出去。</p>"
         "<h4>真相三：国家在背后推你</h4>"
         "<p>海外仓补贴、物流打通、退税简化、上百个试点城市……外贸是命脉。你每卖一单出国，都是在帮国家赚外汇。</p>"
         "<h3>三、跨境电商凭什么适合普通人？三个优势</h3>"
         "<h4>优势一：投入小到离谱，回本快到想不到</h4>"
         "<p>开奶茶店：加盟+装修+设备+房租 = 26万打水漂可能听不见响声。<br>做跨境电商：<strong>千元启动资金就够了</strong>。</p>"
         "<div class=\"highlight\">杭州一个大三学生，2023年9月拿2000块压岁钱做TikTok。一周回本，第一个月纯利2万。现在还没毕业，已经换了三台手机。</div>"
         "<h4>优势二：可副业可主业，进退都自由</h4>"
         "<p>不想辞职？下班搞两小时，多赚一份工资。做大了想辞职？月入超过工资那天就可以跟老板说拜拜。想当事业？组建团队、注册品牌，这就是你的一辈子饭碗。</p>"
         "<h4>优势三：风险全在你手里</h4>"
         "<p>客户先下订单，我们才去采购，<strong>没有任何囤货的风险</strong>。不掌握在房东手里，不掌握在加盟商手里，只掌握在你自己的试错节奏里。手里有现金流，你就有无数次试错的机会。</p>"
         "<h3>四、现在，就是最好的时机</h3>"
         "<p>等你看懂了，门槛就高了。等你心动了，风口就过了。等你准备好了，红利就没了。</p>"
         "<div class=\"highlight\">你可以继续观望，五年后回头看，对自己说一句"早知道我也做了"。<br>或者——<strong>你现在就开始。</strong></div>"),

    dict(id="art2", icon="🤑",
         title="低风险入局跨境电商的三大关键",
         summary="选品、发货模式、店铺安全——新手迈出第一步前必须想清楚的压舱石。",
         content=
         "<h2>🤑 低风险入局跨境电商的三大关键</h2>"
         "<p>剥开外壳看本质：跨境电商就是买卖——把国内商品通过平台卖给国外买家。既然是"低风险入局"，就不能靠蛮干，不能靠赌运气。</p>"
         "<h3>关键一：选对发货模式，拒绝压货风险</h3>"
         "<p>发货模式分两种：<strong>国内直发</strong>（从中国直接发货）和<strong>海外仓备货</strong>（先批量运到目标国仓库，出单后从当地发）。最致命的是货"死"在路上或仓库里。一旦滞销，既退不回国内（运费比货贵），也很难在当地清仓。</p>"
         "<div class=\"highlight\"><strong>新手明智之选：</strong>尽量选择"从中国直发"的平台或模式。先出单、再采购、再发货。资金是转起来的，库存是可控的。手里有现金流，你就有无数次试错的机会。</div>"
         "<h3>关键二：守护店铺安全，这是你的命根子</h3>"
         "<p><strong>封店是悬在跨境电商头顶的一把剑。</strong>它不仅关乎你能不能继续卖货，更关乎你能不能顺利回款。新手常见的三个雷区：</p>"
         "<ul>"
         "<li><strong>侵权</strong>：盗用别人的爆款图、卡通形象</li>"
         "<li><strong>违规商品</strong>：售卖平台明令禁止的高风险或敏感类商品</li>"
         "<li><strong>资料问题</strong>：不干净的网络环境、虚假身份资料、重复注册</li>"
         "</ul>"
         "<p>宁愿走得慢一点，也不要去碰灰色地带的"快钱"。</p>"
         "<h3>关键三：运营人员的认知与执行力</h3>"
         "<p>最后一个要素，也是最核心的变量——人。体现在三个维度：</p>"
         "<ul>"
         "<li><strong>选品敏锐度</strong>：判断利润空间、竞争程度、侵权风险</li>"
         "<li><strong>细节把控</strong>：文案撰写、图片拍摄、广告词设置</li>"
         "<li><strong>风险预判能力</strong>：读懂平台规则更新，核算综合成本</li>"
         "</ul>"
         "<div class=\"tip-box\">起步阶段，哪怕慢一点，也要保证每一个动作是规范的、专业的。</div>"),

    dict(id="art3", icon="🎯",
         title="从事跨境电商的顶级认知",
         summary="八个思维认知，不是速成技巧，而是能陪你走五年十年的底层逻辑。",
         content=
         "<h2>🎯 从事跨境电商的顶级认知</h2>"
         "<p>真正能穿越周期、持续赚钱的人，靠的不是运气，而是一套稳定的底层认知系统。</p>"
         "<h3>上篇：心态与格局</h3>"
         "<h4>认知一：真正的红利，是慢功夫带来的复利</h4>"
         "<p>彻底戒掉赌徒心态，做一个<strong>坚定的长期主义者</strong>。跨境电商的本质不是短跑，而是马拉松。真正长期主义者在做：打磨产品、研究供应链、优化用户体验、建立品牌认知。三年后回头看，走慢路的人已经在一条赛道上挖出了护城河。</p>"
         "<h4>认知二：允许亏一单，但要赢全局</h4>"
         "<p>从"单点盈亏"转向<strong>"整体思维"</strong>。广告投放：十个点击才有一单成交，那九个不是"浪费"，是找到那个对的人的"路费"。<strong>学会算大账，不算小账；算总账，不算单账。</strong></p>"
         "<h4>认知三：信息差是暂时的，认知差是永恒的</h4>"
         "<p>今天你发现的蓝海，明天就能被爬虫扒光。<strong>信息差只能让你赚快钱，认知差才能让你持续赚钱。</strong>认知差的本质是对一件事的理解深度：知道"是什么" → 知道"怎么玩" → 知道"为什么这么玩" → 知道"变了该怎么玩"。</p>"
         "<h3>中篇：经营与策略</h3>"
         "<h4>认知四：生意的本质是利他，而非收割</h4>"
         "<p>把<strong>"利他"</strong>刻在骨子里。生意的本质是价值变现，不是技巧收割。</p>"
         "<h4>认知五：小而美，优于大而全</h4>"
         "<p>不要试图取悦所有人。<strong>不需要找到所有人都能爆的品，只需要找到属于你的那一小群人，然后服务好他们。</strong></p>"
         "<h4>认知六：流量是平台的，用户才是自己的</h4>"
         "<p><strong>任何时候，都要把"留量"放在和"流量"同等重要的位置。</strong>怎么沉淀？独立站、邮件列表、社交媒体、品牌官网。</p>"
         "<h3>下篇：成长与底线</h3>"
         "<h4>认知七：合规不是束缚，而是最低成本的生存策略</h4>"
         "<p>把<strong>合规当成底线，而不是天花板</strong>。当平台开始清洗，<strong>合规的卖家就是唯一的幸存者</strong>。</p>"
         "<h4>认知八：守住底线比追求上限更重要</h4>"
         "<p><strong>永远把风险控制放在收益预期之前。</strong>资金上：只用闲钱做，永远不要All in。心态上：接受慢一点，接受小富即安。布局上：多平台、多账号分散风险。</p>"
         "<div class=\"highlight\">在这个行业里，<strong>活得久的人，才是真正赚到钱的人</strong>。</div>"),

    dict(id="art4", icon="🇧🇷",
         title="拉美市场简介",
         summary="了解拉美六国市场格局与消费特征，找到属于你的出海起跳点。",
         content=
         "<h2>🇧🇷 拉美市场简介</h2>"
         "<h3>巴西市场深度介绍</h3>"
         "<p>拉丁美洲最大电商市场，占拉美电商市场份额 40%+，说葡萄牙语，是全球第五大人口国家（2.15亿）。电商增速领跑全球，平均年增长率约 20%。</p>"
         "<p>主要平台：<strong>MercadoLibre（美客多）</strong>、Amazon Brazil、Shopee Brazil、Americanas。MercadoLibre 在巴西 C端用户覆盖率达 90%。</p>"
         "<h4>核心优势</h4>"
         "<ul>"
         "<li>人口红利：2.15亿，50% 是中产阶级，年轻人口结构</li>"
         "<li>电商红利：智能手机普及率快速增长，移动互联网渗透率高</li>"
         "<li>竞争度低：相比欧美，红利期还在，本土竞争相对较小</li>"
         "<li>汇率优势：雷亚尔对人民币贬值，中国商品价格竞争力强</li>"
         "</ul>"
         "<h4>消费特征</h4>"
         "<ul>"
         "<li>消费电子、时尚服装、家居用品是核心类目</li>"
         "<li>价格敏感度高，"省得多"是核心购买驱动力</li>"
         "<li>分期付款文化发达，3-12期免息是主流支付方式</li>"
         "<li>移动端占比超 70%，SEO 和 SEM 优化要侧重移动</li>"
         "</ul>"
         "<h4>中国卖家机会</h4>"
         "<ul>"
         "<li>美客多对中国卖家政策友好，本土店铺与中国店铺并行</li>"
         "<li>义乌、深圳卖家已大量进入，竞争尚在可控范围内</li>"
         "<li>3C数码配件、家居百货、宠物用品是中国卖家优势类目</li>"
         "</ul>"
         "<h3>阿根廷市场</h3>"
         "<p>全球通胀最高的国家之一，本地商品价格极高，中国商品有天然价格优势。比索贬值严重，但官方汇率与黑市汇率差距大，换汇是重要考量。本土电商增速放缓但仍在增长。</p>"
         "<h3>哥伦比亚市场</h3>"
         "<p>拉美第三大人口国（约5000万），电商起步晚但增长快。信用卡渗透率约 40%，COD（现金支付）占比仍然较高，约 30-40%。主要平台：MercadoLibre、Dafiti。国际品牌进入较多，竞争逐年加剧。</p>"
         "<h3>智利市场</h3>"
         "<p>拉美最成熟、最稳定的市场，互联网渗透率超 80%，信用卡使用率最高。消费者信任度高客单价高，物流成熟。国际品牌竞争激烈，中国卖家以 3C 电子、家居为主。主要平台：MercadoLibre Chile、Falabella（本土最大零售商转型电商）。</p>"
         "<h3>乌拉圭市场</h3>"
         "<p>人口少（约350万），但人均收入最高，社会福利好。电商规模较小，以跨境直发为主。作为进入拉美的跳板，测试南锥体市场策略。</p>"
         "<h3>墨西哥市场</h3>"
         "<p>拉美第二大电商市场，约 1.3 亿人口，贫富差距大，消费者价格敏感度高。美客多墨西哥站是中国卖家最热门的入门市场，中小卖家首选。竞争激烈但容量大，适合作为拉美第一站。</p>"
         "<div class=\"tip-box\"><strong>💡 新手建议：</strong>从墨西哥站入手，市场容量大、门槛低、卖家生态成熟。等运营经验积累后再拓展到智利、巴西等市场。</div>"),

    dict(id="art5", icon="🛒",
         title="美客多平台简介",
         summary="拉美最大电商平台，一图读懂美客多四大站点与核心玩法。",
         content=
         "<h2>🛒 美客多平台简介</h2>"
         "<p>MercadoLibre（美客多）成立于1999年，总部位于阿根廷，是拉丁美洲最大的电商生态系统，被称作"拉美版淘宝+支付宝"。业务覆盖阿根廷、巴西、墨西哥、智利、哥伦比亚等18个国家。</p>"
         "<h3>平台核心数据</h3>"
         "<ul>"
         "<li>年活跃买家：超 1.3 亿</li>"
         "<li>在售商品：超 1 亿件</li>"
         "<li>新注册卖家：每分钟约 17 个</li>"
         "<li>2023年平台GMV：约 370亿美元</li>"
         "</ul>"
         "<h3>四大核心站点</h3>"
         "<h4>🇧🇷 巴西站</h4>"
         "<p>流量最大，市场最成熟，客单价相对较高，但竞争也最激烈。巴西人对质量要求更高，售后期望值高。</p>"
         "<h4>🇲🇽 墨西哥站</h4>"
         "<p>中国卖家最集中，语言门槛最低（西班牙语），市场容量大。新卖家居多首选，物流体系相对完善。</p>"
         "<h4>🇨🇱 智利站</h4>"
         "<p>客单价最高，平台抽佣相对低，用户消费能力强。对产品质量要求高，适合中高端定位。</p>"
         "<h4>🇦🇷 阿根廷站</h4>"
         "<p>流量可观但汇率复杂，通胀环境下对价格极度敏感，本地供应商竞争激烈。</p>"
         "<h3>平台核心玩法</h3>"
         "<p>不同于亚马逊的图文搜索逻辑，美客多更像"拉美版拼多多"——用户更习惯滑屏浏览图片驱动消费，对图片要求极高。平台内流量主要靠：关键词广告（竞价排名）、投放大促活动、参与官方促销活动。</p>"
         "<div class=\"tip-box\"><strong>💡 关键洞察：</strong>美客多平台对图片的依赖远超文字，好的主图直接决定点击率。这是中国卖家最大的机会，也是最容易踩的坑。</div>"),
]

BASE_DIR = "/Users/chensan/cloud-sail/articles"

print("Generating 售前板块 articles...")
for i, art in enumerate(ARTICLES):
    prev = ARTICLES[i-1] if i > 0 else None
    nxt  = ARTICLES[i+1] if i < len(ARTICLES)-1 else None
    out = f"{BASE_DIR}/ml-article-pre-{art['id']}.html"
    generate(art, SECTION_PRE, prev, nxt, out)

print("\nDone ✓")

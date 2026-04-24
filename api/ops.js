function switchToOpsTab(t){
    var c=document.querySelectorAll('.ops-tab-card');
    for(var i=0;i<c.length;i++)c[i].classList.remove('active');
    var card=document.getElementById('ops-tab-'+t);
    if(card)card.classList.add('active');
    var section=null;
    for(var i=0;i<SECTIONS.length;i++){
        if(SECTIONS[i].tab===t){section=SECTIONS[i];break}
    }
    if(!section)return;
    var label=document.getElementById('opsSectionLabel');
    if(label)label.textContent=section.name+' · 课程列表';
    var container=document.getElementById('opsArticles');
    if(!container)return;
    var html='';
    (section.articles||[]).forEach(function(a){
        html+='<div class="ops-article-card" onclick="showOpsArticle(\''+a.id+'\')">'+
            '<div class="ops-article-header">'+
            '<span class="ops-article-icon">'+(a.icon||'📄')+'</span>'+
            '<span class="ops-article-title">'+a.title+'</span></div>'+
            '<div class="ops-article-summary">'+(a.summary||'')+'</div></div>';
    });
    container.innerHTML=html;
}
function showOpsArticle(articleId){
    var article=null;var section=null;
    for(var i=0;i<SECTIONS.length;i++){
        var a=(SECTIONS[i].articles||[]).find(function(x){return x.id===articleId});
        if(a){article=a;section=SECTIONS[i];break}
    }
    if(!article)return;
    var el=document.getElementById('opsArticles');
    if(el)el.innerHTML='<div style="max-width:800px;padding:20px 0">'+
        '<div onclick="switchToOpsTab(\''+section.tab+'\')" style="cursor:pointer;color:var(--secondary);margin-bottom:20px;font-size:13px">← 返回课程列表</div>'+
        '<div style="font-size:20px;font-weight:700;margin-bottom:16px">'+(article.icon||'📄')+' '+article.title+'</div>'+
        '<div style="line-height:1.8;font-size:14px">'+article.content+'</div></div>';
}
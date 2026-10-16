/* ====== 段落ごとに書く／AIに質問・野田先生に質問／入力の自動保存 ======
   AI機能は config.js の AI_CFG.endpoint（Google Apps Script のURL）を入れると動きます。
   空のあいだは「かんたんチェック（AIなし）」と「野田先生に質問（LINE）」が使えます。 */

var DISCLAIMER = "これはあくまでAIの提案です。使うかどうかは自分で決めてください。使うことは自己の責任であることを承知してください。";

/* ---------- 下書きの自動保存（この端末のブラウザ内） ---------- */
function draftKey(){return "kg_draft_"+(S.pen||"").replace(/\s+/g,"")}
function draftSave(){ if(!S.pen)return; try{localStorage.setItem(draftKey(),JSON.stringify({D:D,sel:S.sel,at:Date.now()}))}catch(e){} }
function draftLoad(){ try{var o=JSON.parse(localStorage.getItem(draftKey())||"null");if(o&&o.D){D=o.D;D.pen=S.pen;S.sel=(o.sel||[]).slice();S.restored=true;return true}}catch(e){} return false }
setInterval(draftSave,2000);

/* ---------- AIとの通信（Google Apps Script経由） ---------- */
function aiOn(){return typeof AI_CFG!=="undefined"&&!!AI_CFG.endpoint}
function aiCall(payload,cb){
  if(!aiOn()){cb({ok:false,off:true});return}
  payload.pen=S.pen||"";
  try{
    fetch(AI_CFG.endpoint,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)})
      .then(function(r){return r.json()}).then(function(j){cb(j)}).catch(function(){cb({ok:false,err:1})});
  }catch(e){cb({ok:false,err:1})}
}
function schoolInfo(){
  return S.sel.map(function(id){var s=byId(id);return {name:s.name,keywords:(s.keywords||[]).filter(function(k){return k.indexOf("要確認")<0}),emphasis:s.emphasis||[],essay:s.essay||""}})}
function baseCtx(){
  return {round:hNextNo(),schools:schoolInfo(),exam:D.exam||"",chars:D.chars||"",mins:D.mins||"",theme:(D.W&&D.W.theme)||"",sheet:(D.W&&D.W.theme?"【題材】"+D.W.theme+"\n":"")+sheetText()}}

/* ---------- 段落構成のモデル ---------- */
function W(){
  if(!D.W)D.W={theme:"",n:4,plan:["","","",""],paras:["","","",""],idx:0,stage:"plan",ev:{}};
  return D.W}
function setN(n){var w=W();w.n=n;while(w.plan.length<n){w.plan.push("");w.paras.push("")}w.plan.length=n;w.paras.length=n;if(w.idx>=n)w.idx=n-1}
function roles(n){
  var R={intro:{name:"序論（きっかけ）",ask:"看護師をめざしたきっかけは何ですか。",start:"私が看護師を目指すきっかけは、〜です。"},
    b1:{name:"本論① 経験",ask:"そのきっかけにつながる経験（つらかったこと・頑張ったこと）は何ですか。",start:"私は、〜という経験をしました。そのとき、〜と感じました。"},
    b2:{name:"本論② 学びと強み",ask:"その経験から学んだこと、自分の強みは何ですか。看護にどう活かせますか。",start:"この経験から、私は〜ということを学びました。"},
    b3:{name:"本論③ もう一つの経験",ask:"ほかに伝えたい経験や強みはありますか。",start:"また、私は〜という強みがあります。"},
    end:{name:"結論（決意）",ask:"入学したら、どんな看護師になりたいですか。",start:"入学後は、〜に取り組み、〜な看護師になりたいです。"},
    body:{name:"本論 経験と学び",ask:"経験（つらかったこと・頑張ったこと）と、そこから学んだことは何ですか。",start:"私は、〜という経験をしました。この経験から、〜を学びました。"}};
  return n===3?[R.intro,R.body,R.end]:(n===5?[R.intro,R.b1,R.b2,R.b3,R.end]:[R.intro,R.b1,R.b2,R.end])}
function perPara(){var t=parseInt(D.chars)||600;return Math.round(t*0.9/W().n)}

/* ---------- AIなしの提案・チェック ---------- */
function firstLine(t){var a=bullets(t);return a.length?a[0]:""}
function localProposal(){
  var n=W().n,r=roles(n),out=[];
  var hard=firstLine(D.hard),over=firstLine(D.overcome),use=firstLine(D.useful)||firstLine(D.nurseLink),pr=bullets(D.pr).slice(0,2).join("、"),eff=firstLine(D.effort)||firstLine(D.hsEffort);
  var job=(D.jobs&&D.jobs[0]&&D.jobs[0].duty)||"",kw=[];S.sel.forEach(function(id){byId(id).keywords.forEach(function(k){if(k.indexOf("要確認")<0&&kw.length<3)kw.push(k)})});
  r.forEach(function(x,i){
    var s;
    if(x.name.indexOf("序論")===0)s=hard?"きっかけ：「"+hard+"」という出来事（または身近な人の看護・医療との出会い）から、看護師を目指した。":"身近な人の入院や、仕事・生活での出来事など、看護師を目指したきっかけを1つ書く。";
    else if(x.name.indexOf("結論")===0)s="入学後は"+(kw.length?"「"+kw.join("」「")+"」を大切にして":"学びに向き合って")+"、"+(bullets(D.ideal).length?"「"+bullets(D.ideal).slice(0,3).join("」「")+"」な看護師":(use?use:"自分の経験を活かせる看護師"))+"を目指す。"+(D.worryText||(D.worry||[]).length?"不安なこともあるが、乗り越える決意を書く。":"");
    else if(x.name.indexOf("① 経験")>0||x.name.indexOf("本論 経験")===0)s="経験："+(hard||eff||job||"頑張ったこと・つらかったことを1つ")+"。"+(over?"それを「"+over+"」で乗り越えた。":"どう乗り越えたかを書く。");
    else if(x.name.indexOf("② ")>0)s="学びと強み："+(use||pr||"経験から身についた力")+"。看護の場面（患者さんへの声かけ、チーム医療など）でどう活きるかを書く。";
    else s="ほかの強み・経験："+(pr||eff||"自己PRの中から1つ")+"。";
    out.push(s)});
  return out}
function localCheck(text,idx){
  var good=[],issues=[],t=text||"",len=hCount(t),per=perPara(),lo=Math.round(per*0.6),hi=Math.round(per*1.4);
  if(!len)return {good:[],issues:["まだ書かれていません。1文だけでも書いてみましょう。"],advice:"「書き出しの例」を見て、〜の部分だけ自分の言葉にしてみましょう。"};
  if(len>=lo&&len<=hi)good.push("字数がちょうどよいです（"+len+"字）。");
  else if(len<lo)issues.push("もう少し書けそうです（目安 "+per+"字、いま"+len+"字）。そのとき感じたことを1文足してみましょう。");
  else issues.push("少し長めです（目安 "+per+"字、いま"+len+"字）。いちばん伝えたいことを残して整えましょう。");
  if(/[0-9０-９一二三四五六七八九十]+\s*(年|か月|ヶ月|カ月|回|人|歳|日|時間)/.test(t))good.push("年数や人数など、具体的なことが書けています。");
  else issues.push("年数・回数・人数など、具体的な数字が1つあると伝わりやすくなります。");
  if(/(思|感じ|気持ち|嬉し|うれし|悔し|くやし|悲し|不安|つらかっ|辛かっ|驚|安心)/.test(t))good.push("そのときの気持ちが書けています。");
  else issues.push("そのとき感じた気持ちを1文足しましょう（例：「とても不安でした」）。");
  var ss=t.split(/[。！？\n]/).filter(Boolean),longS=ss.filter(function(x){return x.length>70});
  if(longS.length)issues.push("一文が長いところがあります。「、」で切って2つの文に分けましょう。");
  var omo=(t.match(/思います/g)||[]).length;if(omo>=3)issues.push("「思います」が"+omo+"回あります。「〜です」「〜します」に変えられるところがあります。");
  genkouWarn(t).filter(function(x){return x.indexOf("段落")<0}).forEach(function(x){issues.push(x)});
  var plan=(W().plan[idx]||"").replace(/[\s、。]/g,""),hit=0,tot=0;
  for(var i=0;i<plan.length-1;i+=2){var g=plan.substr(i,2);tot++;if(t.indexOf(g)>=0)hit++}
  if(tot>=6&&hit/tot<0.15)issues.push("最初に決めた構想と、少し違う内容になっているかもしれません。構想を見直してみましょう。");
  return {good:good,issues:issues,advice:issues.length?"直すところは"+issues.length+"つです。1つずつ直せば大丈夫です。":"このまま次へ進めます。"}}

/* ---------- 評価の表示 ---------- */
function stars(sc){if(sc==null)return "";var k=Math.max(1,Math.min(5,Math.round(sc/20)));return "★★★★★".slice(0,k)+"☆☆☆☆☆".slice(0,5-k)}
function evalHtml(r,label){
  if(!r)return "";
  if(r.off)return '<div class="tip">AIの準備はまだできていません。「かんたんチェック」と「野田先生に質問」をお使いください。</div>';
  if(r.ok===false)return '<div class="warn">AIにつながりませんでした。しばらくしてからもう一度ためすか、野田先生に質問してください。</div>';
  var h='<div class="ok"><b>【評価】'+esc(label||"")+'</b>'+(r.score!=null?'　<span style="font-size:20px;color:#e0a000">'+stars(r.score)+'</span>':"")+(r.local?'<span class="small">（かんたんチェック・AIなし）</span>':"");
  if(r.comment)h+='<p>'+nl(r.comment)+'</p>';
  if((r.good||[]).length)h+='<p style="margin:6px 0 2px"><b>よいところ</b></p><ul>'+r.good.map(function(x){return '<li>'+esc(x)+'</li>'}).join("")+'</ul>';
  if((r.issues||[]).length)h+='<p style="margin:6px 0 2px"><b>のばせるところ</b></p><ul>'+r.issues.map(function(x){return '<li>'+esc(x)+'</li>'}).join("")+'</ul>';
  if(r.advice)h+='<p style="margin:6px 0 2px"><b>アドバイス</b></p><p>'+nl(r.advice)+'</p>';
  if(r.example)h+='<p style="margin:6px 0 2px"><b>書き方の例（そのまま写さず、自分の言葉に直しましょう）</b></p><p>'+nl(r.example)+'</p>';
  if(!r.local)h+='<p class="small">'+esc(DISCLAIMER)+'</p>';
  return h+'</div>'}
function aiGate(){return '<label style="display:flex;gap:8px;align-items:flex-start;font-weight:700;margin:6px 0"><input type="checkbox" class="aiok" '+(S.aiok?"checked":"")+' style="width:22px;height:22px;margin-top:3px"><span>'+esc(DISCLAIMER)+'（承知しました）</span></label>'}
function bindAiGate(root){Array.prototype.forEach.call(root.querySelectorAll(".aiok"),function(c){c.onchange=function(){S.aiok=c.checked;var y=window.scrollY;render();window.scrollTo(0,y)}})}

/* ---------- 段落で書く画面 ---------- */
function allText(){return W().paras.map(function(p){return (p||"").trim()}).filter(Boolean).join("\n")}
function viewWrite(){
  var w=W(),h='';
  var sch=S.sel.length?S.sel.map(function(id){return esc(byId(id).name)}).join("／"):"（志望校が未決定です）";
  h+='<div class="card"><h2>🪜 段落で書く</h2><p>志望校：<b>'+sch+'</b>　　字数の目安：<b>'+esc(D.chars||"未入力")+'字</b>　制限時間：<b>'+esc(D.mins||"未入力")+'分</b></p>'+
  '<p><button class="btn line" data-go2="input">これまで入力した情報を修正する</button> <button class="btn line" data-go2="sheet">素材シートを見る</button> <button class="btn line" data-go2="research">志望校を変える</button></p>'+
  '<p class="small">まず「どう書きたいか」（段落の構成）を決めます。次に、1段落ずつ書いていきます。書けないときは、ヒントやアドバイスのボタンが助けます。</p></div>';
  var prog=w.stage==="plan"?1:(w.stage==="write"?2:3);
  h+='<div class="progress"><i style="width:'+Math.round(prog/3*100)+'%"></i></div><p class="small">①構成を決める　→　②段落を書く　→　③全文を確認して送る　（いま：'+prog+'）</p>';
  if(w.stage==="plan")h+=planView(w);else if(w.stage==="write")h+=paraView(w);else h+=finalView(w);
  return h}
var THEMES={"作文":["看護師を志望する理由","最近、うれしかったこと","人の役に立った経験","私の長所と短所","つらかったことと、それを乗り越えた経験","高校（または仕事）で頑張ったこと"],
 "小論文":["看護師に大切だと思うこと","高齢化が進む社会で看護師にできること","チーム医療で大切なこと","患者さんに寄りそうとはどういうことか","医療現場でのコミュニケーションの大切さ"]};
function themeCard(w){
  var kind=(D.exam==="小論文")?"小論文":"作文",list=THEMES[kind];
  var h='<div class="card"><h3>📌 題材（テーマ）を決めましょう</h3>'+
  '<p class="small">学校から題が出ているときは、そのまま書き写します。まだ決まっていないときは、練習用の題から選べます（自分で書いてもかまいません）。</p>'+
  '<input type="text" id="theme" style="width:100%;font-size:17px;padding:10px;border:2px solid var(--blue);border-radius:10px;box-sizing:border-box" placeholder="例：看護師を志望する理由" value="'+esc(w.theme||"")+'">'+
  '<p class="small" style="margin-top:8px">練習用の題（'+kind+'）：</p><div style="display:flex;flex-wrap:wrap;gap:8px">'+
  list.map(function(t,i){return '<button class="btn line thm" data-i="'+i+'" style="padding:6px 12px;font-size:14px">'+esc(t)+'</button>'}).join("")+'</div>';
  if(!D.exam)h+='<p class="small">※入試の形式は「志望校」の画面で選べます。いまは作文の題を出しています。</p>';
  return h+'</div>'}
function planView(w){
  var r=roles(w.n),h=themeCard(w)+'<div class="card"><h3>① どう書きたいかを決めましょう（段落構成）</h3>'+
  '<p>段落の数：'+[3,4,5].map(function(n){return '<label style="margin-right:12px"><input type="radio" name="pn" value="'+n+'" '+(w.n===n?"checked":"")+'> '+n+'つ</label>'}).join("")+'</p>'+
  '<p class="small">各段落で「何を書くか」を、短い言葉でメモします。文章でなくて大丈夫です。</p>';
  r.forEach(function(x,i){
    h+='<div style="margin:12px 0"><b>'+(i+1)+'段落目：'+esc(x.name)+'</b><br><span class="small">'+esc(x.ask)+'</span>'+
    '<textarea class="plan" data-i="'+i+'" style="min-height:64px" placeholder="例：'+esc(x.start)+'">'+esc(w.plan[i]||"")+'</textarea></div>'});
  h+='<div id="planout">'+(S.planOut||"")+'</div>'+
  '<p><button class="btn line" id="pprop">構成のヒントをもらう（書けないとき）</button> <button class="btn" id="peval">この構成を見てもらう（AI）</button></p>'+
  aiGate()+
  '<p style="margin-top:12px"><button class="btn sun" id="pgo">この構成で書き始める →</button></p></div>';
  return h}
function paraView(w){
  var r=roles(w.n),i=w.idx,x=r[i],h='';
  h+='<div class="card"><h3>② '+(i+1)+'段落目を書きましょう（全'+w.n+'段落）：'+esc(x.name)+'</h3>'+(w.theme?'<p class="small">題材：<b>'+esc(w.theme)+'</b></p>':'')+
  '<div class="tip"><b>あなたの構想</b><br>'+(w.plan[i]?nl(w.plan[i]):'<span class="small">（構想が空です）</span>')+'</div>';
  if(i>0)h+='<details><summary class="small">ここまで書いた段落を見る</summary><div class="ex" style="white-space:pre-wrap">'+esc(w.paras.slice(0,i).join("\n\n"))+'</div></details>';
  h+='<p class="small">書き出しの例：'+esc(x.start)+'（〜の部分を自分の言葉にします）</p>'+
  '<textarea id="para" style="min-height:160px" placeholder="ここに'+(i+1)+'段落目を書きます">'+esc(w.paras[i]||"")+'</textarea>'+
  '<div class="small" id="pcnt">'+hCount(w.paras[i])+'字（目安 '+perPara()+'字）</div>'+
  '<div id="paraout">'+(S.paraOut||"")+'</div>'+
  '<p><button class="btn" id="padv">この段落のアドバイスをもらう</button> <button class="btn line" id="phint">書けないとき：ヒントをもらう</button></p>'+aiGate()+
  '<p style="margin-top:12px">'+(i>0?'<button class="btn line" id="pback">← 前の段落</button> ':'<button class="btn line" id="pplan">← 構成にもどる</button> ')+
  (i<w.n-1?'<button class="btn sun" id="pnext">次の段落に進む →</button>':'<button class="btn sun" id="pfin">全文を確認する →</button>')+'</p></div>';
  if(i<w.n-1)h+='<div class="card"><b>次の段落の構想（'+(i+2)+'段落目：'+esc(r[i+1].name)+'）</b><br>'+(w.plan[i+1]?nl(w.plan[i+1]):'<span class="small">（まだ決めていません）</span>')+'</div>';
  return h}
function finalView(w){
  var t=allText(),h='<div class="card"><h3>③ 全文を確認しましょう</h3>'+(w.theme?'<p>題材：<b>'+esc(w.theme)+'</b></p>':'')+'<div class="ex" style="white-space:pre-wrap">'+esc(w.paras.map(function(p){return (p||"").trim()}).join("\n\n"))+'</div>'+
  '<p><b>'+hCount(t)+'字</b>'+(D.chars?'（制限 '+esc(D.chars)+'字）':'')+'</p>';
  var wr=genkouWarn(t);if(wr.length)h+='<ul>'+wr.map(function(x){return '<li>'+esc(x)+'</li>'}).join("")+'</ul>';
  h+='<div id="fout">'+(S.finalOut||"")+'</div><p><button class="btn line" id="feval">全体のアドバイスをもらう（AI）</button> <button class="btn line" id="fedit">← 段落を書き直す</button> <button class="btn line" data-go2="essay">原稿用紙で見る</button></p>'+aiGate()+
  '</div><div class="card" style="border-color:var(--mint)"><h3>これでよいですか？</h3><p>よければ、下の「野田先生に送る」を押してください。野田先生のLINEに届きます。</p>'+
  '<div class="ok"><b>返信は最大3営業日以内です。</b>できるだけ早く返信します。素材シートも必要なので添付して送ります。</div>'+
  '<p><button class="btn" id="fsend">野田先生に送る</button> <button class="btn line" id="fnew">新しい回を始める（素材はそのまま）</button></p></div>';
  return h}

function bindWrite(){
  var w=W();
  Array.prototype.forEach.call(app.querySelectorAll("[data-go2]"),function(b){b.onclick=function(){go(b.getAttribute("data-go2"))}});
  bindAiGate(app);
  var rerender=function(){var y=window.scrollY;render();window.scrollTo(0,y)};
  var th=document.getElementById("theme");if(th)th.oninput=function(){w.theme=th.value};
  Array.prototype.forEach.call(app.querySelectorAll(".thm"),function(b){b.onclick=function(){var l=THEMES[(D.exam==="小論文")?"小論文":"作文"];w.theme=l[+b.getAttribute("data-i")];rerender()}});
  if(w.stage==="plan"){
    Array.prototype.forEach.call(app.querySelectorAll("input[name=pn]"),function(r){r.onchange=function(){setN(+r.value);S.planOut="";rerender()}});
    Array.prototype.forEach.call(app.querySelectorAll(".plan"),function(a){a.oninput=function(){w.plan[+a.getAttribute("data-i")]=a.value}});
    document.getElementById("pprop").onclick=function(){
      var p=localProposal(),r=roles(w.n);
      S.planOut='<div class="ok"><b>構成のヒント（素材ノートから作りました）</b><ul>'+p.map(function(x,i){return '<li><b>'+(i+1)+'段落目</b>：'+esc(x)+'</li>'}).join("")+'</ul><p><button class="btn line" id="puse">このヒントを構想欄に入れる</button></p></div>';
      rerender();
      var u=document.getElementById("puse");if(u)u.onclick=function(){p.forEach(function(x,i){if(!w.plan[i])w.plan[i]=x});rerender()}};
    document.getElementById("peval").onclick=function(){
      if(!w.plan.some(function(x){return x.trim()})){alert("先に、各段落の構想をメモしてください。");return}
      if(hasPII(w.plan.join(" "))){alert("電話番号・住所・メールアドレスのような文字が入っています。消してください。");return}
      if(!S.aiok){alert("AIを使うには、「承知しました」にチェックを入れてください。");return}
      S.planOut='<div class="tip">AIが見ています。少し待ってください…</div>';rerender();
      var p=baseCtx();p.action="structure";p.roles=roles(w.n).map(function(x){return x.name});p.plan=w.plan.slice();
      aiCall(p,function(j){S.planOut=evalHtml(j,"段落構成");w.ev.plan=j;rerender();bindPlanProp()})};
    var bindPlanProp=function(){};
    document.getElementById("pgo").onclick=function(){
      var empty=w.plan.filter(function(x){return !x.trim()}).length;
      if(empty){alert("構想が空の段落が"+empty+"つあります。短い言葉でよいので、メモしてください。書けないときは「構成のヒントをもらう」を押してください。");return}
      w.stage="write";w.idx=0;S.paraOut="";S.planOut="";render();window.scrollTo(0,0)};
  } else if(w.stage==="write"){
    var ta=document.getElementById("para"),cnt=document.getElementById("pcnt");
    ta.oninput=function(){w.paras[w.idx]=ta.value;cnt.textContent=hCount(ta.value)+"字（目安 "+perPara()+"字）";D.essay=allText()};
    document.getElementById("padv").onclick=function(){
      var t=ta.value;w.paras[w.idx]=t;
      if(!t.trim()){alert("先に、少しでも書いてみましょう。書けないときは「ヒントをもらう」を押してください。");return}
      if(hasPII(t)){alert("電話番号・住所・メールアドレスのような文字が入っています。消してください。");return}
      var lc=localCheck(t,w.idx);lc.local=true;
      if(!aiOn()||!S.aiok){S.paraOut=evalHtml(lc,(w.idx+1)+"段落目")+(aiOn()?'<div class="tip">AIのアドバイスも受けるには、下の「承知しました」にチェックを入れてから、もう一度押してください。</div>':"");rerender();return}
      S.paraOut='<div class="tip">AIが見ています。少し待ってください…</div>';rerender();
      var p=baseCtx();p.action="paragraph";p.index=w.idx+1;p.total=w.n;p.role=roles(w.n)[w.idx].name;p.plan=w.plan.slice();p.text=t;p.prev=w.paras.slice(0,w.idx);
      aiCall(p,function(j){if(j&&j.ok===false){j=lc}S.paraOut=evalHtml(j,(w.idx+1)+"段落目");w.ev["p"+w.idx]=j;rerender()})};
    document.getElementById("phint").onclick=function(){
      var x=roles(w.n)[w.idx],plan=w.plan[w.idx]||"";
      var local='<div class="ok"><b>ヒント</b><ol><li>最初の一文は、こう始めてみましょう：<br><b>'+esc(x.start)+'</b></li><li>あなたの構想「'+esc(plan)+'」の中から、いちばん言いたいことを1つ選び、〜の部分に入れます。</li><li>次の一文に、そのとき感じた気持ちを書きます（例：「とても不安でした」）。</li><li>最後の一文で、その段落のまとめを書きます。</li></ol></div>';
      if(!aiOn()||!S.aiok){S.paraOut=local+(aiOn()?'<div class="tip">AIのヒントを受けるには、「承知しました」にチェックを入れてから、もう一度押してください。</div>':"");rerender();return}
      S.paraOut='<div class="tip">AIが考えています…</div>';rerender();
      var p=baseCtx();p.action="hint";p.index=w.idx+1;p.total=w.n;p.role=x.name;p.plan=w.plan.slice();p.text=ta.value;p.prev=w.paras.slice(0,w.idx);
      aiCall(p,function(j){S.paraOut=(j&&j.ok!==false)?evalHtml(j,"ヒント"):local;rerender()})};
    var nx=document.getElementById("pnext"),fin=document.getElementById("pfin"),bk=document.getElementById("pback"),pp=document.getElementById("pplan");
    var need=function(){w.paras[w.idx]=ta.value;if(!ta.value.trim()){alert("この段落をまだ書いていません。1文でも書いてから進みましょう。書けないときは「ヒントをもらう」を押してください。");return false}D.essay=allText();return true};
    if(nx)nx.onclick=function(){if(!need())return;w.idx++;S.paraOut="";render();window.scrollTo(0,0)};
    if(fin)fin.onclick=function(){if(!need())return;w.stage="final";S.finalOut="";render();window.scrollTo(0,0)};
    if(bk)bk.onclick=function(){w.paras[w.idx]=ta.value;w.idx--;S.paraOut="";render();window.scrollTo(0,0)};
    if(pp)pp.onclick=function(){w.paras[w.idx]=ta.value;w.stage="plan";render();window.scrollTo(0,0)};
  } else {
    D.essay=allText();
    document.getElementById("fedit").onclick=function(){w.stage="write";w.idx=0;S.paraOut="";render();window.scrollTo(0,0)};
    document.getElementById("feval").onclick=function(){
      var t=allText(),lc=localCheck(t,0);lc.local=true;lc.good=lc.good.slice(0,3);
      if(!aiOn()||!S.aiok){S.finalOut=evalHtml(lc,"全体")+(aiOn()?'<div class="tip">AIのアドバイスも受けるには、「承知しました」にチェックを入れてから、もう一度押してください。</div>':"");rerender();return}
      S.finalOut='<div class="tip">AIが見ています。少し待ってください…</div>';rerender();
      var p=baseCtx();p.action="full";p.plan=w.plan.slice();p.paras=w.paras.slice();
      aiCall(p,function(j){if(j&&j.ok===false)j=lc;S.finalOut=evalHtml(j,"全体");w.ev.full=j;rerender()})};
    document.getElementById("fsend").onclick=function(){
      var t=lineGuard();if(!t)return;hRecord();logSend();lineSend(t)};
    document.getElementById("fnew").onclick=function(){
      if(this.getAttribute("data-c")!=="1"){this.setAttribute("data-c","1");this.textContent="本当に新しく始める（送った内容は記録に残っています）";return}
      D.W=null;D.essay="";S.planOut="";S.paraOut="";S.finalOut="";render();window.scrollTo(0,0)};
  }
}
function logSend(){
  var w=W(),f=w.ev.full||{};
  aiCall({action:"log",kind:"送信",round:hNextNo(),schools:schoolInfo().map(function(s){return s.name}),score:f.score==null?"":f.score,good:(f.good||[]).join(" / "),issues:(f.issues||[]).join(" / "),chars:hCount(allText()||D.essay),text:allText()||D.essay||""},function(){})}

/* ---------- すべてのページの「AIに質問／野田先生に質問」 ---------- */
function pageLabel(){
  if(S.tab==="sakubun"||S.tab==="shouron"||S.tab==="genkou"){var L=LESSONS[S.lessonKey];return L.title+"（"+(S.lessonIdx+1)+"ページ目）"+L.pages[S.lessonIdx].t}
  var m={home:"ホーム",research:"志望校リサーチ",input:"素材ノート",sheet:"素材シート",essay:"原稿用紙で書く",write:"段落で書く",quiz:"ミニテスト"};return m[S.tab]||S.tab}
/* ---------- フロート質問（AIに質問／野田先生にLINEで質問）全ページ共通 ---------- */
var QAF_CSS='#qaf{position:fixed;right:12px;bottom:14px;z-index:90;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-family:inherit}'+
'#qaf .fb{border:0;border-radius:999px;padding:12px 16px;font-size:15px;font-weight:700;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.28);cursor:pointer}'+
'#qaf .fb.ai{background:#2e8fd0}#qaf .fb.ln{background:#06c755}'+
'#qaf .pn{width:min(380px,calc(100vw - 24px));max-height:78vh;overflow:auto;background:#fff;border:3px solid #2e8fd0;border-radius:18px;padding:14px;box-shadow:0 8px 28px rgba(0,0,0,.3);box-sizing:border-box}'+
'#qaf .pn.sen{border-color:#06c755}#qaf .pn h3{margin:0 0 6px;font-size:17px}'+
'#qaf .pn textarea{width:100%;min-height:90px;box-sizing:border-box;font-size:16px;padding:8px;border:2px solid #cfe3f3;border-radius:10px}'+
'#qaf .x{float:right;border:0;background:#eef3f8;border-radius:50%;width:30px;height:30px;font-size:16px;cursor:pointer}'+
'@media print{#qaf{display:none}}';
function qaHtml(){return ""}
function qaMake(){
  var f=document.getElementById("qaf");
  if(!f){
    if(!document.getElementById("qaf-css")){var st=document.createElement("style");st.id="qaf-css";st.textContent=QAF_CSS;document.head.appendChild(st)}
    f=document.createElement("div");f.id="qaf";f.className="noprint";document.body.appendChild(f)}
  return f}
function qaDraw(){
  var q0=document.getElementById("qaq");if(q0&&q0.value!=null&&S.qaMode)S.qaText=q0.value;
  var f=qaMake(),m=S.qaMode||"";
  if(!(S.unlocked&&S.consent&&S.pen)){f.style.display="none";return}
  f.style.display="";
  var h="";
  if(m==="ai"){
    h+='<div class="pn"><button class="x" id="qax">×</button><h3>🤖 AIに質問</h3>'+aiGate()+
    '<textarea id="qaq" placeholder="例：「きっかけ」が思いつきません。どう考えたらいいですか。">'+esc(S.qaText||"")+'</textarea>'+
    '<p><button class="btn" id="qago">AIに質問する</button></p><div id="qaans">'+(S.qaAns||"")+'</div>'+
    (aiOn()?"":'<div class="tip">AIへの質問は、準備ができたら使えるようになります。いまは「野田先生にLINEで質問」をお使いください。</div>')+
    '<div class="ok" style="margin-top:10px;background:#e8f8ee;border-color:#06c755"><b>AIで解決しなかったときは、次に野田先生に聞けます。</b><br><button class="btn" id="qa2sen" style="background:#06c755;color:#fff;margin-top:6px">野田先生にLINEで質問する（上の質問がそのまま入ります）</button></div>'+
    '<p class="small">いまのページ：'+esc(pageLabel())+'</p></div>'}
  if(m==="sensei"){
    h+='<div class="pn sen"><button class="x" id="qax">×</button><h3>野田先生にLINEで質問</h3>'+
    '<textarea id="qaq" placeholder="先生に聞きたいことを書きます">'+esc(S.qaText||"")+'</textarea>'+
    '<div class="ok"><b>返信は最大3営業日以内です。</b>できるだけ早く返信します。</div>'+
    '<p><button class="btn" id="qago">LINEで野田先生に送る</button></p><p class="small">いまのページ：'+esc(pageLabel())+'</p></div>'}
  h+='<div><button class="fb ai" id="qaai">🤖 AIに質問</button> <button class="fb ln" id="qasen">先生にLINEで質問</button></div>';
  f.innerHTML=h;
  var keep=function(){var q=document.getElementById("qaq");if(q)S.qaText=q.value};
  document.getElementById("qaai").onclick=function(){keep();S.qaMode=S.qaMode==="ai"?"":"ai";S.qaAns="";qaDraw()};
  document.getElementById("qasen").onclick=function(){keep();S.qaMode=S.qaMode==="sensei"?"":"sensei";qaDraw()};
  var t2=document.getElementById("qa2sen");if(t2)t2.onclick=function(){keep();S.qaMode="sensei";qaDraw()};
  var x=document.getElementById("qax");if(x)x.onclick=function(){keep();S.qaMode="";qaDraw()};
  Array.prototype.forEach.call(f.querySelectorAll(".aiok"),function(c){c.onchange=function(){keep();S.aiok=c.checked;qaDraw()}});
  var go=document.getElementById("qago");if(!go)return;
  go.onclick=function(){
    var q=document.getElementById("qaq").value;S.qaText=q;
    if(!q.trim()){alert("聞きたいことを書いてください。");return}
    if(hasPII(q)){alert("電話番号・住所・メールアドレスのような文字が入っています。消してください。");return}
    if(S.qaMode==="sensei"){
      lineSend("【質問】\nペンネーム："+(S.pen||"")+"\nページ："+pageLabel()+"\n\n"+q+"\n\n※返信は最大3営業日以内です。できるだけ早く返信します。");return}
    if(!aiOn()){alert("AIへの質問は、まだ準備中です。野田先生にLINEで質問してください。");return}
    if(!S.aiok){alert("AIを使うには、「承知しました」にチェックを入れてください。");return}
    S.qaAns='<div class="tip">AIが考えています…</div>';qaDraw();
    var p=baseCtx();p.action="ask";p.page=pageLabel();p.question=q;
    aiCall(p,function(j){S.qaAns=(j&&j.ok!==false&&j.text)?'<div class="ok">'+nl(j.text)+'<p class="small">'+esc(DISCLAIMER)+'</p></div>':evalHtml(j);qaDraw()})}
}
function bindQA(){qaDraw()}

/* ---------- 職歴（追加・修正・削除） ---------- */
function jobsList(){if(!D.jobs)D.jobs=[];return D.jobs}
function ymStr(y,m){return (y?y+"年":"")+(m?m+"月":"")}
function jobLabel(j){return ymStr(j.fy,j.fm)+" 〜 "+(j.now?"現在":ymStr(j.ty,j.tm))}
function jobsText(){
  var L=jobsList();if(!L.length)return "（なし）";
  return L.map(function(j,i){return (i+1)+". "+jobLabel(j)+"　"+(j.emp||"")+(j.place?"（"+j.place+"）":"")+"\n   業務内容："+(j.duty||"")}).join("\n")}
function monthOpts(cur){var o='<option value="">月</option>';for(var m=1;m<=12;m++)o+='<option value="'+m+'"'+(String(cur)===String(m)?" selected":"")+'>'+m+'月</option>';return o}
function jobForm(j,i){
  var emp=["正職員","非正規（パート・アルバイト・派遣）","その他"];
  return '<div class="jobc jobform" style="background:var(--sun-l);border-color:var(--sun)"><b>'+(i<0?"職歴を追加":"職歴を修正")+'</b>'+
  '<div class="small">はじめ</div><div class="two"><input type="number" id="jfy" placeholder="西暦（例：2019）" value="'+esc(j.fy||"")+'"><select id="jfm">'+monthOpts(j.fm)+'</select></div>'+
  '<div class="small">おわり</div><div class="two"><input type="number" id="jty" placeholder="西暦（例：2022）" value="'+esc(j.ty||"")+'"'+(j.now?" disabled":"")+'><select id="jtm"'+(j.now?" disabled":"")+'>'+monthOpts(j.tm)+'</select></div>'+
  '<label style="display:block;margin:4px 0"><input type="checkbox" id="jnow" '+(j.now?"checked":"")+'> 現在も続けている</label>'+
  '<div class="small">雇用の形</div><select id="jemp"><option value="">えらんでください</option>'+emp.map(function(o){return '<option'+(j.emp===o?" selected":"")+'>'+esc(o)+'</option>'}).join("")+'</select>'+
  '<div class="small">勤務先・業種 <span>（任意。会社名は書かなくてOK）</span></div><input type="text" id="jplace" value="'+esc(j.place||"")+'" placeholder="例：介護施設、スーパー">'+
  '<div class="small">業務内容</div><textarea id="jduty" style="min-height:90px" placeholder="どんな仕事を担いましたか">'+esc(j.duty||"")+'</textarea>'+
  '<p><button class="btn" id="jsave" data-i="'+i+'">この内容で保存</button> <button class="btn line" id="jcancel">やめる</button></p></div>'}
function jobsHtml(){
  var L=jobsList(),h='<div class="jobs">';
  if(!L.length&&S.jobEdit!==-1)h+='<p class="small">まだ書いていません。「＋職歴を追加」を押して、1つずつ入れましょう。</p>';
  L.forEach(function(j,i){
    if(S.jobEdit===i){h+=jobForm(j,i);return}
    h+='<div class="jobc"><b>'+esc(jobLabel(j))+'</b>　'+esc(j.emp||"")+(j.place?'（'+esc(j.place)+'）':'')+
    '<div style="white-space:pre-wrap">'+esc(j.duty||"")+'</div>'+
    '<div class="noprint" style="margin-top:4px"><button class="btn line jedit" data-i="'+i+'">修正</button> <button class="btn line jdel" data-i="'+i+'">削除</button></div></div>'});
  if(S.jobEdit===-1)h+=jobForm({},-1);
  else h+='<p class="noprint"><button class="btn jadd">＋ 職歴を追加</button></p>';
  return h+'</div>'}
function bindJobs(){
  var rr=function(){var y=window.scrollY;render();window.scrollTo(0,y)};
  var ad=app.querySelectorAll(".jadd");Array.prototype.forEach.call(ad,function(b){b.onclick=function(){S.jobEdit=-1;rr()}});
  Array.prototype.forEach.call(app.querySelectorAll(".jedit"),function(b){b.onclick=function(){S.jobEdit=+b.getAttribute("data-i");rr()}});
  Array.prototype.forEach.call(app.querySelectorAll(".jdel"),function(b){b.onclick=function(){
    if(b.getAttribute("data-c")!=="1"){b.setAttribute("data-c","1");b.textContent="本当に削除";return}
    jobsList().splice(+b.getAttribute("data-i"),1);S.jobEdit=null;rr()}});
  var now=document.getElementById("jnow");
  if(now)now.onchange=function(){document.getElementById("jty").disabled=now.checked;document.getElementById("jtm").disabled=now.checked};
  var cancel=document.getElementById("jcancel");if(cancel)cancel.onclick=function(){S.jobEdit=null;rr()};
  var sv=document.getElementById("jsave");
  if(sv)sv.onclick=function(){
    var j={fy:document.getElementById("jfy").value.trim(),fm:document.getElementById("jfm").value,now:document.getElementById("jnow").checked,
      ty:document.getElementById("jty").value.trim(),tm:document.getElementById("jtm").value,emp:document.getElementById("jemp").value,
      place:document.getElementById("jplace").value.trim(),duty:document.getElementById("jduty").value.trim()};
    if(j.now){j.ty="";j.tm=""}
    if(!j.fy||!j.fm){alert("はじめの年と月を入れてください。");return}
    if(!j.now&&(!j.ty||!j.tm)){alert("おわりの年と月を入れてください。続けている仕事は「現在も続けている」にチェックします。");return}
    if(!j.duty){alert("業務内容を書いてください。");return}
    if(hasPII([j.place,j.duty].join(" "))){alert("電話番号・住所・メールアドレスのような文字が入っています。消してください。");return}
    var i=+sv.getAttribute("data-i"),L=jobsList();
    if(i>=0)L[i]=j;else L.push(j);
    L.sort(function(a,b){return (+a.fy*12+(+a.fm))-(+b.fy*12+(+b.fm))});
    S.jobEdit=null;rr()}
}

/* ---------- 先生のGoogleシートに保存（素材シートの内容） ---------- */
function profileObj(){
  var j=function(a){return (a||[]).join("、")};
  return {立場:D.who||"",学歴区分:(D.who==="社会人"?D.edu:D.school)||"",学科:D.dept||"",志望校:S.sel.map(function(id){return byId(id).name}).join("、"),
    入試形式:D.exam||"",字数:D.chars||"",制限時間:D.mins||"",部活動:D.club||"",役職:(D.post||"")+(D.postName?"（"+D.postName+"）":""),
    高校での入賞:(D.prizeYN||"")+(D.prizeYN==="あり"&&D.prize?"："+D.prize:""),高校で頑張ったこと:D.hsEffort||"",
    職歴:D.who==="社会人"?jobsText():"",モットー:D.motto||"",看護につながる経験:D.nurseLink||"",
    つらかったこと:D.hard||"",乗り越え方:D.overcome||"",看護師に役立つこと:D.useful||"",
    お子さん:(D.kids||"")+(D.kidsN?"（"+D.kidsN+"人）":""),ひとり親:D.single||"",入学後の不安:j(D.worry)+(D.worryText?"／"+D.worryText:""),
    自己PR:D.pr||"",頑張ったこと:D.effort||"",研究:D.research||"",なりたい看護師:D.ideal||""}}
function syncSheet(cb){
  if(!aiOn()||!S.pen){if(cb)cb({ok:false});return}
  var all=JSON.stringify(profileObj());
  if(hasPII(all)){if(cb)cb({ok:false});return}
  aiCall({action:"save",profile:profileObj(),round:hNextNo()},function(j){if(cb)cb(j)})}

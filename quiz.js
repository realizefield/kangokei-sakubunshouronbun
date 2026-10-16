/* ====== ミニテスト1（基礎の確認）／ミニテスト2（この場合どうしますか） ====== */
var QUIZ = {
 1: {title:"ミニテスト1　基礎をおぼえよう", intro:"作文・小論文の基礎の確認です。1問ずつ、4つの中から正しいものを選びます。正解すると花吹雪が出ます。", qs:[
  {q:"作文では、何を中心に書きますか。", a:"自分の経験と気持ち", w:["自分の意見と、その理由","むずかしい言葉や、ことわざ","ニュースの内容のまとめ"], e:"作文は「経験と気持ち」、小論文は「意見と理由」が中心です。"},
  {q:"小論文では、何を中心に書きますか。", a:"自分の意見と、その理由", w:["自分の経験と気持ちだけ","他の人の意見のくわしい紹介","思い出の出来事の順番"], e:"小論文は、自分の意見をはっきり示し、理由をそえて書きます。"},
  {q:"一つの文の長さは、どのくらいが読みやすいですか。", a:"40〜60字ぐらい", w:["10字より短く","100字をこえるくらい","長いほど立派に見える"], e:"短く区切るほど、はっきり伝わります。40〜60字を目安にします。"},
  {q:"文末（文の終わり）は、どうそろえますか。", a:"「です・ます」か「だ・である」のどちらかにそろえる", w:["文ごとに、好きなほうを使う","かならず「です・ます」にする","話し言葉のまま書く"], e:"途中で混ぜると読みにくくなります。小論文は「だ・である」調で書きます。"},
  {q:"作文の4つの段落は、どの順に書くと整いますか。", a:"きっかけ → 経験 → 学び → これから", w:["これから → きっかけ → 学び → 経験","経験 → これから → きっかけ → 学び","学び → 経験 → これから → きっかけ"], e:"「きっかけ→経験→学び→これから」の順で、自分の成長が伝わります。"},
  {q:"「私は頑張りました」だけでは伝わりません。何を足しますか。", a:"いつ・どこで・何をしたか（具体的なエピソード）", w:["もっと強い言葉（とても、非常に）","むずかしい漢字","同じ文をくり返す"], e:"具体的な出来事が1つあると、あなたの言葉に説得力が出ます。"},
  {q:"小論文の基本の型は、どれですか。", a:"結論 → 理由 → 具体例 → まとめ", w:["具体例 → まとめ → 理由 → 結論","理由 → まとめ → 結論 → 具体例","まとめ → 具体例 → 結論 → 理由"], e:"先に結論を示すと、読む人が迷いません。"},
  {q:"原稿用紙で、段落の初めは、どうしますか。", a:"最初の1マスを空ける", w:["空けずに、すぐ書き始める","2マス空ける","行の真ん中から書く"], e:"段落が変わるときは、最初の1マスを空けます。"},
  {q:"縦書きで、行の最初のマスに「。」が来そうです。どうしますか。", a:"前の行の最後のマスに入れる", w:["行の最初のマスに書く","「。」を書かない","次の行の2マス目に書く"], e:"句読点（、。）は、行の最初のマスには書きません。前の行の最後のマスに入れます。"},
  {q:"縦書きで、2018年を正しく書いているのは、どれですか。", a:"二〇一八年", w:["二千十八年","2018年（算用数字）","二〇一八ねん"], e:"縦書きでは漢数字を使い、西暦は「二〇一八年」と書きます。「二千十八年」は×です。"}
 ]},
 2: {title:"ミニテスト2　この場合、どうしますか", intro:"試験のときに、よくある場面です。どうするのがよいか、4つの中から選びます。正解すると花吹雪が出ます。", qs:[
  {q:"「高校時代、部活動を頑張りました。」としか書けません。どうしますか。", a:"いつ・どこで・何をしたかを1つ思い出して、書き足す", w:["「とても」「非常に」を足して強くする","同じ文をもう一度書く","次の段落に進んで、あとで考える"], e:"具体的な出来事を1つ入れると、あなたの頑張りが伝わります。"},
  {q:"書いていたら、一つの文が100字ぐらいになってしまいました。どうしますか。", a:"「。」で区切って、2つの文に分ける", w:["そのままにする","「、」をたくさん足す","文を消して、短い一文だけ残す"], e:"40〜60字を目安に、短く区切ります。"},
  {q:"800字の指定で、残り10分なのに、500字しか書けていません。どうしますか。", a:"経験の具体例や、学んだことを書き足して、8割（640字）以上にする", w:["字数が足りなくても、そのまま出す","同じ内容をくり返して字数を増やす","空白の行をあけて、長く見せる"], e:"字数は8割〜10割が目安です。短すぎるのもよくありません。"},
  {q:"小論文のテーマについて、賛成も反対も言えそうで、決められません。どうしますか。", a:"どちらかに決めて、その理由を書く", w:["「どちらとも言えない」と書いて終わる","賛成と反対を、同じ分量で書く","テーマと関係ない話を書く"], e:"立場を決めて書くと、意見がはっきり伝わります。"},
  {q:"自分の意見と反対の意見があることを知っています。どうしますか。", a:"反対の意見も一度ふまえてから、自分の意見にもどる", w:["反対の意見は、ぜったいに書かない","反対の意見だけを書く","反対の意見を、強い言葉で否定する"], e:"「確かに〜という意見がある。しかし〜」の形が、説得力を高めます。"},
  {q:"書き終わって、時間が少し余りました。どうしますか。", a:"誤字・脱字、文末、字数、最後の一文を見直す", w:["何もせず、座って待つ","最初から全部書き直す","余白に、思いついたことを書き足す"], e:"見直しの順番は、①誤字・脱字 ②文末の統一 ③字数 ④最後の一文です。"},
  {q:"「食べれる」と書いてしまったことに気づきました。どうしますか。", a:"「食べられる」に直す（ら抜き言葉をやめる）", w:["そのままにする","「食べれる」を二重線で消して、また「食べれる」と書く","ひらがなで「たべれる」と書く"], e:"「ら抜き言葉」は、「見られる」「食べられる」の形に直します。"},
  {q:"60分で800字の作文です。書き始める前に、まず何をしますか。", a:"5分ほどで、段落の構成メモを作る", w:["すぐに1行目から書き始める","最後の段落から先に書く","時計を見ずに、全部書いてから考える"], e:"目安は、構成メモ5分→本文40分→見直し10分→予備5分です。"}
 ]}
};
function shuf(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function quizStart(n){
  var Q=QUIZ[n];
  S.quiz={n:n,i:0,score:0,picked:-1,done:false,
    items:Q.qs.map(function(x){var ch=shuf([x.a].concat(x.w));return {q:x.q,ch:ch,ans:ch.indexOf(x.a),e:x.e}})}}

/* ---------- 花吹雪 ---------- */
function confetti(){
  try{
    if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    var c=document.createElement("canvas");c.style.cssText="position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:200";
    var W=window.innerWidth||360,H=window.innerHeight||640;c.width=W;c.height=H;
    var g=c.getContext&&c.getContext("2d");if(!g)return;
    document.body.appendChild(c);
    var cols=["#ffb7c5","#ff8fab","#ffd166","#ffffff","#ffc2d1","#a0e7c8","#9bd7ff"],P=[];
    for(var i=0;i<90;i++)P.push({x:Math.random()*W,y:-20-Math.random()*H*0.6,vx:-1+Math.random()*2,vy:1.5+Math.random()*2.5,r:Math.random()*6.28,vr:(Math.random()-0.5)*0.2,s:6+Math.random()*7,c:cols[i%cols.length],ph:Math.random()*6.28});
    var t0=Date.now();
    (function f(){
      var t=Date.now()-t0;g.clearRect(0,0,W,H);
      P.forEach(function(p){p.x+=p.vx+Math.sin(t/300+p.ph)*0.8;p.y+=p.vy;p.r+=p.vr;
        g.save();g.translate(p.x,p.y);g.rotate(p.r);g.globalAlpha=Math.max(0,1-t/3200);g.fillStyle=p.c;
        g.beginPath();g.ellipse(0,0,p.s,p.s*0.55,0,0,6.28);g.fill();g.restore()});
      if(t<3200)requestAnimationFrame(f);else if(c.parentNode)c.parentNode.removeChild(c)
    })();
  }catch(e){}
}

/* ---------- 画面 ---------- */
function viewQuiz(){
  if(!S.quiz)quizStart(S.quizN||1);
  var z=S.quiz,Q=QUIZ[z.n],tot=z.items.length;
  if(z.done){
    var pct=Math.round(z.score/tot*100),msg=pct===100?"全問正解です。すばらしい！":(pct>=70?"よくできました。まちがえたところだけ、もう一度ふり返りましょう。":"だいじょうぶです。もう一度挑戦すると、きっとおぼえられます。");
    return '<div class="card"><h2>'+esc(Q.title)+'</h2><h3 style="font-size:22px;text-align:center">'+z.score+' / '+tot+' 問 正解</h3><p style="text-align:center">'+esc(msg)+'</p>'+
    '<p style="text-align:center;margin-top:14px"><button class="btn line" id="qretry">もう一度挑戦する</button> <button class="btn sun" id="qnext">次に進む →</button></p>'+
    '<p class="small" style="text-align:center">'+(z.n===1?"次は、ミニテスト2「この場合、どうしますか」です。":"次は、志望校リサーチ（または素材ノート）に進みます。")+'</p></div>'}
  var it=z.items[z.i],answered=z.picked>=0;
  var h='<div class="card"><h2>'+esc(Q.title)+'</h2>'+(z.i===0&&!answered?'<p class="small">'+esc(Q.intro)+'</p>':'')+
  '<div class="progress"><i style="width:'+Math.round((z.i+(answered?1:0))/tot*100)+'%"></i></div><p class="small">'+(z.i+1)+' / '+tot+'　（いまの正解数：'+z.score+'）</p>'+
  '<h3 style="font-size:18px">'+esc(it.q)+'</h3><div class="qch">';
  it.ch.forEach(function(c,k){
    var cls="qbtn";if(answered){if(k===it.ans)cls+=" qok";else if(k===z.picked)cls+=" qng"}
    h+='<button class="'+cls+'" data-c="'+k+'" '+(answered?"disabled":"")+'><b>'+"ABCD".charAt(k)+'</b> '+esc(c)+'</button>'});
  h+='</div>';
  if(answered){
    var good=z.picked===it.ans;
    h+='<div class="'+(good?"ok":"warn")+'" style="margin-top:10px"><b>'+(good?"🌸 せいかい！":"ざんねん。正しいのは「"+"ABCD".charAt(it.ans)+"」です。")+'</b><br>'+esc(it.e)+'</div>'+
    '<p><button class="btn" id="qgo">'+(z.i<tot-1?"次の問題へ →":"結果を見る")+'</button></p>'}
  return h+'</div>'}
function bindQuiz(){
  var z=S.quiz;
  Array.prototype.forEach.call(app.querySelectorAll(".qbtn"),function(b){b.onclick=function(){
    if(z.picked>=0)return;var k=+b.getAttribute("data-c");z.picked=k;
    if(k===z.items[z.i].ans){z.score++;confetti()}
    var y=window.scrollY;render();window.scrollTo(0,y)}});
  var go1=document.getElementById("qgo");if(go1)go1.onclick=function(){
    if(z.i<z.items.length-1){z.i++;z.picked=-1}else z.done=true;render();window.scrollTo(0,0)};
  var rt=document.getElementById("qretry");if(rt)rt.onclick=function(){quizStart(z.n);render();window.scrollTo(0,0)};
  var nx=document.getElementById("qnext");if(nx)nx.onclick=function(){
    if(z.n===1){quizStart(2);render();window.scrollTo(0,0)}
    else{S.quiz=null;go(S.sel.length?"input":"research")}};
  var all=z.done&&z.score===z.items.length;if(all)confetti();
}

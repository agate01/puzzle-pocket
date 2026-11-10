const $ = s => document.querySelector(s);
const homeView = $("#homeView"), gameView = $("#gameView"), homeBtn = $("#homeBtn");
const STORAGE = "puzzle-pocket-v1";
let stats = JSON.parse(localStorage.getItem(STORAGE) || '{"attempts":0,"solved":0,"favorites":[]}');
let current = null;
const puzzles = {
  riddle: [
    {title:"消えたコイン",q:"テーブルの上にコインが5枚あります。あなたは2枚をポケットに入れました。あなたが持っているコインは何枚？",a:["2","２","二枚","2枚"],hint:"テーブルに残った枚数ではなく、あなたが持っている枚数。",ex:"ポケットに入れた2枚。問題文の「あなたが持っている」に注目するひっかけ問題だよ。"},
    {title:"雨の日の散歩",q:"ある人は傘を持たずに雨の中を歩きました。帽子もかぶっていないのに、髪の毛はまったく濡れませんでした。なぜ？",a:["はげ","髪がない","坊主","スキンヘッド"],hint:"雨が当たる場所に、濡れる髪があったかな？",ex:"その人には髪の毛がなかったから。"},
    {title:"時計の音",q:"時計が6回鳴るのに5秒かかります。同じ間隔で12回鳴るには何秒かかる？",a:["11","11秒"],hint:"音と音の「あいだ」は何回ある？",ex:"6回鳴る間には5つの間隔。1間隔は1秒なので、12回なら11秒。"},
    {title:"兄弟の年齢",q:"兄は弟より4歳年上です。5年後、2人の年齢の差はいくつ？",a:["4","4歳"],hint:"2人とも同じだけ年を取るよ。",ex:"年齢差は変わらず4歳。"}
  ],
  shape: [
    {title:"マッチ棒の三角形",q:"同じ長さのマッチ棒を6本使って、同じ大きさの正三角形を4つ作るには？",a:["立体","三角錐","正四面体","四面体"],hint:"紙の上だけで考えず、立体にしてみよう。",ex:"正四面体を作る。底面と3つの側面で、正三角形が4つできるよ。"},
    {title:"四角形はいくつ？",q:"正方形を縦横それぞれ2等分して、同じ大きさの小さな正方形4つにしました。図の中に正方形はいくつある？",a:["5","５","五つ","5個"],hint:"小さい正方形だけでなく、全体も数えよう。",ex:"小さい正方形4つと、外側の大きな正方形1つで合計5つ。"},
    {title:"向きを変える",q:"数字の『6』を上下逆さまにすると『9』になります。では、上下逆さまにしても変わらない数字は？（一般的なデジタル表示で考えてね）",a:["0","8","0と8","8と0"],hint:"丸や左右対称の形に注目。",ex:"0と8。どちらも上下を逆さにしても同じ形。"},
    {title:"立方体の面",q:"立方体の面はいくつ？",a:["6","６","六","6面"],hint:"サイコロを思い浮かべて。",ex:"立方体には6つの面があるよ。"}
  ],
  logic: [
    {title:"3人の順位",q:"AさんはBさんより上位。CさんはAさんより下位ですが、Bさんより上位です。1位から順に並べると？",a:["a c b","a,c,b","acb","aさん、cさん、bさん","a b c".replaceAll(" ","")],hint:"条件を2つの比較に分けてみよう。",ex:"A ＞ C ＞ B。したがってA、C、Bの順。"},
    {title:"うそつきは誰？",q:"赤・青・黄の箱があり、宝物は1つ。赤の札『宝物は青の箱』、青の札『宝物はここにはない』、黄の札『宝物は赤の箱』。3つの札のうち正しいのは1つだけ。宝物はどこ？",a:["黄色","黄","黄の箱","yellow"],hint:"宝物が赤・青・黄の場合をそれぞれ試そう。",ex:"黄の箱。赤なら赤と青の札が正しくなり2つ。青なら赤の札だけでなく青の札は誤り、黄の札も誤りで1つ。黄なら赤・青・黄の札がそれぞれ誤・正・誤となり1つ。※青の場合も1つになるため、この問題は条件が不足しているよ。"},
    {title:"並んだ本",q:"赤・青・緑の本が左から1冊ずつ並んでいます。赤は青より左。緑は赤より右。真ん中の本はどれ？",a:["赤","赤い本","red"],hint:"赤がいちばん左になる条件だね。",ex:"赤・青・緑、または赤・緑・青のどちらも条件を満たすので、真ん中は一意に決まりません。これは「情報不足」を見抜く問題。答えは一意に決まらない。"},
    {title:"曜日の推理",q:"昨日の翌日は、今日です。では、明日の前日は何曜日？",a:["今日","きょう","today"],hint:"言葉をそのまま置き換えてみよう。",ex:"明日の前日は今日。曜日を特定する情報はないので、答えは「今日」だよ。"}
  ]
};
let puzzleIndex = 0, selectedCell = -1, board = [], solution = [], fixed = [], difficulty = "ふつう";

function save(){localStorage.setItem(STORAGE,JSON.stringify(stats));renderStats()}
function renderStats(){
 $("#solvedCount").textContent=stats.solved;$("#attemptCount").textContent=stats.attempts;
 $("#accuracy").textContent=stats.attempts?Math.round(stats.solved/stats.attempts*100)+"%":"—";
}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1700)}
function showHome(){current=null;gameView.hidden=true;homeView.hidden=false;homeBtn.hidden=true;renderStats()}
function showGame(html){homeView.hidden=true;gameView.hidden=false;homeBtn.hidden=false;gameView.innerHTML=html}
homeBtn.addEventListener("click",showHome);
document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>openCategory(b.dataset.category)));
renderStats();

function openCategory(cat){
 current=cat;
 if(cat==="sudoku"){showSudokuIntro();return}
 const names={riddle:"ひらめき問題",shape:"図形・マッチ棒",logic:"論理推理"};
 puzzleIndex=0;
 showPuzzle(cat);
}
function showPuzzle(cat){
 const p=puzzles[cat][puzzleIndex%puzzles[cat].length];
 showGame(`<div class="backline"><button class="back-btn" id="back">← 戻る</button><span class="muted">${cat==="riddle"?"ひらめき問題":cat==="shape"?"図形・マッチ棒":"論理推理"}</span></div>
 <div class="panel"><div class="problem-number">PUZZLE ${String(puzzleIndex+1).padStart(2,"0")} / ${puzzles[cat].length}</div><h2>${p.title}</h2><p class="question">${p.q}</p>
 <input id="answer" class="answer-input" placeholder="答えを入力…" autocomplete="off">
 <div class="button-row"><button class="action" id="check">答え合わせ</button><button class="action secondary" id="hint">ヒント</button><button class="action secondary" id="next">次の問題</button></div>
 <div id="feedback" aria-live="polite"></div><div id="hintText"></div></div>`);
 $("#back").onclick=showHome;
 $("#check").onclick=()=>checkTextAnswer(cat,p);
 $("#answer").addEventListener("keydown",e=>{if(e.key==="Enter")checkTextAnswer(cat,p)});
 $("#hint").onclick=()=>{$("#hintText").innerHTML=`<p class="hint">ヒント：${p.hint}</p>`};
 $("#next").onclick=()=>{puzzleIndex=(puzzleIndex+1)%puzzles[cat].length;showPuzzle(cat)};
}
function checkTextAnswer(cat,p){
 const value=$("#answer").value.trim().toLowerCase().replace(/[ 　]/g,"");
 if(!value){toast("答えを入力してね");return}
 stats.attempts++;
 const correct=p.a.some(a=>a.toLowerCase().replace(/[ 　]/g,"")===value);
 if(correct){stats.solved++;$("#feedback").innerHTML=`<div class="feedback good">正解！<br>${p.ex}</div>`}
 else{$("#feedback").innerHTML=`<div class="feedback bad">今回は不正解。もう一度考えてみよう。<br>解説：${p.ex}</div>`}
 save();$("#check").disabled=true;
}

function showSudokuIntro(){
 showGame(`<div class="backline"><button class="back-btn" id="back">← 戻る</button><span class="muted">数字パズル</span></div>
 <div class="panel"><h2>数独</h2><p class="description">縦・横・3×3のブロックに、1から9までの数字を重複しないように入れよう。</p>
 <div class="difficulty" id="difficulty"><button data-d="かんたん">かんたん</button><button data-d="ふつう" class="active">ふつう</button><button data-d="むずかしい">むずかしい</button></div>
 <button class="action" id="startSudoku">新しい問題を始める</button><p class="empty-note">問題は端末内で生成するよ。通信は不要。</p></div>`);
 $("#back").onclick=showHome;
 $("#difficulty").querySelectorAll("button").forEach(b=>b.onclick=()=>{difficulty=b.dataset.d;$("#difficulty").querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b))});
 $("#startSudoku").onclick=startSudoku;
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function makeSolved(){
 const bands=shuffle([0,1,2]), rows=[];
 bands.forEach(b=>shuffle([0,1,2]).forEach(r=>rows.push(b*3+r)));
 const stacks=shuffle([0,1,2]), cols=[];
 stacks.forEach(s=>shuffle([0,1,2]).forEach(c=>cols.push(s*3+c)));
 const nums=shuffle([1,2,3,4,5,6,7,8,9]);
 return rows.map(r=>cols.map(c=>nums[(r*3+Math.floor(r/3)+c)%9]));
}
function countSolutions(grid,limit=2){
 let count=0;
 function solve(){
  let best=null,opts=null;
  for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(!grid[r][c]){
   const used=new Set([...grid[r],...grid.map(row=>row[c]),...grid.slice(Math.floor(r/3)*3,Math.floor(r/3)*3+3).flatMap(row=>row.slice(Math.floor(c/3)*3,Math.floor(c/3)*3+3))]);
   const o=[1,2,3,4,5,6,7,8,9].filter(n=>!used.has(n));
   if(!opts||o.length<opts.length){best=[r,c];opts=o}
   if(!o.length)return;
  }
  if(!best){count++;return}
  for(const n of opts){grid[best[0]][best[1]]=n;solve();grid[best[0]][best[1]]=0;if(count>=limit)return}
 }
 solve();return count;
}
function makePuzzle(){
 solution=makeSolved();board=solution.map(r=>r.slice());
 const removeCount=difficulty==="かんたん"?35:difficulty==="むずかしい"?52:44;
 const cells=shuffle(Array.from({length:81},(_,i)=>i));
 let removed=0;
 for(const i of cells){
  if(removed>=removeCount)break;
  const r=Math.floor(i/9),c=i%9,old=board[r][c];board[r][c]=0;
  if(countSolutions(board.map(row=>row.slice()))===1)removed++;else board[r][c]=old;
 }
 fixed=board.map(r=>r.map(v=>v!==0));selectedCell=-1;
}
function startSudoku(){makePuzzle();renderSudoku()}
function renderSudoku(){
 const cells=board.flat().map((v,i)=>`<button class="cell ${fixed[Math.floor(i/9)][i%9]?"fixed":""} ${i===selectedCell?"selected":""}" data-cell="${i}" ${fixed[Math.floor(i/9)][i%9]?"disabled":""}>${v||""}</button>`).join("");
 showGame(`<div class="backline"><button class="back-btn" id="back">← 戻る</button><span class="muted">数独・${difficulty}</span></div>
 <div class="panel"><h2>数独</h2><p class="description">マスを選んで、下の数字を入力。</p><div class="board-wrap"><div class="sudoku">${cells}</div></div>
 <div class="number-pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-num="${n}">${n}</button>`).join("")}<button class="erase" data-num="0">消す</button></div>
 <div class="button-row"><button class="action secondary" id="checkSudoku">答え合わせ</button><button class="action secondary" id="newSudoku">別の問題</button></div><div id="sudokuFeedback"></div></div>`);
 $("#back").onclick=showSudokuIntro;$("#newSudoku").onclick=startSudoku;
 document.querySelectorAll("[data-cell]").forEach(b=>b.onclick=()=>{selectedCell=Number(b.dataset.cell);renderSudoku()});
 document.querySelectorAll("[data-num]").forEach(b=>b.onclick=()=>enterNumber(Number(b.dataset.num)));
 $("#checkSudoku").onclick=checkSudoku;
}
function enterNumber(n){
 if(selectedCell<0){toast("先にマスを選んでね");return}
 const r=Math.floor(selectedCell/9),c=selectedCell%9;if(fixed[r][c])return;
 board[r][c]=n;renderSudoku();
}
function checkSudoku(){
 const complete=board.every(row=>row.every(v=>v!==0));
 const correct=complete&&board.every((row,r)=>row.every((v,c)=>v===solution[r][c]));
 if(correct){stats.attempts++;stats.solved++;save();$("#sudokuFeedback").innerHTML='<div class="feedback good">全問正解！数独クリア！</div>';$("#checkSudoku").disabled=true}
 else{$("#sudokuFeedback").innerHTML=`<div class="feedback ${complete?"bad":""}">${complete?"どこかの数字が違うみたい。":"まだ空欄があるよ。"}${complete?"":" もう少し埋めてみよう。"}</div>`}
}
if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});

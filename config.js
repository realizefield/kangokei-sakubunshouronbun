// ★ 合言葉の設定ファイル ★
// 合言葉を変えるときは、make-passphrase.html を開いて新しい合言葉を入れ、
// 表示された長い文字列を、下の hash の " " の中に貼りつけてください。
// いまの合言葉（仮）： kango2026
var GATE = {
  hash: "06fcd2f1c4618ce4079a751f544f1fb2a6fb1eb9985ed4ae570681b339179f17",
  hint: "江原予備校の先生に聞いてください。"
};

// ★ LINEの設定 ★
// 江原予備校のLINE公式アカウントがある場合は、そのベーシックID（@から始まるもの）を
// oaId の " " の中に入れてください。生徒さんの画面から、ワンタップでそのトークが開きます。
// 空のままの場合は、LINEの共有画面が開くので、生徒さんが先生を選んで送ります。
var LINE_CFG = { oaId: "@735itfta" };

// ★ AI（質問・評価・アドバイス）の設定 ★
// apps-script/Code.gs を Google Apps Script に貼りつけて公開すると、URLができます。
// そのURLを endpoint の " " の中に入れると、AIの質問・評価・アドバイスと、
// スプレッドシートへの記録が動きます。空のあいだは「かんたんチェック（AIなし）」だけが動きます。
var AI_CFG = {
  endpoint: "https://script.google.com/macros/s/AKfycbwEdhwe0zFOshBvz_S9skAbhdpVqIfIZijwL9VmW01XW2Cz50GTu6kh_9ViD02-8EMs_Q/exec",
  ai: true    // AIの鍵（APIキー）を入れたあとは true。止めたいときは false に変えます（その間は「かんたんチェック」が動きます）。
};

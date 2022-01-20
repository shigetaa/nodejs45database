# データベースの使い方

ここでは、データベースについて紹介します。
JavaScriptから利用出来るどんなデータベースがあるか紹介していきます。

## 関係データモデルとNoSQL

現在主流は、リレーショナルデータモデル(関係データベース)を採用したデータベースです。
これは、データを複数の表として管理し、表同士が関係(リレーション)と呼ばれる構造で相互連結可能となっています。
多くのリレーショナルデータベースでは、SQLと呼ばれる問い合わせ言語を用いて、データベースを操作しています。

有名なのは、Oracle Database, Microsoft SQL Server, MySQL, PostgreSQL, DB2, FileMaker, H2 Database, などがあります。

これに対して、関係データモデルを利用しないデータベースモデルを NoSQL と言います。
関係データモデルでないデータストアの特徴として、固定されたスキーマに縛られないこと、関係モデルの結合操作を利用しないこと等があげられます。
「キー」と「値」を組み合わせ、それを入出力するシンプルな Key-Value型データベースもあります。
これをKVS (Key-Value Store)と略すこともあります。
NoSQLがかつやくする場面は関連モデルを必要としないデータを扱う時や、大量のデータを扱うときです。
用とは多様であり、数百万のkey-value ペアを格納したり、数個程度の連想配列を格納したり、数百万の構造的データを格納したりと様々です。
この構造は、大規模なデータを統計的に解析したり、増え続ける情報をリアルタイムにかいせきしたりするにも便利です。

有名なものには、Google BigTable, Amazon DynamoDB などがあります。
また、オープンソースの実装も数多く存在し、MongoDB, Redis, Apache HBase, Apache Casanda などがあります。

## 関係データベース SQLite3 を使う

関連データベースに関して、Node.js では、MySQL や Oracle PostgreSQL など有名なデータベースのライブラリがそろっています。
JavaScript からこれらのデータベースを利用出来るのは、非常に便利です。
ここでは、手軽に利用出来る組み込みデータベースの「 SQLite 」を使ってみることにします。
Node.js で SQLite を利用する為に、npm を利用して 「`sqlite3`」モジュールをインストールしてみます。
```bash
npm i sqlite3
```
データベースを作成し、そこにデータを挿入し、データを取り出して表示するという簡単なプログラムを `sqlite-test.js` と言うファイル名で作成してみます。
```javascript
// モジュールの読み込み
var sqlite3 = require('sqlite3').verbose();
// ローカルＤＢを開く
var db = new sqlite3.Database('test.sqlite')

db.serialize(function () {
	// itemsと言うテーブルが存在してない場合 SQLを実行してテーブルを作成
	db.run('CREATE TABLE IF NOT EXISTS items(name, value)');

	// プリペアードステートメントでデータを挿入
	var stmt = db.prepare('INSERT INTO items VALUES(?, ?)');
	stmt.run(["Banana", 150]);
	stmt.run(["Tomato", 200]);
	stmt.run(["Apple", 300]);
	stmt.finalize();
	// データを取り出す
	db.each("SELECT * FROM items", function (err, row) {
		console.log(row.name + ":" + row.value);
	});
});
db.close();
```
上記のプログラムを実行すると、以下の様に表示されます。
```bash
node sqlite-test.js 
```
```bash
Banana:150
Tomato:200
Apple:300
```

## Web からダウンロードしてSQLite に保存しよう

ここでは、Webサイト「青空文庫」から人気作品をダウンロードしてSQLite に格納するプログラムを`dl-aozora.js`と言うファイル名で作成していきます。

[参考ページ:https://github.com/shigetaa/nodejs23webdownloads](https://github.com/shigetaa/nodejs23webdownloads)

```javascript
var URL_RANKING = "https://www.aozora.gr.jp/access_ranking/2021_xhtml.html";
var MAX_RANK = 30; // 30位までを取得する
var SAVE_DIR = __dirname + "/aozora";

// モジュールの取り込み
var client = require('cheerio-httpcli');
var fs = require('fs');
var URL = require('url');

// 作品一覧データ保存用
var cardlist = [];

// 作品データ保存用のディレクトリを作る
if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR);

// ランキングページをダウンロード
client.fetch(URL_RANKING, function (err, $, res) {
	if (err) { console.log("DL error"); return; }
	// ランキングのテーブル全行を取得
	var tr = $("table.list tr");
	if (!tr) {
		console.log("ページの形式エラー"); return;
	}
	// テーブルの各行を反復
	for (var i = 0; i < tr.length; i++) {
		// 必要な要素を調べる
		var cells = tr.eq(i).children();
		var rank = parseInt(cells.eq(0).text());
		var link = cells.eq(1);
		var href = link.children('a').attr('href')
		var name = link.text().replace(/(^\s+|\s+$)/, "");
		// console.log(rank, name, href);
		if (isNaN(rank) || rank > MAX_RANK) continue;
		// 相対パスを絶対パスに変換 
		href = URL.resolve(URL_RANKING, href);
		cardlist.push([rank, name, href]);
	}
	downloadNextFile();
});

// 各作品をダウンロードする
function downloadNextFile() {
	if (cardlist.length == 0) {
		console.log("処理完了");
		return;
	}
	// 遅延処理させる
	setTimeout(function () {
		var card = cardlist.shift();
		downloadCard(card);
	}, 1000);
}

// カードをダウンロードする 
function downloadCard(card) {
	var index = card[0], name = card[1], link = card[2];
	console.log("図書カード" + index + ":" + name);
	client.fetch(link, function (err, $, res) {
		if (err) { console.log("ERROR"); return; }
		// 全てのリンクを取得し作品ページを類推する
		var xhtml_link = "";
		$("a").each(function (idx) {
			var text = $(this).text();
			var href = $(this).attr('href');
			if (text.indexOf("XHTML版で読む") >= 0) {
				// 相対パスを絶対パスに変換
				href = URL.resolve(link, href);
				xhtml_link = href;
				return false; // これ以後eachしない
			}
		});
		if (xhtml_link == "") {
			console.log("作品リンクが見つかりません");
		}
		// 作品をダウンロードする
		var path = SAVE_DIR + "/" + index + ".html";
		console.log("ダウンロード開始:" + name);
		// 作品のダウンロード時User-Agentの明示が必要 
		//client.setBrowser('chrome');
		client.fetch(xhtml_link, function (err, $, res, body) {
			body = body.replace(/Shift_JIS/ig, "UTF-8");
			fs.writeFileSync(path, body, "utf-8");
			console.log("完了:" + name);
			downloadNextFile();
		});
	});
}
```
上記のプログラムを実行すると、以下の様に表示されます。
```bash
node dl-aozora.js 
```
```bash
図書カード1:〔雨ニモマケズ〕
ダウンロード開始:〔雨ニモマケズ〕
完了:〔雨ニモマケズ〕
図書カード2:走れメロス
ダウンロード開始:走れメロス
完了:走れメロス
図書カード3:山月記
ダウンロード開始:山月記
完了:山月記
図書カード4:羅生門
ダウンロード開始:羅生門
完了:羅生門
図書カード5:こころ
ダウンロード開始:こころ
完了:こころ
処理完了
...[省略]...
```
上記のプログラム補足説明として、外部のサーバーに対して連続でアクセスすると迷惑がかかるので、1秒間隔で通信をしてサーバー負荷を低減する。
最初のページで、作品一覧の詳細ページURLを取得して、詳細ページ内を調査して、作品ページURLを取得後、htmlページをダウンロードして保存する。
保存時には、青空文庫ページは、文字コードSHIFT_JISで作成されているが、`cheerio-httpcli`モジュールでデータを取得時に`UTF-8`に変換してくれるので、htmlページの文字コード宣言部分のSHIFT_JIS文字部分をUTF-8に置換処理をして、ダウンロード保存を処理する。

### SQLite に作品を保存しよう

## NoSQL から LevelDB を使ってみよう
### LevelDB で検索したいとき

## 青空文庫のデータを LevelDB に保存

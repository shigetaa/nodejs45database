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

それでは、ダウンロードした作品をデータベースに保存してみます。
すでにダウンロード済みのHTMLファイルからも作者や作品名を取り出したいので、HTMLをjQueryライクに解析出来るモジュール「 `cheerio` 」を利用します。
```bash
npm i cheerio
```
作品を登録するだけでは面白くないので、作品の作者ランキングベスト30の中で登録回数を調べたプログラム`sqlite-aozora.js`を作成してます。

```javascript
// パスの指定など
var FILES_DIR = __dirname + "/aozora";
var DB_PATH = __dirname + "/aozora.sqlite";

// モジュールの取り込み
var sqlite3 = require('sqlite3').verbose();
var cheerio = require('cheerio');
var fs = require('fs');

// DBに入れるファイル一覧を取得
var files = fs.readdirSync(FILES_DIR);
// HTMLファイルだけ残す
files = files.filter(function (s) {
	return s.match(/\.html$/);
});

// データベースを開く
var db = new sqlite3.Database(DB_PATH);

// データを登録
db.serialize(function () {
	// SQLを実行してテーブルを作成
	db.run("CREATE TABLE IF NOT EXISTS items(" +
		"item_id INTEGER PRIMARY KEY, " +
		"author TEXT, title TEXT, body TEXT)");
	// 挿入用プリペアドステートメントを準備
	var ins_stmt = db.prepare(
		'INSERT INTO items(author, title, body)' +
		'VALUES(?, ?, ?)');
	// 各HTMLファイルを処理
	files.forEach(function (file, i, ar) {
		var html = fs.readFileSync(FILES_DIR + "/" + file);
		// HTMLファイルから情報を得る
		var $ = cheerio.load(html);
		var title = $(".title").text();
		var author = $(".author").text();
		var body = $('body').text();
		// DBに挿入
		ins_stmt.run(author, title, body);
		console.log("+ " + title + " を登録");
	});
	ins_stmt.finalize();
});

// 作者の出現回数を調べる 
console.log("集計結果:");
db.each("SELECT author,COUNT(author) as cnt "
	+ "FROM items GROUP BY author "
	+ "ORDER BY cnt DESC",
	function (err, row) {
		console.log(row.cnt + "回:" + row.author);
	});
```
上記のプログラムを実行すると、以下の様に表示されます。
```bash
node sqlite-aozora.js
```
```bash
+ 〔雨ニモマケズ〕 を登録
+ やまなし を登録
+ 注文の多い料理店 を登録
+ 蜘蛛の糸 を登録
+ 草枕 を登録
+ 坊っちゃん を登録
...[省略]...
集計結果:
6回:宮沢賢治
5回:夏目漱石
3回:太宰治
2回:芥川龍之介
...[省略]...
```

## NoSQL から LevelDB を使ってみよう

次に、関係データベースモデルを利用しない、LevelDBデータベースを利用したいと思います。
そもそも「LevelDB」とは、Key-Value型データストアの一つで、Googleの研究者が開発したものです。
C++で書かれていますが、多くのプログラミング言語から利用できるようになっています。
ちなみに、HTML5の仕様の一つに「IndexdDB」の仕様がありますが、Webブラウザ「google Chrome」でIndexdDBを実装するために、LevelDBが開発されたそうです。
「LevelDB」は組み込み用とで使えるデータベースで、非常に手軽に使う事ができます。
では、早速データベースを利用するモジュール「 `level` 」モジュールをインストールしてみましょう。
```bash
npm i level
```
基本的な使い方のプログラムを`leveldb-test.js`として作成してみましょう。
```javascript
// モジュールの読み込み
var levelup = require('level');
// ローカルＤＢを開く
var db = levelup('./testdb');

// 値を設定
db.put('Apple', 'red', function (err) {
	if (err) { console.log('Error', err); return; }
	testGet();
});

// 値を取得
function testGet() {
	db.get('Apple', function (err, value) {
		if (err) { console.log('Error', err); return; }
		console.log('Apple=' + value);
		testBatch();
	});
}

// 一括設定
function testBatch() {
	db.batch()
		.put('Mango', 'yellow')
		.put('Banana', 'yellow')
		.put('Kiwi', 'green')
		.write(function () { testGet2(); });
}
// 値を取得
function testGet2() {
	db.get('Banana', function (err, value) {
		console.log('Banana=' + value);
	});
}
```
上記のプログラムを実行すると、以下の様に表示されます。
```bash
node leveldb-test.js
```
```bash
Apple=red
Banana=yellow
```
まず、`levelup()`メソッドでデータベースを開きます。

そして、`put()`メソッドを実行すると、値を保存することができます。
```javascript
// [書式] 値の設定
db.put(key, value, function(err){...})
```
`get()`メソッドを実行すると、値を取得することができます。
```javascript
// [書式]値の取得
db.get(key, function(err, value){...})
```
ともに、値が即時に反映されるわけではなく、メソッドが成功した時に、コールバック関数に通知される仕組みとなってます。

値の一括設定方法については、`batch()`メソッドの後、`write()`メソッドまで、メソッドチェーンを利用して、連続で値を書き込む事が出来るようになっています。
他にも、値を設定する`put()`や、キーを削除する`del()`メソッドも利用できます。

### LevelDB で検索したいとき

ところで、levelDBのようなKVS(Key-Value Store)では、どのようにして任意のデータを探したら良いのでしょうか。
早速、`leveldb-test2.js`ファイルにプログラムを記述してみます。
```javascript
var levelup = require('level');
// データベースを開く(データはJSONで)
var opt = { valueEncoding: 'json' };
var db = levelup('./testdb2', opt);

// 一括で値を設定
db.batch()
	.put('fruits!apple', {
		name: 'Apple',
		price: 300,
		color: 'red'
	})
	.put('fruits!orange', {
		name: 'Orange',
		price: 180,
		color: 'orange'
	})
	.put('fruits!banana', {
		name: 'Banana',
		price: 200,
		color: 'yellow'
	})
	.put('fruits!kiwi', {
		name: 'Kiwi',
		price: 220,
		color: 'green'
	})
	.put('snack!poteto', {
		name: 'Poteto-Snack',
		price: 340,
		color: 'brown'
	})
	.put('snack!choco', {
		name: 'Choco-Snack',
		price: 220,
		color: 'black'
	})
	.write(testKeys);

// キーの一覧を取得する
function testKeys() {
	console.log("keys:")
	db.createKeyStream()
		.on('data', function (key) {
			console.log(" - " + key);
		})
		.on('end', testKeyValues);
}

// キーと値の一覧を取得する
function testKeyValues() {
	console.log("\nkey-value-list:");
	db.createReadStream()
		.on('data', function (data) {
			var key = data.key;
			var o = data.value;
			console.log("+ key=" + data.key);
			console.log("| color=" + o.color);
			console.log("| price=" + o.price);
		})
		.on('end', testSearch);
}

// 検索を行う
function testSearch() {
	console.log('\nrange-search:');
	var opt = {
		gt: "snack!",
		lte: "snack!\xFF"
	};
	db.createReadStream(opt)
		.on('data', function (data) {
			console.log("+ key=" + data.key);
		})
		.on('end', function () {
			console.log('ok')
		});
}

```
上記のプログラムを実行すると、以下の様に表示されます。
```bash
node leveldb-test2.js
```
```bash
keys:
 - fruits!apple
 - fruits!banana
 - fruits!kiwi
 - fruits!orange
 - snack!choco
 - snack!poteto

key-value-list:
+ key=fruits!apple
| color=red
| price=300
...[省略]...

range-search:
+ key=snack!choco
+ key=snack!poteto
ok
```
プログラムで登録した、key の中から、**snack** のデータだけ検索する方法ですが、`createReadStream()`メソッドにオプションを付けると、キーの検索をすることができます。
ここでは、「**snack!**」から「**Snack!\xFF**」までのキーを抽出してます。
これは、つまり「**snack!**」から始まるキーをすべて検索することになります。
オプションでは、検索対象範囲を設定して抽出してます。
```javascript
var opt = {
		gt: "snack!", // gt (検索開始文字) gte (検索開始文字以降)
		lte: "snack!\xFF", // lt (検索終了文字) lte (検索終了文字以前)
		limit: -1, // 範囲リミット -1 は無制限になります。　値は数値
		reverse: true, // ソート順序 値は true or false 既定値は true
		keys: true, // 検索結果対象 key? 値は true or false 既定値は true
		values: false, // 検索結果対象 value? 値は true or false 既定値は false
	};
```
## 青空文庫のデータを LevelDB に保存

青空文庫のデータをLeelDBに保存して、簡単な検索をするプログラム`leveldb-aozora.js`ファイルに記述してみます。
```javascript
// パスの指定など
var FILES_DIR = __dirname + "/aozora";
var DB_DIR = __dirname + "/leveldb-aozora";

var levelup = require('level');
var cheerio = require('cheerio');
var fs = require('fs');

// データベースを開く
var db = levelup(DB_DIR);

// DBに入れるファイル一覧を取得
var files = fs.readdirSync(FILES_DIR);
// HTMLファイルだけ残す
files = files.filter(function (s) {
	return s.match(/\.html$/);
});

// 各ファイルのデータをDBに入れる
var count = 0;
files.forEach(function (file, i, ar) {
	// ファイルを開く
	var html = fs.readFileSync(FILES_DIR + "/" + file);
	// HTMLファイルから情報を得る
	var $ = cheerio.load(html);
	var title = $(".title").text();
	var author = $(".author").text();
	var body = $('body').text();
	// データベースに入れる
	// 「作者:作品名」で入れる
	var key = author + ":" + title;
	db.put(key, body, function () { count++; });
	// 作品名で検索できるようにも配慮
	var key2 = "idx-title:" + title + ":" + author;
	db.put(key2, key);
	// console.log(key);
});

// 処理完了を待つ
var wait_proc = function () {
	if (files.length == count) {
		testSearch(); return;
	}
	setTimeout(wait_proc, 100);
};
wait_proc();

// 作者から作品一覧を検索
function testSearch() {
	console.log("\n夏目漱石の作品一覧:");
	var opt = {
		gte: '夏目漱石:',
		lte: '夏目漱石:\uFFFF'
	};
	db.createReadStream(opt)
		.on("data", function (data) {
			console.log(" - " + data.key);
		})
		.on("end", testSearch2);
}

// 作品名で検索する
function testSearch2() {
	var title = '注文の多い料理店';
	console.log("\n作品名[" + title + "]で検索:");
	var opt = {
		gte: 'idx-title:' + title,
		lte: 'idx-title:' + title + "\uFFFF"
	};
	db.createReadStream(opt)
		.on("data", function (data) {
			console.log(" - " + data.value);
		})
		.on("end", testSearch3);
}

// 正規表現で作品を検索
function testSearch3() {
	console.log("\nひらがなの作品を検索:");
	var opt = {
		gte: 'idx-title:',
		lte: 'idx-title:\uFFFF'
	};
	var hiragana_re = /^[ぁ-ん]+$/;
	db.createReadStream(opt)
		.on("data", function (data) {
			var params = data.key.split(":");
			var title = params[1];
			if (!hiragana_re.test(title)) return;
			console.log(" - " + data.value);
		})
}
```
上記のプログラムを実行すると、以下の様に表示されます。
```bash
node leveldb-aozora.js
```
```bash
夏目漱石の作品一覧:
 - 夏目漱石:こころ
 - 夏目漱石:吾輩は猫である
 - 夏目漱石:坊っちゃん
 - 夏目漱石:夢十夜
 - 夏目漱石:草枕

作品名[注文の多い料理店]で検索:
 - 宮沢賢治:注文の多い料理店

ひらがなの作品を検索:
 - 夏目漱石:こころ
 - 宮沢賢治:やまなし
```
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
### SQLite に作品を保存しよう

## NoSQL から LevelDB を使ってみよう
### LevelDB で検索したいとき

## 青空文庫のデータを LevelDB に保存

// モジュールの読み込み
var sqlite3 = require('sqlite3').verbose();
// ローカルＤＢを開く
var db = new sqlite3.Database('test.sqlite')

db.serialize(function () {
	// SQLを実行してテーブルを作成
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
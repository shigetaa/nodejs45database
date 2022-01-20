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


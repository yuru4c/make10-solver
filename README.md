# make10-solver
テンパズル解答器　[**` 開く `**](https://yuru4c.github.io/make10-solver/)

## 概要
テンパズルの解答器です。  
無駄な計算や出力をせず、高速に簡潔な結果を得られます。

## 特徴
変数の数に応じて不等価な式を過不足なく生成します。  
`a+b` と `b+a`、`(a-b)×(c-d)` と `(b-a)×(d-c)` など、等価な式は列挙しません。

使う数の重複は同一変数とみなします。  
式の等価判定は評価よりも時間がかかるため、作る数と等しかったときに行います。

整数、小数および分数（整数/整数）を入力できます。  
浮動小数点数計算は誤差を生ずることがあるため、値は有理数として扱います。

## 備考
`exprs(n: number): Expr[]`
* `n`: 変数の数 (>0)
* 戻り値: 式の配列

`Expr.prototype.toString(strs: string[]): string`
* `strs`: 変数を置き換える文字列の配列
* 戻り値: 式を表す文字列

---

書き出し

```javascript
var set = exprs(4); // 4 変数の式を
var strs = ['a', 'b', 'c', 'd']; // 文字式として
for (var i = 0; i < set.length; i++) {
	console.log(set[i].toString(strs));
}
```

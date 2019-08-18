
var Rational = (function () {
	
	function Rational(n, d) {
		if (arguments.length == 1) {
			d = 1;
		} else {
			if (d == 0) {
				throw new Error();
			}
		}
		
		var divisor = gcd(n, d);
		this.n = n / divisor;
		this.d = d / divisor;
	}
	var prototype = Rational.prototype;
	
	Rational.Z = new Rational(0);
	Rational.I = new Rational(1);
	
	Rational.valueOf = function (str) {
		var s = str.split('/');
		if (s.length == 2) {
			return new Rational(parse(s[0]), parse(s[1]));
		}
		s = str.split('.');
		if (s.length != 1) {
			var f = parse('1' + s[1]) / 10, d = 1;
			while (d <= f) d *= 10;
			var r = new Rational(parse(s[0] + s[1]), d);
			r.decimal = true;
			return r;
		}
		return new Rational(parse(str));
	};
	
	function gcd(m, n) {
		if (n == 0) return m;
		return gcd(n, m % n);
	}
	
	function parse(str) {
		var value = parseInt(str, 10);
		if (isNaN(value)) {
			throw new Error();
		}
		return value;
	}
	
	prototype.decimal = false;
	
	prototype.negative = function () {
		return new Rational(-this.n, this.d);
	};
	prototype.inverse = function () {
		return new Rational(this.d, this.n);
	};
	
	prototype.plus = function (rational) {
		return new Rational(
			this.n * rational.d + rational.n * this.d,
			this.d * rational.d);
	};
	prototype.minus = function (rational) {
		return this.plus(rational.negative());
	};
	
	prototype.multiply = function (rational) {
		return new Rational(
			this.n * rational.n,
			this.d * rational.d);
	};
	prototype.divide = function (rational) {
		return this.multiply(rational.inverse());
	};
	
	prototype.equals = function (rational) {
		return this.n == rational.n && this.d == rational.d ||
			-this.n == rational.n && -this.d == rational.d;
	};
	
	prototype.valueOf = function () {
		return this.n / this.d;
	};
	
	prototype.toString = function () {
		if (this.decimal) {
			return (+this).toString();
		}
		var n = this.n, d = this.d;
		if (d < 0) {
			n = -n;
			d = -d;
		}
		return d == 1 ? n.toString() : n + '/' + d;
	};
	
	return Rational;
})();

var Expr = (function () {
	
	function Expr(vars, prd, ops) {
		if (arguments.length == 1) {
			this.i = vars;
		} else {
			this.vars = vars;
			this.prd = prd;
			this.ops = ops;
		}
	}
	var prototype = Expr.prototype;
	
	prototype.vars = null;
	prototype.prd = null;
	
	prototype.assign = function (perms, start) {
		if (!this.vars) {
			return new Expr(perms[start + this.i]);
		}
		var vars = [];
		vars.length = this.vars.length;
		for (var i = 0; i < vars.length; i++) {
			vars[i] = this.vars[i].assign(perms, start);
		}
		return new Expr(vars, this.prd, this.ops);
	};
	
	prototype.getOp = function (index) {
		return this.ops & 1 << this.vars.length - index - 1;
	};
	prototype.setOp = function (index, op) {
		var mask = 1 << this.vars.length - index - 1;
		if (op) {
			this.ops |= mask;
		} else {
			this.ops &= ~mask;
		}
	};
	
	prototype.negative = function () {
		if (!this.vars) return null;
		if (!this.prd && this.ops) {
			return new Expr(this.vars, false, ~this.ops);
		}
		for (var i = this.vars.length - 1; i >= 0; i--) {
			var n = this.vars[i].negative();
			if (n) {
				var vars = [];
				vars.length = this.vars.length;
				for (var j = 0; j < vars.length; j++) {
					vars[j] = this.vars[j];
				}
				vars[i] = n;
				if (this.prd) {
					return new Expr(vars, true, this.ops);
				}
				var expr = new Expr(vars, false, ~0);
				expr.setOp(i, false);
				return expr;
			}
		}
		return null;
	};
	
	prototype.calc = function (rationals) {
		if (!this.vars) {
			return rationals[this.i];
		}
		var value = this.prd ? Rational.I : Rational.Z;
		for (var i = 0; i < this.vars.length; i++) {
			var v = this.vars[i].calc(rationals);
			if (this.getOp(i)) {
				value = this.prd ?
					value.divide(v) :
					value.minus(v);
			} else {
				value = this.prd ?
					value.multiply(v) :
					value.plus(v);
			}
		}
		return value;
	};
	
	prototype.equals = function (expr, perms) {
		if (expr == null || this.prd != expr.prd) {
			return false;
		}
		if (!this.vars) {
			return perms[this.i] == perms[expr.i];
		}
		var l = this.vars.length, m = expr.vars.length;
		if (l != m) return false;
		
		var positive = true, not0 = true;
		var seen = 0;
		
		i: for (var i = 0; i < l; i++) {
			var o = !this.getOp(i);
			var v = this.vars[i], n = v.negative();
			if (this.prd && not0) {
				not0 = !v.equals(n, perms);
			}
			
			for (var j = 0; j < m; j++) {
				var t = 1 << j;
				if (seen & t) continue;
				var w = expr.vars[j];
				
				if (!expr.getOp(j) == o) {
					if (!w.equals(v, perms)) {
						if (this.prd && w.equals(n, perms)) {
							if (not0) positive = !positive;
						} else {
							continue;
						}
					}
				} else if (this.prd || !w.equals(n, perms)) {
					continue;
				}
				seen |= t;
				continue i;
			}
			return false;
		}
		return positive || !not0;
	};
	
	prototype.strAt = function (i, op, strs) {
		var str;
		if (this.getOp(i)) {
			str = this.prd ? '÷' : '-';
		} else if (op) {
			str = this.prd ? '×' : '+';
		} else {
			str = '';
		}
		var v = this.vars[i];
		var s = v.toString(strs);
		return str + (v.prd == false ? '(' + s + ')' : s);
	};
	
	prototype.toString = function (strs) {
		if (!this.vars) {
			/* if (!strs) {
				return (this.i + 10).toString(36);
			} */
			return strs[this.i];
		}
		var i = 0, l = this.vars.length;
		if (this.getOp(0)) {
			for (i = 1; i < l; i++) {
				if (!this.getOp(i)) break;
			}
		}
		var f = i == l ? 0 : i;
		var str = this.strAt(f, false, strs);
		for (i = 0; i < l; i++) {
			if (i == f) continue;
			str += this.strAt(i, true, strs);
		}
		return str;
	};
	
	return Expr;
})();

var exprs = (function () {
	
	var expr = [new Expr(0)];
	
	var Sum  = [null, expr];
	var Prd  = [null, expr];
	var Sets = [null, expr];
	
	var i = 2;
	var index = [0];
	var perms = [0];
	var used  = [false];
	var stack = [];
	
	function negative(set) {
		var negative = [];
		for (var i = 0; i < set.length; i++) {
			var n = set[i].negative();
			if (n) {
				negative.push(n);
			}
		}
		return negative;
	}
	
	function ops(set, r, prd, ol) {
		var vars = [];
		vars.length = r;
		for (var i = 0; i < r; i++) {
			vars[i] = stack[i];
		}
		for (var o = 0; o < ol; o++) {
			set.push(new Expr(vars, prd, o));
		}
	}
	
	function iterate(n, r, s, prd, set) {
		if (s == r) {
			if (prd) {
				ops(Prd[n], r, true, (1 << r) - 1);
			} else {
				ops(Sum[n], r, false, 1 << r - 1);
			}
			return;
		}
		var exprs = set[s];
		for (var i = 0; i < exprs.length; i++) {
			stack[s] = exprs[i];
			iterate(n, r, s + 1, prd, set);
		}
	}
	
	function dp(set, r) {
		var assigned = [];
		assigned.length = r;
		for (var i = 0, m = 0; i < r; i++) {
			var l = index[i];
			var exprs = set[l];
			var a = [];
			a.length = exprs.length;
			for (var j = 0; j < a.length; j++) {
				a[j] = exprs[j].assign(perms, m);
			}
			assigned[i] = a;
			m += l;
		}
		return assigned;
	}
	
	function assign(n, r) {
		iterate(n, r, 0, false, dp(Prd, r));
		iterate(n, r, 0, true,  dp(Sum, r));
	}
	
	function combl(n, r, m, s, min, l, t, j) {
		if (l == index[s]) {
			if (t >= min) {
				combg(n, r, m, s + 1, t);
			}
			return;
		}
		for (var i = j; i < n; i++) {
			if (used[i]) continue;
			used[i] = true;
			perms[m] = i;
			combl(n, r, m + 1, s, min, l + 1, t * n + i, i + 1);
			used[i] = false;
		}
	}
	function combg(n, r, m, s, min) {
		if (s == r) {
			assign(n, r);
			return;
		}
		if (s != 0 && index[s] != index[s - 1]) {
			min = 0;
		}
		combl(n, r, m, s, min, 0, 0, 0);
	}
	
	function group(n, r, m, s) {
		if (s == 0) {
			index[s] = m;
			combg(n, r, 0, 0, 0);
			return;
		}
		var min = ~~((m + s) / (s + 1)), max = m - s;
		if (s + 1 < r && max > index[s + 1]) {
			max = index[s + 1];
		}
		for (var i = max; i >= min; i--) {
			index[s] = i;
			group(n, r, m - i, s - 1);
		}
	}
	
	function count(n) {
		Sum[n] = [];
		Prd[n] = [];
		
		index[n - 1] = 0;
		perms[n - 1] = 0;
		used [n - 1] = false;
		
		for (var r = n; r > 1; r--) {
			stack.length = r;
			group(n, r, n, r - 1);
		}
	}
	
	function make(n) {
		var set = Sets[n];
		if (set) return set;
		
		for (; i <= n; i++) {
			count(i);
		}
		var sum = Sum[n].concat(negative(Sum[n]));
		var prd = Prd[n].concat(negative(Prd[n]));
		set = sum.concat(prd);
		
		Sets[n] = set;
		return set;
	}
	
	return make;
})();

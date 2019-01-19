
var Rational = (function () {
	
	function Rational(n, d) {
		if (1 in arguments) {
			if (d == 0) {
				throw new Error();
			}
		} else {
			d = 1;
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
		if (s.length == 2) {
			var l = parse('1' + s[1]);
			if (l != 1) {
				return new Rational(
					parse(s[0] + s[1]),
					Math.pow(10, Math.floor(Math.log(l) / Math.LN10)));
			}
		}
		return new Rational(parse(str));
	};
	
	function gcd(m, n) {
		if (n == 0) return m;
		return gcd(n, m % n);
	}
	
	function parse(str) {
		return parseInt(str, 10);
	}
	
	prototype.negative = function () {
		return new Rational(-this.n, this.d);
	};
	prototype.inverse = function () {
		return new Rational(this.d, this.n);
	};
	
	prototype.plus = function (rational) {
		return new Rational(
			this.n * rational.d + rational.n * this.d,
			this.d * rational.d
		);
	};
	prototype.minus = function (rational) {
		return this.plus(rational.negative());
	};
	
	prototype.multiply = function (rational) {
		return new Rational(
			this.n * rational.n,
			this.d * rational.d
		);
	};
	prototype.divide = function (rational) {
		return this.multiply(rational.inverse());
	};
	
	prototype.equals = function (rational) {
		return this.n == rational.n && this.d == rational.d ||
			-this.n == rational.n && -this.d == rational.d;
	};
	
	return Rational;
})();

var Expr = (function () {
	
	function Expr(prd, ops, vars) {
		this.vars = [];
		this.prd = prd;
		this.ops = ops;
		
		if (arguments.length) {
			if (vars) {
				for (var i = 0; i < vars.length; i++) {
					this.vars[i] = vars[i];
				}
			}
		} else {
			this.vars[0] = 0;
		}
	}
	var prototype = Expr.prototype;
	
	prototype.assign = function (perms, start) {
		var expr = new Expr(this.prd, this.ops);
		if (this.prd == null) {
			expr.vars[0] = perms[start + this.vars[0]];
			return expr;
		}
		for (var i = 0; i < this.vars.length; i++) {
			expr.vars[i] = this.vars[i].assign(perms, start);
		}
		return expr;
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
		if (this.prd == null) return null;
		if (!this.prd && this.ops) {
			return new Expr(false, ~this.ops, this.vars);
		}
		for (var i = this.vars.length - 1; i >= 0; i--) {
			var n = this.vars[i].negative();
			if (n) {
				var expr = new Expr(this.prd, this.ops, this.vars);
				expr.vars[i] = n;
				if (this.prd) return expr;
				expr.ops = ~0;
				expr.setOp(i, false);
				return expr;
			}
		}
		return null;
	};
	
	prototype.calc = function (rationals) {
		if (this.prd == null) {
			return rationals[this.vars[0]];
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
		if (expr == null || this.prd != expr.prd) return false;
		if (this.prd == null) {
			return perms[this.vars[0]] == perms[expr.vars[0]];
		}
		var l = this.vars.length, m = expr.vars.length;
		if (l != m) return false;
		
		var seen = [];
		var negative = false;
		i: for (var i = 0; i < l; i++) {
			var o = !this.getOp(i);
			var v = this.vars[i];
			for (var j = 0; j < m; j++) {
				if (seen[j]) continue;
				var p = !expr.getOp(j);
				var w = expr.vars[j];
				var eq;
				if (o == p) {
					eq = v.equals(w, perms);
					if (this.prd && !eq) {
						eq = v.equals(w.negative(), perms);
						if (eq) negative = !negative;
					}
				} else {
					eq = !this.prd && v.equals(w.negative(), perms);
				}
				if (eq) {
					seen[j] = true;
					continue i;
				}
			}
			return false;
		}
		return !negative;
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
		if (this.prd == null) {
			var v = this.vars[0];
			/* if (!strs) {
				return (v + 10).toString(36);
			} */
			return strs[v];
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
	
	var Sum  = [null, [new Expr()]];
	var Prd  = [null, [new Expr()]];
	var Sets = [null, [new Expr()]];
	
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
	
	function ops(set, prd, ol) {
		for (var o = 0; o < ol; o++) {
			set.push(new Expr(prd, o, stack));
		}
	}
	
	function iterate(n, r, m, s, sets) {
		if (s == r) {
			switch (sets) {
				case Prd: ops(Sum[n], false, 1 << r - 1);
				break;
				case Sum: ops(Prd[n], true, (1 << r) - 1);
				break;
			}
			return;
		}
		var l = index[s];
		var exprs = sets[l];
		for (var i = 0; i < exprs.length; i++) {
			stack[s] = exprs[i].assign(perms, m);
			iterate(n, r, m + l, s + 1, sets);
		}
	}
	
	function assign(n, r) {
		iterate(n, r, 0, 0, Prd);
		iterate(n, r, 0, 0, Sum);
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

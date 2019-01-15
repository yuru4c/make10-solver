
var Rational = (function () {
	
	function Rational(n, d) {
		if (!(1 in arguments)) d = 1;
		if (d == 0) {
			throw new Error();
		}
		
		var divisor = gcd(n, d);
		this.n = n / divisor;
		this.d = d / divisor;
	}
	var prototype = Rational.prototype;
	
	Rational.Z = new Rational(0);
	Rational.I = new Rational(1);
	
	function gcd(m, n) {
		if (n == 0) return m;
		return gcd(n, m % n);
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
	prototype.setOp = function (index, opr) {
		var mask = 1 << this.vars.length - index - 1;
		if (opr) {
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
	
	prototype.strAt = function (i, nums, j) {
		var op;
		if (this.getOp(i)) {
			op = this.prd ? '÷' : '-';
		} else if (j) {
			op = this.prd ? '×' : '+';
		} else {
			op = '';
		}
		var v = this.vars[i];
		var s = v.toString(nums);
		return op + (v.prd == false ? '(' + s + ')' : s);
	};
	
	prototype.toString = function (nums) {
		if (this.prd == null) {
			var v = this.vars[0];
			if (!nums) {
				return (v + 10).toString(36);
			}
			var n = nums[v];
			return n < 0 ? '(' + n + ')' : n.toString();
		}
		var i = 0;
		if (this.getOp(0)) {
			for (i = 1; i < this.vars.length; i++) {
				if (!this.getOp(i)) break;
			}
		}
		var f = i == this.vars.length ? 0 : i;
		var str = this.strAt(f, nums);
		for (i = 0; i < this.vars.length; i++) {
			if (i == f) continue;
			str += this.strAt(i, nums, i || f);
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
	
	function iterate(n, r, sets, p, s) {
		if (s == r) {
			switch (sets) {
				case Prd: ops(Sum[n], false, 1 << r - 1);
				break;
				case Sum: ops(Prd[n], true, (1 << r) - 1);
				break;
			}
			return;
		}
		var exprs = sets[index[s]];
		for (var i = 0; i < exprs.length; i++) {
			stack[s] = exprs[i].assign(perms, p);
			iterate(n, r, sets, p + index[s], s + 1);
		}
	}
	
	function assign(n, r) {
		iterate(n, r, Prd, 0, 0);
		iterate(n, r, Sum, 0, 0);
	}
	
	function combl(n, r, id, prev, p0, p1, li, gi) {
		if (li == index[gi]) {
			combg(n, r, id, p0, p1, gi + 1);
			return;
		}
		for (var i = prev + 1; i < n; i++) {
			if (used[i]) continue;
			used[i] = true;
			perms[id] = i;
			combl(n, r, id + 1, i, p0 * n + i, p1, li + 1, gi);
			used[i] = false;
		}
	}
	function combg(n, r, id, p0, p1, gi) {
		if (p0 < p1) return;
		if (gi == r) {
			assign(n, r);
			return;
		}
		if (gi != 0 && index[gi] != index[gi - 1]) {
			p0 = 0;
		}
		combl(n, r, id, -1, 0, p0, 0, gi);
	}
	
	function group(n, r, m, s) {
		if (s == 0) {
			index[s] = m;
			combg(n, r, 0, 0, 0, 0);
			return;
		}
		var min = ~~((m + s) / (s + 1));
		var max = m - s;
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


(function (window, $) {
	
	var disabled = 'disabled';
	var chunk = 256, timeout = 1000 / 24;
	
	var num, length;
	var nums = [];
	var perms = [];
	
	function solve(onprepare, onsolve) {
		var ans = [], set;
		var i = 0, j = 0, sl;
		var id;
		window.setTimeout(function () {
			set = exprs(length);
			sl = set.length;
			id = window.setInterval(calc, 1);
			onprepare(sl);
		});
		function calc() {
			var s = ans.length;
			var end;
			var time = +new Date() + timeout; do {
				j += chunk;
				end = j >= sl;
				i: for (end && (j = sl); i < j; i++) {
					var expr = set[i];
					var value;
					try {
						value = expr.calc(nums);
					} catch (e) {
						continue;
					}
					if (value.equals(num)) {
						for (var k = 0; k < ans.length; k++) {
							if (ans[k].equals(expr, perms)) {
								continue i;
							}
						}
						ans.push(expr);
					}
				}
				if (end) {
					window.clearInterval(id);
					break;
				}
			} while (new Date() < time);
			onsolve(ans, s, i, sl, end);
		}
	}
	
	var focused;
	function select() {
		focused.select();
	}
	function onfocus() {
		focused = this;
		window.setTimeout(select);
	}
	
	var re = /[\uff0d-\uff19]/g;
	function f(c) {
		return String.fromCharCode(c.charCodeAt() ^ 0xff20);
	}
	function valueOf(input) {
		return Rational.valueOf(input.value.replace(re, f));
	}
	
	function progress(i, l) {
		return '計算中 (' + i + ' / ' + l + ')';
	}
	
	var chars = [], strs = [];
	var str;
	function insert(row, str) {
		var cell = row.insertCell(-1);
		cell.appendChild($.createTextNode(str));
		return cell;
	}
	function write(row, e) {
		insert(row, e.toString(chars));
		insert(row, '=').className = 'eq';
		insert(row, e.toString(strs));
		insert(row, '=').className = 'eq';
		insert(row, str);
	}
	
	$.onreadystatechange = function () {
		this.onreadystatechange = null;
		
		var inputs = $.forms['inputs'];
		var ls   = inputs['l'];
		var uses = inputs['use'];
		
		var fieldset = $.getElementById('fieldset');
		var p    = $.getElementById('p');
		var make = $.getElementById('make');
		var exec = $.getElementById('exec');
		
		var div   = $.getElementById('results');
		var count = $.getElementById('count').firstChild;
		var list  = $.getElementById('list');
		
		var fl = ls[0].value - 1;
		p.onclick = function () {
			var flag = false;
			for (var i = 0; i < ls.length; i++) {
				uses[i + fl].disabled = flag;
				if (ls[i].checked) {
					length = i + fl + 1;
					flag = true;
				}
			}
		};
		p.onclick();
		
		for (var i = 0; i < uses.length; i++) {
			uses[i].onfocus = onfocus;
		}
		make.onfocus = onfocus;
		
		function onprepare(sl) {
			var table = $.createElement('table');
			div.replaceChild(table, list);
			list = table;
			exec.value = progress(0, sl);
		}
		function onsolve(ans, s, i, sl, end) {
			var c = ans.length;
			count.data = c;
			for (var t = s; t < c; t++) {
				write(list.insertRow(-1), ans[t]);
			}
			if (end) {
				fieldset.disabled = false;
				fieldset.className = '';
				exec.disabled = false;
				exec.value = '実行';
				div.className = '';
			} else {
				exec.value = progress(i, sl);
			}
		}
		
		inputs.onsubmit = function () {
			var i;
			try {
				for (i = 0; i < length; i++) {
					nums[i] = valueOf(uses[i]);
				}
				num = valueOf(make);
			} catch (e) {
				window.alert('入力が不正です');
				return false;
			}
			
			var ss = [];
			i: for (i = 0; i < length; i++) {
				var r = nums[i];
				for (var j = 0; j < i; j++) {
					if (nums[j].equals(r)) {
						perms[i] = perms[j];
						chars[i] = chars[j];
						strs[i] = strs[j];
						uses[i].value = ss[j];
						continue i;
					}
				}
				perms[i] = i;
				chars[i] = (i + 10).toString(36);
				var s = r.toString();
				ss[i] = s;
				strs[i] = r < 0 ? '(' + s + ')' : s;
				uses[i].value = s;
			}
			str = num.toString();
			make.value = str;
			
			fieldset.disabled = true;
			fieldset.className = disabled;
			exec.disabled = true;
			exec.value = '生成中...';
			div.className = disabled;
			
			solve(onprepare, onsolve);
			return false;
		};
	};
	
})(window, document);

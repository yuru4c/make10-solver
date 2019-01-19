
(function (window, $) {
	
	var chunk = 4096;
	
	var num, length;
	var nums = [];
	var perms = [];
	
	function solve(onprepare, onsolve) {
		var all = [], set;
		var i = 0, j = 0, sl;
		var id;
		window.setTimeout(function () {
			set = exprs(length);
			sl = set.length;
			id = window.setInterval(calc, 1);
			onprepare();
		});
		function calc() {
			var ans = [];
			i: for (; i < j && i < sl; i++) {
				var expr = set[i];
				var eq;
				try {
					eq = expr.calc(nums).equals(num);
				} catch (e) {
					continue;
				}
				if (eq) {
					for (var k = 0; k < all.length; k++) {
						if (expr.equals(all[k], perms)) {
							continue i;
						}
					}
					all.push(expr);
					ans.push(expr);
				}
			}
			var end = i == sl;
			if (end) window.clearInterval(id);
			else j += chunk;
			onsolve(ans, all.length, i, sl, end);
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
		
		function onprepare() {
			var table = $.createElement('table');
			div.replaceChild(table, list);
			list = table;
		}
		function onsolve(ans, c, j, sl, end) {
			count.data = c;
			for (var i = 0; i < ans.length; i++) {
				write(list.insertRow(-1), ans[i]);
			}
			if (end) {
				fieldset.disabled = false;
				fieldset.className = '';
				exec.disabled = false;
				exec.value = '実行';
				div.className = '';
			} else {
				exec.value = '計算中 (' + j + ' / ' + sl + ')';
			}
		}
		
		inputs.onsubmit = function () {
			var i;
			try {
				i: for (i = 0; i < length; i++) {
					var r = Rational.valueOf(uses[i].value);
					nums[i] = r;
					for (var j = 0; j < i; j++) {
						if (r.equals(nums[j])) {
							perms[i] = perms[j];
							chars[i] = chars[j];
							strs[i] = strs[j];
							continue i;
						}
					}
					perms[i] = i;
					chars[i] = (i + 10).toString(36);
					strs[i] = r.toString();
				}
				num = Rational.valueOf(make.value);
				str = num.toString();
			} catch (e) {
				window.alert('入力が不正です');
				return false;
			}
			
			for (i = 0; i < length; i++) {
				uses[i].value = strs[i];
				if (nums[i] < 0) {
					strs[i] = '(' + strs[i] + ')';
				}
			}
			make.value = str;
			
			fieldset.disabled = true;
			fieldset.className = 'disabled';
			exec.disabled = true;
			exec.value = '生成中...';
			div.className = 'disabled';
			
			solve(onprepare, onsolve);
			return false;
		};
	};
	
})(window, document);

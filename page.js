
(function (window, $) {
	
	var Error = this.Error;
	
	var parseInt = this.parseInt;
	var isNaN = this.isNaN;
	
	var num, l;
	var nums = [];
	
	function solve(onprepare, onsolve) {
		var r = new Rational(num);
		var rs = [];
		for (var i = 0; i < l; i++) {
			rs[i] = new Rational(nums[i]);
		}
		var set;
		
		window.setTimeout(function () {
			set = exprs(l);
			onprepare();
			
			window.setTimeout(calc);
		});
		function calc() {
			var ans = [];
			for (var i = 0; i < set.length; i++) {
				var expr = set[i];
				try {
					if (expr.calc(rs).equals(r)) {
						ans.push(expr);
					}
				} catch (e) { }
			}
			onsolve(ans);
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
	
	function valueOf(input) {
		var value = parseInt(input.value, 10);
		if (isNaN(value)) {
			throw new Error('入力が不正です');
		}
		return value;
	}
	
	function insert(row, str) {
		var cell = row.insertCell(-1);
		cell.appendChild($.createTextNode(str));
		return cell;
	}
	function write(row, e) {
		insert(row, e.toString());
		insert(row, '=').className = 'eq';
		insert(row, e.toString(nums));
		insert(row, '=').className = 'eq';
		insert(row, num.toString());
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
					l = i + fl + 1;
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
			exec.value = '計算中...';
		}
		function onsolve(ans) {
			count.data = ans.length;
			
			var table = $.createElement('table');
			for (var i = 0; i < ans.length; i++) {
				write(table.insertRow(i), ans[i]);
			}
			div.replaceChild(table, list);
			list = table;
			
			fieldset.disabled = false;
			fieldset.className = '';
			exec.value = '実行';
			div.className = '';
		}
		
		inputs.onsubmit = function () {
			try {
				for (var i = 0; i < l; i++) {
					nums[i] = valueOf(uses[i]);
				}
				num = valueOf(make);
			} catch (e) {
				window.alert(e.message);
				return false;
			}
			
			fieldset.disabled = true;
			fieldset.className = 'disabled';
			exec.value = '生成中...';
			div.className = 'disabled';
			
			solve(onprepare, onsolve);
			return false;
		};
	};
	
})(window, document);

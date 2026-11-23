/*! Eretek Online Araçlar #35 — AD Zaman Damgası Dönüştürücü */
ERT.def('35', {
	run: function (v, c) {
		var s = String(v.val || '').trim(), EPOCH = 116444736000000000n, ms, src, kv = [], msgs = [];
		if (/^\d{1,8}$/.test(s)) {
			if (+s === 0 && v.attr === 'pwdLastSet') { return { big: c.t('mustChange'), msgs: [['info', c.t('mustChangeT')]], v: { never: false, mustChange: true } }; }
			if (+s === 0 && v.attr === 'accountExpires') { return { big: c.t('never'), msgs: [['info', c.t('neverT')]], v: { never: true } }; }
			throw c.fe('val', 'bad');
		}
		var gt = /^((?:19|20)\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(?:\.\d+)?(Z|[+-]\d{4})?$/i.exec(s); // LDAP Generalized Time (whenCreated)
		if (gt && +gt[2] >= 1 && +gt[2] <= 12 && +gt[3] >= 1 && +gt[3] <= 31) {
			var off = gt[7] && gt[7].toUpperCase() !== 'Z' ? gt[7].slice(0, 3) + ':' + gt[7].slice(3) : 'Z';
			ms = Date.parse(gt[1] + '-' + gt[2] + '-' + gt[3] + 'T' + gt[4] + ':' + gt[5] + ':' + gt[6] + off); src = 'gentime';
			if (!gt[7]) { msgs.push(['warn', c.t('noTz')]); }
		} else if (/^\d{15,19}$/.test(s)) {
			var b = BigInt(s);
			if (v.attr === 'accountExpires' && (b === 0n || b === 9223372036854775807n)) { return { big: c.t('never'), msgs: [['info', c.t('neverT')]], v: { never: true } }; }
			if (v.attr === 'pwdLastSet' && b === 0n) { return { big: c.t('mustChange'), msgs: [['info', c.t('mustChangeT')]], v: { never: false, mustChange: true } }; }
			if (b > 9223372036854775807n) { throw c.fe('val', 'range'); }
			src = 'filetime'; ms = Number((b - EPOCH) / 10000n); var rem = (b - EPOCH) % 10000n;
			if (rem < 0n) { ms -= 1; }
		} else if (/^\d{9,11}$/.test(s)) { src = 'unix'; ms = +s * 1000; }
		else if (/^\d{12,14}$/.test(s)) { src = 'unixms'; ms = +s; }
		else if (/^0x[0-9a-f]{1,16}$/i.test(s)) { src = 'filetime'; ms = Number((BigInt(s) - EPOCH) / 10000n); }
		else {
			var t = Date.parse(s.replace(' ', 'T')); if (isNaN(t)) { throw c.fe('val', 'bad'); }
			if (!/[zZ]|[+-]\d\d:?\d\d$/.test(s)) { msgs.push(['warn', c.t('noTz')]); }
			src = 'iso'; ms = t;
		}
		var d = new Date(ms); if (isNaN(d.getTime())) { throw c.fe('val', 'range'); }
		var ft = (BigInt(ms) * 10000n + EPOCH).toString(), iso = d.toISOString().replace('.000Z', 'Z');
		var tz = v.tz || 'Europe/Istanbul', local;
		try { local = new Intl.DateTimeFormat(c.loc, { timeZone: tz, dateStyle: 'full', timeStyle: 'long' }).format(d); } catch (e) { throw c.fe('tz', 'badTz'); }
		kv.push([c.t('src'), c.t('s_' + src)], ['UTC (ISO 8601)', iso], [c.t('local', { z: tz }), local], ['FILETIME', ft], ['Unix (s)', String(Math.floor(ms / 1000))]);
		if (v.attr === 'lastLogonTimestamp') { msgs.push(['info', c.t('llt')]); }
		return { big: iso, kv: kv, msgs: msgs, x: { copy: kv.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n') }, v: { iso: iso, filetime: ft } };
	}
});

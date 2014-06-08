function IPStringToBuffer(ip, port, buff, offset) {
	if (port==undefined) {
		var sections = ip.split(':');
		if (sections.length == 2) {
			ip = sections[0];
			port = parseInt(sections[1]);
		}
		else {
			//ip v6?
		}		
	}

	offset = ~~offset;

	var result;

	if (/^(\d{1,3}\.){3,3}\d{1,3}$/.test(ip)) {
		result = buff || new Buffer(offset + 4 + 2);
		ip.split(/\./g).map(function (byte) {
			result[offset++] = parseInt(byte, 10) & 0xff;
		});
	} else if (/^[a-f0-9:]+$/.test(ip)) {
		var s = ip.split(/::/g, 2),
			head = (s[0] || '').split(/:/g, 8),
			tail = (s[1] || '').split(/:/g, 8);

		if (tail.length === 0) {
			// xxxx::
			while (head.length < 8) head.push('0000');
		} else if (head.length === 0) {
			// ::xxxx
			while (tail.length < 8) tail.unshift('0000');
		} else {
			// xxxx::xxxx
			while (head.length + tail.length < 8) head.push('0000');
		}

		result = buff || new Buffer(offset + 16 + 2);
		head.concat(tail).map(function (word) {
			word = parseInt(word, 16);
			result[offset++] = (word >> 8) & 0xff;
			result[offset++] = word & 0xff;
		});
	} else {
		throw Error('Invalid ip address: ' + ip);
	}
	result.writeUInt16BE(port, offset);

	return result;
}
exports.IPStringToBuffer = IPStringToBuffer;

function IPBufferToString(buff, offset, length) {
	offset = ~~offset;
	length = length || (buff.length - offset);

	var result = [];
	if (length === 4 + 2) {
		// IPv4
		for (var i = 0; i < 4; i++) {
			result.push(buff[offset]);
			offset++;
		}
		result = result.join('.');
	} else if (length === 16 + 2) {
		// IPv6
		for (var i = 0; i < 16; i += 2) {
			result.push(buff.readUInt16BE(offset).toString(16));
			offset += 2;
		}
		result = result.join(':');
		result = result.replace(/(^|:)0(:0)*:0(:|$)/, '$1::$3');
		result = result.replace(/:{3,4}/, '::');
	}

	var port = buff.readUInt16BE(offset);
	result += ':' + port;

	return result;
}
exports.IPBufferToString = IPBufferToString;


function IPB64ToString(i) {
  return IPBufferToString(new Buffer(i, 'base64'));
}
exports.IPB64ToString = IPB64ToString;

function IPStringToB64(i) {
  return IPStringToBuffer(i).toString('base64');
}
exports.IPStringToB64 = IPStringToB64;

function testIPCompress(address, port) {
	var b = IPStringToBuffer(address, port);
	var b2 = IPBufferToString(b);
	console.log(address, port?port:'', b.toString('base64'), b2, b2.length-b.length + ' bytes saved');
}
//testIPCompress("192.168.0.1:1001");
//testIPCompress("192.168.0.1",1001);
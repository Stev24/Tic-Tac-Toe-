const path = require("path");

function isJsonString(str) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

function getContentType(filePath) {
	const extname = path.extname(filePath);
	switch (extname) {
		case ".js":
			return "text/javascript";
		case ".css":
			return "text/css";
		case ".html":
			return "text/html";
		default:
			return "application/octet-stream";
	}
}

module.exports = {
    isJsonString,
    getContentType,
}
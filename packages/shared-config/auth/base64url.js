"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeBase64Url = encodeBase64Url;
exports.decodeBase64Url = decodeBase64Url;
function encodeBase64Url(value) {
    return Buffer.from(value).toString('base64url');
}
function decodeBase64Url(value) {
    return Buffer.from(value, 'base64url').toString('utf8');
}

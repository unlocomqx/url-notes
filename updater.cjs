module.exports.readVersion = function (contents) {
    const json = JSON.parse(contents)
    return json.version
}

module.exports.writeVersion = function (contents, version) {
    const json = JSON.parse(contents)
    json.version = version
    return JSON.stringify(json, null, 2)
}

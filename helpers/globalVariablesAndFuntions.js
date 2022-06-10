/** Configurations **/
const schema = 'https://';
const ip = 'localhost';
const port = 5000;

module.exports.selfURL = {
    schema,
    ip,
    port,
    hostname: `${ip}:${port}`,
    fullURL: `${schema}${ip}:${port}`
}

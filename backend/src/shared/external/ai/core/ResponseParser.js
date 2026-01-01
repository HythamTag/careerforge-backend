// AI - Response Parser
class ResponseParser {
  parse(response) { return JSON.parse(response); }
}
module.exports = new ResponseParser();


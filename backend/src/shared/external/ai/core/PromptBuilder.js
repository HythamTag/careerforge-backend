// AI - Prompt Builder
class PromptBuilder {
  build(type, data) { return `Generate ${type} for: ${JSON.stringify(data)}`; }
}
module.exports = new PromptBuilder();


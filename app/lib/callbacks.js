const hasPromptOutput = (output, prompt) => {
  const promptValue = output.find((chunk) => chunk.name === 'prompt');
  return promptValue.value === prompt;
};

const hasPrompt = (result, prompt) => result.data.callbacks.find(
  (chunk) => hasPromptOutput(chunk.output, prompt),
);

module.exports = {
  hasPrompt,
};

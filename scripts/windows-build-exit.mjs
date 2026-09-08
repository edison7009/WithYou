// Vinext forces process.exit(0) after prerendering. On Windows, native build
// workers can still be closing libuv handles at that point. Let a successful
// build drain naturally; nonzero exits and thrown errors retain their behavior.
if (process.platform === 'win32') {
  const exit = process.exit.bind(process);
  process.exit = (code = 0) => {
    if (Number(code) === 0) {
      process.exitCode = 0;
      return;
    }
    exit(code);
  };
}

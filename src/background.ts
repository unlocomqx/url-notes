import browser from "webextension-polyfill"

let handleCommand = (command) => {
  if (command === 'add-note') {
    browser.runtime.sendMessage({command: 'add-note'})
  }
}

browser.commands.onCommand.addListener(handleCommand)

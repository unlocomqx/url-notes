import browser from "webextension-polyfill"

let handleCommand = async (command) => {
  if (command === 'add-note') {
    // addNoteFromSelection()
    await browser.action.openPopup()
    await browser.runtime.sendMessage({command: 'add-note'})
  }
}

browser.commands.onCommand.addListener(handleCommand)

import browser from "webextension-polyfill"

let handleCommand = async (command) => {
  await browser.action.openPopup()
  await browser.runtime.sendMessage({command})
}

browser.commands.onCommand.addListener(handleCommand)

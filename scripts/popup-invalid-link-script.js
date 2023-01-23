document.getElementById('logout').addEventListener('click',
  async function () {
      await chrome.runtime.sendMessage({ message: 'logout' });
      window.close();
});

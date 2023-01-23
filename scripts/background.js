
const CLIENT_ID = encodeURIComponent('6f297f314bf54b05b5da78c15aa53424');
const RESPONSE_TYPE = encodeURIComponent('token');
const REDIRECT_URI = encodeURIComponent('https://jmjjembcfhocgnpafblcchcimfknloid.chromiumapp.org/');
const SCOPE = encodeURIComponent('user-read-email user-library-modify user-library-read');
const SHOW_DIALOG = encodeURIComponent('true');
let STATE = '';
let ACCESS_TOKEN = '';

let isUserSignedIn = false;

function create_spotify_endpoint() {
    STATE = encodeURIComponent('meet' + Math.random().toString(36).substring(2, 15));

    let oauth2_url =
        `https://accounts.spotify.com/authorize
?client_id=${CLIENT_ID}
&response_type=${RESPONSE_TYPE}
&redirect_uri=${REDIRECT_URI}
&state=${STATE}
&scope=${SCOPE}
&show_dialog=${SHOW_DIALOG}
`;

    return oauth2_url;
}

const songData = { title: "", artist: "", cover: "", link: "", songId: "" }
let mostRecentURL = '';
let isSaved = false;



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.message){
    case ('login'):
      mostRecentURL = '';
      chrome.identity.launchWebAuthFlow(
        {
          url: create_spotify_endpoint(),
          interactive: true
        }, 
        function (redirect_url) {
          if (chrome.runtime.lastError) {
            sendResponse({ message: 'fail' });
          } else {
            if (redirect_url.includes('callback?error=access_denied')) {
              sendResponse({ message: 'fail' });
            } else {
              ACCESS_TOKEN = redirect_url.substring(redirect_url.indexOf('access_token=') + 13);
              ACCESS_TOKEN = ACCESS_TOKEN.substring(0, ACCESS_TOKEN.indexOf('&'));
              let state = redirect_url.substring(redirect_url.indexOf('state=') + 6);
        
              if (state === STATE) {
                isUserSignedIn = true;

                chrome.action.setPopup({ popup: '../popup-signed-in.html' }, () => {
                  sendResponse({ message: 'success' });
                });
              } else {
                sendResponse({ message: 'fail' });
              }
            }
          }
        }
      );
      return true;
    case ('logout'):
      isUserSignedIn = false;
      ACCESS_TOKEN = '';
      chrome.action.setPopup({ popup: '../popup.html' }, () => {
          sendResponse({ message: 'success' });
      });
      break;
    case ('getToken'):
      const ytData = request.data;

      sendResponse({message: 'success', ACCESS_TOKEN: ACCESS_TOKEN});
      break;
    case ('sendSongData'):
      songData.title = request.data.name;
      songData.artist = request.data.artists[0].name;
      songData.cover = request.data.album.images[1].url;
      songData.link = request.data.external_urls.spotify;
      songData.songId = request.data.id;

      sendResponse({data: songData});
      break;
    case ('getSongData'):
      sendResponse({songData: songData});
      break;
    case ('saveSong'):
      const songId = songData.songId;
      fetch(`https://api.spotify.com/v1/me/tracks?ids=${songId}`,
        {
          method: isSaved ? 'DELETE' : 'PUT' ,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}` 
          }
        });
      break;
    case('getMostRecentURL'):
      sendResponse({mostRecentURL: mostRecentURL});
      break;
    case('setMostRecentURL'):
      mostRecentURL = request.mostRecentURL;
      break;
    case('getIsSaved'):
        sendResponse({ isSaved: isSaved });
        break;
    case('setIsSaved'):
        isSaved = request.isSaved;
        break;
    case('getIsUserSignedIn'):
        sendResponse({isUserSignedIn: isUserSignedIn});
        break;
  }
});